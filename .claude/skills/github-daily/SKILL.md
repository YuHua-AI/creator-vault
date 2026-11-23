---
name: github-daily
description: 「GitHub 日榜」系列帖图每期生产流程，GitHub 周榜的姊妹系列。拉 OpenGithubs/github-daily-rank 日榜数据 → 调研 Top8 → 填 data.json → 生成 9 张卡片图 → 视觉自检 → 推图片消息草稿。做新一期 GitHub 日榜帖图时用；审图/推送/发布/归档沿用 image-post skill 的对应阶段。
argument-hint: [日榜文件日期如 20261116；留空则取数据源最新一天]
---

# GitHub 日榜（每期帖图）

本 skill 是 image-post 管线在「GitHub 日报」选题上的特化，与 `github-weekly` 同源同版式：数据源、卡片版式、图标库固定，**每期只换一份 data.json**。图即内容，正文只做壳。

| | 日榜（本 skill） | 周榜（github-weekly） |
|---|---|---|
| 内容 | 当日涨星最快 Top 8 排名 | 当周涨星最快 Top 8 排名 |
| 数据源 | `tools/github-daily-rank`（OpenGithubs/github-daily-rank） | `tools/github-weekly-rank` |
| 生成器 | 本 skill `scripts/`（今日增长 DAILY / 开源日榜） | 周榜 skill `scripts/`（本周增长 WEEKLY / 开源周榜） |
| frontmatter | `collection: GitHub 日榜`，标题带「GitHub 日榜｜」前缀 | `collection: GitHub 周榜` |
| 目录 | `github/daily-<日期>/` | `github/weekly-<周日期>/` |

两系列共用：1350×1800 竖版画幅、深蓝霓虹线框风、图片消息管线与全部生产规则。**生产规则**（内容/版式/管线的硬规则）以 `references/rules.md` 为准（与周榜同源，出图前过一遍）。版式变更时两套生成器一起改并 commit。

## 每期流程

### ① 拉数据（一键自动）

```
node .claude/skills/github-daily/scripts/fetch-data.js [日期如 20261116]   # 缺省取最新一天
```

自动完成：`tools/github-daily-rank` git pull（直连，失败用本地数据继续）→ **与已发布/在稿对比：数据源不是每天更新，最新日文件若已有 `published/github/daily-<day>/` 或 `drafts/github/daily-<day>/`，输出「无更新」即结束，不往下走** → 否则定位当日 `YYYY/MM/YYYYMMDD.md`，解析涨星 Top 8（owner/repo、总星标、日增长，详情段挂 `_research`：描述/建仓时间/上周月增长）→ 脚手架 `img-src/data.json`（数值已填好）+ `article.md` 壳（图序已排）。已存在的稿件不会覆盖。

**星数一律以日榜文件解析结果为准，不凭印象写。** 数据源通常每日更新前一日的榜，脚手架的 `daily-<日期>` 以数据文件日期为准。

### ② 调研 8 个仓库，补齐 data.json 的 TODO

脚手架已把数值字段填好，剩下 TODO 字段靠调研：每仓读 README 与仓库元数据（GitHub API 或 raw.githubusercontent.com，不走代理，如 `gh api repos/<owner>/<repo>/readme`），提炼：

- `pitch`：一句话（绿色霓虹标语）
- `what` / `can` / `who`（项目速览·核心玩法·适用人群）：各 2 行，每行 ≤40 字
- `coverIntro` + `coverTags`：封面榜单行的短介绍与 2 个标签；`tags`：卡片底部 3 个标签
- 口吻面向公众号读者：说人话、有钩子，参考往期 `published/github/*/img-src/data.json`

### ③ 图标映射

