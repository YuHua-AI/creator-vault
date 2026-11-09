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
```

## 目录

| 目录 | 用途 |
|---|---|
| `ideas/` | 选题池，一行一个想法，攒够了挑一条进 drafts |
| `drafts/` | 写作中的文章，frontmatter `status: draft` |
| `published/` | 发布后归档，`status: published` |
| `assets/` | doocs/md 主题 CSS 备份（`theme.css`）、题图等素材 |

## 环境备忘

- **AI 写作约定**在 `.claude/CLAUDE.md`（Obsidian 内不可见，用编辑器查看）——frontmatter 格式、写作规范、改稿流程都写在那里
- **备份**：Remotely Save 插件自动同步到 NAS（WebDAV）；`.git`/`.obsidian` 不在同步范围，完整灾备用 `git bundle create backups/vault.bundle --all`
- **版本**：本地 git，每次实质改稿一个 commit，message 格式「文章名: 改了什么」
