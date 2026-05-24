import { db, schema } from "./index";
import { eq } from "drizzle-orm";

export async function seed() {
  const { users, regions, anchors, userAnchors, checkins, mainQuests, sideQuests, achievements, userMainQuestProgress, userSideQuestProgress, userAchievements, userRegionProgress } = schema;

  // 已有数据则跳过
  const existing = db.select().from(users).where(eq(users.id, "1")).get();
  if (existing) {
    console.log("[DB] Already seeded, skipping.");
    return;
  }

  // ── 用户 ──
  db.insert(users).values({
    id: "1", name: "羊城探索者",
    avatar: "",
    level: 5, exp: 1250, created_at: "2026-05-01",
  }).run();

  // ── 区域 ──
  db.insert(regions).values([
    { id: "yuexiu", name: "越秀", subtitle: "五羊圣地", color: "#8B4513", icon: "landmark", unlocked: true },
    { id: "liwan", name: "荔湾", subtitle: "西关风华", color: "#DAA520", icon: "store", unlocked: true },
    { id: "haizhu", name: "海珠", subtitle: "珠水映城", color: "#4682B4", icon: "water", unlocked: false },
    { id: "tianhe", name: "天河", subtitle: "都市新核", color: "#9370DB", icon: "building", unlocked: false },
    { id: "panyu", name: "番禺", subtitle: "古邑新章", color: "#228B22", icon: "tree", unlocked: false },
    { id: "baiyun", name: "白云", subtitle: "云山叠翠", color: "#87CEEB", icon: "mountain", unlocked: false },
    { id: "huangpu", name: "黄埔", subtitle: "海丝古港", color: "#CD853F", icon: "ship", unlocked: false },
  ]).run();

  // ── 锚点（33个核心锚点，覆盖7大区域） ──
  db.insert(anchors).values([
    // 越秀·五羊圣地 (8个)
    { id: "1", name: "五羊石像", region_id: "yuexiu", latitude: 23.1291, longitude: 113.2644, type: "landmark", description: "广州城市标志，五羊传说的发源地" },
    { id: "2", name: "镇海楼", region_id: "yuexiu", latitude: 23.1350, longitude: 113.2610, type: "landmark", description: "岭南第一楼，始建于明朝" },
    { id: "7", name: "中山纪念堂", region_id: "yuexiu", latitude: 23.1326, longitude: 113.2591, type: "landmark", description: "纪念孙中山先生的宏伟建筑" },
    { id: "8", name: "北京路步行街", region_id: "yuexiu", latitude: 23.1200, longitude: 113.2640, type: "landmark", description: "千年古道，广州最繁华的商业街" },
    { id: "9", name: "南越王博物院", region_id: "yuexiu", latitude: 23.1366, longitude: 113.2565, type: "landmark", description: "西汉南越国第二代王赵眜之墓" },
    { id: "10", name: "光孝寺", region_id: "yuexiu", latitude: 23.1310, longitude: 113.2500, type: "landmark", description: "广州最古老的佛教寺院" },
    { id: "11", name: "点都德（越秀）", region_id: "yuexiu", latitude: 23.1275, longitude: 113.2580, type: "food", description: "老字号茶楼，正宗广式早茶" },
    { id: "12", name: "广州酒家", region_id: "yuexiu", latitude: 23.1195, longitude: 113.2630, type: "food", description: "百年老字号，粤菜第一品牌" },
    // 荔湾·西关风华 (7个)
    { id: "3", name: "陈家祠", region_id: "liwan", latitude: 23.1295, longitude: 113.2420, type: "landmark", description: "广东民间工艺博物馆，建筑艺术瑰宝" },
    { id: "5", name: "沙面岛", region_id: "liwan", latitude: 23.1195, longitude: 113.2440, type: "secret", description: "隐秘角落，充满历史感的欧式建筑群" },
    { id: "6", name: "永庆坊", region_id: "liwan", latitude: 23.1180, longitude: 113.2400, type: "landmark", description: "恩宁路历史文化街区，活化更新典范" },
    { id: "13", name: "荔枝湾涌", region_id: "liwan", latitude: 23.1160, longitude: 113.2350, type: "landmark", description: "羊城八景之一，西关水乡风情" },
    { id: "14", name: "上下九步行街", region_id: "liwan", latitude: 23.1130, longitude: 113.2460, type: "landmark", description: "百年商业街，骑楼建筑群" },
    { id: "15", name: "陶陶居", region_id: "liwan", latitude: 23.1140, longitude: 113.2450, type: "food", description: "百年茶楼，康有为题匾" },
    { id: "16", name: "莲香楼", region_id: "liwan", latitude: 23.1120, longitude: 113.2470, type: "food", description: "百年饼家，莲蓉月饼首创者" },
    // 海珠·珠水映城 (4个)
    { id: "17", name: "广州塔", region_id: "haizhu", latitude: 23.1064, longitude: 113.3240, type: "landmark", description: "600米高的广州地标建筑" },
    { id: "18", name: "海珠湿地公园", region_id: "haizhu", latitude: 23.0760, longitude: 113.3340, type: "landmark", description: "城央湿地，广州绿心" },
    { id: "19", name: "太古仓码头", region_id: "haizhu", latitude: 23.0980, longitude: 113.2680, type: "secret", description: "日落圣地，文艺酒吧街区" },
    { id: "20", name: "琶醍", region_id: "haizhu", latitude: 23.1070, longitude: 113.3430, type: "food", description: "江边美食酒吧一条街" },
    // 天河·都市新核 (4个)
    { id: "21", name: "花城广场", region_id: "tianhe", latitude: 23.1171, longitude: 113.3248, type: "landmark", description: "广州城市客厅，CBD核心" },
    { id: "22", name: "广东省博物馆", region_id: "tianhe", latitude: 23.1164, longitude: 113.3260, type: "landmark", description: "月光宝盒造型，镇馆之宝丰富" },
    { id: "23", name: "海心沙", region_id: "tianhe", latitude: 23.1130, longitude: 113.3263, type: "landmark", description: "珠江上的亚运之舟" },
    { id: "24", name: "体育西横街", region_id: "tianhe", latitude: 23.1300, longitude: 113.3170, type: "food", description: "美食云集的美食街" },
    // 番禺·古邑新章 (3个)
    { id: "25", name: "沙湾古镇", region_id: "panyu", latitude: 22.9030, longitude: 113.3350, type: "landmark", description: "800年岭南古镇，姜撞奶发源地" },
    { id: "26", name: "余荫山房", region_id: "panyu", latitude: 22.9420, longitude: 113.3330, type: "landmark", description: "清代岭南四大名园之一" },
    { id: "27", name: "长隆欢乐世界", region_id: "panyu", latitude: 23.0100, longitude: 113.3130, type: "landmark", description: "大型主题游乐园" },
    // 白云·云山叠翠 (3个)
    { id: "28", name: "白云山", region_id: "baiyun", latitude: 23.1644, longitude: 113.2933, type: "landmark", description: "羊城第一秀，登高远眺广州全景" },
    { id: "29", name: "云台花园", region_id: "baiyun", latitude: 23.1550, longitude: 113.2850, type: "landmark", description: "花城明珠，四季花海" },
    { id: "30", name: "麓湖公园", region_id: "baiyun", latitude: 23.1480, longitude: 113.2830, type: "secret", description: "城市里的幽静绿洲" },
    // 黄埔·海丝古港 (3个)
    { id: "31", name: "黄埔军校旧址", region_id: "huangpu", latitude: 23.0840, longitude: 113.4260, type: "landmark", description: "中国近代军事摇篮" },
    { id: "32", name: "南海神庙", region_id: "huangpu", latitude: 23.0880, longitude: 113.4870, type: "landmark", description: "海上丝绸之路发源地" },
    { id: "33", name: "古港遗址", region_id: "huangpu", latitude: 23.0950, longitude: 113.4450, type: "secret", description: "千年古港，海丝记忆" },
  ]).run();

  // ── 用户锚点进度 ──
  const initUA: { user_id: string; anchor_id: string; checked: boolean; unlocked: boolean }[] = [];
  for (const id of ["1","2","7","8","9","10","11","12"]) {
    initUA.push({ user_id: "1", anchor_id: id, checked: id === "1" || id === "2", unlocked: true });
  }
  for (const id of ["3","5","6","13","14","15","16"]) {
    initUA.push({ user_id: "1", anchor_id: id, checked: false, unlocked: true });
  }
  for (const id of ["17","18","19","20","21","22","23","24","25","26","27","28","29","30","31","32","33"]) {
    initUA.push({ user_id: "1", anchor_id: id, checked: false, unlocked: false });
  }
  db.insert(userAnchors).values(initUA).run();

  // ── 用户区域解锁进度（种子用户） ──
  db.insert(userRegionProgress).values([
    { user_id: "1", region_id: "yuexiu", unlocked_at: "2026-05-01" },
    { user_id: "1", region_id: "liwan", unlocked_at: "2026-05-01" },
  ]).run();

  // ── 打卡记录 ──
  db.insert(checkins).values([
    { id: "1", anchor_id: "1", user_id: "1", image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200", created_at: "2026-05-20", location: "越秀区" },
    { id: "2", anchor_id: "2", user_id: "1", image_url: "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=200", created_at: "2026-05-18", location: "越秀区" },
    { id: "3", anchor_id: "11", user_id: "1", image_url: "https://images.unsplash.com/photo-1555244162-803834f70033?w=200", created_at: "2026-05-18", location: "荔湾区" },
  ]).run();

  // ── 主线任务（模板，7章覆盖7区） ──
  db.insert(mainQuests).values([
    { id: "1", chapter: "第一章", title: "寻穗之旅", subtitle: "初到羊城，从五羊石像开始你的探险之旅", progress: 0, total: 5, status: "active", region: "yuexiu", reward: "解锁荔湾·西关风华" },
    { id: "2", chapter: "第二章", title: "西关风情", subtitle: "走进西关大屋，聆听百年商埠的往事", progress: 0, total: 10, status: "locked", region: "liwan", reward: "解锁海珠·珠水映城" },
    { id: "3", chapter: "第三章", title: "珠水夜韵", subtitle: "跨过珠江，在广州塔下许一个心愿", progress: 0, total: 14, status: "locked", region: "haizhu", reward: "解锁天河·都市新核" },
    { id: "4", chapter: "第四章", title: "天河星辉", subtitle: "漫步花城广场，感受新广州的脉搏", progress: 0, total: 18, status: "locked", region: "tianhe", reward: "解锁番禺·古邑新章" },
    { id: "5", chapter: "第五章", title: "番禺古韵", subtitle: "穿越八百年沙湾，寻味岭南水乡", progress: 0, total: 22, status: "locked", region: "panyu", reward: "解锁白云·云山叠翠" },
    { id: "6", chapter: "第六章", title: "云山叠翠", subtitle: "登白云山巅，俯瞰羊城万家灯火", progress: 0, total: 26, status: "locked", region: "baiyun", reward: "解锁黄埔·海丝古港" },
    { id: "7", chapter: "第七章", title: "黄埔风云", subtitle: "探访千年海丝起点，追寻近代革命足迹", progress: 0, total: 30, status: "locked", region: "huangpu", reward: "广州探索之旅圆满达成" },
  ]).run();

  // ── 用户主线进度（种子用户） ──
  db.insert(userMainQuestProgress).values([
    { user_id: "1", quest_id: "1", progress: 2, status: "active" },
  ]).run();

  // ── 支线任务（模板，10个任务含温馨剧情） ──
  db.insert(sideQuests).values([
    { id: "s1", type: "food", title: "早茶里的温情", subtitle: "一盅两件间，品尝老广的人情味与慢时光", progress: 0, total: 3, status: "active", reward: 50, locations: JSON.stringify(["点都德", "陶陶居", "莲香楼"]) },
    { id: "s2", type: "culture", title: "博物馆寻踪", subtitle: "两座博物馆，两段穿越千年的岭南故事", progress: 0, total: 2, status: "active", reward: 80, locations: JSON.stringify(["南越王博物院", "广东省博物馆"]) },
    { id: "s3", type: "food", title: "消失的肠粉摊", subtitle: "寻找街角那家消失了的老字号肠粉，老主顾们等你来揭开谜底", progress: 0, total: 4, status: "locked", reward: 30, locations: "[]" },
    { id: "s4", type: "secret", title: "老广的记忆", subtitle: "沙面岛的榕树下，一位老人讲述只有老广州才知道的故事...", progress: 0, total: 1, status: "hidden", reward: 200, locations: "[]" },
    { id: "s5", type: "secret", title: "榕树下的阿伯", subtitle: "越秀山下有棵百年榕树，树下的阿伯能说出五羊城的每一段往事。听他讲完三个故事，你会明白什么是「羊城精神」。", progress: 0, total: 3, status: "active", reward: 100, locations: JSON.stringify(["五羊石像", "镇海楼", "光孝寺"]) },
    { id: "s6", type: "culture", title: "西关小姐的明信片", subtitle: "恩宁路的旧书店里夹着几张泛黄的明信片，是八十年前一位西关小姐写给远行恋人的。沿着上面的地名走一遍，拼出这段未完的故事。", progress: 0, total: 3, status: "active", reward: 120, locations: JSON.stringify(["永庆坊", "上下九步行街", "荔枝湾涌"]) },
    { id: "s7", type: "food", title: "糖水铺的阿嬷", subtitle: "文明路那家开了四十年的糖水铺，阿嬷每天只做一锅红豆沙。她说，红豆沙里熬的不仅是糖，更是她对这座城的记忆和对每位客人的祝福。", progress: 0, total: 3, status: "active", reward: 80, locations: JSON.stringify(["广州酒家", "体育西横街", "琶醍"]) },
    { id: "s8", type: "secret", title: "雨夜借伞人", subtitle: "那年台风天，一个陌生人在北京路把伞塞给了一位避雨的孕妇。十年后，孕妇带着孩子来这里寻找那位素未谋面的恩人...", progress: 0, total: 2, status: "active", reward: 150, locations: JSON.stringify(["北京路步行街", "中山纪念堂"]) },
    { id: "s9", type: "food", title: "邻里煲汤香", subtitle: "广州的夏天湿热难耐，老街坊们却有一套祖传的祛湿汤方。走进三个老社区，品尝三种不同配方的「阿妈靓汤」——每一碗，都是家的味道。", progress: 0, total: 3, status: "active", reward: 70, locations: JSON.stringify(["太古仓码头", "海珠湿地公园", "麓湖公园"]) },
    { id: "s10", type: "culture", title: "珠江边的琴声", subtitle: "每晚八点，珠江边总会传来悠扬的钢琴声。弹琴的是一位退休的音乐教师，他用琴声陪伴这座城市入夜。听他弹完三首曲子，他会告诉你关于广州、关于音乐、关于一生的故事。", progress: 0, total: 3, status: "active", reward: 130, locations: JSON.stringify(["广州塔", "花城广场", "海心沙"]) },
  ]).run();

  // ── 用户支线进度（种子用户） ──
  db.insert(userSideQuestProgress).values([
    { user_id: "1", quest_id: "s1", progress: 1, status: "active" },
    { user_id: "1", quest_id: "s2", progress: 2, status: "completed" },
    { user_id: "1", quest_id: "s5", progress: 2, status: "active" },
    { user_id: "1", quest_id: "s6", progress: 1, status: "active" },
  ]).run();

  // ── 成就 ──
  db.insert(achievements).values([
    { id: "1", name: "初来乍到", icon: "star", unlocked: false, color: "#FFD700" },
    { id: "2", name: "五羊探索者", icon: "map", unlocked: false, color: "#8B4513" },
    { id: "3", name: "美食猎人", icon: "utensils", unlocked: false, color: "#E85D4C" },
    { id: "4", name: "连续7天", icon: "fire", unlocked: false, color: "#FF6B35" },
    { id: "5", name: "西关漫步", icon: "walking", unlocked: false, color: "#DAA520" },
    { id: "6", name: "博物馆迷", icon: "landmark", unlocked: false, color: "#2D7D46" },
    { id: "7", name: "夜景达人", icon: "moon", unlocked: false, color: "#4682B4" },
    { id: "8", name: "隐藏成就", icon: "question", unlocked: false, color: "#999" },
    { id: "9", name: "羊城百事通", icon: "book", unlocked: false, color: "#8B4513" },
    { id: "10", name: "珠江夜话", icon: "cloud-moon", unlocked: false, color: "#4682B4" },
    { id: "11", name: "人情味", icon: "heart", unlocked: false, color: "#E85D4C" },
    { id: "12", name: "广州通", icon: "crown", unlocked: false, color: "#FFD700" },
  ]).run();

  // ── 用户成就（种子用户） ──
  db.insert(userAchievements).values([
    { user_id: "1", achievement_id: "1", unlocked_at: "2026-05-01" },
    { user_id: "1", achievement_id: "2", unlocked_at: "2026-05-01" },
    { user_id: "1", achievement_id: "3", unlocked_at: "2026-05-01" },
    { user_id: "1", achievement_id: "4", unlocked_at: "2026-05-01" },
  ]).run();

  console.log("[DB] Seed complete — all initial data loaded.");
}
