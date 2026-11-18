---
name: topic-radar
description: 选题雷达——一次扫描 NAS / GitHub / AUTOSAR / Obsidian 四条选题线的热点素材（HN Algolia、Obsidian 官方论坛、Reddit RSS、GitHub 涨星数据仓），策展成 ideas/radar/<日期>.md。想找选题、看近期热点、收集素材时使用；手动调用，后续可挂 agent-autoloop 定时。
argument-hint: [可选：只看某条线 nas|github|autosar|obsidian；留空全线扫描]
---

# 选题雷达（topic-radar）

一次扫描四条选题线的热点素材，策展成一份雷达报告。**只收集、不写稿、不动选题池**——报告给用户挑，挑中的才走 write-article 阶段 1 入库。

## 流程

### ① 跑抓取脚本

```
node .claude/skills/topic-radar/scripts/fetch-radar.js
```

JSON 到 stdout：`{ date, hn[], reddit[], forum[], github[], errors{} }`。单源失败写进 errors，不影响其它源，别重试超过一次。

数据源与覆盖：

| 源 | 覆盖线 | 说明 |
|---|---|---|
| HN Algolia（近 7 天 points>40） | 全线（关键词命中） | 主力源 |
| forum.obsidian.md latest.rss | obsidian | Discourse 官方论坛，稳定 |
| tools/github-weekly-rank 最新周 Top | github | 复用本地数据仓，含总星/周涨/描述 |
| Reddit RSS top/week | nas / autosar | 本网络直连不通（429/超时），脚本自动跳过；需要时用 WebFetch 抓 `reddit.com/r/selfhosted/top/?t=week` 等页 |

### ② AUTOSAR 线补抓

HN 对 AUTOSAR 覆盖弱，用 WebFetch 补两个来源，各取最近的大事（规范新版本、工具链发布、行业新闻）：

- `https://www.autosar.org/news-events`（注意：`/newsroom` 路径已 404）
- `https://www.vector.com/int/en/company/news/`（或当期可访问的新闻页）

### ③ 策展（Claude 做，不是脚本做）

- 按 nas / github / autosar / obsidian 分组（有参数则只出该线）
- 每条候选：**标题 / 热度**（HN points·评论数、周涨星数，或「论坛热帖」）**/ 来源链接 / 一句话选题角度**——角度面向公众号读者，写「为什么值得写、从哪个切入」
- **剔除假命中**：关键词撞车但主题无关的直接丢（如 "NAS" 命中的美国航天新闻）
- 每线标 ⭐ 推荐 ≤2 条，标准：热度高 + 有可写角度 + 与 `ideas/pool.md`、`published/` 已有文章不重复
- HN/Reddit 素材是英文的，角度用中文写；标题保留原文 + 可加中文括注

### ④ 落盘

写 `ideas/radar/<日期>.md`（目录不存在则建）：

```markdown
# 选题雷达 YYYY-MM-DD

> 来源命中：HN N 条 · 论坛 N 条 · GitHub Top8 · Reddit 不可达
> ⭐ = 推荐选题（每线 ≤2）

## NAS
- **标题**（热度）— 一句话角度 [来源](url)

## GitHub
…

## AUTOSAR
…

## Obsidian
…
```

frontmatter 可不带（非文章）；报告只新增当天文件，不改历史雷达。

## 红线

- 不动 `ideas/pool.md`、不动 drafts——入库选题必须用户拍板后走 write-article 阶段 1
- 来源只留链接与一句话概括，不转载正文段落
- 永不在此库存放任何密码、token、密钥

## 挂 agent-autoloop（后续）

定时规则 prompt 模板（届时直接用）：

> 跑 /topic-radar 全线扫描，产出 ideas/radar/<当天日期>.md，第一行写「雷达完成：<各线推荐数>」，正文列出全部 ⭐ 推荐选题；发现爆点（HN points>500 或周涨星>10000）额外发卡片提醒。
