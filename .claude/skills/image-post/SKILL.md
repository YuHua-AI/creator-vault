---
name: image-post
description: 公众号「帖图」（图片消息）全流程管线：选题 → 数据 → 卡片图生成 → 人工审图 → 图片消息草稿推送 → 发布归档。做「发帖图」类稿件（GitHub 周榜等图片为主的选题）用这个；写图文文章用 write-article，两条管线不混用。
argument-hint: [选题文字 或 drafts/ 下的文章短名；留空则报告当前进度]
---

# 公众号帖图全流程

> 核心准则：**写文章重在文字，发帖图重在图片。** 帖图的信息量做进图片里，正文只做极简包装（开场点题 + 图 + 收尾互动），不在正文重复卡片上已有的内容。

管线：**Claude Code 生成卡片图 → Obsidian 人工审图 → 图片消息草稿（API 自动推送）→ 后台发布归档**。

与 write-article（图文文章）是平行管线，互不借用阶段流程。公众号侧对应「图片消息」：读者在信息流刷到的是首图卡片，点开是可滑动的图集 + 一段短文案。

## 形态与硬性限制（微信图片消息）

- 图片 ≤20 张，**首图即封面**（约定 `img/cover.jpg` 在正文排第一）
- 标题 ≤20 字：frontmatter 可选字段 `post_title`，缺省用 `title`（超 20 字推送时报错）
- 文案：纯文本 ≤1000 字，自动取 article.md 去图后的正文
- 文件结构沿用写作管线约定：`drafts/<短名>/article.md + img/ + img-src/`；article.md 是壳：开场 2~3 行 + 按序引用全部图片 + 收尾互动
- frontmatter 用库约定（title/date/status/tags，另加可选 post_title）

## 第 0 步：定位阶段（每次必做）

读 `drafts/<短名>/article.md` 的 `status`：idea/draft → 阶段 2~3；review → 阶段 4 等人工确认；published 但仍在 drafts/ → 阶段 7 归档。无文件则从阶段 1 选题开始。

## 阶段 1：选题入库

想法落 `ideas/`。帖图适合**结构化、可枚举**的选题：榜单、合集、清单、一图流——一张卡一个条目，条目数即卡数（+1 张总览封面）。对齐选题角度、目标读者、卡片字段后再动手。

## 阶段 2：数据与素材

- 数据源优先用库里已有的（如周榜 `tools/github-weekly-rank`，先 `git pull` 取最新周，GitHub 访问走 `https_proxy=http://127.0.0.1:7890`）
- 每个条目按卡片字段组织：编号 / 图标名 / 标题（项目名）/ 一句话 / 数值双格（总星标·周增长，或选题对应指标）/ 三段正文（项目速览·核心玩法·适用人群）/ 标签

## 阶段 3：生成卡片图（AI 执行）

- **先列清单再出图**：几张、每张画什么、封面怎么排，与用户确认后再产出
- 手写 SVG 生成脚本存 `img-src/`：gen-cover.js + gen-cards.js + 共享 icons.js，**数据驱动，下一期只改数据数组**
- 渲染：`node .claude/skills/image-post/scripts/render-img.js <in.svg> <out.jpg>`（headless Chrome；playwright 未安装时自动回落到 write-article 的 node_modules）
- 风格沿用库内深蓝霓虹线框风，规格文档见 `.claude/skills/write-article/references/illustration-spec.md`（共享的是设计规格，不是流程）
- 渲染后逐张视觉自检：文字截断 / 重叠 / 溢出，有问题改脚本重渲染，不手改 JPG
- article.md 壳文案同步写好，status: draft
- 收尾统一 git commit（message 用「文章名: 改了什么」）

## 阶段 4：人工审图（人工关卡，AI 不代替）

- 请用户翻 `img/` 通读整套图（这是帖图的「终审」，图即内容）
- 用户确认后 `status: review`

## 阶段 5：推帖图草稿（AI 自动执行）

```
node .claude/skills/image-post/scripts/push-image-post.js <文章文件夹> [--title 标题] [--text 文案路径]
```

- 按正文图片引用顺序逐张传永久素材 → 建 newspic 图片消息草稿（首图即封面，文案 = 去图正文）
- 前提：凭据在 `~/.config/gzh/env`（GZH_APPID / GZH_SECRET，可选 GZH_AUTHOR ≤8 字），库外永不入库；**不需要** doocs/md
- 家宽 IP 变化报 40164：按 errmsg 里的新 IP 更新微信开发者平台白名单后重跑

## 阶段 6：发布（人工操作）

后台 → 草稿箱 → 打开帖图草稿 → 预览（确认首图封面裁剪与图序）→ **勾选 AI 生成内容标识** → 发布。

## 阶段 7：归档

`status: published` → 整个文件夹移入 `published/` → git commit（「文章名: 发布归档」）。

## 始终遵守

- 永不在此库存放任何密码、token、密钥
- 不手工编辑 `wiki/meta/ledgers/`；文章草稿绝不写进 `wiki/`
- 文案克制：信息进卡片，正文不重复；贴图稿不写长文
