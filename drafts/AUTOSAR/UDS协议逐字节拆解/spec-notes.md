# ISO 14229-1:2020 摘录（写作溯源用）

来源：/Volumes/Obsidian_Sync/KnowledgeVault/Autosar/ISO/ISO 14229-1-2020.pdf，表号/章节号均为标准原文编号，页码为标准内页码。正文引用以此为准。

## 1. 服务全景（SID 列表）

**没有一张包含"全部服务名+SID"的总表**。SID 值域由 Table 2 定义（§8.4, p.17），服务按 6 个"功能单元"分别列在各单元开头的 Overview 表里。汇总如下（服务名+SID 均为原文）：

| SID | 服务 | 功能（原文 Description 意译） | 出处 |
|---|---|---|---|
| 0x10 | DiagnosticSessionControl | 控制诊断会话 | Table 22, p.36 |
| 0x11 | ECUReset | 强制 ECU 复位 | Table 22, p.36 |
| 0x27 | SecurityAccess | 请求解锁受安全保护的服务器 | Table 22, p.36 |
| 0x28 | CommunicationControl | 控制通信参数设置 | Table 22, p.36 |
| 0x3E | TesterPresent | 告知服务器诊断仪仍在线 | Table 22, p.36 |
| 0x84 | SecuredDataTransmission | 扩展数据链路安全传输 | Table 22, p.36 |
| 0x85 | ControlDTCSetting | 控制 DTC 的记录 | Table 22, p.36 |
| 0x86 | ResponseOnEvent | 建立/控制事件机制 | Table 22, p.36 |
| 0x87 | LinkControl | 控制通信波特率 | Table 22, p.36 |
| 0x22 | ReadDataByIdentifier | 按 DID 读数据记录当前值 | Table 185, p.152-153 |
| 0x23 | ReadMemoryByAddress | 读指定内存范围的值 | Table 185, p.153 |
| 0x24 | ReadScalingDataByIdentifier | 读 DID 的缩放信息 | Table 185, p.153 |
| 0x2A | ReadDataByPeriodicIdentifier | 周期性调度数据传输 | Table 185, p.153 |
| 0x2C | DynamicallyDefineDataIdentifier | 动态定义 DID | Table 185, p.153 |
| 0x2E | WriteDataByIdentifier | 按 DID 写数据记录 | Table 185, p.153 |
| 0x3D | WriteMemoryByAddress | 覆写指定内存范围 | Table 185, p.153 |
| 0x14 | ClearDiagnosticInformation | 清除 DTC 等诊断信息 | Table 295, p.223 |
| 0x19 | ReadDTCInformation | 读取 DTC 及快照/扩展数据 | Table 295, p.223 |
| 0x2F | InputOutputControlByIdentifier | 控制 I/O（信号替换/执行器控制） | Table 398, p.297 |
| 0x31 | RoutineControl | 启动/停止例程或请求例程结果 | Table 424, p.311 |
| 0x34 | RequestDownload | 协商 client→server 数据传输 | Table 439, p.321 |
| 0x35 | RequestUpload | 协商 server→client 数据传输 | Table 439, p.321 |
| 0x36 | TransferData | 传输数据（下载/上传） | Table 439, p.321 |
| 0x37 | RequestTransferExit | 终止数据传输 | Table 439, p.321 |
| 0x38 | RequestFileTransfer | 协商文件传输 | Table 439, p.321 |

另：0x29 Authentication（§10.5，2020 版新增）、0x7F 负响应 SID。SID 值域规则（Table 2, p.17）：请求 SID 0x10–0x3E，正响应 SID 0x50–0x7E，0x7F 为负响应 SID；请求与正响应一一对应，**bit 6 区分请求（0）/正响应（1）**（即正响应 SID = 请求 SID + 0x40）。

## 2. 0x10 DiagnosticSessionControl（§10.2, p.36-43）

