# gzh-vault — 公众号文章写作库

AI 写作助手在此库工作时的约定。管线：**Claude Code 生成/改稿 → Obsidian 人工终审 → doocs/md（http://localhost:8080）排版 → 粘贴公众号后台发布**。

## 文章流转

```
ideas/（选题池，一行一个想法）→ drafts/（AI 草稿+改稿）→ published/（发布后归档）
```

发布完成的标志：frontmatter `status: published`，文件移入 `published/`，git commit。

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

- 面向公众号读者：段落短（3~5 行内），金句/结论前置，善用小标题分节
- 中文排版：中英文与数字之间加空格，全角标点
- 代码块和技术内容：给出最小可运行示例，公众号端展示靠 doocs/md 的代码主题
- 改稿保留 git 历史：每次实质修改单独 commit，message 用「文章名: 改了什么」
- **永不在此库存放任何密码、token、密钥**（WebDAV、公众号后台等凭据一律不入库）

## 排版交付

- 终稿确认后：内容粘贴到 http://localhost:8080（doocs/md），选主题，复制富文本
- 自定义主题 CSS 的备份在 `assets/theme.css`，doocs/md 配置变更后同步更新此文件
- 发布时记得勾选平台的 AI 生成内容标识

## 环境备忘

- 备份走 Remotely Save 插件（WebDAV → NAS），点开头目录（`.git`/`.obsidian`）不在其同步范围，灾备含历史可用 `git bundle create backups/vault.bundle --all`
