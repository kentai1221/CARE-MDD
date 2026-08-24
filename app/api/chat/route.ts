import { NextRequest, NextResponse } from "next/server";

const CONVAI_URL = "https://api.convai.com/character/getResponse";

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId, charId } = await req.json();

    const apiKey = process.env.CONVAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing CONVAI_API_KEY on server" },
        { status: 500 },
      );
    }

    const effectiveCharId = charId || process.env.CONVAI_CHAR_ID;
    if (!effectiveCharId) {
      return NextResponse.json(
        { error: "No charId provided and CONVAI_CHAR_ID is not set" },
        { status: 400 },
      );
    }

    let finalMessage = message ?? "";

  // Check init
  if (typeof finalMessage === "string" && finalMessage.startsWith("init-")) {
    try {
      // Remove "init-"
      const base64Part = finalMessage.slice(5);

      // Decode Base64
      const decoded = Buffer.from(base64Part, "base64").toString("utf-8");

      // Log / debug if needed
      console.log("Decoded init message:", decoded);

      // =============================
    // Helpers
    // =============================

    const exerciseMap: Record<number, string> = {
      1: "手腕伸展運動",
      2: "手腕屈曲運動",
      3: "手腕尺側擺動",
      4: "手腕橈側擺動",
      5: "前臂內轉",
      6: "前臂外轉",
      7: "手指彎曲",
      8: "手指掌面相對",
      9: "拇指屈曲",
      10: "手握力訓練",
      11: "強化手腕伸肌運動",
      12: "強化手腕屈肌運動",
      13: "強化手腕尺側擺動",
      14: "強化手腕橈側擺動",
      15: "強化前臂內轉",
      16: "強化前臂外轉",
      17: "用湯匙進食",
      18: "扭乾毛巾",
      19: "刷牙游戲",
      20: "淋花游戲",
    };

    const statusMap: Record<number, string> = {
      1: "欠1組",
      2: "欠2組",
      3: "欠3組",
      4: "欠4組",
      5: "欠5組",
      6: "欠6組",
      7: "欠7組",
      8: "欠8組",
      9: "欠9組",
      10: "達標了",
      11: "多做了1組",
      12: "多做了2組",
      13: "多做了3組",
      14: "多做了4組",
      15: "多做了5組",
      16: "多做了6組",
      17: "多做了7組",
      18: "多做了8組",
      19: "多做了9組",
      20: "一組都沒完成",
      21: "已完成第一次記錄，需要下一次再比較",
      22: "今日未完成評估",
      23: "平均速度提升",
      24: "平均速度降低",
      25: "平均時間減少",
      26: "平均時間增加",
      27: "流暢度提升",
      28: "流暢度降低",
      29: "尚未完成過評估",
    };

    // =============================
    // Parse Data
    // =============================

    // Remove { }
    const clean = decoded.replace(/[{}]/g, "");

    // Split into arrays
    const groups = clean
      .split("],")
      .map((g) => g.replace(/[\[\]]/g, "").trim());

    const group1 = groups[0].split(",").map(Number);
    const group2 = groups[1].split(",");
    const group3 = groups[2]?.split(",") ?? [];

    // =============================
    // Group 1
    // =============================

    const [age, hand, days, phase] = group1;

    const handText = hand === 0 ? "右手" : "左手";

    let phaseText = "";
    if (phase === 1) phaseText = "第一階段（0–35天，不可運動）";
    if (phase === 2) phaseText = "第二階段（36–77天，可進行關節訓練）";
    if (phase === 3) phaseText = "第三階段（78天以上，可進行所有復健運動）";

    // =============================
    // Group 2 (Training)
    // =============================

    const hasReport = group2[0] === "1";
    const trainingData = group2.slice(1);

    const trainingLines: string[] = [];

    if (hasReport) {
      for (const item of trainingData) {
        const parts = item.split("-").map(Number);

        const exId = parts[0];
        const status = parts[1];

        const exName = exerciseMap[exId] ?? `運動${exId}`;
        const statusText = statusMap[status] ?? `狀態${status}`;

        trainingLines.push(`${exName}${statusText}`);
      }
    }

    // =============================
    // Group 3 (Daily Life)
    // =============================

    const lifeLines: string[] = [];

    for (const item of group3) {
      const parts = item.split("-").map(Number);

      const exId = parts[0];
      const statuses = parts.slice(1);

      const exName = exerciseMap[exId] ?? `項目${exId}`;

      const statusTexts = statuses.map(
        (s) => statusMap[s] ?? `狀態${s}`,
      );

      lifeLines.push(`${exName}：${statusTexts.join("，")}`);
    }

    // =============================
    // Generate Prompt
    // =============================

    let prompt = "";

    // 基本資料
    prompt += "【患者基本資料】\n";
    prompt += `年齡：${age}歲\n`;
    prompt += `受傷手：${handText}\n`;
    prompt += `受傷天數：${days}天\n`;
    prompt += `復健階段：${phaseText}\n\n`;

    // 今日運動
    prompt += "【今日運動紀錄】\n";

    if (hasReport) {
      trainingLines.forEach((line) => {
        prompt += `- ${line}\n`;
      });
    } else {
      prompt += "今日沒有運動訓練紀錄。\n";
    }

    prompt += "\n";

    // 生活功能
    if (lifeLines.length > 0) {
      prompt += "【生活功能評估】\n";

      lifeLines.forEach((line) => {
        prompt += `- ${line}\n`;
      });

      prompt += "\n";
    }

    // 重點摘要（自動生成）
    prompt += "【重點摘要】\n";

    const summaryParts: string[] = [];

    if (trainingLines.length > 0) {
      const incompleteCount = trainingLines.filter((l) =>
        l.includes("欠") || l.includes("沒完成"),
      ).length;

      if (incompleteCount > 0) {
        summaryParts.push(`多項運動未完成（${incompleteCount}項）`);
      } else {
        summaryParts.push("運動完成度良好");
      }
    }

    if (lifeLines.length > 0) {
      if (
        lifeLines.some((l) =>
          l.includes("降低") || l.includes("增加") || l.includes("未完成"),
        )
      ) {
        summaryParts.push("部分日常功能表現退步");
      } else {
        summaryParts.push("日常功能表現穩定");
      }
    }

    if (summaryParts.length === 0) {
      summaryParts.push("目前資料不足，需持續觀察");
    }

    prompt += `- ${summaryParts.join("，")}\n\n`;

    // CBT 角色指示（強化記憶）
    prompt += "【角色指示】\n";
    prompt +=
      "你是 CARE-MDD，一個提供認知行為治療（CBT）相關心理教育與自助練習支援的聊天助手。請在後續對話中持續參考以上資料，以親切、不批判和合作的方式回應，透過合適的開放式問題，協助使用者辨識情境、想法、情緒、身體感受與行為之間的關係，並探索較平衡的想法及可實行的小步驟。不要聲稱自己是持牌心理治療師，不作診斷，也不要把回應當成專業治療。如資料不足或不確定，應坦白說明；如使用者持續受困擾，建議尋求合資格的心理健康專業人士。若使用者表示可能傷害自己或他人，應鼓勵立即聯絡當地緊急服務、危機支援或可信任的人。\n\n";

    // 回覆語言
    prompt += "【回覆語言】\n";
    prompt += "請用廣東話回覆使用者，保持口語化和親切感。\n\n";

    // 對話起點
    prompt += "【對話開始】\n";
    prompt += "使用者說：「你好，我想了解目前的狀況。」";


    // =============================
    // Set final message
    // =============================

      // Use decoded message
      finalMessage = prompt;
    } catch (e) {
      console.error("Failed to decode init message:", e);
    }
  }

    // Convai expects form-data
    const form = new FormData();
    form.append("userText", finalMessage);
    form.append("charID", effectiveCharId);
    form.append("sessionID", sessionId ?? "-1"); // -1 to start a new session
    form.append("voiceResponse", "False"); // we only want text

    const resp = await fetch(CONVAI_URL, {
      method: "POST",
      headers: {
        "CONVAI-API-KEY": apiKey,
      },
      body: form,
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json(
        { error: `Convai error: ${resp.status} ${text}` },
        { status: 502 },
      );
    }

    const data = await resp.json();


    const reply = data?.text ?? data?.response ?? "";
    const nextSessionId = data?.sessionID ?? sessionId ?? "-1";

    return NextResponse.json({
      reply,
      sessionId: nextSessionId,
      raw: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown server error" },
      { status: 500 },
    );
  }
}
