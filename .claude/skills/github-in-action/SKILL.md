---
name: github-in-action
description: GitHub 开源项目实战文章（英文发布）：核实 repo → 调研 → 英文起草 → 人工终审 → dev.to/Medium 等国际平台发布 → 归档。写某个开源项目的上手实战、接入自己工作流的经验、踩坑类英文文章时使用。走 write-article 状态机，本 skill 只补英文实战稿的特化规则。
argument-hint: [repo 地址或项目名；或 drafts/ 下的 -en 短名]
---

# GitHub 实战（英文）

定位：以真实使用者视角写一个 GitHub 开源项目的**英文**实战文章——痛点、上手、接入自己工作流的经验、踩坑——面向 dev.to / Medium / Hashnode 等国际平台读者。

首例：agent-autoloop（中文底稿 `drafts/github/agent-autoloop/`，英文稿短名 `agent-autoloop-en`）。

与 write-article 的关系：完整管线（第 0 步定位阶段、阶段 1~7、归档、始终遵守的红线）一律按 `../write-article/SKILL.md` 执行，本 skill 只定义英文实战稿的特化规则；冲突时以 write-article 为准。

## 选题与调研

- repo 必须先核实存在：访问 `github.com/<owner>/<repo>` 或 GitHub 搜索，记下 owner/name、语言、license、star——全文只用核实过的事实
- star 数要么不写，要么注明「截至发文」（as of this writing），永不凭印象写
- README 调研走 raw 通道（本机代理不稳，git 直连）：`https://raw.githubusercontent.com/<owner>/<repo>/HEAD/README.md`
- 用户在 `ideas/assets/<项目>/` 上传的中文大纲与截图是**输入**，不是产出——产出是英文实战稿
- 动笔前先和用户对齐大纲（节次、每节配什么图），确认后再写全文

## 结构模板（首例沉淀，按项目特点取舍小节）

1. **Pain-point hook**（2~3 段）：不用这个工具时真实存在的痛点，第一人称，短段落
2. **What is X**：一句话定义加粗 + 3 个要点 bullet + 一张总览截图
3. **Hands-on quick start**：安装 → 配置 → 校验 → 首跑 → 查状态，每步一个最小命令/代码块，配 CLI 截图；节尾一句过渡引向进阶
4. **Real-workflow integration**：接进自己真实工作流的进阶用法——权限白名单、异常处置预案这类设计决策，给出「为什么这么设计」
5. **Visibility layer**（项目如有）：仪表盘 / 日志 / 通知，配截图
6. **Lessons learned**：什么场景适合、什么不适合、中间地带怎么设计 + 2~3 条纪律 bullet
7. **收尾**：致谢原作者（`@owner` 链接）+ repo 地址 + 一个互动问题

## 示例与案例规则

- **一条主线贯穿**：全文用一个真实工作流做贯穿示例（首例是需求开发工作流），从 quick start 到 lessons 不换例子；不拿与主线无关的其它项目凑数
- 示例里的事件名、命令、配置字段用真实在用的，不编 `foo/bar` 式占位符（涉及内部信息时按脱敏规则改写）
- 真实跑通过才有资格写「跑通了」——案例必须是发生过的，细节（耗时、轮次、花费）可核实

## 英文写作规范

- 第一人称亲历、过去时叙述，plain English，段落 ≤4 行，结论前置
- 无 hype 词：supercharge / seamless / unlock / game-changing / revolutionize 一律不用
- 无感叹号、无「Welcome back」式问候语；标题陈述事实不喊话
- 项目名、命令、配置字段、报错信息保留原文；代码块最小可运行
- 标题具体、可核实、不标题党，≤60 字符；正文小标题从 `##` 起，正文不以 H1 开头（标题进 frontmatter `title`）
- frontmatter 加 `lang: en`、`platform: [dev.to, medium]`（按实际目标平台）

## 素材与截图

- 截图来自真实使用：用户上传 `ideas/assets/<项目>/` 后，AI 按结构模板位置拷入文章 `img/`，命名 `01-<keyword>.png` 递增（如 `01-intro` / `02-cli` / `03-dashboard` / `04-card`），正文相对路径引用；用户补传新图时替换同名文件
- **截图脱敏人工关卡**：AI 读不了图——正文写完后必须提请用户逐张过目：内网地址、工单号、本机真实路径、token、密钥，有一处就不能用
- 需要 AI 生成的配图（架构图等）走 write-article 阶段 3 的 SVG 渲染管线，**用亮色主题变体**（2026-11-18 agent-autoloop 篇定）：浅蓝灰底 `#F5F9FD` + 白底节点、深青主描边 `#0E8FC7`、蓝 `#3E7BD6`、青绿强调 `#0FA97E`、警示红 `#D64545`、深藏青标题 `#14324F`、网格 `#D5E4F0`；暗色深蓝霓虹规格（`../write-article/references/illustration-spec.md`）作备选，版式（左图右文封面、胶囊、横链+金句）不变（深蓝霓虹线框风，规格见 `../write-article/references/illustration-spec.md`）

## 脱敏规则（正文硬红线）

绝不入文的内容：

- 内部域名与系统地址（公司 Jira/GitLab/CI 的 host）、工单号、项目代号
- 内网 IP、SSH 地址、端口号指向的真实内网
- 本机绝对路径（`C:\Users\...`、`/Users/yaohua/...`）——示例路径写成 `~` 或占位目录
- 密码、token、密钥、APPID 等一切凭据
- 可定位到个人或雇主的账号、组织名、同事信息

可以点名的内容：公开的开源项目、通用工具链（Jira/Bitbucket/飞书/SSH 这类通用名词）、行业与产品类型。

**脱敏做了但不宣传**：正文与文末都不写「本文已脱敏」之类的免责声明尾注。

## 收尾与署名规则

- **必须致谢原作者**：`Thanks to @owner for open-sourcing…` 一句 + 链接
- **repo 地址写两处**：quick start 开头一处（引导上手）+ 收尾致谢处一处
- 口径永远是「我用的开源项目」，不是「我写的」——除非项目确实是用户自己的
- 结尾以互动问题收（如「你会把什么交给它？」），不加目录、不加关注引导（站外分发引导由 `published/<专题>/footer.md` 统一拼接）

## 红线

- 不成段抄 README——亲历与实测经验才是文章本体
- 短名约定：`<项目短名>-en`（如 `agent-autoloop-en`），与中文稿分文件夹、各自独立走 write-article 状态机
- 永不在此库存放任何密码、token、密钥
- 改动先积累，收尾统一 commit；不替用户发布，发布永远是人工动作