- 请求格式（Table 24, p.40）：`10` + 子功能 diagnosticSessionType（1 字节）。
- 子功能值（Table 25, p.40-41）：
  - `0x00` ISOSAEReserved
  - `0x01` **defaultSession**（默认会话，不需要 TesterPresent 保活；上电即默认会话）
  - `0x02` **programmingSession**（启用刷写所需全部服务；跑在 boot 里时只能通过 ECUReset、切回 defaultSession 或会话层超时退出）
  - `0x03` **extendedDiagnosticSession**（启用怠速、CO 值等调整功能及扩展诊断服务）
  - `0x04` safetySystemDiagnosticSession（安全系统相关，如气囊）
  - 0x05–0x3F 保留；0x40–0x5F 厂商自定义；0x60–0x7E 供应商自定义
- 正响应格式（Table 26, p.42）：`50` + diagnosticSessionType 回显 + sessionParameterRecord（4 字节）
- sessionParameterRecord（Table 28/29, p.42）：字节 1-2 = **P2Server_max**（分辨率 1 ms，0–65535 ms），字节 3-4 = **P2\*Server_max**（分辨率 10 ms，0–655350 ms，即 NRC 0x78 后的增强超时）。
- 子功能字节 bit 7 = suppressPosRspMsgIndicationBit（抑制正响应），适用于所有带子功能的服务（§8.7.3, p.21）。

## 3. 0x22 ReadDataByIdentifier（§11.2, p.153-158）

- DID 概念（§11.2.1, p.153）：dataIdentifier 是 2 字节标识符，标识服务器维护的数据记录（dataRecord）；dataRecord 内容车厂自定义，可为模拟量、数字量、内部数据、系统状态。标准在 Annex C.1（p.405 起）定义了保留 DID，如 F186 ActiveDiagnosticSession、F187 车厂备件号、F188 ECU 软件号、F189 软件版本号、**F190 VIN**、F191 boot 软件标识等（Table C.1 区域，p.405-406）。
- 请求格式（Table 186, p.154）：`22` + DID#1 高字节 + DID#1 低字节 + …（可一次请求多个 DID，最少 3 字节）。
- 正响应格式（Table 188, p.154）：`62` + DID 回显 + dataRecord[]，多组"DID+dataRecord"依次排列。
- 该服务**无子功能参数**（§11.2.2.2, p.154）。
- 典型 NRC（Table 190, p.155）：0x13/0x14/0x22/0x31/0x33。

## 4. 0x19 ReadDTCInformation（§12.3, p.227-270+）

- 请求格式（Table 302, p.239）：`19` + 子功能 reportType + 参数。子功能 0x01 reportNumberOfDTCByStatusMask 与 **0x02 reportDTCByStatusMask** 均带 1 字节 DTCStatusMask。
- 0x02 语义（§12.3.1.3, p.229-230）：服务器对每个 DTC 的 statusOfDTC 与客户端 mask 做**按位与，非零即返回**（`(statusOfDTC & DTCStatusMask) != 0`）。
- 0x02 正响应格式（Table 320, p.250）：`59` + `02` + DTCStatusAvailabilityMask（服务器实际支持哪些状态位）+ DTCAndStatusRecord[]（每个 DTC 3 字节 DTC + 1 字节 statusOfDTC）。
- DTC 为 3 字节编码（如 P0A9B-17 = `0A 9B 17`，Table 346, p.268-269）。
- 子功能总表（Table 317, p.243-245）：0x01 reportNumberOfDTCByStatusMask、0x02 reportDTCByStatusMask、0x03 reportDTCSnapshotIdentification、0x04 reportDTCSnapshotRecordByDTCNumber、0x05 reportDTCStoredDataByRecordNumber、0x06 reportDTCExtDataRecordByDTCNumber、0x07 reportNumberOfDTCBySeverityMaskRecord、0x08 reportDTCBySeverityMaskRecord、0x09 reportSeverityInformationOfDTC、0x0A reportSupportedDTC、0x0B–0x0E first/firstConfirmed/mostRecentTestFailed/mostRecentConfirmed DTC、0x15 reportDTCWithPermanentStatus、以及 0x55/0x56 等（Table 315/316, p.242-243）。
- **DTC 状态字节 8 位定义**（Table 342, p.267，DTC 状态位行为详见 Annex D.2）：

