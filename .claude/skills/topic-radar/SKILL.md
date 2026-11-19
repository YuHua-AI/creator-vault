---
name: topic-radar
description: 选题雷达——扫描 NAS / GitHub / AUTOSAR / Obsidian 四条选题线里**能亲手复现的实战题材**（可部署的开源工具、可试用的版本特性），策展成 ideas/radar/<日期>.md，供产出实战教程。找选题、看有什么新工具值得上手时使用；手动调用，后续可挂 agent-autoloop 定时。
argument-hint: [可选：只看某条线 nas|github|autosar|obsidian；留空全线扫描]
---

# 选题雷达（topic-radar）

一次扫描四条选题线，**只收能上手实战的题材**：有可运行产物的开源工具、可试用的版本特性、可复现的踩坑。策展成雷达报告，供产出实战教程。**热点新闻、行业动态、话题事件不收**——那是资讯号的事，本库只做实战教程。**只收集、不写稿、不动选题池**。

## 流程

### ① 跑抓取脚本

```
node .claude/skills/topic-radar/scripts/fetch-radar.js
```

JSON 到 stdout：`{ date, hn[], frontPage[], reddit[], forum[], github[], githubNew[], errors{} }`。单源失败写进 errors，不影响其它源，别重试超过一次。

数据源与覆盖（**热度信号分两级**：硬热度 = 真实榜单排名/巨量星标；次级 = 关键词命中）：

| 源 | 级别 | 覆盖线 | 说明 |
|---|---|---|---|
| HN Algolia `tags=front_page`（此刻首页在榜 ~40 条） | 硬热度 | 全线（LINE_WORDS 本地分类） | 首页在榜即硬热度；多为新闻，靠实战三问过滤 |
| GitHub Search API：7 天内创建按星标排序 Top20 | 硬热度 | 全线（描述/语言分类） | 新爆款仓，`created:>日期 sort=stars` 免登录；一天几千星的才算热 |
| HN Algolia 关键词搜索（近 7 天 points>100） | 次级 | 全线（分线关键词） | 榜单漏掉的垂直题材；`advancedSyntax=true` 防裸词误配 |
| forum.obsidian.md latest.rss | 论坛直出 | obsidian | Discourse 官方论坛，稳定 |
| tools/github-weekly-rank 最新周 Top | 本地复用 | github | 周榜已覆盖的不重复报 |
| Reddit RSS top/week | 备用 | nas / autosar | 本网络直连不通（超时），脚本自动跳过；需要时用 WebFetch 抓 `reddit.com/r/selfhosted/top/?t=week` 等页 |

### ② AUTOSAR 线补抓

HN 对 AUTOSAR 覆盖弱，用 WebFetch 补两个来源，各取最近的大事（规范新版本、工具链发布、行业新闻）：

- `https://www.autosar.org/news-events`（注意：`/newsroom` 路径已 404）
- `https://www.vector.com/int/en/company/news/`（或当期可访问的新闻页）

### ③ 策展（Claude 做，不是脚本做）

**实战三问，过不了就不收：**

1. **有可运行产物吗？**——开源 repo、安装方式、可部署服务；纯新闻/纯观点/无产物的丢弃
2. **能在我的真实环境复现吗？**——对照四类环境：NAS/homelab（Docker、自托管）、Windows 工作机（CLI/桌面工具）、Obsidian 库（插件/工作流）、车载诊断经验（AUTOSAR 工具链）；复现不了的丢弃
3. **值得写成教程吗？**——上手门槛适中（太浅没人看、太深超出一次教程容量）、与 `ideas/pool.md`、`published/` 不重复

热度只作排序参考，不作入选标准——30 分但能装能用的 Show HN 优先于 500 分的新闻。

- 每条候选：**标题 / 热度 / 是什么（一句话）/ 上手方式（部署或安装的入口）/ 结合我的哪个环境 / 教程切入点**（面向公众号读者的钩子）
- 每线标 ⭐ 推荐 ≤2 条：实战三问全过 + 角度最好
- AUTOSAR 线特殊：实战素材主要来自用户自己的项目经验（见 autosar-series skill），雷达只收「可上手的新规范特性、新工具链版本」，纯行业新闻不收
- HN/Reddit 素材是英文的，角度用中文写；标题保留原文 + 可加中文括注

### ④ 落盘

写 `ideas/radar/<日期>.md`（目录不存在则建）：

```markdown
# 选题雷达 YYYY-MM-DD

> 来源命中：HN N 条 · 论坛 N 条 · GitHub Top8 · Reddit 不可达
> ⭐ = 推荐选题（每线 ≤2）；已剔除无产物/无法复现的条目

## NAS
- **标题**（热度）
  是什么：一句话
  上手：docker/安装入口或 repo 地址
  结合：NAS 自托管 × 场景
  切入：教程钩子一句话
  [来源](url) ⭐
```

frontmatter 可不带（非文章）；报告只新增当天文件，不改历史雷达。

## 红线

- **纯新闻、无产物、无法复现的条目不收**——行业大事只在其能落地为「可上手特性」时才入报告
- 不动 `ideas/pool.md`、不动 drafts——入库选题必须用户拍板后走 write-article 阶段 1
- 来源只留链接与一句话概括，不转载正文段落
- 永不在此库存放任何密码、token、密钥

## agent-autoloop 定时（已挂）

2026-11-18 起挂在 `C:\Users\YH\.agent-autoloop\rules.json`，规则名「选题雷达」，每天 08:03 全线扫描：跑脚本 → AUTOSAR 补抓 → 实战三问策展 → 写当天雷达报告；不 commit、不动 pool.md，爆点（front_page points>500 或 7 天新仓>3000 星且过实战三问）发卡片提醒。改规则去 rules.json，不在本文件改。
