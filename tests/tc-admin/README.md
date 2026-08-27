# TC-Admin Seed 说明

命令：`pnpm run test:tc-admin:seed --ENV=tcTest`（`--workers=1`，全部 `@Seed`）

## P1（主链路，必跑）

| ID | 文件 | catalog |
|----|------|---------|
| SEED-AUTH-001 | `seed-user-auth.spec.ts` | `auth[]` |
| SEED-CERT-RES-001 | `seed-product-res.spec.ts` | `certs[0]` |
| SEED-COURSE-001 | `seed-course.spec.ts` | `courses[0]` |
| SEED-EXAM-001 | `seed-exam.spec.ts` | `exams[0]` |

## P2（扩展，表有数据才写入）

| ID | 文件 | catalog | 说明 |
|----|------|---------|------|
| SEED-MEMBER-RES-001 | `seed-membership-res.spec.ts` | `memberships[0]` | 收编首个会员详情页首行资源；空表 skip |

环境变量：`TC_SEED_PRODUCT_ID` / `TC_SEED_CERT_QUERY` / `TC_SEED_MEMBERSHIP_ID`

## 仍须人工准备

见 `tests/testData/seed-p2-matrix.md` 与 **`tests/COVERAGE-BACKLOG.md`**（覆盖缺口 backlog）。