| Bit | 名称 | 含义 |
|---|---|---|
| 0 | testFailed | 请求时刻故障正在发生 |
| 1 | testFailedThisOperationCycle | 本运行周期内曾失败 |
| 2 | pendingDTC | 本或上一运行周期失败（待定） |
| 3 | confirmedDTC | 已确认为故障 |
| 4 | testNotCompletedSinceLastClear | 最近一次清除后测试未完成 |
| 5 | testFailedSinceLastClear | 清除后至少失败过一次 |
| 6 | testNotCompletedThisOperationCycle | 本运行周期测试未完成 |
| 7 | warningIndicatorRequested | 请求点亮警告指示器 |

示例：statusOfDTC = 0x24（0010 0100）= pendingDTC + testFailedSinceLastClear（Table 342, p.267）；0x2F（0010 1111）= testFailed+本周期失败+pending+confirmed+sinceLastClear（Table 344, p.268）。

## 5. 0x27 SecurityAccess 机制（§10.4, p.47-50）

- **Seed & Key 挑战-应答**（§10.4.1 原文流程）：client 请求 "Seed" → server 发 "Seed" → client 回 "Key" → server 校验通过则解锁并正响应。
- 子功能配对规则：**requestSeed 恒为奇数，同一安全级的 sendKey = requestSeed + 1**（如 0x01/0x02、0x03/0x04；Table 40/41, p.49）。requestSeed 取值 0x01, 0x03, 0x05, 0x07–0x7D；sendKey 取值 0x02, 0x04, 0x06, 0x08–0x7E。
- 同一时刻只有一个安全级别生效；低级解锁会撤销高级已解锁的功能（§10.4.1, p.48）。
- **已解锁时再请求 seed，服务器返回全零 seed**（seed=0 表示该级已解锁；锁定状态的 seed 永不为零）——client 用此判断锁定状态（§10.4.1, p.48）。
- 防爆破：错误 key 计为一次失败尝试，可配置尝试次数上限（超限 NRC 0x36）和延时定时器（未到期 NRC 0x37）（§10.4.1 + Table A.1, p.48, 393）。
- 典型解锁前置序列：DiagnosticSessionControl → SecurityAccess → 受保护服务（§10.4.1, p.48）。完整状态机见 Annex I（p.450，normative）。

## 6. NRC 否定应答码（Table A.1, Annex A.1, p.390-396）

负响应报文格式（Table 3, §8.6, p.18）：`7F` + 请求 SID 回显 + NRC，共 3 字节。NRC 值域分三段（p.390）：0x00 内部正响应保留；0x01–0x7F 通信相关；0x80–0xFF 特定条件不满足。

| NRC | 名称 | 含义 |
|---|---|---|
| 0x10 | generalReject | 服务器拒绝请求，仅当其他 NRC 均不适用时使用 |
| 0x11 | serviceNotSupported | 服务器不支持该服务（注意：功能寻址请求下不发送 0x11/0x7F/0x12/0x7E/0x31 等，§8.7.1, p.19） |
| 0x12 | subFunctionNotSupported | 服务已知但子功能不支持 |
| 0x13 | incorrectMessageLengthOrInvalidFormat | 报文长度或格式错误 |
| 0x14 | responseTooLong | 应答超出底层传输协议上限（如一次请求太多 DID） |
| 0x21 | busyRepeatRequest | 服务器忙，请重发相同请求 |
| 0x22 | conditionsNotCorrect | 服务器前提条件不满足（如车速不为 0） |
| 0x24 | requestSequenceError | 请求顺序错误（如 SecurityAccess 未 requestSeed 就 sendKey） |
| 0x31 | requestOutOfRange | 参数越界或 DID/routineID 不支持/当前会话不支持 |
| 0x33 | securityAccessDenied | 安全策略未满足（未解锁就请求受保护服务） |
| 0x35 | invalidKey | key 不匹配，计一次失败尝试，保持锁定 |
| 0x36 | exceedNumberOfAttempts | 失败尝试次数超限 |
| 0x37 | requiredTimeDelayNotExpired | 安全访问延时未到 |
| 0x7E | subFunctionNotSupportedInActiveSession | 该子功能在当前会话不支持（其他会话支持） |
| 0x7F | serviceNotSupportedInActiveSession | 该服务在当前会话不支持（其他会话支持） |
| 0x78 | requestCorrectlyReceived-ResponsePending | 请求已正确收到但未处理完（典型：flash 擦写期间），服务器仍会发最终响应，触发 P2\* 超时 |

