import express from "express";
import cors from "cors";
import multer from "multer";
import { FetchClient, Config } from 'coze-coding-dev-sdk';

const app = express();
const port = process.env.PORT || 9091;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 文件上传配置
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// 健康检查
app.get('/api/v1/health', (req, res) => {
  console.log('Health check success');
  res.status(200).json({ status: 'ok' });
});

// ==================== 用户相关 ====================
interface User {
  id: string;
  name: string;
  avatar: string;
  level: number;
  exp: number;
  created_at: string;
}

// 模拟用户数据
let users: User[] = [
  {
    id: '1',
    name: '羊城探索者',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    level: 5,
    exp: 1250,
    created_at: '2026-05-01',
  }
];

// 获取当前用户
app.get('/api/v1/user/me', (req, res) => {
  res.json(users[0]);
});

// 更新用户信息
app.put('/api/v1/user/me', (req, res) => {
  const { name, avatar } = req.body;
  if (name) users[0].name = name;
  if (avatar) users[0].avatar = avatar;
  res.json(users[0]);
});

// ==================== 区域相关 ====================
interface Region {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  icon: string;
  unlocked: boolean;
}

const regions: Region[] = [
  { id: 'yuexiu', name: '越秀', subtitle: '五羊圣地', color: '#8B4513', icon: 'landmark', unlocked: true },
  { id: 'liwan', name: '荔湾', subtitle: '西关风华', color: '#DAA520', icon: 'store', unlocked: true },
  { id: 'haizhu', name: '海珠', subtitle: '珠水映城', color: '#4682B4', icon: 'water', unlocked: false },
  { id: 'tianhe', name: '天河', subtitle: '都市新核', color: '#9370DB', icon: 'building', unlocked: false },
  { id: 'panyu', name: '番禺', subtitle: '古邑新章', color: '#228B22', icon: 'tree', unlocked: false },
  { id: 'baiyun', name: '白云', subtitle: '云山叠翠', color: '#87CEEB', icon: 'mountain', unlocked: false },
  { id: 'huangpu', name: '黄埔', subtitle: '海丝古港', color: '#CD853F', icon: 'ship', unlocked: false },
];

// 获取所有区域
app.get('/api/v1/regions', (req, res) => {
  res.json(regions);
});

// ==================== 锚点相关 ====================
interface Anchor {
  id: string;
  name: string;
  region_id: string;
  x: number;
  y: number;
  type: 'landmark' | 'food' | 'secret';
  unlocked: boolean;
  checked: boolean;
}

const anchors: Anchor[] = [
  { id: '1', name: '五羊石像', region_id: 'yuexiu', x: 0.3, y: 0.4, type: 'landmark', unlocked: true, checked: true },
  { id: '2', name: '镇海楼', region_id: 'yuexiu', x: 0.35, y: 0.3, type: 'landmark', unlocked: true, checked: true },
  { id: '3', name: '中山纪念堂', region_id: 'yuexiu', x: 0.4, y: 0.45, type: 'landmark', unlocked: true, checked: false },
  { id: '4', name: '永庆坊', region_id: 'liwan', x: 0.25, y: 0.55, type: 'food', unlocked: true, checked: false },
  { id: '5', name: '荔枝湾涌', region_id: 'liwan', x: 0.3, y: 0.6, type: 'food', unlocked: true, checked: false },
  { id: '6', name: '沙面岛', region_id: 'liwan', x: 0.2, y: 0.5, type: 'secret', unlocked: false, checked: false },
];

// 获取所有锚点
app.get('/api/v1/anchors', (req, res) => {
  res.json(anchors);
});

// 获取特定区域锚点
app.get('/api/v1/anchors/:regionId', (req, res) => {
  const { regionId } = req.params;
  const regionAnchors = anchors.filter(a => a.region_id === regionId);
  res.json(regionAnchors);
});

// ==================== 打卡相关 ====================
interface Checkin {
  id: string;
  anchor_id: string;
  user_id: string;
  image_url: string;
  created_at: string;
  location: string;
}

