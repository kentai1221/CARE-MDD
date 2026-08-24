import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  ChatMessage,
  Conversation,
  ConversationSummary,
} from "./conversation-types";

const DATA_DIRECTORY = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIRECTORY, "conversations.json");
const DEFAULT_GREETING =
  "你好，我是 CARE-MDD。今天有甚麼想法、情緒或情境想一起整理？";

let mutationQueue: Promise<void> = Promise.resolve();

async function readConversations(): Promise<Conversation[]> {
  try {
    const contents = await readFile(DATA_FILE, "utf8");
    const parsed: unknown = JSON.parse(contents);
    return Array.isArray(parsed) ? (parsed as Conversation[]) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function writeConversations(conversations: Conversation[]) {
  await mkdir(DATA_DIRECTORY, { recursive: true });
  await writeFile(DATA_FILE, `${JSON.stringify(conversations, null, 2)}\n`, "utf8");
}

async function mutateConversations<T>(
  mutation: (conversations: Conversation[]) => T | Promise<T>
): Promise<T> {
  let result: T;

  const task = mutationQueue.then(async () => {
    const conversations = await readConversations();
    result = await mutation(conversations);
    await writeConversations(conversations);
  });

  mutationQueue = task.catch(() => undefined);
  await task;
  return result!;
}

export async function listConversations(): Promise<ConversationSummary[]> {
  const conversations = await readConversations();

  return conversations
    .map((conversation) => ({
      id: conversation.id,
      sequence: conversation.sequence,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      preview:
        conversation.messages.at(-1)?.content.trim() || "尚未開始對話",
    }))
    .sort(
      (first, second) =>
        new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime()
    );
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const conversations = await readConversations();
  return conversations.find((conversation) => conversation.id === id) ?? null;
}

export async function createConversation(): Promise<Conversation> {
  return mutateConversations((conversations) => {
    const nextSequence =
      conversations.reduce(
        (highest, conversation) => Math.max(highest, conversation.sequence || 0),
        0
      ) + 1;
    const now = new Date().toISOString();
    const greeting: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: DEFAULT_GREETING,
      createdAt: now,
    };
    const conversation: Conversation = {
      id: crypto.randomUUID(),
      sequence: nextSequence,
      title: `對話 ${nextSequence}`,
      messages: [greeting],
      sessionId: null,
      charId: null,
      createdAt: now,
      updatedAt: now,
    };

    conversations.push(conversation);
    return conversation;
  });
}

type ConversationUpdates = {
  title?: string;
  messages?: ChatMessage[];
  sessionId?: string | null;
  charId?: string | null;
};

export async function updateConversation(
  id: string,
  updates: ConversationUpdates
): Promise<Conversation | null> {
  return mutateConversations((conversations) => {
    const conversation = conversations.find((item) => item.id === id);
    if (!conversation) return null;

    if (updates.title !== undefined) conversation.title = updates.title;
    if (updates.messages !== undefined) conversation.messages = updates.messages;
    if (updates.sessionId !== undefined) conversation.sessionId = updates.sessionId;
    if (updates.charId !== undefined) conversation.charId = updates.charId;
    conversation.updatedAt = new Date().toISOString();

    return conversation;
  });
}

export async function deleteConversation(id: string): Promise<boolean> {
  return mutateConversations((conversations) => {
    const conversationIndex = conversations.findIndex((item) => item.id === id);
    if (conversationIndex === -1) return false;

    conversations.splice(conversationIndex, 1);
    return true;
  });
}
