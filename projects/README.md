# 赛博派蒙 · 旅游搭子

> AI 驱动的广州城市探索游戏 —— 与 AI 伙伴「阿穗」一起，打卡地标、解锁任务、收集成就，沉浸式感受羊城魅力。

## 产品定位

**赛博派蒙**（Cyber Paimon）是一款融合 AI 对话与游戏化打卡的广州旅游探索应用。用户扮演"旅行者"，在 AI 伙伴「阿穗」的陪伴下，穿越广州七大区域，打卡 33 个精选锚点，完成主线剧情与温馨支线任务，收集成就徽章，探索城市背后的故事。

- **核心人格**：AI 旅游搭子「阿穗」—— 话痨、热情、偶尔傲娇，模拟原神派蒙的陪伴感
- **产品调性**：游戏化 × 沉浸感 × 温暖陪伴
- **目标用户**：喜欢开放世界探索体验的年轻用户、广州深度游爱好者

## 核心功能

### 🗺️ 广州大世界探索

覆盖广州 **7 大区域**、**33 个精选锚点**（地标 / 美食 / 隐藏地点），支持 GPS 距离验证打卡。已解锁区域亮起，未解锁区域迷雾遮蔽，逐区推进探索进度。

### 🤖 AI 伙伴对话

与「阿穗」自由聊天，她会根据你的探索进度、当前位置、时间天气等上下文给出个性化回应。同时也支持与 NPC（如"老广阿伯"）对话，触发隐藏剧情。

### 📋 主线 × 支线任务系统

- **7 章主线任务**：从越秀五羊石像出发，一路解锁至黄埔海丝古港
- **10 个支线任务**：穿插温馨感人的广州故事——榕树下的阿伯、西关小姐的明信片、糖水铺的阿嬷、雨夜借伞人……
- 打卡进度实时同步，完成任务自动解锁下一章

### 🏆 成就收集

**12 枚成就徽章**：从"初来乍到"到"广州通"，覆盖探索、美食、夜景、人情味、博物馆迷等多维度挑战。

### 📅 回忆日历

月视图日历展示打卡足迹。支持点击日期查看当天打卡照片，照片可随时替换更新。横向照片墙展示，沉浸式浏览探索回忆。

### 📊 个人足迹统计

探索区域数、打卡锚点数、连续打卡天数、成就收集进度——一目了然的游戏化统计面板。

## 技术栈

| 层 | 技术 | 说明 |
|---|------|------|
| **前端** | Expo SDK 54 + React 19 + React Native 0.81 | 跨平台移动应用（iOS / Android / Web） |
| **路由** | Expo Router (file-based) | 基于文件系统的类型安全路由 |
| **样式** | Tailwind CSS v4 + Uniwind | 原子化 CSS，支持 light/dark 双主题 |
| **组件库** | HeroUI + 自研组件 | 跨平台 UI 组件（Dialog / Toast / Skeleton 等） |
| **地图** | Leaflet.js (Web) / 高德 3D 地图 (Native) | 平台自适应地图渲染 |
| **动画** | react-native-reanimated + expo-linear-gradient | 流畅动效与渐变装饰 |
| **后端** | Express.js + TypeScript | RESTful API 服务 |
| **数据库** | SQLite + Drizzle ORM | 轻量级嵌入式数据库，零配置 |
| **AI** | OpenAI 兼容 API (DeepSeek) | 角色扮演对话生成 |
| **包管理** | pnpm workspace monorepo | 单仓库管理前后端代码 |

## 架构总览

