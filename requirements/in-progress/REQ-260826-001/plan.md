# 伙伴认证 E2E 对齐平铺改版 Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 使 `TC-PARTNER-*` 与 website `release/260830` 伙伴认证平铺页一致，Smoke 不再依赖已删除的 Tab。

**Architecture:** 仅改 `etcert-e2e`。Page Object 改为定位 `.partner-section-list` / `.partner-cert-course`、权益文案「伙伴专属」、按钮「去考试」「立即学习」（优先 `data-testid`）。Spec 去掉 Tab 断言；课程可为 0（配置未命中）时改为断言岗位区块或「去考试」行存在，不再要求「暂无课程信息」。

**Tech Stack:** Playwright + TypeScript Page Object

**req_type:** frontend

## Global Constraints

- 只改 e2e；不改 website/admin 业务包
- 需求文档不写 skill 名
- 账号仍走 partner storageState；无账号则 skip

## 页面结构

- 路由仍为 `/partnerCert`
- 顶栏权益区含「伙伴专属」等 label
- 下方 `partner-section-list` 平铺多个 `PartnerMain`（`.partner-cert-course`），无 el-tabs

## 组件树

- `partnerCert/index.vue` → benefits + `PartnerMain` × N → `CourseItem`（立即学习）+ `CertExamRow`（去考试）

## 路由

- Website：`/partnerCert`（不变）

## 数据流

- 无 catalog 依赖；课程由前端配置 courseId 映射接口数据，可能为空

## 状态管理

- 无前端状态变更；仅 storageState=`partner`

## 验收标准

- `TC-PARTNER-001`：容器可见，至少 1 个岗位区块（`.partner-cert-course`）可见
- `TC-PARTNER-002`：「伙伴专属」可见；课程卡 >0 **或**「去考试」按钮 >0 **或** 岗位区块内有阶段标题
- README 待补项不再写「多 Tab、报名考试」
- 有 partner 账号时 `@Smoke` 对 `tcTest` 通过或仅因缺账号 skip（非选择器失败）

## 任务

- [x] Task 1: 更新 `PartnerCertPage.ts`
- [x] Task 2: 更新 `partner-cert.spec.ts`、`README.md`、`partner.json`；断言含阶段标题兜底
- [x] ~~Task 3: 跑伙伴 Smoke~~（`accounts.local.json` 仍为 `your-*` 占位，用例会 skip；已修 `isPlaceholder` 识别）
