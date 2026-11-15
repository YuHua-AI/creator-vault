# gzh-vault — 公众号写作库

AI 生成 → 人工终审 → 排版发布的文章生产线。备份自动同步到 NAS。

## 管线

```
ideas/（选题池） ──► drafts/（AI 草稿+改稿） ──► published/（已发布）
                          │                          │
                    Claude Code 生成/改稿      doocs/md 排版
                    (终端或桌面 App)          http://localhost:8080
                                                     │
                                              粘贴公众号后台发布
                                              （勾选 AI 内容标识）

published/ ──► 站外分发（知乎/CSDN 等）：登记随专题放 published/<专题>/{footer,links,gzh/zh/csdn}
```

## 目录

| 目录 | 用途 |
|---|---|
| `ideas/` | 选题池（`pool.md`）与增长策略（`growth-plan.md`） |
| `drafts/` | 写作中的文章，frontmatter `status: draft`，按专题分子目录 |
| `published/` | 发布后归档，`status: published`，按专题分子目录；专题目录内同放分发登记（`footer.md`、`links.json`、`gzh/zh/csdn/`），`gen-dist-versions.js` 一条命令生成贴稿流 |
| `assets/` | 主题 CSS 备份（`theme.css`）、合集封面（`collection-covers/`）等素材 |
| `tools/` | 外部数据源仓库（gitignore，如 github-weekly-rank） |
| `wiki/` | **claude-obsidian 插件管的知识库**（带溯源的素材沉淀），文章不进这里 |
| `inbox/` | 插件的捕获暂存区，外部资料先落这再由 wiki-ingest 消化 |

## 环境备忘

- **AI 写作约定**在 `.claude/CLAUDE.md`（Obsidian 内不可见，用编辑器查看）——frontmatter 格式、写作规范、改稿流程都写在那里
- **备份**：Remotely Save 插件自动同步到 NAS（WebDAV）；`.git`/`.obsidian` 不在同步范围，完整灾备用 `git bundle create backups/vault.bundle --all`
- **版本**：本地 git，每次实质改稿一个 commit，message 格式「文章名: 改了什么」
