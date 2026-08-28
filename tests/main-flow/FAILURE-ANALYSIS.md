# 主流程 E2E 失败用例分析

> 最近一次全量跑测记录。跑测命令：`pnpm run test:main-flow:screenshots:tcTest`  
> 环境：`ENV=tcTest` → https://edu-test.zwsoft.cn/etcert/  
> 跑测时间：2026-08-27（约 15 分钟，workers=1）

---

## 一、跑测结果总览

| 状态 | 数量 | 用例 |
|------|------|------|
| passed | 6 | MF-CERT-001、002、008；MF-COURSE-001、002；MF-NCRE-001 |
| skipped | 5 | MF-CERT-003；MF-PARTNER-001、002；MF-TEAM-001、003 |
| failed / timedOut | 7 | MF-CERT-004、007、009；MF-COURSE-003、004；MF-PARTNER-003；MF-TEAM-002 |

报告路径：`html-report/tcTest/`（`pnpm exec playwright show-report html-report/tcTest`）

---

## 二、登录机制与当前账号

### 2.1 有没有登录？

**有。** 主流程用例默认走完整登录链路，不是「裸 cookie 直跳业务页」。

| 阶段 | 做什么 |
|------|--------|
| **global-setup**（每次 `ENV=tc*` 跑测前） | 用 `accounts.local.json` 账号在 C 端 / Admin 后台 OAuth 登录，写入 `.auth/*.json` |
| **用例级** | `test.use({ storageState })` 注入 cookie |
| **进业务页前** | PO 的 `goto()` → `gotoWebsitePage()` → `ensureWebsiteLoggedIn()`（首页确认登录）→ 再导航 |

例外：未登录回归（如 `TC-AUTH-002`）使用 `gotoWithoutLogin()`，主流程 **不包含** 此类用例。

### 2.2 当前使用的账号（`accounts.local.json`）

| 角色 | 账号 | 是否已配置 | 主流程用途 |
|------|------|------------|------------|
| **user** | `zrg_dev@163.com` | ✅ 已配置 | 课程、认证、NCRE、伙伴负向（MF-PARTNER-003） |
| **admin** | `17585108040` | ✅ 已配置 | Seed 造数；团队 MF-TEAM-002（C 端 `admin-website.json`） |
| **partner** | `your-partner-phone-or-email`（占位） | ❌ 未配置 | MF-PARTNER-001/002 会 skip |

密码见本地 `accounts.local.json`（**勿提交 git**）。也可用环境变量 `TC_USER_USERNAME` / `TC_USER_PASSWORD` 等覆盖。

### 2.3 登录态文件

| 文件 | 角色 | 用于 |
|------|------|------|
| `.auth/user.json` | user | 大部分主流程 |
| `.auth/admin-website.json` | admin（C 端） | MF-TEAM-002 |
| `.auth/admin.json` | admin（后台） | Seed 专用，非主流程 |
| `.auth/partner.json` | partner | 未生成（无有效 partner 账号） |

### 2.4 Seed 授权与测试数据（`catalog.json`）

| 字段 | 当前值 | 说明 |
|------|--------|------|
| `auth[0].account` | `zrg_dev@163.com` | Seed 批量授权账号 |
| `auth[0].productName` | 产品-测试考试两个方向认证 | 授权产品 |
| `certs[0].id` | `2996713542192726528` | 雪花 ID，**名称「课程订阅」** |
| `certs[0].name` | 课程订阅 | ⚠️ 不适合正式考试类用例 |
| `courses[0].id` | `2764747375594439168` | 中望3D标准实例教程-基础篇（视频课，无 PDF） |

---

## 三、失败用例逐项分析

### MF-CERT-004 点击去考试按钮 — timedOut（90s）

