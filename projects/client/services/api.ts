import { Platform } from 'react-native';
import { createFormDataFile } from '@/utils';

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

// 同步获取 token（Native 端由 AuthContext 在 login 时同步写入内存兜底）
function getAuthToken(): string | null {
  if (Platform.OS === 'web') {
    return localStorage.getItem('auth_token');
  }
  return (globalThis as any).__auth_token || null;
}

// Native 端：AuthContext 登录时调用此函数，将 token 同步写入内存兜底
// （SecureStore 是异步的，API 层需要同步读取）
export function setAuthToken(token: string | null) {
  if (Platform.OS === 'web') {
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
  } else {
    if (token) (globalThis as any).__auth_token = token;
    else delete (globalThis as any).__auth_token;
  }
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseApiError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (body.error) return body.error;
    if (body.details) return Array.isArray(body.details) ? body.details.join('; ') : body.details;
  } catch {}
  return `请求失败 (${response.status})`;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(await parseApiError(response));
  return response.json();
}

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
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ message, context }),
  });
  return handleResponse(response);
}

// 发送消息给 NPC（支线任务触发）
export async function sendNpcMessage(
  message: string,
  npcId: string,
  context?: ChatContext
): Promise<{ reply: string; agent: string; timestamp: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/npc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ message, npcId, context }),
  });
  return handleResponse(response);
}

// 获取打卡记录
export async function getCheckins(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/checkins`, { headers: authHeaders() });
  return handleResponse(response);
}

// 替换打卡照片
export async function updateCheckinPhoto(checkinId: string, imageUri: string): Promise<any> {
  const filename = imageUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const mimeType = match ? `image/${match[1]}` : 'image/jpeg';

  const imageFile = await createFormDataFile(imageUri, filename, mimeType);

  const formData = new FormData();
  formData.append('image', imageFile as any);

  const response = await fetch(`${API_BASE_URL}/api/v1/checkins/${checkinId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: formData,
  });
  return handleResponse(response);
}

// 创建打卡记录
export async function createCheckin(anchorId: string, imageUri: string, location: string, coords?: { latitude: number; longitude: number }): Promise<any> {
  const filename = imageUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const mimeType = match ? `image/${match[1]}` : 'image/jpeg';

  const imageFile = await createFormDataFile(imageUri, filename, mimeType);

  const formData = new FormData();
  formData.append('anchor_id', anchorId);
  formData.append('location', location);
  if (coords) {
    formData.append('latitude', String(coords.latitude));
    formData.append('longitude', String(coords.longitude));
  }
  formData.append('image', imageFile as any);

  const response = await fetch(`${API_BASE_URL}/api/v1/checkins`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  return handleResponse(response);
}

// 获取区域列表
export async function getRegions(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/regions`, { headers: authHeaders() });
  return handleResponse(response);
}

// 获取锚点列表
export async function getAnchors(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/anchors`, { headers: authHeaders() });
  return handleResponse(response);
}

// 获取任务
export async function getMainQuests(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/quests/main`, { headers: authHeaders() });
  return handleResponse(response);
}

export async function getSideQuests(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/quests/side`, { headers: authHeaders() });
  return handleResponse(response);
}

// 获取成就
export async function getAchievements(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/achievements`, { headers: authHeaders() });
  return handleResponse(response);
}

// 获取统计
export async function getStats(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/v1/stats`, { headers: authHeaders() });
  return handleResponse(response);
}

// 获取当前用户信息
export async function getUserProfile(): Promise<{
  id: string;
  name: string;
  avatar: string;
  level: number;
  exp: number;
  created_at: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/v1/user/me`, { headers: authHeaders() });
  return handleResponse(response);
}

// 更新用户资料
export async function updateUserProfile(data: { name?: string; avatar?: string }): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/v1/user/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

// 上传图片
export async function uploadImage(imageUri: string): Promise<{ url: string }> {
  const filename = imageUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const mimeType = match ? `image/${match[1]}` : 'image/jpeg';

  const imageFile = await createFormDataFile(imageUri, filename, mimeType);

  const formData = new FormData();
  formData.append('image', imageFile as any);

  const response = await fetch(`${API_BASE_URL}/api/v1/upload`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  return handleResponse(response);
}

// 登录
export async function login(phone: string, name?: string): Promise<{ token: string; user: any }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, name }),
  });
  return handleResponse(response);
}

// 获取聊天历史
export async function getChatHistory(): Promise<{ id: string; role: string; content: string; created_at: string }[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/history`, { headers: authHeaders() });
  return handleResponse(response);
}

// 登出
export async function logout(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('登出失败');
}
