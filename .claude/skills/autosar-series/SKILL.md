---
name: autosar-series
description: 「AUTOSAR 入门」系列长文每篇生产流程：规范库定位素材 → 逐条求证协议细节 → 起草 → 配图 → 推稿。写 AUTOSAR/UDS/诊断/通信栈等汽车软件主题的公众号文章时用；文章流转、配图管线、推送与归档沿用 write-article skill 的对应阶段。
argument-hint: [drafts/autosar 下文章短名或新选题；留空则列进度]
---

# AUTOSAR 入门（系列长文）

本 skill 是 write-article 管线在「AUTOSAR」专题上的特化：素材来源、求证规则、系列约定固定，通用流程（状态机、配图、推送、归档）以 write-article skill 为准，两份都读再动笔。

## 系列路线图（已定，2026-11-12）

| 期 | 标题方向 | 主题 | 工程结合 |
|---|---|---|---|
| ① | 协议总览：对话模型 + 字节解剖（SID+0x40、子功能、NRC、寻址、P2/P2\*）+ 全部 26 个服务地图 | UDS 全景 | DaVinci/ETAS 工程里在哪配 |
| ② | 0x10 服务：会话管理（会话类型、切换状态、TesterPresent、时序参数） | DiagnosticSessionControl | DaVinci + ETAS 配置实操 |
| ③ | 0x27 服务：安全解锁（Seed&Key、安全等级、防爆破） | SecurityAccess | DaVinci + ETAS 配置实操 |
| ④ | 0x22/0x2E 服务：DID 读写 | DataByIdentifier | DaVinci + ETAS 配置实操 |
| ⑤ | 0x31 服务：RID 与例程控制 | RoutineControl | DaVinci + ETAS 配置实操 |
| ⑥ | 0x14/0x19 服务：DTC 清除与读取（状态字节 8 位、快照/扩展数据） | ReadDTCInformation | DaVinci + ETAS 配置实操 |
| ⑦ | 0x34~0x38 服务：刷写与 OTA（传输协商、TransferData、文件传输） | Upload/Download | DaVinci + ETAS 配置实操 |

路线图是活文档：写新一期前回顾，角度/标题可与用户对齐调整；期号顺序尽量稳定。**各篇标题与详细大纲见 `drafts/autosar/series-plan.md`（总控文档，随系列推进更新）**。

## 系列约定

- **标题**：`AUTOSAR 入门 - <模块名>：钩子副题`——模块名标明主题域（如 `UDS 诊断`），后续新模块（DEM、DoIP、FiM 等）各用自己的模块名，不再用 ①②③ 序号；副题走场景/反差/悬念，禁学院风（如「ISO 14229 详解」）。已发布的旧七篇保留 ①~⑦ 序号格式，不改
- **阶段升级**：当前为「入门」阶段（基础协议机制 + 配置入门）；后续结合实战内容（真实项目调试、性能、踩坑、架构决策）的文章升级为 `AUTOSAR 进阶 - <模块名>：副题`——前缀随阶段换，模块名规则不变。开写进阶篇时与用户确认阶段定位
- **目录**：`drafts/autosar/<文章短名>/`（系列父目录），归档时移入 `published/autosar/`
- **frontmatter**：`tags: [AUTOSAR]` + 主题标签（如 `UDS`、`诊断`）；`platform: [公众号]`
- **读者**：汽车软件从业者/学生——术语可直接用（首次出现仍给全称），重点是讲透机制：字节流逐字节拆解表、时序参数、工程落地坑点；可适度场景引入但不下沉到修车小白视角
- **系列钩子**：每篇文末预告下一篇，形成连续阅读路径

## 素材地图（/Volumes/Obsidian_Sync/KnowledgeVault/Autosar）