```
┌──────────────────────────────────────────────────────────┐
│                    Client (Expo / React Native)           │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────┐ ┌─────────┐  │
│  │  首页   │ │  地图   │ │  任务   │ │ 日历  │ │  我的    │  │
│  │ AI聊天 │ │ Leaflet│ │ 主/支线│ │ 打卡  │ │ 成就/设置│  │
│  └────────┘ └────────┘ └────────┘ └──────┘ └─────────┘  │
│                         ↕ API                             │
└──────────────────────────────────────────────────────────┘
                           ↕ HTTP / REST
┌──────────────────────────────────────────────────────────┐
│                   Server (Express.js)                     │
│  ┌───────────┐ ┌───────────┐ ┌──────────────────────┐   │
│  │ auth      │ │  file     │ │  Game Engine          │   │
│  │ Token认证  │ │  upload   │ │  afterCheckin()       │   │
│  └───────────┘ └───────────┘ │  ├─ 主线进度更新       │   │
│                               │  ├─ 支线进度更新       │   │
│  ┌───────────┐ ┌───────────┐ │  ├─ 成就判定           │   │
│  │ AI Agent  │ │  validate │ │  └─ 区域解锁           │   │
│  │ OpenAI API│ │  Zod校验   │ └──────────────────────┘   │
│  └───────────┘ └───────────┘                             │
│                         ↕                                 │
│              SQLite (Drizzle ORM)                         │
└──────────────────────────────────────────────────────────┘
```

## 快速开始

### 前置要求

- **Node.js** >= 24
- **pnpm** >= 9.0.0
- （可选）DeepSeek API Key 或其他 OpenAI 兼容 API Key

### 1. 克隆项目

```bash
git clone https://github.com/your-username/cyber-paimon.git
cd cyber-paimon/projects
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

**服务端**（`server/.env`）：

```env
LLM_API_KEY=your_api_key_here
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat
```

**客户端**（`client/.env`）：

```env
EXPO_PUBLIC_BACKEND_BASE_URL=http://localhost:9091
EXPO_PUBLIC_APP_NAME=广州探索
EXPO_PUBLIC_AMAP_API_KEY=your_amap_key    # 仅 Native 端需要
```

### 4. 初始化数据库

```bash
cd server
npx drizzle-kit push    # 创建表结构
npx tsx src/index.ts    # 启动服务器（自动写入种子数据）
```

### 5. 启动开发服务器

```bash
# 在项目根目录，同时启动前后端
pnpm dev
```

启动后：
- 前端 Web 预览：`http://localhost:8081`
- 后端 API：`http://localhost:9091`

测试账号：手机号 `1`，昵称任意。

## 游戏机制

### 打卡

在锚点附近 50 米范围内（可配置）拍照打卡。系统使用 **Haversine 公式** 计算 GPS 距离。打卡成功后，业务引擎自动执行以下逻辑：

### 任务推进

- **主线任务**：以累计打卡总数为进度指标。完成一章自动解锁下一章，并解锁对应新区域
- **支线任务**：需要打卡任务关联的特定锚点。例如「榕树下的阿伯」需要打卡五羊石像、镇海楼、光孝寺

### 区域解锁
| 打卡数 | 解锁区域 |
|--------|----------|
| 初始 | 越秀、荔湾 |
| ≥5 | 海珠 |
| ≥8 | 天河 |
| ≥12 | 番禺、白云 |
| ≥18 | 黄埔 |

### 成就触发

成就实时检测，条件满足即解锁。包括累计打卡数、特定区域探索、美食打卡数、博物馆打卡组合、隐藏锚点发现、支线完成数、连续打卡天数等。

## API 接口一览

所有接口路径前缀：`/api/v1`

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/auth/login` | 手机号注册/登录，返回 Bearer Token |
| POST | `/auth/logout` | 登出，销毁 Token |

### 用户
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/user/me` | 获取当前用户信息 |
| PUT | `/user/me` | 更新昵称/头像 |

### 区域 & 锚点
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/regions` | 区域列表（含解锁状态） |
| GET | `/anchors` | 全部锚点（含用户打卡/解锁状态） |
| GET | `/anchors/:regionId` | 按区域筛选锚点 |

### 打卡
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/checkins` | 用户打卡记录列表 |
| GET | `/checkins/:date` | 按日期查询打卡 |
| POST | `/checkins` | 创建打卡（multipart: image + anchor_id + GPS） |
| PUT | `/checkins/:id` | 替换打卡照片 |

