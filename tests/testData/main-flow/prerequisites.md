# 主流程前置条件

每条 `MF-*` 用例的账号、Seed、skip 说明。跑前请先：

1. 配置 `accounts.local.json`（至少 `admin` + `user`；伙伴流程加 `partner`）
2. `pnpm run test:tc-admin:seed --ENV=tcTest`

---

## 账号

| 角色 | MF 用例 |
|------|---------|
| `user` | 课程、认证、NCRE |
| `admin`（Website 态 `.auth/admin-website.json`） | 管理中心 MF-MC-* |
| `partner` | MF-PARTNER-001/002 |
| `user`（非 partner） | MF-PARTNER-003 |

---

## 数据

| 字段 | 来源 | 影响用例 |
|------|------|----------|
| `catalog.courses[0].id` | SEED-COURSE-001 | MF-COURSE-* |
| `catalog.certs[0].id` | SEED-CERT-RES-001 | MF-CERT-002~007 |
| admin 已有团队订阅与名额 | **人工/商城**（暂无 Seed） | MF-MC-003/004/005 |
| 课程含 PDF 小节 | 课程资源 | MF-COURSE-004 |
| 课程小节数 ≥ 2 | 课程资源 | MF-COURSE-005 |
| 课程含 VIP 小节 / 试看 | 课程资源/权限配置 | MF-COURSE-006 |
| 认证含模拟测试 | 认证配置 | MF-CERT-003 |
| user 已实名 | 测试账号 | MF-CERT-005/006 Destructive |
| 我的考试有记录 | 先交卷或手工考 | MF-CERT-007 |

---

## 按 ID

| ID | 前置 | 常见 skip |
|----|------|-----------|
| MF-COURSE-001~003 | user + courseId | 无 courseId 时用 `/course` 默认课 |
| MF-COURSE-004 | 同上 + 课程有文档小节 | 仅视频课 |
| MF-COURSE-005 | user + courseId + 课程小节数 ≥ 2 | 课程小节数 ≤ 1 |
| MF-COURSE-006 | user（无会员） + courseId + 课程含 VIP 小节 | 纯免费课无 VIP 试看节 |
| MF-CERT-001 | user | — |
| MF-CERT-002~004 | user + certId | 无 certId |
| MF-CERT-003 | 认证学习步骤有「进入模拟测试」 | 无自测卷 |
| MF-CERT-004 | 在线考试可进考状态 | 终态无按钮 |
| MF-CERT-005~006 | 已实名 + 可进考 + 客观题试卷 | `@Destructive` 单独跑 |
| MF-CERT-007 | 我的考试已有该认证记录 | 空列表 |
| MF-CERT-008~009 | user | 空态仍通过 |
| MF-MC-001 | admin C 端登录态 | — |
| MF-MC-002 | admin + 成员池非空 | 成员池为空 |
| MF-MC-003 | admin + 剩余名额 > 0 + 成员池含 user | 无团队/名额耗尽/成员池无 user |
| MF-MC-004 | 依赖 MF-MC-003 分配 + user 登录态 | 003 未跑或 user 登录态缺失 |
| MF-MC-005 | admin | 团队无学习数据时仅空态 |
| MF-NCRE-001 | user | — |
| MF-PARTNER-001~002 | 有效 partner 账号 | 占位 partner skip |
| MF-PARTNER-003 | user + 伙伴页有课程/去考试 | 无 UI 入口 |

---

## 管理中心（MF-MC-001 ~ 005）

| 前置 | 说明 |
|------|------|
| admin C 端登录态 | `.auth/admin-website.json`，由 global-setup 生成 |
| 团队订单与可分配名额 | admin 账号在「坐席分配」页须有非空团队且剩余名额 > 0 |
| 被分配学员 | 复用 `accounts.local.json` 的 `user` 账号；须先在「成员信息 → 添加成员 → 单个添加」加入成员池 |
| 执行顺序 | MF-MC-003 先跑完成分配，MF-MC-004 才能断言学员端收权 |
| 副作用 | MF-MC-003 每次成功都会真实占用一个名额，名额耗尽后该用例转为 skip |

---

## 规划中的造数

见 [`../COVERAGE-BACKLOG.md`](../COVERAGE-BACKLOG.md) P2：

- `SEED-EXAM-STATE-001` → 固定 MF-CERT-007 状态
- `SEED-CERT-PUBLISH-001` → MF-CERT-009 非空断言