每个项目映射 `scripts/icons.js` 的 ICONS key；没有贴题的就**新画一个**追加进 icons.js（随本批 commit，图标库逐期积累）。图标规范：中心原点、覆盖约 ±60、线框风——`#35D0FF` 描边 3.5 / `#12294D` 填充 / `#3EE8B0` 点缀，封面行内 scale(0.7)、卡片 scale(1.6)。日榜 icon 库与周榜各自独立积累，新画前可先看周榜 `icons.js` 有没有可直接搬的。

### ④ 壳文案收尾

脚手架已生成 `article.md` 骨架与图序，补上：开场 2~3 行（今日趋势，与 `subtitleHighlight` 呼应）、收尾互动、frontmatter `title` 的今日亮点；确认 `post_title` ≤20 字。目录约定：`drafts/github/daily-<日文件日期>/`，归档时整个日目录移入 `published/github/`。

data.json schema（脚手架产物同构，把 TODO 字段替换为实文即可；`period` 为单个日期）：

```json
{
  "day": "20261116",
  "period": "2026.11.16",
  "subtitle": "今日涨星最快的 8 个开源项目",
  "subtitleHighlight": "TODO（今日趋势一句话）",
  "cards": [
    {
      "file": "01-unslop",
      "icon": "TODO（映射 icons.js 已有 key，或新画一个追加进去）",
      "no": 1,
      "owner": "heydamir",
      "repo": "unslop",
      "lang": "TODO",
      "coverIntro": "TODO",
      "coverTags": ["TODO", "TODO"],
      "pitch": "TODO",
      "total": "15.9k",
      "growth": "1,509",
      "what": ["…", "…"],
      "can": ["…", "…"],
      "who": ["…", "…"],
      "tags": ["TODO", "TODO", "TODO"],
      "_research": { "created": "2026-11-01", "desc": "A Claude skill that turns vibecoded, AI-looking UI into a designed interface", "weekGrowth": "12565", "monthGrowth": "12565" }
    }
  ]
}
```

### ⑤ 生成与渲染

```
node .claude/skills/github-daily/scripts/gen-cards.js <draft>/img-src/data.json
node .claude/skills/github-daily/scripts/gen-cover.js <draft>/img-src/data.json
node .claude/skills/image-post/scripts/render-img.js <draft>/img-src/cover.svg <draft>/img/cover.jpg   # 子图同理逐张
```

SVG 与 JPG 都落在 draft 的 `img-src/`、`img/`（skill 只持有生成器，不存产物）。

### ⑥ 视觉自检

逐张查：长项目名截断（>16 字符走降档字号）/ 三段正文溢出 / 中英混排行（如 `Study → Build → Check → Ready`）/ 图标变形。有问题改 data.json 或 icons.js 重跑，**不手改 JPG**。

### ⑦ 之后

沿用 image-post 阶段 4~7：人工审图（用户翻 `img/`，确认后 `status: review`）→ `push-image-post.js` 推图片消息草稿 → 后台发布（勾 AI 生成内容标识）→ 归档 `published/`。

## 版式常量（改版式＝改生成器脚本并 commit，两系列一起改）

- 9 张全部 1350×1800 竖版：cover（标题区 + 8 行榜单）+ 8 张项目卡
- 卡片结构：顶部胶囊（GITHUB DAILY · 开源日榜）/ NO.0X → 图标 → 项目名标题 → 作者·语言小字 → pitch → 星数双格（总星标·今日增长）→ 三段（项目速览·核心玩法·适用人群）→ 标签 → 落款
- 风格：深蓝霓虹线框风，规格文档见 `.claude/skills/write-article/references/illustration-spec.md`

## 自动化

agent-autoloop 有「日榜」定时规则（每日早上拉最新日榜数据脚手架草稿并调研出图，留人工终审，不 commit 不 push）；规则在 `~/.agent-autoloop/rules.json`，改规则后跑 `agent-autoloop check`。

## 始终遵守

- 永不在此库存放任何密码、token、密钥；收尾统一 commit
- 数据以 tools/github-daily-rank 为准；帖图文案克制，信息进卡片
