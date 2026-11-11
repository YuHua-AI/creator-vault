---
name: github-weekly
description: 「GitHub 周榜」系列帖图每期生产流程：拉周榜数据 → 调研 Top8 → 填 data.json → 生成 9 张卡片图 → 视觉自检 → 推图片消息草稿。做新一期 GitHub 周报帖图时用；审图/推送/发布/归档沿用 image-post skill 的对应阶段。
argument-hint: [周榜文件日期如 20261116；留空则取数据源最新一周]
---

# GitHub 周榜（每期帖图）

本 skill 是 image-post 管线在「GitHub 周榜」选题上的特化：数据源、卡片版式、图标库固定，**每期只换一份 data.json**。图即内容，正文只做壳。

**生产规则**（内容/版式/管线的硬规则，做期中持续沉淀）以 `references/rules.md` 为准，出图前过一遍。

## 每期流程

### ① 拉数据

```
cd tools/github-weekly-rank && git pull    # GitHub 访问走 https_proxy=http://127.0.0.1:7890
```

取当周文件 `YYYY/MM/YYYYMMDD.md`，解析「一周增长星数」Top 8：owner/repo、总星标、周增长、语言、建仓时间。**星数一律以该文件为准，不凭印象写。**

### ② 调研 8 个仓库

每仓读 README 与仓库元数据（GitHub API，同样走代理，如 `https_proxy=http://127.0.0.1:7890 gh api repos/<owner>/<repo>/readme`），按卡片字段提炼：

- `pitch`：一句话（绿色霓虹标语）
- `what` / `can` / `who`（项目速览·核心玩法·适用人群）：各 2 行，每行 ≤40 字
- `coverIntro` + `coverTags`：封面榜单行的短介绍与 2 个标签；`tags`：卡片底部 3 个标签
- 口吻面向公众号读者：说人话、有钩子，参考往期 `published/GitHub周榜-*/img-src/data.json`

### ③ 图标映射

每个项目映射 `scripts/icons.js` 的 ICONS key；没有贴题的就**新画一个**追加进 icons.js（随本批 commit，图标库逐期积累）。图标规范：中心原点、覆盖约 ±60、线框风——`#35D0FF` 描边 3.5 / `#12294D` 填充 / `#3EE8B0` 点缀，封面行内 scale(0.7)、卡片 scale(1.6)。

### ④ 建 draft + 填 data.json

- 文件夹：`drafts/GitHub周榜-<周文件日期>/`（如 `GitHub周榜-20261109`）
- `img-src/data.json`（本 skill 唯一数据源，schema 见下）
- `article.md` 壳：frontmatter（`title`；`post_title` ≤32 字；`date`；`status: draft`；`tags: [GitHub, 开源周报, AI Agent]`；`platform: [公众号]`）+ 开场 2~3 行（本周趋势一句话）+ 9 图连排（cover 在首）+ 收尾互动

```json
{
  "week": "20261109",
  "period": "2026.11.03 – 11.08",
  "subtitle": "本周涨星最快的 8 个开源项目",
  "subtitleHighlight": "7 个和 Agent 有关",
  "cards": [
    {
      "file": "01-dsh-superagent",
      "icon": "superagent",
      "no": 1,
      "owner": "deepseek-ai",
      "repo": "dsh-superagent-prototype",
      "lang": "TypeScript",
      "coverIntro": "DeepSeek 超级 Agent 研究原型",
      "coverTags": ["DeepSeek", "研究原型"],
      "pitch": "迈向更自主的 Agent",
      "total": "16.4k",
      "growth": "14,286",
      "what": ["…", "…"],
      "can": ["…", "…"],
      "who": ["…", "…"],
      "tags": ["DeepSeek 官方", "Agent", "研究原型"]
    }
  ]
}
```

### ⑤ 生成与渲染

```
node .claude/skills/github-weekly/scripts/gen-cards.js <draft>/img-src/data.json
node .claude/skills/github-weekly/scripts/gen-cover.js <draft>/img-src/data.json
node .claude/skills/image-post/scripts/render-img.js <draft>/img-src/cover.svg <draft>/img/cover.jpg   # 子图同理逐张
```

SVG 与 JPG 都落在 draft 的 `img-src/`、`img/`（skill 只持有生成器，不存产物）。

### ⑥ 视觉自检

逐张查：长项目名截断（>16 字符走降档字号）/ 三段正文溢出 / 中英混排行（如 `Study → Build → Check → Ready`）/ 图标变形。有问题改 data.json 或 icons.js 重跑，**不手改 JPG**。

### ⑦ 之后

沿用 image-post 阶段 4~7：人工审图（用户翻 `img/`，确认后 `status: review`）→ `push-image-post.js` 推图片消息草稿 → 后台发布（勾 AI 生成内容标识）→ 归档 `published/`。

## 版式常量（改版式＝改生成器脚本并 commit）

- 9 张全部 1350×1800 竖版：cover（标题区 + 8 行榜单）+ 8 张项目卡
- 卡片结构：顶部胶囊 / NO.0X → 图标 → 项目名标题 → 作者·语言小字 → pitch → 星数双格（总星标·周增长）→ 三段（项目速览·核心玩法·适用人群）→ 标签 → 落款
- 风格：深蓝霓虹线框风，规格文档见 `.claude/skills/write-article/references/illustration-spec.md`

## 始终遵守

- 永不在此库存放任何密码、token、密钥；收尾统一 commit
- 数据以 tools/github-weekly-rank 为准；帖图文案克制，信息进卡片
