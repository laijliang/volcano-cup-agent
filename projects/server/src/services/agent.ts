import OpenAI from "openai";
import { config } from "../config";
import { ASUI_SYSTEM_PROMPT } from "../prompts/asui";
import { NPC_PROMPTS } from "../prompts/npc";

const openai = new OpenAI({
  apiKey: config.llm.apiKey,
  baseURL: config.llm.baseURL,
});

export interface UserContext {
  userName: string;
  currentRegion: string;
  nearestAnchor?: string;
  questProgress: string;
  unlockedRegions: string[];
  recentCheckins: string[];
  consecutiveDays: number;
  timeOfDay: string;
}

function buildContextPrompt(ctx: Partial<UserContext>): string {
  const parts: string[] = [];
  if (ctx.userName) parts.push(`当前用户：${ctx.userName}`);
  if (ctx.timeOfDay) parts.push(`当前时段：${ctx.timeOfDay}`);
  if (ctx.currentRegion) parts.push(`所在区域：${ctx.currentRegion}`);
  if (ctx.nearestAnchor) parts.push(`最近锚点：${ctx.nearestAnchor}`);
  if (ctx.questProgress) parts.push(`任务进度：${ctx.questProgress}`);
  if (ctx.unlockedRegions?.length) parts.push(`已解锁区域：${ctx.unlockedRegions.join("、")}`);
  if (ctx.recentCheckins?.length) parts.push(`最近打卡：${ctx.recentCheckins.join("、")}`);
  if (ctx.consecutiveDays) parts.push(`连续打卡天数：${ctx.consecutiveDays}`);
  if (parts.length === 0) return "";
  return `\n\n当前用户状态：\n${parts.join("\n")}`;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chatWithAsui(
  userMessage: string,
  userContext: Partial<UserContext>,
  history: ChatMessage[] = []
): Promise<string> {
  const contextBlock = buildContextPrompt(userContext);

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: ASUI_SYSTEM_PROMPT + contextBlock },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  const response = await openai.chat.completions.create({
    model: config.llm.model,
    messages,
    max_tokens: 500,
    temperature: 0.8,
  });

  return response.choices[0]?.message?.content || "唔…旅行者，我好像走神了，再说一次？";
}

export async function chatWithNpc(
  npcId: string,
  userMessage: string,
  userContext: Partial<UserContext>,
  history: ChatMessage[] = []
): Promise<string> {
  const systemPrompt = NPC_PROMPTS[npcId];
  if (!systemPrompt) {
    throw new Error(`Unknown NPC: ${npcId}`);
  }

  const contextBlock = buildContextPrompt(userContext);

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt + contextBlock },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  const response = await openai.chat.completions.create({
    model: config.llm.model,
    messages,
    max_tokens: 300,
    temperature: 0.85,
  });

  return response.choices[0]?.message?.content || "……（老伯不想理你）";
}
