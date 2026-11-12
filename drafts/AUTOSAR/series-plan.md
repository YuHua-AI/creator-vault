# AUTOSAR 入门系列 · 总控计划

7 篇系列，每篇 = 一个 UDS 主题域 + DaVinci/ETAS 工程结合。协议事实一律以 ISO 14229-1:2020 为准（溯源见各篇 `spec-notes.md`），AUTOSAR 侧依据 DCM/DEM SWS，工程侧依据 DaVinci TechnicalReference 与 03_Etas 真实 ARXML。

---

## ① 诊断仪和 ECU 在 CAN 上说什么？UDS 协议逐字节拆解

**主题**：UDS 全景——对话模型 + 字节解剖 + 26 服务地图
**读者收获**：看懂任意一条诊断报文的每个字节；建立服务全景索引（后续各篇的地图页）

- 开场：一条 CAN 报文（`22 F1 90` → `62 F1 90 57 30 4C…`）——修车时发生的全部
- UDS 是什么：对话剧本，不是协议栈（OSI 分层：14229-1 应用层 / 14229-2 会话层 / 15765-2 传输层，Table 1）
- 解剖第一条报文：SID、正响应 +0x40（bit 6）、负响应 `7F+SID+NRC` 三字节结构、子功能字节与抑制位 bit 7
- ECU 说"不"的方式：NRC 速览（精选 0x11/0x12/0x22/0x31/0x33/0x78；全表进参考资料）
- 广播与点名：功能寻址 7DF vs 物理寻址 7E0-7E7；应答永远物理寻址；多帧 ISO-TP 一句话带过（用 Table 523 的 0x2E 写 VIN 真实报文）
- 全景地图：26 个服务按 6 个功能单元分组（诊断管理 9 / 数据传送 7 / 清读 DTC 2 / IO 控制 1 / 例程 1 / 上传下载 5 + 0x29 Authentication）；冷知识：标准里没有 SID 总表
- 时序：P2/P2\* 由 ECU 在 0x10 正应答自报（50ms/5000ms 只是示例值——纠偏）
- 落到 AUTOSAR：DCM 在通信栈的位置（PduR 之上）；DaVinci 里 Dcm 配置树长什么样；ETAS `Dcm_SWC.arxml` 一瞥
- 收尾 + 预告 ②

**素材状态**：spec-notes.md 已备齐（①全部事实已求证）

---

## ② ECU 的三重人格——0x10 会话控制，从默认会话到编程会话

**主题**：会话状态机。**读者收获**：明白"为什么很多服务要先 `10 03`"——权限的容器是会话

- 开场：直接 `27 01` 被拒（NRC 0x7F/0x22）——因为你还在"前台"
- 三重人格：defaultSession（0x01）/ extendedDiagnosticSession（0x03）/ programmingSession（0x02）各能干什么（Table 25）；safetySystem（0x04）与厂商自定义区
- 请求/应答字节流：`10 03` → `50 03 xx xx xx xx`，重点拆 sessionParameterRecord——P2/P2\* 就在这里自报（Table 26/28/29）
- 会话切换状态机：谁能切到谁、切换时哪些状态复位（SWS 语义 + 14229-2 的 S3_server 超时概念）
- 保活：0x3E TesterPresent——为什么 extended 会话 5 秒没人吭声就"打回原形"
- 抑制位实战：`10 83` 的 bit 7——"这事办了别回话"
- 工程结合：DaVinci `TechnicalReference_Dcm.pdf` 里会话相关配置容器（DcmSessionRow 等）；ETAS `RTA_BIP_Dcm_EcucValues.arxml` 里的真实会话配置值
- 预告 ③：进了"维修间"还不够，贵重操作要钥匙

**素材状态**：14229-1 §10.2 事实已在 ① 摘录中；写前补 14229-2 样张 + DCM SWS 会话章节求证

---

## ③ ECU 的钥匙怎么发？0x27 安全解锁，Seed 与 Key 的攻防

**主题**：SecurityAccess 机制。**读者收获**：搞懂 Seed&Key 挑战应答全流程与防爆破设计

- 开场：`2E F1 90` 写 VIN 被拒 NRC 0x33——安全访问未解锁
- 挑战-应答：requestSeed（奇数子功能）→ seed → 诊断仪本地算 key → sendKey（=requestSeed+1）（Table 40/41）
- 子功能配对规律：0x01/0x02、0x03/0x04……安全等级的含义
- 冷知识：已解锁再要 seed，返回全零 seed——用 `27 01` 探测锁定状态
- 防爆破三件套：失败计数（超限 NRC 0x36）、延时定时器（NRC 0x37）、顺序错误（未 seed 直接 key → NRC 0x24）
- 等级互斥：同一时刻只有一个等级生效，低级解锁撤销高级
- 攻防视角：key 算法在车厂手里，泄露 = 全线失守；2020 版新增 0x29 Authentication（ISO 26021 方向）为什么出现
- 工程结合：DaVinci TechnicalReference_Dcm 的 SecurityAccess 配置；key 算法 DLL 在 DaVinci 生态的接入方式；ETAS arxml 中的安全等级配置实例
- 预告 ④：解锁完干什么——先从读数据开始

**素材状态**：14229-1 §10.4 事实已在 ① 摘录中；写前补 DCM SWS 安全章节

---

## ④ DID，ECU 数据的门牌号——0x22 读数据与 0x2E 写数据

**主题**：DID 体系。**读者收获**：DID 怎么编号、怎么读、怎么写、报文为什么长这样

