# P2 Admin Seed 与测试数据矩阵 Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补齐 P1 之后仍缺的造数能力：能自动的走 Admin Seed，不能自动的用数据矩阵文档化。

**Architecture:** 延续 P1 模式（Admin PO + `@Seed` + catalog append）。P2a 先落地会员资源收编；团队/考试多状态/证书签发因依赖商城或历史数据，只写 `seed-p2-matrix.md` 与 `exam-states.example.json`，不虚构 UI 流程。

**Tech Stack:** Playwright Test、TypeScript、`lib/catalog.ts`

**req_type:** frontend

## Global Constraints

- 只改 `etcert-e2e`
- 需求文档不写 skill 名
- 无账号 / 表为空时 `test.skip`，不 fail

## P2 优先级

| 批次 | 内容 | 实现方式 |
|------|------|----------|
| P2a | 会员资源收编 | SEED-MEMBER-RES-001 + `memberships[]` |
| P2b | 用户证书 / 证书签发 | 待调研 Admin 可发布流程 |
| P2c | NCRE / 公告 | 待补 Admin 路由 PO |
| 人工 | 团队订阅、考试多状态、伙伴、交卷 | `seed-p2-matrix.md` |

## 任务

- [x] Task 1: `catalog` 增加 `appendCertificate` / `appendMembership` / `memberships[]`
- [x] Task 2: `MembershipResPage` + `SEED-MEMBER-RES-001`
- [x] Task 3: `seed-p2-matrix.md` + `exam-states.example.json`
- [x] Task 4: README / tc-admin 说明更新

## 验收

- `SEED-MEMBER-RES-001` 在会员资源表非空时写入 `catalog.memberships[0]`
- P2 矩阵文档列清团队/考试/伙伴/证书的人工前置
- `tsc --noEmit` 通过
