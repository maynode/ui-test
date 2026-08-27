# E2E 覆盖缺口 backlog

> 记录当前 **未覆盖** 或 **覆盖很浅** 项，供后续迭代。  
> 已覆盖清单见 `tc-platform/README.md`「当前用例清单」。  
> **主流程验收对照**见 [`MAIN-FLOW-MATRIX.md`](MAIN-FLOW-MATRIX.md)。  
> 造数/账号前置见 `testData/seed-p2-matrix.md`。

**统计基准（2026-08-27）**：Website 20 条（8 Smoke + 11 Regression + 1 Destructive）；Admin Seed 5 条。

---

## P0 — 已有用例但很浅（加深断言即可）

| 模块 | 现状 | 建议补 |
|------|------|--------|
| 认证考试 | TC-CERT-001b / 005 只认「有状态区」或自适应一种状态 | 按固定账号拆：未开考 / 继续考 / 待发布 / 已过 / 未过 / 补考（需 Seed 或专用账号） |
| 团队 | TC-TEAM-004/005 只测折叠 + 进名额管理页 | 名额管理页内：分配成员、批量导入、移除；依赖 admin 已有团队数据 |
| NCRE | TC-NCRE-001 仅加载 + 考生 Tab | 考点 Tab、课程区内容 |
| 伙伴 | TC-PARTNER-001/002 页级断言 | 岗位内多阶段展开；去考试跳转认证详情；立即学习跳课程 |
| 访问拦截 | TC-AUTH-001/002 个人中心 + 课程 CTA | 未登录进认证详情/进考；其它个人中心子页 |
| 我的考试/证书 | TC-CERT-003/004 仅有列表或空态 | 有数据时断言行字段/证书卡片；证书非空态 |

---

## P1 — 主流程缺口（新用例）

| 模块 | 缺口 | 依赖 |
|------|------|------|
| 认证学习 | 「进入模拟测试」 | user + certId + 认证含自测卷 |
| 认证考试 | 破坏性交卷环境重置 / 专用账号策略 | 已实名 user；可重复进考 certId |
| 课程 | VIP/免费标签、收藏、侧栏选节 | 会员课 / 免费课数据 |
| 团队 | **商城购买团队订阅**（Website 外链） | admin + 商城可测；或 Admin 订单授权调研 |
| 负向账号 | 无会员、无认证权限、非 partner 进伙伴课等 | 多角色 `accounts.local.json` |

---

## P2 — Admin 造数缺口

| Seed（规划） | 目的 | 阻塞/备注 |
|--------------|------|-----------|
| SEED-EXAM-STATE-001 | Admin `#/exam/scoreManage` 改分/发布 → 固定考试 UI 状态 | 需 user 已有考试记录（先交卷或手工考） |
| SEED-CERT-PUBLISH-001 | 成绩发布后发证 → `catalog.certificates[]` | 依赖上条 + 认证自动发证配置 |
| SEED-TEAM-001 | 团队订阅 / teamId | 商城或 Admin 订单链路未打通，见 `seed-p2-matrix.md` |
| SEED-NCRE-001 | NCRE 后台数据 | Admin NCRE 路由 PO 待建 |
| catalog.exams 消费 | Website 用例硬接线 `getExamId()` | 暂无独立 exam 详情用例 |

已实现 P2a：`SEED-MEMBER-RES-001` → `memberships[]`（表空 skip）。

---

## P3 — 830 / 新功能（尚未起步）

| 功能 | 说明 |
|------|------|
| 中望杯 zwCup | 入口显隐、首页、报名、我的大赛、赛事中心 |
| 个人中心 | 会员卡三态、侧栏会员信息、赛事中心菜单 |
| 实习生计划 | 文案/入口 |
| 公告 XSS 回归 | 富文本展示（偏安全，可选 API/单测） |

---

## 明确不在当前范围

- `tests/functional` 等 DemoQA 样例（勿当培训认证回归）
- 生产支付真实下单（除非单独开商城 E2E 环境）
- 直接改 DB 造数（与 Playwright Admin Seed 体系分离，需单独立项）

---

## 建议实施顺序

```
1. P0 加深：伙伴跳转 / NCRE 考点 / 名额管理页内操作
2. P2 造数：SEED-EXAM-STATE → SEED-CERT-PUBLISH
3. P1 新用例：模拟测试、负向账号矩阵
4. P2d 团队：商城或 Admin 订单调研后 SEED-TEAM
5. P3：按 release 830 优先级加 zwCup / 个人中心
```

---

## 变更记录

| 日期 | 说明 |
|------|------|
| 2026-08-27 | 初版：汇总未覆盖/很浅项，对齐 README 与 seed-p2-matrix |
