import { createFormDataFile } from '@/utils';

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

export interface ChatMessage {
  id: string;
  type: 'user' | 'agent';
  content: string;
  time: string;
}

export interface ChatContext {
  userId?: string;
  userName?: string;
  currentRegion?: string;
  nearestAnchor?: string;
  questProgress?: string;
  unlockedRegions?: string[];
  recentCheckins?: string[];
  consecutiveDays?: number;
  timeOfDay?: string;
}

// 发送消息获取阿穗回复
export async function sendChatMessage(
  message: string,
  context?: ChatContext
): Promise<{ reply: string; agent: string; timestamp: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, context }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return response.json();
}

// 发送消息给 NPC（支线任务触发）
export async function sendNpcMessage(
  message: string,
  npcId: string,
  context?: ChatContext
): Promise<{ reply: string; agent: string; timestamp: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/npc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, npcId, context }),
  });

  if (!response.ok) {
    throw new Error('Failed to send NPC message');
  }

  return response.json();
}

// 获取打卡记录
export async function getCheckins(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/checkins`);
  if (!response.ok) throw new Error('Failed to fetch checkins');
  return response.json();
}

// 创建打卡记录
export async function createCheckin(anchorId: string, imageUri: string, location: string): Promise<any> {
  const filename = imageUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const mimeType = match ? `image/${match[1]}` : 'image/jpeg';
  
  const imageFile = await createFormDataFile(imageUri, filename, mimeType);
  
  const formData = new FormData();
  formData.append('anchor_id', anchorId);
  formData.append('location', location);
  formData.append('image', imageFile as any);

  const response = await fetch(`${API_BASE_URL}/api/v1/checkins`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error('Failed to create checkin');
  return response.json();
}

// 获取区域列表
export async function getRegions(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/regions`);
  if (!response.ok) throw new Error('Failed to fetch regions');
  return response.json();
}

// 获取锚点列表
export async function getAnchors(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/anchors`);
  if (!response.ok) throw new Error('Failed to fetch anchors');
  return response.json();
}

// 获取任务
export async function getMainQuests(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/quests/main`);
  if (!response.ok) throw new Error('Failed to fetch main quests');
  return response.json();
}

export async function getSideQuests(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/quests/side`);
  if (!response.ok) throw new Error('Failed to fetch side quests');
  return response.json();
}

// 获取成就
export async function getAchievements(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/achievements`);
  if (!response.ok) throw new Error('Failed to fetch achievements');
  return response.json();
}

// 获取统计
export async function getStats(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/v1/stats`);
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
}