## 7. 时序参数 P2Server_max / P2\*Server_max

- 定义（Table 28/29, §10.2.3.2, p.42）：**P2Server_max** = 服务器在该会话下的默认应答超时上限，2 字节，分辨率 1 ms，最大 65535 ms；**P2\*Server_max** = 发送 NRC 0x78 之后的增强超时，2 字节，**分辨率 10 ms，最大 655350 ms**。两者都由 0x10 正响应的 sessionParameterRecord 下发。详细行为定义在 ISO 14229-2（Table 29 原文注明 "Refer to ISO 14229-2 for further details"）。
- 标准示例值（Tables 31/32, §10.2.5, p.43）：假设 **P2Server_max = 50 ms、P2\*Server_max = 5 000 ms**，编码即 sessionParameterRecord = `00 32 01 F4`。注意：50/5000 只是标准示例值，实际值由服务器在 0x10 响应中报告，本标准正文未规定强制缺省值。

## 8. 完整请求-应答字节流示例（标准原文）

**示例 A：0x10 进入编程会话**（Tables 31/32, §10.2.5, p.43）
- 请求：`10 02`（diagnosticSessionType=programmingSession，抑制位=0）
- 正响应：`50 02 00 32 01 F4`（P2Server_max=0x0032=50 ms，P2\*Server_max=0x01F4×10=5000 ms）

**示例 B：0x22 读 VIN（DID F190）**（Tables 191/192, §11.2.5.2, p.157-158）
- 请求：`22 F1 90`
- 正响应：`62 F1 90 57 30 4C 30 30 30 34 33 4D 42 35 34 31 33 32 36`，17 字节 dataRecord 即 ASCII "W0L00043MB54132 6"（17 位 VIN）

**示例 C：0x19 02 按状态掩码读 DTC**（Tables 345/346, §12.3.5.3, p.268-269）
- 请求：`19 02 84`（DTCStatusMask=0x84 = bit2 pendingDTC + bit7 warningIndicator）
- 正响应：`59 02 7F 0A 9B 17 24 08 05 11 2F`（DTCStatusAvailabilityMask=0x7F 表示 bit7 不支持掩码；返回 P0A9B-17 状态 0x24、P0805-11 状态 0x2F）

**示例 D：带 CAN 帧的多帧传输+功能寻址**（Table 523, §17.4.3, p.388，0x2E 写 VIN）
```
0,0004  7E0 Phys. Request  10 14 2E F1 90 57 41 4C   首帧 FF（PCI 10 14 = 20 字节）
0,0001  7E8 Response       30 00 00                  流控帧 FC（CTS，块大小 0，STmin 0）
0,0012  7E0 Phys. Request  21 54 4F 4E 53 2D 57 45   连续帧 CF#1
0,0010  7E0 Phys. Request  22 42 2E 43 4F 4D 20 20   连续帧 CF#2
0,0011  7E8 Response       03 6E F1 90               正响应（6E F1 90）
```
另（Table 524, p.389）：`7DF: 02 11 01`（功能寻址硬复位）→ `7E8: 02 51 01`、`7E9: 02 51 01`（多 ECU 各自物理寻址应答）。

## 9. 寻址方式与多帧传输