### 任务
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/quests/main` | 主线任务（含用户进度） |
| GET | `/quests/side` | 支线任务（含用户进度） |

### AI 对话
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/chat/history` | 聊天历史（最近 40 条） |
| POST | `/chat` | 与 AI 伙伴「阿穗」对话 |
| POST | `/chat/npc` | 与 NPC 对话 |

### 其他
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/stats` | 用户综合统计数据 |
| GET | `/achievements` | 全部成就列表 |
| POST | `/upload` | 上传图片 |

## 项目结构

```
├── client/                         # Expo React Native 前端
│   ├── app/                        # Expo Router 文件路由
│   │   ├── (tabs)/                 # 5 个 Tab 页面
│   │   │   ├── _layout.tsx         # Tab Bar 配置
│   │   │   ├── index.tsx           # 首页
│   │   │   ├── map.tsx             # 地图页
│   │   │   ├── tasks.tsx           # 任务页
│   │   │   ├── calendar.tsx        # 日历页
│   │   │   └── profile.tsx         # 个人页
│   │   ├── _layout.tsx             # 根布局 (Provider + Stack)
│   │   └── +not-found.tsx
│   ├── screens/                    # 页面实现
│   │   ├── home/index.tsx          # AI 聊天 + 打卡
│   │   ├── map/index.tsx           # 区域浏览 + 锚点 + 打卡
│   │   ├── tasks/index.tsx         # 主/支线任务追踪
│   │   ├── calendar/index.tsx      # 月历 + 打卡历史
│   │   └── profile/index.tsx       # 统计 + 成就 + 设置
│   ├── components/                 # 通用组件
│   │   ├── Screen.tsx              # 页面容器（安全区/键盘处理）
│   │   ├── Provider.tsx            # 全局 Provider 挂载
│   │   ├── LeafletMap.tsx          # 跨平台地图组件
│   │   └── SmartDateInput.tsx      # 日期选择器
│   ├── services/api.ts             # 全部 API 调用
│   ├── hooks/                      # useAppTheme / useSafeRouter
│   ├── contexts/AuthContext.tsx     # 认证状态管理
│   ├── theme/colors.ts             # light/dark 色板
│   ├── heroui/                     # HeroUI 组件库
│   ├── global.css                  # Tailwind 入口 + design tokens
│   └── app.config.ts               # Expo 配置
│
├── server/                         # Express.js 后端
│   └── src/
│       ├── index.ts                # 主入口 + 全部路由
│       ├── config.ts               # 配置（端口、LLM 参数）
│       ├── db/
│       │   ├── index.ts            # 数据库连接
│       │   ├── schema.ts           # Drizzle ORM 表定义（12 张表）
│       │   └── seed.ts             # 种子数据
│       ├── middleware/
│       │   ├── auth.ts             # Token 认证
│       │   └── validate.ts         # Zod 参数校验
│       ├── services/
│       │   ├── agent.ts            # AI 对话服务
│       │   └── engine.ts           # 游戏业务引擎
│       └── prompts/                # AI 角色人设
│
├── DESIGN.md                       # 设计规范文档
└── package.json                    # monorepo 根配置
```

## 设计系统

### 色彩
| Token | 色值 | 用途 |
|-------|------|------|
| Primary | `#2D7D46` | 主色调（森林绿，探索自然） |
| Secondary | `#D4A574` | 沙金色（阳光、广州地标） |
| Accent | `#E85D4C` | 朱红（活力、打卡成就感） |
| Background | `#FDF8F2` | 暖白背景 |
| Surface | `#FFFFFF` | 卡片/面板背景 |

深色模式采用 GitHub Dark 风格暗色调（`#0D1117` ~ `#161B22`），25 个语义化色板 Token 覆盖全部场景。

### 七大区域色彩
越秀 `#8B4513` · 荔湾 `#DAA520` · 海珠 `#4682B4` · 天河 `#9370DB` · 番禺 `#228B22` · 白云 `#87CEEB` · 黄埔 `#CD853F`

## 许可证

MIT License