- 开场：一条 `22 F1 90` 拿到整车 VIN——F190 就是"车架号"的门牌
- DID 是什么：2 字节标识符 + dataRecord；门牌号的规划：标准保留区（Annex C.1：F186 会话、F187 备件号、F188 软件号、F190 VIN……）/ 厂商区
- 0x22 读：请求无子功能、可批量（`22 F1 87 F1 88 F1 89` 一次要三样）；正应答 `62 + DID + data`；NRC 0x14 应答超长的处理
- 0x2E 写：写前要先解锁（呼应③）；多帧传输登场——用 Table 523 的 20 字节写 VIN 完整报文逐帧拆
- 0x2C 动态 DID、0x2A 周期读：一句话带过，留个索引
- 工程结合：DaVinci 里 DID 怎么配（DcmDspDid 容器、数据从 RTE/SWC 来的路由）；DiagA2lGen——DID 配置自动生成 A2L 给标定工具的联动；ETAS arxml 实例
- 预告 ⑤：读数据是"看"，例程是"让它动"

**素材状态**：0x22/0x2E 字节流已在 ① 摘录；写前补 14229-1 §11 写服务细节 + Annex C.1 保留 DID 表

---

## ⑤ 让 ECU 按指令干活——0x31 例程控制与 RID

**主题**：RoutineControl。**读者收获**：分清 DID（数据）/RID（动作），理解 start-stop-result 三段式

- 开场：让 ECU 自检风扇、擦一块 Flash、控制继电器——这些"动作"不是 DID 能表达的
- DID vs RID：门牌号 vs 工号（数据 vs 例程）
- 三段式子功能：0x01 startRoutine / 0x02 stopRoutine / 0x03 requestRoutineResults
- 报文拆解：`31 01 xx xx <参数>` → `71 01 xx xx <结果>`；routineIdentifier 2 字节
- 典型例程场景：自检、Flash 擦除（⑦篇伏笔）、怠速学习、防擦写联动
- 与 0x2F IO 控制的边界：模拟量/执行器瞬时控制 vs 例程化动作
- 工程结合：DaVinci DcmDspRoutine 容器、例程与 SWC 回调的对接；ETAS arxml 里的例程配置
- 预告 ⑥：动作做完，出错谁来记——DTC 登场

**素材状态**：待写前求证（14229-1 §13 RoutineControl 全章摘录）

---

## ⑥ 八盏故障灯的秘密——0x14 清码与 0x19 读 DTC

**主题**：DTC 体系。**读者收获**：DTC 三字节编码 + 状态字节 8 位的完整语义，快照/扩展数据概念

- 开场：仪表盘故障灯亮了→ 4S 店 `19 02 09` 读出 `P0A9B-17`——这串码怎么来的
- DTC 三字节：如 `0A 9B 17` 的编码结构（Table 346）
- 状态字节八盏灯（Table 342）：testFailed / pendingDTC / confirmedDTC / warningIndicator… 逐位讲透；`0x24`、`0x2F` 实例解码
- 0x19 子功能地图（Table 317）：0x01 计数、0x02 按掩码读、0x04 快照、0x06 扩展数据、0x0A 全量、0x15 永久 DTC
- 掩码按位与的妙处：`(status & mask) != 0`——一次请求只筛"我关心的灯"
- 0x14 清码：清的到底是什么（状态位，不是故障本身）；运行周期与 aging 的概念
- 快照（snapshot）：故障瞬间的行车数据定格——事故分析的证据链
- 工程结合：DTC 从 Dem 来——DEM 的 event→DTC 映射、快照记录配置（DaVinci TechnicalReference_Dem / Dem_Obd）；ETAS `Dem_Cfg_McSupportData.arxml`
- 预告 ⑦：清了码、解锁了、擦了 Flash——最后一集把固件传进去

**素材状态**：0x19/0x14 核心事实已在 ① 摘录（Table 342/317/346）；写前补 0x14 细节 + DEM SWS

---

## ⑦ 一次 OTA 刷写，在总线上发生了什么——0x34~0x38 传输五件套

**主题**：上传下载与刷写全流程（系列收官，把前六篇串起来）

**读者收获**：完整刷写会话的报文级剧本——从 `10 02` 到 `37` 的每一步

- 开场：4S 店刷 ECU 的 20 分钟，总线上其实上演了一整部剧
- 五件套分工：0x34 RequestDownload（协商）/ 0x36 TransferData（搬运）/ 0x37 RequestTransferExit（签收）；0x35/0x38 upload 与文件传输变体
- 0x34 报文拆解：地址/长度格式、maxNumberOfBlockLength 协商
- 0x36 块计数器机制：sequenceNumber 从 01 递增，丢块重传的容错设计
- 完整刷写剧本（串联全系列）：`10 02` 进编程会话（②）→ `27` 解锁（③）→ `31 01` 擦除例程（⑤）→ `34/36/37` 传输 → `31 01` 校验例程 → `11 01` 复位生效 → `10 01` 回默认会话——每步标注来自第几篇
- 挂在 CAN 上的限制：传输速率与 ISO-TP 帧效率，以太网 DoIP 的一句话展望
- 工程结合：刷写与 boot 的关系（programmingSession 跑在 boot 里）；DaVinci 里 Flash 驱动/ Fee 与刷写的配合；OTA 业务层（差分包、回滚）在 AUTOSAR 之外的部分
- 系列收尾：全景回顾 + 知识地图（①的总表回收利用）

**素材状态**：待写前求证（14229-1 §14 全章摘录 + 15765-2 传输效率数据）
