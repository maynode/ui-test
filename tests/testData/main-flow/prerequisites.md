# 主流程前置条件

每条 `MF-*` 用例的账号、Seed、skip 说明。跑前请先：

1. 配置 `accounts.local.json`（至少 `admin` + `user`；伙伴流程加 `partner`）
2. `pnpm run test:tc-admin:seed --ENV=tcTest`

---

## 账号

| 角色 | MF 用例 |
|------|---------|
| `user` | 课程、认证、NCRE |
| `admin`（Website 态 `.auth/admin-website.json`） | 团队 MF-TEAM-* |
| `partner` | MF-PARTNER-001/002 |
| `user`（非 partner） | MF-PARTNER-003 |

---

## 数据

| 字段 | 来源 | 影响用例 |
|------|------|----------|
| `catalog.courses[0].id` | SEED-COURSE-001 | MF-COURSE-* |
| `catalog.certs[0].id` | SEED-CERT-RES-001 | MF-CERT-002~007 |
| admin 已有团队订阅 | **人工/商城**（暂无 Seed） | MF-TEAM-002；001/003 阻塞 |
| 课程含 PDF 小节 | 课程资源 | MF-COURSE-004 |
| 认证含模拟测试 | 认证配置 | MF-CERT-003 |
| user 已实名 | 测试账号 | MF-CERT-005/006 Destructive |
| 我的考试有记录 | 先交卷或手工考 | MF-CERT-007 |

---

## 按 ID

| ID | 前置 | 常见 skip |
|----|------|-----------|
| MF-COURSE-001~003 | user + courseId | 无 courseId 时用 `/course` 默认课 |
| MF-COURSE-004 | 同上 + 课程有文档小节 | 仅视频课 |
| MF-CERT-001 | user | — |
| MF-CERT-002~004 | user + certId | 无 certId |
| MF-CERT-003 | 认证学习步骤有「进入模拟测试」 | 无自测卷 |
| MF-CERT-004 | 在线考试可进考状态 | 终态无按钮 |
| MF-CERT-005~006 | 已实名 + 可进考 + 客观题试卷 | `@Destructive` 单独跑 |
| MF-CERT-007 | 我的考试已有该认证记录 | 空列表 |
| MF-CERT-008~009 | user | 空态仍通过 |
| MF-TEAM-001 | 商城购买团队订阅 | **永久 skip 至 SEED-TEAM** |
| MF-TEAM-002 | admin 有团队 + 名额管理入口 | 空态 admin |
| MF-TEAM-003 | 占位邮箱流程 | **永久 skip 至 SEED-TEAM** |
| MF-NCRE-001 | user | — |
| MF-PARTNER-001~002 | 有效 partner 账号 | 占位 partner skip |
| MF-PARTNER-003 | user + 伙伴页有课程/去考试 | 无 UI 入口 |

---

## 规划中的造数

见 [`../COVERAGE-BACKLOG.md`](../COVERAGE-BACKLOG.md) P2：

- `SEED-TEAM-001` → 解锁 MF-TEAM-001/003
- `SEED-EXAM-STATE-001` → 固定 MF-CERT-007 状态
- `SEED-CERT-PUBLISH-001` → MF-CERT-009 非空断言
