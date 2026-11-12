# gzh-vault — 公众号文章写作库

AI 写作助手在此库工作时的约定。管线：**Claude Code 生成/改稿 → Obsidian 人工终审 → doocs/md（http://localhost:8080）排版 → 粘贴公众号后台发布**。

## 文章流转

```
ideas/（选题池，一行一个想法）→ drafts/（AI 草稿+改稿）→ published/（发布后归档）
```

发布完成的标志：frontmatter `status: published`，文件移入 `published/`，git commit。

每篇文章一个文件夹：`drafts/<文章短名>/article.md + img/`（短名去掉标点用连字符连接；图片命名主图 `cover.jpg`、插图 `01-xxx.jpg` 递增，正文用相对路径 `img/…` 引用）。发布归档时整个文件夹移入 `published/`。

## 双体系分界（claude-obsidian 插件 vs 写作管线）

`wiki/`、`inbox/`、`.raw/` 归 claude-obsidian 插件管；`ideas/`、`drafts/`、`published/` 是写作管线。判别一条内容归属：

- **值得长期记住的知识/素材**（调研结论、参考来源、可复用观点）→ `wiki/`，走 wiki-ingest/save
- **一篇要发布的文章** → `drafts/`，绝不能把文章草稿写进 `wiki/`

规则：

- 不手工编辑 `wiki/meta/ledgers/`（插件的溯源账本，由其事务机制维护）
- 文章 frontmatter 用本库约定（title/date/status/tags）；wiki 页跟随插件自己的元数据格式，两套格式不互用
- 发布后的文章若含可复用观点，可 `save` 回 wiki（可选，非必须）

## frontmatter 约定（每篇必带）

```yaml
---
title: 文章标题
date: YYYY-MM-DD
status: idea | draft | review | published
tags: [主题标签]
---
```

## 写作规范

- **实例必须取材自 nas-ops 真实运维库**（`/Users/yaohua/Workspace/06_Tools/nas-ops`）：文章中的具体场景、端口、脚本、服务清单、架构细节一律先读该库求证（重点：`docs/architecture.md`、`docs/network_topology.md`、`docker-compose/`、`configs-backup/`、`scripts/`），写真实发生过的事，不编造与真实环境矛盾的"假实例"。转述时脱敏：**个人信息数据绝不入文**（密码/token/密钥/内网真实 IP/账号凭据等可定位到个人的信息）；产品品牌、具体网站、设备型号、具体实物**可以直接点名**（2026-11-11 起，旧「写成通用指引」要求作废）。
- 面向公众号读者：段落短（3~5 行内），金句/结论前置，善用小标题分节
- 中文排版：中英文与数字之间加空格，全角标点
- 代码块和技术内容：给出最小可运行示例，公众号端展示靠 doocs/md 的代码主题
- 改稿保留 git 历史：改动先积累，收尾时统一 commit（或用户明确要求时再提交），message 用「文章名: 改了什么」
- **永不在此库存放任何密码、token、密钥**（WebDAV、公众号后台等凭据一律不入库）

## 排版交付

- 终稿确认后：内容粘贴到 http://localhost:8080（doocs/md），选主题，复制富文本
- 自定义主题 CSS 的备份在 `assets/theme.css`，doocs/md 配置变更后同步更新此文件
- 发布时记得勾选平台的 AI 生成内容标识

## 环境备忘

- 备份走 Remotely Save 插件（WebDAV → NAS），点开头目录（`.git`/`.obsidian`）不在其同步范围，灾备含历史可用 `git bundle create backups/vault.bundle --all`
