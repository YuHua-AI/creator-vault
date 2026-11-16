# 选题池

- 老苹果路由+有源音箱组 NAS 无线 Hi-Fi：三件吃灰设备的播放链路（2026-11-10 已起草）
- 无损音乐自动补货管线：网盘转存 + 自动同步 + 标签整理（上半篇「AI 逆向拿链接 + 批量出码 + 转存边界」2026-11-13 已发布归档；剩频谱验真入库流水线可续篇，Navidrome 篇文末已预告）
- Navidrome 私人音乐服务端：音乐基建系列中心拼图（Tailscale=外网地基、HiFi 铁三角=播放端、补货管线=供给端都已写，就差把文件夹变流媒体的大脑）；DS218play ARM 实测、16 行 compose、Substreamer 客户端、标签优先于目录（2026-11-14 已发布归档，NAS 合集自此 5 篇）
- 1G 内存 NAS 自救·Navidrome 迁 Mac：存算分离实录——load 99 假死排障三次纠错（换页超卖定案）、方案对比选迁移、迁移战报（1973 首/107 秒、自愈 ≤30 秒）、7 条踩坑清单；接续上篇同一套音乐基建（2026-11-15 已发布归档，NAS 合集自此 6 篇）
- AUTOSAR 专题（7 期系列，路线图见 .claude/skills/autosar-series/SKILL.md）：①UDS 总览 26 服务 ②0x10 会话 ③0x27 安全解锁 ④0x22/2E DID ⑤0x31 RID ⑥0x14/19 DTC ⑦0x34-38 OTA 刷写；②~⑦结合 DaVinci/ETAS 工程；汽车软件从业者/学生，仅公众号；素材取自 /Volumes/Obsidian_Sync/KnowledgeVault/Autosar（2026-11-12 已定题，七篇 + NRC 番外共八篇 2026-11-15 全部发布归档）
- AUTOSAR 续作候选（按选题价值排序）：a) P2/0x78/DSL 并发调度——刷写超时是人人被折磨过的痛点，能串起①⑤⑦；b) DoIP（车载以太网诊断，UDP 13400）——①⑦已埋伏笔，面向下一代；c) DEM 深讲（事件存储/老化自愈，⑥已埋伏笔）；d) FiM 功能抑制（故障降级那只手，⑥已埋伏笔）；e) 0x29 Authentication 证书认证；f) ISO 15765-2 传输层细节；g) ODX 诊断数据库与 DaVinci 配置对齐（偏工具链，读者面窄，可不做）（2026-11-12 归档）
- GitHub 周榜（涨星排名，可系列化）：AI 解析 github-weekly-rank 涨星最快前 8，主图+8 张项目卡，正文简介（2026-11-11 第 1 期已发布归档，数据源 tools/github-weekly-rank）
- GitHub 周精选（主题策展）：每期选 3~5 个仓讲一个主题，手写卡片不走 data.json 产线（第 1 期「给 Agent 装外设」原题 Claude Code 四件套，2026-11-15 已发布归档）
- AUTOSAR 实战·诊断工具系列（5 篇，接续 AUTOSAR 入门合集，单开「AUTOSAR 实战」合集互导流；标题统一前缀「AUTOSAR 实战-诊断工具 | 」，技术向行文）：
  ①「AUTOSAR 实战-诊断工具 | 基于 Python 与 USB-CANFD 的 UDS 诊断测试工具设计与实现」——需求背景（CANoe 授权成本、脚本化程度、多项目回归痛点）；四层架构（CAN 驱动抽象层 ZLG/创芯/Mock 三实现 → ISO-TP 传输层 SF/CF/FC 流控与 P2/P2* 超时 → UDS 会话层 → 测试流程引擎）；run/chat/probe/unlock/dem/dem-map 六命令；run.log/result.csv/trace.blf 三路落盘（BLF 供 CANoe 回放）；PyQt UI 三 Tab 设计；Mock 驱动与 pytest 测试策略
  ②「AUTOSAR 实战-诊断工具 | UDS 0x27 安全访问的配置化实现：种子密钥算法插件化设计」——0x27 服务机制回顾（seed-key 握手、会话前置约束、NRC 0x7F/0x7E/0x35/0x36）；六类算法拆解（AES-CMAC 密钥因子派生、CMAC(key,Seed)、mask 查表、CRC16 位运算、移位乘法异或）原理与参数化；算法注册表 + YAML security 节的插件架构（新算法=注册一个函数）；工程细节（同周期种子记忆逐字节断言、密钥响应 67+key_sub 判定）；密钥材料一律假数据
  ③「AUTOSAR 实战-诊断工具 | 基于 YAML 的诊断测试用例工程：轮询、断言与回归」——用例模型（steps/expect 前缀判定/timeout_ms/delay_after_ms/addressing 物理+功能寻址）；while 轮询步骤（in_progress 前缀匹配、delay_ms、max_cycles 防死循环，0x31 例程等待场景）；跨步骤变量断言（set_var/expect_equals_var，0x27 种子记忆校验）；on_fail 策略（abort/continue）与 timing 覆盖机制；功能寻址复现网关组播交付问题（PduR TP 网关过期长度）；回归产物闭环（result.csv 一行一步骤 → BLF → CANoe 回放）
  ④「AUTOSAR 实战-诊断工具 | DTC/Event/FiM 故障报告自动化：DEM 诊断数据采集与解析」——DEM 数据模型回顾（DTC 状态位、事件状态、FiM FID 抑制关系，接正传⑥ DTC 篇）；采集流程（10 03 扩展会话 → 0x27 解锁 → 19 02 0F 读 DTC + 22 读 event DID + FiM FID DID）；dtc_map/event_map/fimfid_map 三张映射表解码设计；dem-map 离线解析（仅有 CANoe 抓包响应的现场复核场景）；埋 DEM 深讲/FiM 续作伏笔
  ⑤「AUTOSAR 实战-诊断工具 | 用 Claude Code 开发诊断测试工具：AI 协作开发实践」——superpowers 工作流全记录（brainstorm → plans/specs 设计文档 → TDD 实现 → 测试，docs/superpowers 目录为证）；工具的 AI 友好设计（YAML 用例可由 AI 生成、CLI 可被 Agent 编排调用、结构化日志/CSV 可断言验证）；需求→设计→实现→测试的证据链片段；诊断工程师 + AI 的协作范式总结
  三平台（公众号+知乎+CSDN，CSDN ④ 主推吃 DEM 存量权重）；素材源 develop_workflow/tools/DiagnosticTester，**不开源**；脱敏红线：项目代号全虚构、configs 密钥材料绝不入文、develop 内部算法只讲机制；UI 截图不得带 mikasa 背景（版权），演示全走 mock（2026-11-16 已定题）
- AI 周报（系列帖图，**2026-11-16 搁置**——多事件杂烩无单一钩子，同日毙掉早报变体；雷达方法论保留供单点深拚选题用，产线 .claude/skills/ai-weekly/ 封存待解封）：每周雷达扫 AI 大事件（HN Algolia 7 天窗 + WebSearch 补漏 + 中文查重定增量）→ 8~9 条事件卡帖图。第 1 期 20261116：黄仁勋辞职 4054pt 领衔 + Anthropic IPO + Fable/Mythos 双发 + Gemini 隐私 + Nvidia 循环融资 + 美联航封杀 agent + Lovable 泄露 + Amazon 换模型省千万 + Jane Street 开源 skills
- AI 专题文章线（AI 观察/周报/早报/产线文）：2026-11-16 整线暂缓——热点与账号身份不匹配（多轮验证），主线回归 AUTOSAR 系列吃搜索长尾 + 每篇做「可转发工作群」的收藏钩子；Gemini 稿留在 drafts/ai-watch/ 未发布，产线文 idea 备用。解封条件：热点落在自己领域（汽车软件×AI 交叉）