| 项 | 内容 |
|----|------|
| **现象** | 点击「进入正式考试」后 `waitForURL(/cert/(notice|binding)|etcert-exam/)` 超时 |
| **直接原因** | 前端点击后会再弹 **ElMessageBox**：「请确认是否立即开始正式考试？」；测试未点「确认」就等跳转 |
| **数据原因** | catalog 收编的是 **「课程订阅」** 认证，详情页标题甚至显示 `--`，考试 API 可能无有效数据 |
| **归类** | 测试缺步骤（二次确认）+ Seed 认证类型不对 |
| **建议** | PO/用例补 `.zw-confirm` 点「确认」；Seed 换可正式考试的认证 |

---

### MF-CERT-007 考试状态同步 — timedOut（120s）

| 项 | 内容 |
|----|------|
| **现象** | 全量跑在认证详情 / 我的考试步骤超时；并行复跑时出现登录失败 |
| **可能原因 1** | 前置 MF-CERT-004 已耗时长，链路后段 OAuth 不稳定，`ensureWebsiteLoggedIn` 重登失败 |
| **可能原因 2** | 详情页标题为「课程订阅」，与「我的考试」列表对不上，即使登录成功断言也会失败 |
| **可能原因 3** | 账号无该认证考试记录时应 skip，但卡在更早的登录/导航 |
| **归类** | 稳定性 + 数据 + 断言条件 |
| **建议** | 换可考试认证；加固登录；标题匹配改用更稳字段 |

---

### MF-CERT-009 我的证书页面 — failed

| 项 | 内容 |
|----|------|
| **现象** | `getCertCount() === 0` 后断言「暂无证书信息」，但页面上实际有多张证书 |
| **直接原因** | 前端已改用 `MyCertList.vue`（`.cert-list-item`），PO 仍数 `.cert-img` → 误判空列表 |
| **干扰因素** | 登录后 **「账号权益」** 弹窗（`ZwAccountBenefitDialog`）可能挡住页面 |
| **归类** | 测试选择器过期 + 未处理弹窗 |
| **建议** | `MyCertPage` 改为 `.cert-list-item`；`goto` 后关闭账号权益弹窗 |

---

### MF-COURSE-003 课程视频播放正常 — timedOut（全量）/ passed（单跑）

| 项 | 内容 |
|----|------|
| **现象** | 全量 120s 超时；单独跑约 1.8 分钟通过 |
| **原因** | 视频区 `.zw-course-video` 加载慢；全量跑前置用例多，剩余时间不够 |
| **归类** | 超时偏紧 / 偶发慢加载 |
| **建议** | 适当加大 timeout 或优化 `waitForStudyMode` / `assertVideoStudyVisible` 等待策略 |

---

### MF-COURSE-004 学习文档加载正常 — timedOut（全量）

| 项 | 内容 |
|----|------|
| **现象** | 卡在「进入学习模式」；并行复跑报 `Login failed for role "user"` |
| **数据** | 当前课程为视频课，**无 PDF 小节**，正常应 `test.skip` |
| **原因** | 全量后期登录 OAuth 失败，未走到 skip 分支 |
| **归类** | 登录稳定性 + 预期 skip 被登录错误掩盖 |
| **建议** | 修登录稳定性；或换含 PDF 小节的课程做正向断言 |

---

### MF-PARTNER-003 非 partner 无权限拦截 — timedOut（全量）/ failed（复跑）

| 项 | 内容 |
|----|------|
| **现象** | 点伙伴课程「开始学习」后未出现 `.zw-partner-auth-dialog` |
| **直接原因** | 前端行为变更：点「开始学习」**直接进入学习页**；权限校验改在 **播放 / 收藏** 等交互时触发（同 TC-AUTH-002） |
| **归类** | 测试断言时机与前端不一致 |
| **建议** | 进学习页后点播放或收藏再断言无权限弹窗 |

---

### MF-TEAM-002 管理员分配权限生效 — timedOut（120s）

| 项 | 内容 |
|----|------|
| **现象** | 点击团队折叠面板时一直 retry，被 `el-overlay-dialog` 挡住 |
| **直接原因** | 登录后自动弹出 **「账号权益」** 对话框，未关闭即操作页面 |
| **账号** | 使用 **admin** `17585108040` 的 C 端态（`admin-website.json`） |
| **归类** | 测试未处理新弹窗 |
| **建议** | `ensureWebsiteLoggedIn` 后统一 dismiss 账号权益（点「知道了」或勾选 30 天不再提醒） |

