---
name: ai-weekly
description: 「AI 周报」系列帖图每期生产流程——本周 AI 大事件盘点（硬件/七姐妹/大模型/agent/隐私/开源全覆盖）。选题雷达扫热点 → 中文查重定增量 → 定 8~9 条事件 → 填 data.json → 生成卡片图 → 视觉自检 → 推图片消息草稿。做新一期 AI 周报帖图时用；审图/推送/发布/归档沿用 image-post skill 的对应阶段。定位：引流款，时效即流量。
argument-hint: [期号日期如 20261116；留空则以上周一~周日为周期现扫]
---

# AI 周报（每期帖图）

本 skill 是 image-post 管线在「本周 AI 大事盘点」选题上的特化，与 github-weekly 平行：数据源换成**选题雷达**（无本地数据仓，每期现扫），卡片从项目卡换成**事件卡**。图即内容，正文只做壳。

- 目录约定：`drafts/ai-weekly/<期号>/`（期号=周期周日日期 YYYYMMDD），归档进 `published/ai-weekly/`
- frontmatter：`collection: AI 周报`，标题带「AI 周报｜」前缀，`post_title` ≤20 字且钩子前置（如「本周AI圈炸了：黄仁勋辞职领衔9件大事」）
- 引流定位：封面首图决定信息流点击，标题公式「情绪钩子 + 领衔事件 + N 件大事」；周期内越早发越好，新闻热度衰减以天计

## 每期流程

### ① 选题雷达（数据源，每期现扫）

三层扫描，全上周一 00:00 UTC 以来的 7 天窗：

1. **HN Algolia 全量高分帖**（主雷达，事件热度的客观标尺）：
   ```
   curl -s "https://hn.algolia.com/api/v1/search?tags=story&numericFilters=created_at_i>{周一起始unix},points>120&hitsPerPage=30"
   ```
   按 points 降序通读，AI 相关条目全部入选候选池
2. **定向关键词补漏**（防高分帖漏网）：`AI / LLM / OpenAI / Anthropic / Claude / Gemini / Nvidia / agent` 各查一遍（`points>25`），大厂官方动作即使分不高也要（Vercel 文档、微软开源等）
3. **WebSearch 面扫**：英文「AI news this week + 日期」补 HN 盲区（发布会、政策、融资）

热度数字（pt/评论数）**一律以 API 返回为准**，不凭印象写。

### ② 中文查重，定增量

每个候选事件单独 WebSearch 中文关键词（人名/公司/事件词 + 中文），分三档：

- **刷屏**（BBC/WSJ 中文都在追）→ 只配当综述里的一条，不做主角
- **早期传播**（仅 X/Threads 个人号在转）→ 可做主角或深拆
- **空白** → 增量最大，优先级最高

### ③ 定条目（8~9 条，与用户对齐后再出图）

- **排序按热度**，领衔条目进标题和封面视觉重心
- **多样性配额**：硬件/七姐妹商业、大模型发布、agent 生态、隐私安全、开源社区——每个领域至少 1 条，避免全是同一家的新闻
- 宁缺毋滥：不足 8 条硬货就做 6~7 条，不凑数

### ④ 填 data.json（事件卡 schema）

```json
{
  "week": "20261116",
  "period": "2026.11.09 – 11.15",
  "subtitle": "本周 AI 圈 9 件大事",
  "subtitleHighlight": "黄仁勋辞职领衔",
  "cards": [
    {
      "file": "01-jensen-resigns",
      "icon": "chip",
      "no": 1,
      "event": "黄仁勋辞任英伟达 CEO",
      "date": "11-12",
      "coverIntro": "婚外情丑闻曝光后即时辞职",
      "coverTags": ["英伟达", "接班人悬案"],
      "oneLiner": "33 年创始人时代落幕，CFO 临时接棒",
      "heat": "4054",
      "comments": "3465",
      "what": ["发生了什么，2 行，每行 ≤40 字", "…"],
      "why": ["为什么重要，2 行", "…"],
      "watch": ["后续盯什么（财报/听证/接班）1~2 行", "…"],
      "tags": ["硬件", "人事地震", "AI 算力"]
    }
  ]
}
```

三段正文从周榜的「速览·玩法·人群」换成「**发生了什么 · 为什么重要 · 后续盯什么**」；数值双格从「总星标·周增长」换成「**HN 热度 · 评论数**」。

### ⑤ 图标映射

`scripts/icons.js` 起步时从 github-weekly 拷贝共享图标，新闻向图标逐期新画追加（芯片/盾牌/火箭/飞机/法槌/锁…），规范同周榜：中心原点 ±60、`#35D0FF` 描边 3.5 / `#12294D` 填充 / `#3EE8B0` 点缀。

### ⑥ 生成与渲染

```
node .claude/skills/ai-weekly/scripts/gen-cards.js <draft>/img-src/data.json
node .claude/skills/ai-weekly/scripts/gen-cover.js <draft>/img-src/data.json
node .claude/skills/image-post/scripts/render-img.js <draft>/img-src/cover.svg <draft>/img/cover.jpg   # 子图同理
```

首期先从 github-weekly 的 gen 脚本改造（字段换事件版）；封面沿用「标题区 + N 行榜单」家族版式，副标题与周榜区分。

### ⑦ 视觉自检

逐张查：事件名超长截断 / 三段正文溢出 / 中英混排行 / 图标变形。改 data.json 或生成器重跑，**不手改 JPG**。事件卡日期与热度数字和 data.json 一一对应。

### ⑧ 壳文案与之后

article.md 壳：开场 2~3 行（本周一句话定调，与 `subtitleHighlight` 呼应）+ 按序引用全部图 + 收尾互动（下期想看什么/评论区聊哪件）。之后沿用 image-post 阶段 4~7：人工审图 → `push-image-post.js` → 后台发布（勾 AI 生成内容标识）→ 归档。

## 版式常量（改版式＝改生成器脚本并 commit）

- 封面 + 8~9 张事件卡，全部 1350×1800 竖版，深蓝霓虹线框风（规格见 `.claude/skills/write-article/references/illustration-spec.md`）
- 事件卡结构：顶部胶囊 / NO.0X + 日期 → 图标 → 事件名 → oneLiner → 热度双格（HN 热度·评论数）→ 三段（发生了什么·为什么重要·后续盯什么）→ 标签 → 落款

## 始终遵守

- 永不在此库存放任何密码、token、密钥；收尾统一 commit
- 热度与日期以雷达 API 结果为准；涉及未定案的指控性新闻（丑闻/诉讼），卡片措辞用「被曝/据报道」，不断言
- 引流但不标题党：钩子基于真实热度数字，不造情绪
