# TC-Admin Seed 说明

命令：`pnpm run test:tc-admin:seed --ENV=tcTest`（`--workers=1`，全部 `@Seed`）

## P1（主链路，必跑）

| ID | 文件 | catalog |
|----|------|---------|
| SEED-CERT-RES-001 | `seed-01-product-res.spec.ts` | `certs[0]`（须可考试认证 + `productName`） |
| SEED-AUTH-001 | `seed-02-user-auth.spec.ts` | `auth[]`（授权产品与 `certs[0].productName` 一致） |
| SEED-COURSE-001 | `seed-course.spec.ts` | `courses[0]` |
| SEED-EXAM-001 | `seed-exam.spec.ts` | `exams[0]` |

## P2（扩展，表有数据才写入）

| ID | 文件 | catalog | 说明 |
|----|------|---------|------|
| SEED-MEMBER-RES-001 | `seed-membership-res.spec.ts` | `memberships[0]` | 收编首个会员详情页首行资源；空表 skip |

环境变量：`TC_SEED_PRODUCT_QUERY`（默认 `测试考试两个方向认证`）/ `TC_SEED_PRODUCT_ID` / `TC_SEED_CERT_QUERY`（默认 `测试考试`）/ `TC_SEED_MEMBERSHIP_ID`

**注意：** `SEED-CERT-RES-001` 会打开与 `SEED-AUTH-001` **同一产品**的资源页；若仅有「课程订阅」会自动再绑定考试类认证。勿用「课程订阅」跑正式考试，否则 C 端会提示「产品已下架」。

## 仍须人工准备

见 `tests/testData/seed-p2-matrix.md` 与 **`tests/COVERAGE-BACKLOG.md`**（覆盖缺口 backlog）。
