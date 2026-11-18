---
name: github-weekly
description: 「GitHub 周榜 / 周精选」系列帖图每期生产流程。周榜（涨星排名）：拉周榜数据 → 调研 Top8 → 填 data.json → 生成 9 张卡片图 → 视觉自检 → 推图片消息草稿。做新一期 GitHub 周报帖图时用；审图/推送/发布/归档沿用 image-post skill 的对应阶段。
argument-hint: [周榜文件日期如 20261116；留空则取数据源最新一周；周精选期不带参数手动开工]
---

# GitHub 周榜 / 周精选（每期帖图）

本 skill 是 image-post 管线在「GitHub 周报」选题上的特化：数据源、卡片版式、图标库固定，**每期只换一份 data.json**。图即内容，正文只做壳。

## 两种期型（先分清再做）

| | 周榜 | 周精选 |
|---|---|---|
| 内容 | 当周涨星最快 Top 8 排名 | 主题策展，选 3~5 个仓讲一个主题 |
| 产线 | fetch-data.js 脚手架 + data.json + gen-*.js 批量出 9 图 | 手写主题卡片 SVG（无 data.json、不走 gen-*.js），图数随主题定 |
| frontmatter | `collection: GitHub 周榜`，标题带「GitHub 周榜｜」前缀 | `collection: GitHub 每周精选`，标题即主题钩子 |
| 首例 | `published/github/weekly-20261109/` | `drafts/github/weekly-20261114/`（Claude Code 四件套） |

两种期型共用：目录 `github/weekly-<周日期>/`、1350×1800 竖版画幅、深蓝霓虹线框风、图片消息管线与全部生产规则。下面 ①~⑥ 流程是**周榜专用**；周精选参考首例手写卡片，规则同 `references/rules.md`。

**生产规则**（内容/版式/管线的硬规则，做期中持续沉淀）以 `references/rules.md` 为准，出图前过一遍。

## 每期流程

### ① 拉数据（周榜期一键自动）

```
node .claude/skills/github-weekly/scripts/fetch-data.js [周日期如 20261116]   # 缺省取最新一周
```

自动完成：`tools/github-weekly-rank` git pull（走代理，失败用本地数据继续）→ 定位当周 `YYYY/MM/YYYYMMDD.md` → 解析周期与涨星 Top 8（owner/repo、总星标、周增长，前 3 名描述挂 `_research`）→ 若 `drafts/github/weekly-<week>/` 不存在则脚手架 `img-src/data.json`（数值已填好）+ `article.md` 壳（图序已排）。已存在的稿件不会覆盖。

**星数一律以周榜文件解析结果为准，不凭印象写。**

### ② 调研 8 个仓库，补齐 data.json 的 TODO

脚手架已把数值字段填好，剩下 TODO 字段靠调研：每仓读 README 与仓库元数据（GitHub API，同样走代理，如 `https_proxy=http://127.0.0.1:7890 gh api repos/<owner>/<repo>/readme`），提炼：

- `pitch`：一句话（绿色霓虹标语）
- `what` / `can` / `who`（项目速览·核心玩法·适用人群）：各 2 行，每行 ≤40 字
- `coverIntro` + `coverTags`：封面榜单行的短介绍与 2 个标签；`tags`：卡片底部 3 个标签
- 口吻面向公众号读者：说人话、有钩子，参考往期 `published/github/*/img-src/data.json`

### ③ 图标映射

每个项目映射 `scripts/icons.js` 的 ICONS key；没有贴题的就**新画一个**追加进 icons.js（随本批 commit，图标库逐期积累）。图标规范：中心原点、覆盖约 ±60、线框风——`#35D0FF` 描边 3.5 / `#12294D` 填充 / `#3EE8B0` 点缀，封面行内 scale(0.7)、卡片 scale(1.6)。

### ④ 壳文案收尾

脚手架已生成 `article.md` 骨架与图序，补上：开场 2~3 行（本周趋势，与 `subtitleHighlight` 呼应）、收尾互动、frontmatter `title` 的本周亮点；确认 `post_title` ≤20 字。目录约定：`drafts/github/weekly-<周文件日期>/`，归档时整个周目录移入 `published/github/`。

data.json schema（脚手架产物同构，把 TODO 字段替换为实文即可）：

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