---

## 四、跳过用例（本次预期，非失败）

| 用例 | 原因 |
|------|------|
| MF-CERT-003 | 「课程订阅」无「进入模拟测试」入口 |
| MF-PARTNER-001 / 002 | `partner` 账号仍为占位符 |
| MF-TEAM-001 / 003 | 代码内 `test.skip(true)`，待团队 Seed |
| MF-COURSE-004 | 课程无 PDF（全量中被登录超时掩盖） |
| MF-TEAM-002 | admin 无团队时也会 skip（本次有团队数据但弹窗导致失败） |

---

## 五、共性问题汇总

| 编号 | 问题 | 影响用例 |
|------|------|----------|
| C1 | 登录后 **账号权益** 弹窗未关闭 | MF-TEAM-002、MF-CERT-009 等 |
| C2 | Seed 认证为 **「课程订阅」**，非可考试认证 | MF-CERT-003/004/007 |
| C3 | 去考试缺 **二次确认** MessageBox | MF-CERT-004（及 005/006 Destructive） |
| C4 | **我的证书** DOM 改版（`.cert-list-item`） | MF-CERT-009 |
| C5 | **伙伴/课程** 权限拦截时机后移 | MF-PARTNER-003 |
| C6 | 长链路后 **OAuth 登录不稳定** | MF-CERT-007、MF-COURSE-004 |

---

## 六、建议修复优先级

| 优先级 | 动作 |
|--------|------|
| P0 | 封装 `dismissAccountBenefitDialog()`，登录后进业务页前调用 |
| P0 | MF-CERT-004 补点「请确认是否立即开始正式考试？」→「确认」 |
| P0 | Seed 指定可正式考试认证（`TC_SEED_CERT_QUERY` 或后台先绑好资源） |
| P1 | `MyCertPage` 选择器改为 `.cert-list-item` |
| P1 | MF-PARTNER-003 改为学习页内触发权限断言 |
| P2 | MF-COURSE-003 加长超时；全量跑保持 `workers=1` |

---

## 八、修复记录（2026-08-27 测试侧改动）

| 优先级 | 改动 | 文件 |
|--------|------|------|
| P0 | `dismissAccountBenefitDialog` + `confirmZwDialog` | `lib/websiteDialog.ts`、`websiteSession.ts`、`websiteNavigate.ts` |
| P0 | 去考试二次确认 `clickEnterExamWithConfirm` | `CertDetailPage.ts`、`mf-cert.spec.ts` |
| P0 | Seed 优先选「测试考试」类认证 | `ProductResPage.ts`、`package.json`（`TC_SEED_CERT_QUERY`） |
| P1 | 我的证书 `.cert-list-item` | `MyCertPage.ts` |
| P1 | 伙伴无权限改学习页点「收藏」 | `CourseDetailPage.ts`、`mf-partner.spec.ts`、`access-control.spec.ts` |
| P2 | MF-COURSE-003 超时 180s | `mf-course.spec.ts` |

重跑前建议：`pnpm run test:tc-admin:seed:tcTest`（刷新 catalog + 登录态），再 `pnpm run test:main-flow:tcTest`。

---

## 九、相关文件

| 路径 | 说明 |
|------|------|
| [`RUNBOOK.md`](RUNBOOK.md) | 主流程跑测 SOP |
| [`../testData/generated/catalog.json`](../testData/generated/catalog.json) | 当前 certId / courseId |
| [`../../accounts.local.json`](../../accounts.local.json) | 本地账号（gitignore） |
| [`../../lib/websiteSession.ts`](../../lib/websiteSession.ts) | `ensureWebsiteLoggedIn` |
| [`../../lib/TcAuth.ts`](../../lib/TcAuth.ts) | global-setup 登录 |

---

*文档随跑测结果更新；修完一批失败项后请重跑并刷新本节。*
