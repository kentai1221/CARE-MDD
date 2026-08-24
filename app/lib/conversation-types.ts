export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  sequence: number;
  title: string;
  messages: ChatMessage[];
  sessionId: string | null;
  charId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ConversationSummary = Pick<
  Conversation,
  "id" | "sequence" | "title" | "createdAt" | "updatedAt"
> & {
  preview: string;
};