let checkins: Checkin[] = [
  { id: '1', anchor_id: '1', user_id: '1', image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200', created_at: '2026-05-20', location: '越秀区' },
  { id: '2', anchor_id: '2', user_id: '1', image_url: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=200', created_at: '2026-05-18', location: '越秀区' },
  { id: '3', anchor_id: '4', user_id: '1', image_url: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=200', created_at: '2026-05-18', location: '荔湾区' },
];

// 获取用户打卡记录
app.get('/api/v1/checkins', (req, res) => {
  const userCheckins = checkins.filter(c => c.user_id === '1');
  res.json(userCheckins);
});

// 获取指定日期的打卡记录
app.get('/api/v1/checkins/:date', (req, res) => {
  const { date } = req.params;
  const dayCheckins = checkins.filter(c => c.created_at === date);
  res.json(dayCheckins);
});

// 创建打卡记录
app.post('/api/v1/checkins', upload.single('image'), (req, res) => {
  const { anchor_id, location } = req.body;
  const newCheckin: Checkin = {
    id: Date.now().toString(),
    anchor_id,
    user_id: '1',
    image_url: req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : '',
    created_at: new Date().toISOString().split('T')[0],
    location: location || '',
  };
  checkins.push(newCheckin);
  
  // 标记锚点为已打卡
  const anchor = anchors.find(a => a.id === anchor_id);
  if (anchor) anchor.checked = true;
  
  res.status(201).json(newCheckin);
});

// ==================== 任务相关 ====================
interface MainQuest {
  id: string;
  chapter: string;
  title: string;
  subtitle: string;
  progress: number;
  total: number;
  status: 'active' | 'locked' | 'completed';
  region: string;
  reward: string;
}

interface SideQuest {
  id: string;
  type: 'food' | 'culture' | 'secret';
  title: string;
  subtitle: string;
  progress: number;
  total: number;
  status: 'active' | 'locked' | 'completed' | 'hidden';
  reward: number;
}

const mainQuests: MainQuest[] = [
  { id: '1', chapter: '第一章', title: '寻穗之旅', subtitle: '初到广州，探索五羊圣地', progress: 3, total: 5, status: 'active', region: 'yuexiu', reward: '解锁镇海楼区域' },
  { id: '2', chapter: '第二章', title: '西关风情', subtitle: '走进荔湾，感受岭南韵味', progress: 0, total: 6, status: 'locked', region: 'liwan', reward: '解锁永庆坊' },
  { id: '3', chapter: '第三章', title: '珠江夜游', subtitle: '跨越珠水，眺望小蛮腰', progress: 0, total: 5, status: 'locked', region: 'haizhu', reward: '解锁广州塔' },
];

const sideQuests: SideQuest[] = [
  { id: 's1', type: 'food', title: '早茶达人', subtitle: '品尝3家地道茶楼', progress: 1, total: 3, status: 'active', reward: 50 },
  { id: 's2', type: 'culture', title: '博物馆探索', subtitle: '参观2家博物馆', progress: 2, total: 2, status: 'completed', reward: 80 },
  { id: 's3', type: 'food', title: '肠粉寻味', subtitle: '寻找最正宗的布拉肠', progress: 0, total: 4, status: 'locked', reward: 30 },
  { id: 's4', type: 'secret', title: '隐藏任务：老广的记忆', subtitle: '发现沙面岛的秘密...', progress: 0, total: 1, status: 'hidden', reward: 200 },
];

// 获取主线任务
app.get('/api/v1/quests/main', (req, res) => {
  res.json(mainQuests);
});

// 获取支线任务
app.get('/api/v1/quests/side', (req, res) => {
  res.json(sideQuests);
});

// ==================== 成就相关 ====================
interface Achievement {
  id: string;
  name: string;
  icon: string;
  unlocked: boolean;
  color: string;
  unlocked_at?: string;
}

const achievements: Achievement[] = [
  { id: '1', name: '初来乍到', icon: 'star', unlocked: true, color: '#FFD700' },
  { id: '2', name: '五羊探索者', icon: 'map', unlocked: true, color: '#8B4513' },
  { id: '3', name: '美食猎人', icon: 'utensils', unlocked: true, color: '#E85D4C' },
  { id: '4', name: '连续7天', icon: 'fire', unlocked: true, color: '#FF6B35' },
  { id: '5', name: '西关漫步', icon: 'walking', unlocked: false, color: '#DAA520' },
  { id: '6', name: '博物馆迷', icon: 'landmark', unlocked: false, color: '#2D7D46' },
  { id: '7', name: '夜景达人', icon: 'moon', unlocked: false, color: '#4682B4' },
  { id: '8', name: '隐藏成就', icon: 'question', unlocked: false, color: '#999' },
];

// 获取所有成就
app.get('/api/v1/achievements', (req, res) => {
  res.json(achievements);
});

// ==================== AI对话（Coze集成） ====================

// 获取文档内容的接口
app.post('/api/v1/fetch-doc', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const config = new Config();
    const client = new FetchClient(config);
    const response = await client.fetch(url);

    if (response.status_code !== 0) {
      return res.status(500).json({ 
        error: 'Failed to fetch document',
        message: response.status_message 
      });
    }

    // 提取纯文本内容
    const textContent = response.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n');

    res.json({
      title: response.title,
      content: textContent,
      url: response.url
    });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AI对话接口（预留Coze Bot对接）
app.post('/api/v1/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    // 预留：后续接入Coze Bot API
    // const config = new Config();
    // const client = new CozeClient(config);
    // const response = await client.chat({ message, context });

    // 模拟阿穗回复
    const replies = [
      '这个想法太棒了！让我帮你规划一下路线吧～',
      '哇，原来你想去这里！那边确实有很多有趣的打卡点呢！',
      '好呀好呀！我们一起去探索吧，我已经迫不及待啦！',
      '旅行者，今天天气真不错，要不要出去走走？',
      '你知道吗？五羊石像可是广州的标志性建筑呢！',
    ];
    
    const randomReply = replies[Math.floor(Math.random() * replies.length)];
    
    res.json({
      reply: randomReply,
      agent: '阿穗',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to get response' });
  }
});

// 流式AI对话接口（SSE）
app.post('/api/v1/chat/stream', async (req, res) => {
  try {
    const { message } = req.body;
    
    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, no-transform, must-revalidate');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    
    // 模拟流式回复（分词发送）
    const replies = [
      '这个想法太棒了！让我帮你规划一下路线吧～',
      '哇，原来你想去这里！那边确实有很多有趣的打卡点呢！',
      '好呀好呀！我们一起去探索吧，我已经迫不及待啦！',
      '旅行者，今天天气真不错，要不要出去走走？',
      '你知道吗？五羊石像可是广州的标志性建筑呢！',
    ];
    
    const reply = replies[Math.floor(Math.random() * replies.length)];
    
    // 将回复分成多个小片段发送，模拟流式效果
    const chunks = reply.split('');
    for (const char of chunks) {
      res.write(`data: ${JSON.stringify({ content: char })}\n\n`);
      await new Promise(resolve => setTimeout(resolve, 30)); // 模拟打字效果
    }
    
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Stream chat error:', error);
    res.status(500).json({ error: 'Failed to get stream response' });
  }
});

// ==================== 统计相关 ====================
app.get('/api/v1/stats', (req, res) => {
  const unlockedRegions = regions.filter(r => r.unlocked).length;
  const checkedAnchors = anchors.filter(a => a.checked).length;
  const completedQuests = sideQuests.filter(q => q.status === 'completed').length;
  
  res.json({
    total_regions: 7,
    unlocked_regions: unlockedRegions,
    total_anchors: anchors.length,
    checked_anchors: checkedAnchors,
    total_checkins: checkins.length,
    total_achievements: achievements.length,
    unlocked_achievements: achievements.filter(a => a.unlocked).length,
    total_quests: sideQuests.length,
    completed_quests: completedQuests,
    total_side_quests: sideQuests.length,
    completed_side_quests: completedQuests,
    user_level: users[0].level,
    user_exp: users[0].exp,
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
});
