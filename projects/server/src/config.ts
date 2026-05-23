import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "9091"),

  llm: {
    apiKey: process.env.LLM_API_KEY || "",
    baseURL: process.env.LLM_BASE_URL || "https://api.deepseek.com/v1",
    model: process.env.LLM_MODEL || "deepseek-chat",
  },

  asui: {
    botId: "asui-main",
  },

  npc: {
    oldGuangzhou: "npc-old-guangzhou",
  },
};