- **物理寻址**（§7.4.1.4, p.13-14）：点对点，一条报文发给一个特定 ECU 内的服务器；**应答必须始终使用物理寻址**。
- **功能寻址**（§7.4.1.4, p.14）：client 不知道物理地址或服务器功能分布在多个 ECU 时使用，为广播通信，一台或多台 ECU 都可接收；A_TA_Type 参数枚举 physical/functional（§7.4.1.5, p.14）。功能寻址下部分 NRC（SNS/SNSIAS/SFNS/SFNSIAS/ROOR）不发（§8.7.1, p.19）。
- CAN 上的典型地址：功能寻址请求 0x7DF，物理请求 0x7E0-0x7E7、应答 0x7E8-0x7EF（见 Table 523/524 报文示例）。
- 多帧传输：CAN 单帧只能装 7 字节诊断数据（SF PCI `0x0n`），超过则用首帧 FF/流控 FC/连续帧 CF 的分段机制——这属于传输层 **ISO 15765-2（ISO TP）** 的职责，UDS 应用层不定义（Table 1 OSI 分层表，Foreword, p.11：Transport 层 CAN 上为 ISO 15765-2，会话层为 ISO 14229-2）。

**未找到项说明**：标准中没有一张汇总全部服务 SID 的单一总表（第 1 项系由 6 张功能单元 Overview 表拼合）；P2/P2\* 的强制缺省值标准正文未规定（仅示例给 50 ms/5000 ms，精确定义在 ISO 14229-2，本 PDF 未含）。

---

# 10. AUTOSAR DCM 模块事实（SWS + Vector TR 摘录）

文档：SWS = AUTOSAR_SWS_DiagnosticCommunicationManager.pdf（CP R4.3.0，548 页）；TR = TechnicalReference_Dcm.pdf（Vector MICROSAR DCM v9.5，2018）

- DCM 提供 OSI 5~7 层（SWS Table 1.1, p.21）：7 层=14229-1 UDS + 15031-5 OBD，5 层=15765-3/-4 会话层；2~4 层（15765-2/CanTp）不在 Dcm 内
- 相邻模块（SWS Figure 5.1, p.28）：PduR（收发诊断数据）、ComM、Dem（故障存储器）、BswM、NvM、IoHwAb；应用数据经 RTE 端口
- 三子模块（SWS Figure 7.1, p.50；划分 not mandatory）：
  - DSL Diagnostic Session Layer（7.3）：会话/定时/安全等级状态、PduR↔DSD 转发、TesterPresent 保活、多协议优先级
  - DSD Diagnostic Service Dispatcher（7.4）：校验会话/安全等级/模式依赖，分发 DSP，组装正负响应
  - DSP Diagnostic Service Processing（7.5）：解析请求→格式/子功能检查→经 RTE/Dem 取数执行→组装响应（7.5.2 逐服务定义）
- 处理流程：PduR → Dcm_TpRxIndication → DSL → DSD 校验 → DSP 执行 → DSD 组装 → DSL → PduR_DcmTransmit（7.3.4.2/7.4.4/7.5.1/7.3.4.4）
- DCM 与 DEM：Dem_GetDTCStatusAvailabilityMask / Dem_SetDTCFilter / Disable-EnableDTCRecordUpdate（SWS 7.5.2.1, p.102-103）
- DaVinci 配置（TR ch.5 各服务 Configuration Aspects；工具=DCM Configurator 5 GCE, TR 2.1.4）：
  - /Dcm/DcmConfigSet/DcmGeneral；DcmDsl/DcmDslProtocol/DcmDslProtocolRow（含 P2/P2* 校正）
  - DcmDsd/DcmDsdServiceTable/DcmDsdService → DcmDsdSubService
  - DcmDsp/DcmDspSession/DcmDspSessionRow（会话+P2/P2Star）、DcmDspSecurity/DcmDspSecurityRow、DcmDspDid（+DidInfo/DidAccess/DidRead|Write）、DcmDspRoutine、DcmDspPid
- 支持：CAN/LIN/FlexRay/MOST（SWS Table 1.1）；J1939 明确不支持（SWS ch.4）；DoIP/CAN FD 在 4.3.0 SWS 无支持声明（勿写，需 Foundation 版佐证）
- 写作红线：TR/SWS 无独立"NRC 配置容器"节点，勿写成 NRC 有专门配置树；仅有 DcmModeRuleNrcValue（SWS ch.10.3）