| 路径 | 内容 | 用途 |
|---|---|---|
| `ISO/ISO 14229-1-2020.pdf` | UDS 主标准（现行版；2013 版并存，引用一律以 2020 版为准） | UDS 服务语义、SID/子功能、NRC、时序参数 |
| `ISO/ISO-14229-2-2021-preview.pdf` | 会话层标准**官方预览样张**（仅 15 页，全本付费，待补） | P2/P2\*、S3 时序精确语义（当前只有目录框架） |
| `ISO/ISO-15765-2-2016.pdf` | DoCAN 传输层全本（SF/FF/FC/CF、寻址格式） | ①篇多帧传输一节、⑦篇传输背景 |
| `01_Official/Software-Architecture_Diagnostic-Services/standard/` | **DCM 主规范**（AUTOSAR_SWS_DiagnosticCommunicationManager）、**DEM**（AUTOSAR_SWS_DiagnosticEventManager）、FIM、J1939 变体 | ②~⑦ AUTOSAR 工程结合的主依据（协议语义引 14229-1，模块行为/配置容器引 SWS） |
| `01_Official/Software-Architecture_*` | 其余 AUTOSAR SWS 规范（Communication-Stack、RTE、System-Services 等） | AUTOSAR 分层、模块职责、配置项 |
| `01_Official/Application-Interfaces_*` | 应用接口规范 | 按域（动力/底盘/车身…）取实例 |
| `01_Official/Methodology-and-Templates_*` | 方法论与模板 | 工程流程、ARXML |
| `02_Davinci/01_TechnicalReferences/` | **Vector MICROSAR 全套模块技术参考**（TechnicalReference_Dcm / Dem / Dem_Obd / CanTp / PduR / FiM / DiagA2lGen 等约 60 份） | ②~⑦ 的 DaVinci 工程实操：配置参数、默认值、生成代码视角 |
| `03_Etas/02_Arxml/` | **真实工程 ARXML**：Dcm_SWC.arxml、RTA_BIP_Dcm_EcucValues.arxml（RTA-BIP 基础集成包）、J6B_\*_EcucValues.arxml（某量产项目配置，含 changes.csv） | 工程结合的真实配置实例——写配置项时对照真实参数值，不凭空编 |
| `KnowledgeVault/wiki/concepts/`（库外，路径 `../wiki/`） | 50 篇 AUTOSAR 模块中文笔记（dcm/dem/cantp/doip/comm-stack 等） | 快速定位概念的先导阅读；属 claude-obsidian 体系，不改动 |

地图会过期：动笔前先 `ls` 实际目录，发现新资料就更新本表（随文章 commit）。

## 硬规则：协议内容必须求证

1. **不凭记忆写协议细节**。SID 值、子功能位、NRC、P2/P2\*、会话状态……一律先翻 PDF 求证再落笔。PDF 大，用页码/章节定位（Read 工具带 `pages`），或先 grep 目录页再翻正文
2. **引用给条款号/表号**：如「ISO 14229-1:2020 §9.2 / Table 401」。正文可淡化，但草稿阶段小节内自查用的出处要能追溯到规范原文（写给作者看的核实痕迹可放文末「参考资料」节，正式内容直接引用）
3. **版本写明**：引用任何规范注明版本年份，两个版本冲突以新版为准，旧版差异值得写时单独说明
4. **代码/字节流示例**：给完整一次请求-应答对（含 NRC 反例更好），逐字节注释；示例参数值若来自规范示例或工具默认，注明来源

## 每篇流程

1. **定位素材**：按主题查素材地图 → `ls` 实际目录 → Read 对应 PDF 章节
2. **对齐**：与用户确认标题、结构（一般：场景钩子 → 概念 → 核心机制逐个拆 → 工程视角 → 预告）
3. 之后全部走 write-article 阶段 3~7（起草/配图/终审/推送/归档）。**配图用本系列专属风格体系**（见 `references/style-spec.md`）：A 工程蓝图＝封面/结构图，B/B+ 终端＝报文交互与真实 CLI 输出转录（实战系列主力，遵守真实证据铁律），C 技术手册＝单条报文格式讲解；另守 style-spec 内「SVG 生产规则」（字重层级/图片编号不重号/三栏网格/文案红线）。不与 write-article 的 `illustration-spec.md`（旧系列霓虹风）混用。图内术语用规范英文缩写（SID、DID、DTC）+ 中文标注
