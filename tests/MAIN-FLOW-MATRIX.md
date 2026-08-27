# 主流程覆盖对照表

> 对照产品/验收清单「主要功能流程」，映射到 `tests/main-flow/` 的 `MF-*` 用例。  
> **实现目录**：[`main-flow/README.md`](main-flow/README.md) · **前置**：[`testData/main-flow/prerequisites.md`](testData/main-flow/prerequisites.md)  
> 扩展回归见 [`tc-platform/README.md`](tc-platform/README.md)；缺口见 [`COVERAGE-BACKLOG.md`](COVERAGE-BACKLOG.md)。

**统计基准（2026-08-27）**：主流程 `MF-*` 20 条（18 非破坏性 + 2 `@Destructive`）；`tc-platform` TC-* 20 条保留作扩展回归；Admin Seed 5 条。

---

## 图例

| 符号 | 含义 |
|------|------|
| ✅ | 已有用例，断言达到「可验收」深度 |
| 🟡 | 已有用例，但仅 Smoke/浅断言（页面存活、空态、按钮可见等） |
| ❌ | 无对应用例，或 PO 有方法但未接线 |
| ➖ | 产品清单标注为 `/` 或明确不在当前 E2E 范围 |

**跑测命令**

- `pnpm run test:main-flow`：主流程 20 项（不含 `@Destructive`）
- `pnpm run test:main-flow:destructive`：MF-CERT-005/006 交卷类
- `pnpm run test:tc-platform:smoke`：扩展 Smoke（与主流程并行维护）

---

## 1. 课程学习

| # | 检查项 | MF 用例 | 覆盖 | 说明 |
|---|--------|---------|------|------|
| 1.1 | 课程页加载正常 | MF-COURSE-001 | 🟡 | `/course?courseId=` 详情入口 |
| 1.2 | 课程详情页加载正常 | MF-COURSE-002 | 🟡 | 收藏按钮等详情元素 |
| 1.3 | 课程视频播放正常 | MF-COURSE-003 | ✅ | 学习模式 + `.zw-course-video` 播放器 |
| 1.4 | 学习文档加载正常 | MF-COURSE-004 | 🟡 | 有 PDF 小节则断言；纯视频课 skip |

**模块小结**：2/4 有浅覆盖；媒体类（视频、文档）缺口。

---

## 2. 认证考试

| # | 检查项 | MF 用例 | 覆盖 | 说明 |
|---|--------|---------|------|------|
| 2.1 | 认证页加载正常 | MF-CERT-001 | ✅ | `/cert/list` 认证目录 |
| 2.2 | 认证详情页加载正常 | MF-CERT-002 | ✅ | 标题 + 步骤导航 |
| 2.3 | 点击去自测按钮 | MF-CERT-003 | 🟡 | 有自测入口则跳转 notice/binding/exam |
| 2.4 | 点击去考试按钮 | MF-CERT-004 | 🟡 | 可进考状态才点按钮 |
| 2.5 | 考试流程正常 | MF-CERT-005 | 🟡 | `@Destructive`；前置向导 + 答题页 |
| 2.6 | 考试正常 | MF-CERT-006 | 🟡 | `@Destructive`；客观题 + 交卷 |
| 2.7 | 考试状态同步 | MF-CERT-007 | 🟡 | 我的考试有记录时匹配认证标题 |
| 2.8 | 我的考试页面 | MF-CERT-008 | 🟡 | 表格或空态 |
| 2.9 | 我的证书页面 | MF-CERT-009 | 🟡 | 有证或空态；发证闭环待 Seed |

**模块小结**：MF 已接线 9 项；上传/发证/固定多状态仍待 P2 造数。

---

## 3. 团队管理

| # | 检查项 | MF 用例 | 覆盖 | 说明 |
|---|--------|---------|------|------|
| 3.1 | 团队服务记录同步 | MF-TEAM-001 | ❌ | spec 占位 skip，待 SEED-TEAM / 商城 |
| 3.2 | 管理员分配权限生效 | MF-TEAM-002 | 🟡 | 打开分配成员弹窗（未提交分配） |
| 3.3 | 未注册账号分配占位 | MF-TEAM-003 | ❌ | spec 占位 skip |

**模块小结**：002 加深至弹窗级；001/003 阻塞于团队 Seed。

---

## 4. NCRE

| # | 检查项 | MF 用例 | 覆盖 | 说明 |
|---|--------|---------|------|------|
| 4.1 | NCRE 模块加载正常 | MF-NCRE-001 | ✅ | 考生 Tab + 考点 Tab |

---

## 5. 伙伴认证

| # | 检查项 | MF 用例 | 覆盖 | 说明 |
|---|--------|---------|------|------|
| 5.1 | 伙伴认证模块加载正常 | MF-PARTNER-001 | ✅ | 平铺岗位区块 |
| 5.2 | 伙伴课程详情页正常加载 | MF-PARTNER-002 | ✅ | partner 新标签打开课程详情 |
| 5.3 | 伙伴权限判断 | MF-PARTNER-003 | ✅ | 非 partner 学/考拦截 |

**模块小结**：5 项 MF 已独立目录接线；缺 partner 账号时会 skip。

---

## 汇总

### 按覆盖深度（MF 套件）

| 深度 | 数量 | 含义 |
|------|------|------|
| ✅ | 7 | 视频、认证列表/详情、NCRE、伙伴三项等 |
| 🟡 | 9 | 自测/进考/交卷/同步/团队弹窗/文档等 |
| ❌ | 2 | MF-TEAM-001/003（待 Seed） |
| `@Destructive` | 2 | MF-CERT-005/006 单独跑 |

### 按模块

| 模块 | 清单项 | ✅ | 🟡 | ❌ |
|------|--------|----|----|-----|
| 课程学习 | 4 | 1 | 3 | 0 |
| 认证考试 | 9 | 2 | 7 | 0 |
| 团队管理 | 3 | 0 | 1 | 2 |
| NCRE | 1 | 1 | 0 | 0 |
| 伙伴认证 | 3 | 3 | 0 | 0 |
| **合计** | **20** | **7** | **11** | **2** |

> `tc-platform` 的 TC-* / TC-AUTH 仍为扩展回归，见 [`tc-platform/README.md`](tc-platform/README.md)。

---

## 跑测命令

| 命令 | 范围 |
|------|------|
| `pnpm run test:main-flow` | MF 18 条（非破坏性） |
| `pnpm run test:main-flow:destructive` | MF-CERT-005/006 |
| `pnpm run test:tc-platform:smoke` | 扩展 Smoke（并行维护） |

---

## 变更记录

| 日期 | 说明 |
|------|------|
| 2026-08-27 | 初版：对照主流程验收清单与 tc-platform 20 条用例 |
| 2026-08-27 | 落地 `tests/main-flow/` MF-* 20 条 + TC-MainFlow project |
