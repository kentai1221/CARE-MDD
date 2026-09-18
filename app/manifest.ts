import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "另存心檔",
    short_name: "另存心檔",
    description: "CBT 心理教育與自助練習聊天支援",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f5fbfa",
    theme_color: "#20b79f",
    orientation: "portrait-primary",
    lang: "zh-Hant-HK",
    categories: ["health", "lifestyle"],
    icons: [
      {
        src: "/icons/care-mdd-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/care-mdd-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/care-mdd-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
