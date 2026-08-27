# Admin 造数 → Catalog → Website 验证管线 Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `etcert-e2e` 内建立「后台 Admin UI 自动造数 → 写出 Catalog → 前台 Website 用例消费验证」的可扩展管线，首切片打通「用户授权」闭环。

**Architecture:** 全部落在 `etcert-e2e`（Playwright + Page Object），不引入 goldpath-e2e / Midscene。拆成三层：`admin`（等保级造数操作）、`catalog`（造数产物契约）、`website`（已有 tc-platform 验证用例）。新增 Playwright project `TC-Admin`（baseURL = etcert-admin），与现有 `TC-Platform`（website）分离。造数用例 `@Seed` 可独立跑，也可在验证前按依赖序执行；产物写入 `tests/testData/generated/catalog.json`（gitignore），静态 `courses.json` / `certs.json` 改为优先读 catalog、否则回退占位。业务依赖按 DAG 推进，禁止跨层硬编码 ID。

**Tech Stack:** Playwright Test、现有 `lib/TcAuth` OAuth、Page Object（`pageFactory/pageRepository`）、JSON catalog、`accounts.local.json` 多角色。

**req_type:** frontend

## Global Constraints

- 所有新代码只进 `D:\CERT-ALL-CODES\etcert-e2e`，可对照 `goldpath-e2e` 思路，禁止把 flow 迁进 goldpath 或反过来依赖它运行
- Admin 与 Website 分 project / baseURL：`/etcert-admin/` vs `/etcert/`
- 造数必须可幂等或带唯一前缀（时间戳 / runId），避免污染共享环境时无法识别
- 账号密钥只来自 `accounts.local.json`（已 gitignore），不提交真实密码
- 首轮范围：基建 + 用户授权垂直切片；课程 / 考试 / 证书造数为同一模式扩展，接口先定好

---

## 后台功能地图（造数前必须理清）

来源：`tc-platform-merge/frontend/packages/admin` 的 `views/` + `api/` + 路由。菜单多数由后端下发，静态路由只覆盖部分；以下按**业务域**整理，标出与造数的关系。

### A. 平台授权 `platformAuth`（造数高频）

| 页面 | Hash 路径（参考） | 能力 | 造数角色 |
|------|-------------------|------|----------|
| 用户授权 | `#/platformAuth/user` | 批量添加用户授权、选产品、起止时间 | **P0 首切片**（对照 goldpath `admin-batch-user-auth`） |
| 产品 | `#/platformAuth/product` | 产品定义 | 授权前置；首切片可复用已有产品 |
| 产品资源 | `#/platformAuth/productRes` | 新增认证资源 / 会员资源 | 认证可学可考前置 |
| 会员 | `#/platformAuth/membership` | 会员定义 | 课程会员类授权前置 |
| 会员资源 | `#/platformAuth/membershipRes` | 会员绑定资源 | 同上 |

### B. 课程 `system/course`（造数高频）

| 页面 | 能力 | 造数角色 |
|------|------|----------|
| 课程列表 / 详情 | 新建课程、章节、视频/文件、关联认证 | P1：产出 `courseId` |
| 课程分类 `category` | 分类维护 | 新建课前置 |
| 学习路径 `learnPath` | 路径挂课 | 可选 |
| 评论 `comment` | 评论管理 | 非造数主路径 |

### C. 考试中心 `exam`（造数高频）

| 页面 | 能力 | 造数角色 |
|------|------|----------|
| 考试管理 `exam/list` | 新建/配置考试、试卷类型、分类、开关企微提醒 | P1：产出 `examId` / 关联认证 |
| 试卷策略 `PaperStrategy` | 组卷 | 考试可答前置（题目在试卷内） |
| 自测列表 / 成绩 | 模拟测 | 对应前台「进入模拟测试」 |
| 成绩管理 / 导入 | 成绩批处理 | 证书签发可选前置 |

> 说明：后台没有独立「题库」一级菜单时，题目挂在考试/试卷配置里；造数时按「建考试 → 配试卷/题目」一条链处理，不要假设另有题库模块。

### D. 认证中心 `certificate`

| 页面 | 能力 | 造数角色 |
|------|------|----------|
| 证书模板 `template` | 模板 | 签发前置 |
| 证书管理 `manage` | 证书实体 | P2 |
| 签发 `sign`（个人/团队） | 发证 | P2：前台「我的证书」有数据 |

### E. 系统与其它（造数低频 / 环境准备）

| 域 | 能力 | 造数角色 |
|----|------|----------|
| `system/user` | 用户、导入、试用产品 | 账号一般用现成测试号；导入可选 |
| `system/role` / `menu` / `dept` / `dic` | 权限与字典 | 不进日常造数 |
| `system/announcement` | 平台公告 | 公告类用例另建 |
| `system/ncre` | NCRE 码 / 优惠 | NCRE 用例扩展时再做 |
| `system/config` / `staff` | 配置、员工 | 非主路径 |
| `software` | 软件相关 | 非主路径 |
| `ja/platformAuth` | 日文站授权变体 | 首轮不做 |

### 造数依赖 DAG（逻辑顺序）

```text
[产品 / 会员定义] ──┐
[课程分类 → 课程 → 章节] ──┼──► [产品资源：认证/会员绑资源]
[考试 + 试卷/题目] ────────┘              │
                                         ▼
                              [用户授权 platformAuth/user]
                                         │
                    ┌────────────────────┼────────────────────┐
                    ▼                    ▼                    ▼
              Website 学课         Website 考试           [成绩 → 证书签发]
                    │                    │                    │
                    └────────────────────┴──► Website 我的考试 / 我的证书
```

首切片只走：**已有产品 → 用户授权 →（可选）前台可见权限变化**。不强制本轮新建课程/考试。

---

## 页面结构（测试工程视角）

```text
etcert-e2e/
  lib/
    TcAuth.ts              # 扩展：admin 登录 etcert-admin OAuth
    tcAdminConfig.ts       # admin baseURL / catalog 路径
    catalog.ts             # 读写作物 catalog.json
  pageFactory/pageRepository/
    admin/                 # Admin PO
      AdminLoginPage.ts
      UserAuthPage.ts      # 用户授权（首切片）
      # 后续：CourseManagePage / ExamListPage / CertManagePage ...
  tests/
    tc-platform/           # 现有 Website 验证（TC-Platform）
    tc-admin/              # 新建 Admin 造数（TC-Admin）
      seed-user-auth.spec.ts
    testData/
      courses.json / certs.json   # 改为优先 merge catalog
      generated/
        catalog.json              # gitignore，造数写入
        .gitkeep
```

## 组件树（Page Object / Helper）

```text
BaseTest (extend)
  ├─ website POs（已有）
  └─ admin POs（新增，仅 TC-Admin 注入）

tc-admin seed specs
  └─ UserAuthPage
       ├─ openBatchAuthDialog()
       ├─ pickProduct(name?)
       ├─ fillAccounts(phones[])
       ├─ fillDateRange(start, end)
       └─ confirm() → 写 catalog.auth 记录
```

## 路由

| 侧 | baseURL 规则 | 示例 |
|----|--------------|------|
| Website | `testConfig.tcQa` + `/etcert/`（与现网一致时在 config 中定） | 现有 TC-Platform |
| Admin | 同 host 换 `/etcert-admin/`，hash 路由 | `.../etcert-admin/#/platformAuth/user` |

`testConfig` 增加 `tcAdminQa` / 或由 website URL 推导（与 goldpath `adminBaseURL()` 同思路，逻辑迁入 `lib/tcAdminConfig.ts`）。

## 数据流

```text
accounts.local.json
        │
        ▼
global-setup → .auth/admin.json + user.json + partner.json
        │
        ▼
TC-Admin @Seed（admin storageState）
        │ UI 操作写真实业务数据
        ▼
tests/testData/generated/catalog.json
        │
        ▼
TC-Platform @Smoke/@Regression（user storageState）
        │ loadCatalog() 覆盖 courses/certs 空 id
        ▼
断言前台可见 / 可学 / 可考
```

## 状态管理

- 登录态：`.auth/{role}.json`（已有）
- 造数态：`catalog.json` 单文件契约，字段版本 `version: 1`
- 用例内不缓存跨文件可变 ID；一律 `loadCatalog()`

### Catalog 契约（v1）

```json
{
  "version": 1,
  "runId": "20260821-093000",
  "env": "tcQa",
  "auth": [
    {
      "account": "13800000000",
      "productName": "示例产品",
      "start": "2026-08-21 00:00:00",
      "end": "2027-08-21 00:00:00",
      "createdAt": "2026-08-21T01:00:00.000Z"
    }
  ],
  "courses": [],
  "exams": [],
  "certs": [],
  "certificates": []
}
```

后续模块只往对应数组追加，不改无关字段。

---

## 验收标准

1. `ENV=tcQa` 下可独立执行 Admin 造数：`pnpm exec playwright test --project=TC-Admin --grep @Seed`
2. 造数成功后存在 `tests/testData/generated/catalog.json`，且含本 run 的 `auth[]` 记录
3. Website 侧读取 catalog 的工具函数有单测或最小脚本校验（读文件 merge 逻辑可测）
4. 首切片 `seed-user-auth`：Admin 登录 → 打开用户授权 → 批量授权对话框完整填写（产品、账号、起止时间）→ 确认后见授权结果或成功提示 → 写入 catalog
5. README / `tests/tc-platform/README.md` 补充「造数 → 验证」怎么跑；不依赖 goldpath-e2e 仓库
6. `accounts.example.json` 说明 admin 需具备后台用户授权权限

---

## File Structure

| 路径 | 职责 |
|------|------|
| `lib/tcAdminConfig.ts` | adminBaseURL / adminPageUrl / catalog 路径 |
| `lib/catalog.ts` | loadCatalog / saveCatalog / mergeAuth |
| `lib/TcAuth.ts` | 增加 `loginAsAdmin` / 生成 `.auth/admin.json` 时走 admin URL |
| `pageFactory/pageRepository/admin/UserAuthPage.ts` | 用户授权 PO |
| `tests/tc-admin/seed-user-auth.spec.ts` | @Seed 首切片 |
| `playwright.config.ts` | 新增 `TC-Admin` project |
| `package.json` | `test:tc-admin:seed` 脚本 |
| `.gitignore` | `tests/testData/generated/catalog.json` |
| `tests/tc-platform/README.md` | 管线说明 |

---

## Task 1: Admin URL 与 Catalog 基建

**Files:**
- Create: `lib/tcAdminConfig.ts`
- Create: `lib/catalog.ts`
- Create: `tests/testData/generated/.gitkeep`
- Modify: `.gitignore`
- Test: 用 node/ts 直接调用 `loadCatalog`/`saveCatalog`（无浏览器）

**Interfaces:**
- Produces: `adminBaseURL(): string`, `adminPageUrl(hashPath: string): string`, `loadCatalog(): Catalog`, `saveCatalog(c: Catalog): void`, `CATALOG_PATH`

- [ ] **Step 1: 写 catalog 契约与空载逻辑**

```typescript
// lib/catalog.ts
import fs from 'fs';
import path from 'path';

export type CatalogAuth = {
  account: string;
  productName: string;
  start: string;
  end: string;
  createdAt: string;
};

export type Catalog = {
  version: 1;
  runId: string;
  env: string;
  auth: CatalogAuth[];
  courses: unknown[];
  exams: unknown[];
  certs: unknown[];
  certificates: unknown[];
};

export const CATALOG_PATH = path.resolve(process.cwd(), 'tests/testData/generated/catalog.json');

export function emptyCatalog(runId: string, env: string): Catalog {
  return { version: 1, runId, env, auth: [], courses: [], exams: [], certs: [], certificates: [] };
}

export function loadCatalog(): Catalog | null {
  if (!fs.existsSync(CATALOG_PATH)) return null;
  return JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8')) as Catalog;
}

export function saveCatalog(catalog: Catalog): void {
  fs.mkdirSync(path.dirname(CATALOG_PATH), { recursive: true });
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
}

export function appendAuth(entry: CatalogAuth, runId: string, env: string): Catalog {
  const current = loadCatalog() ?? emptyCatalog(runId, env);
  current.auth.push(entry);
  saveCatalog(current);
  return current;
}
```

- [ ] **Step 2: 写 admin URL 工具**

```typescript
// lib/tcAdminConfig.ts
import { testConfig } from '../testConfig';

const DEFAULT_ADMIN_SUFFIX = '/etcert-admin/';

export function adminBaseURL(env = process.env.ENV || 'tcQa'): string {
  const fromEnv = process.env.TC_ADMIN_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/?$/, '/');

  const website = (testConfig as Record<string, string>)[env] || testConfig.tcQa;
  // website 形如 https://dev.edu-test.zwsoft.cn → 拼 etcert-admin
  return `${website.replace(/\/$/, '')}${DEFAULT_ADMIN_SUFFIX}`;
}

export function adminPageUrl(hashPath: string, env?: string): string {
  const path = hashPath.startsWith('#')
    ? hashPath
    : `#${hashPath.startsWith('/') ? hashPath : `/${hashPath}`}`;
  return `${adminBaseURL(env)}${path}`;
}
```

- [ ] **Step 3: gitignore generated catalog**

在 `.gitignore` 追加：

```
tests/testData/generated/catalog.json
.auth/
accounts.local.json
```

（若已有则跳过重复。）

- [ ] **Step 4: 本地校验 catalog round-trip**

Run: `npx tsx -e "const c=require('./lib/catalog'); const x=c.emptyCatalog('r1','tcQa'); c.saveCatalog(x); console.log(c.loadCatalog())"`
Expected: 打印出 version=1 的对象，且文件落在 `tests/testData/generated/catalog.json`

- [ ] **Step 5: Stage**

```bash
git add lib/catalog.ts lib/tcAdminConfig.ts tests/testData/generated/.gitkeep .gitignore
```

---

## Task 2: Admin OAuth 登录态

**Files:**
- Modify: `lib/TcAuth.ts`
- Modify: `global-setup.ts`（若需区分 admin baseURL）
- Test: `tests/tc-admin` 里一条 skip-friendly 探测或手动跑登录

**Interfaces:**
- Consumes: `adminPageUrl`, `getAccount('admin')`
- Produces: `loginAsAdmin(page, baseURL)`, `.auth/admin.json` 基于 admin 域

- [ ] **Step 1: 增加 loginAsAdmin**

参考 `goldpath-e2e/helpers/admin.ts` 行为，迁入 etcert-e2e 风格：

```typescript
// 在 lib/TcAuth.ts 追加
import { adminPageUrl } from './tcAdminConfig';

export async function loginAsAdmin(page: Page, adminBase: string): Promise<void> {
  await page.goto(adminPageUrl('/platformAuth/user'), { waitUntil: 'domcontentloaded' });
  const addAuth = page.getByRole('button', { name: '新增授权' });
  const oauthBtn = page.getByRole('button', { name: '授权登录' });

  await Promise.race([
    addAuth.waitFor({ state: 'visible', timeout: 60_000 }),
    oauthBtn.waitFor({ state: 'visible', timeout: 60_000 }),
    page.waitForURL(/testaccounts\.zwsoft\.cn/, { timeout: 60_000 }),
  ]);

  if (await addAuth.isVisible().catch(() => false)) return;

  if (await oauthBtn.isVisible().catch(() => false)) {
    await oauthBtn.click();
  }
  await fillZwsoftAccountLogin(page, 'admin');
  await page.waitForURL(/etcert-admin/, { timeout: 90_000 });
  await page.waitForLoadState('networkidle');
}
```

并让 `saveAuthState` 对 `admin` 角色走 `loginAsAdmin` + admin baseURL（website 角色仍走 `loginAs`）。

- [ ] **Step 2: global-setup 传入 admin URL**

`setupTcAuthStates` 签名扩展为 `(websiteBaseURL, adminBaseURL?)`，admin 角色用后者。

- [ ] **Step 3: 真跑生成 admin storageState**

前置：`accounts.local.json` 已填 admin。  
Run: `$env:ENV='tcQa'; pnpm exec playwright test --list --project=TC-Admin`（Task 3 加 project 后）或临时脚本调用 `setupTcAuthStates`。  
Expected: `.auth/admin.json` 生成且非空。

- [ ] **Step 4: Stage**

```bash
git add lib/TcAuth.ts global-setup.ts
```

---

## Task 3: Playwright project TC-Admin + UserAuthPage + 首切片 Seed

**Files:**
- Create: `pageFactory/pageRepository/admin/UserAuthPage.ts`
- Create: `tests/tc-admin/seed-user-auth.spec.ts`
- Modify: `playwright.config.ts`（`TC-Admin` project，`testDir: ./tests/tc-admin`）
- Modify: `package.json`（脚本）
- Modify: `lib/BaseTest.ts`（可选注入 `userAuthPage`）
- Modify: `tests/tc-platform/README.md`

**Interfaces:**
- Consumes: `loginAsAdmin` storageState、`appendAuth`、账号 `user.username` 作为被授权方
- Produces: catalog.auth 一条；可独立 `@Seed` 跑通

- [ ] **Step 1: 配置 TC-Admin project**

```typescript
// playwright.config.ts 追加 project
{
  name: `TC-Admin`,
  testDir: `./tests/tc-admin`,
  use: {
    browserName: `chromium`,
    channel: `chrome`,
    baseURL: adminBaseURL(currentEnvironment),
    headless: isCI,
    viewport: { width: 1500, height: 730 },
    ignoreHTTPSErrors,
    screenshot: `only-on-failure`,
    video: `retain-on-failure`,
    trace: `retain-on-failure`,
    ...(fs.existsSync(getAuthStatePath('admin'))
      ? { storageState: getAuthStatePath('admin') }
      : {}),
  },
},
```

注意：顶部需 `import { adminBaseURL } from './lib/tcAdminConfig'`。

- [ ] **Step 2: 实现 UserAuthPage（选择器对齐现网文案）**

```typescript
// pageFactory/pageRepository/admin/UserAuthPage.ts
import { Page, expect } from '@playwright/test';
import { adminPageUrl } from '@lib/tcAdminConfig';

export class UserAuthPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto(adminPageUrl('/platformAuth/user'), { waitUntil: 'domcontentloaded' });
    await this.page.getByRole('button', { name: '新增授权' }).waitFor({ state: 'visible', timeout: 30_000 });
  }

  dialog() {
    return this.page.getByRole('dialog').filter({
      has: this.page.getByText(/批量添加用户授权|授权结果/),
    });
  }

  async openBatchDialog(): Promise<void> {
    await this.page.getByRole('button', { name: '新增授权' }).click();
    await expect(this.dialog().getByText('批量添加用户授权')).toBeVisible();
  }

  async pickFirstProduct(): Promise<string> {
    const select = this.dialog().locator('.el-form-item').filter({ hasText: '授权产品' }).locator('.el-select');
    await select.locator('.el-select__caret, .el-select__suffix').first().click();
    const opt = this.page.locator('.el-select-dropdown:visible .el-select-dropdown__item:not(.is-disabled)').first();
    await opt.waitFor({ state: 'visible', timeout: 10_000 });
    const name = (await opt.innerText()).trim();
    await opt.click();
    await expect(this.dialog().getByText('产品个人编码')).toBeVisible();
    return name;
  }

  async fillAccount(account: string): Promise<void> {
    const textarea = this.dialog().locator('.el-form-item').filter({ hasText: '授权账号' }).locator('textarea');
    await textarea.fill(account);
  }

  async fillDateTime(label: string, value: string): Promise<void> {
    const input = this.dialog().locator('.el-form-item').filter({ hasText: label }).locator('input').first();
    await input.fill(value);
    await input.press('Enter');
  }

  async confirm(): Promise<void> {
    await this.dialog().getByRole('button', { name: '确认' }).click();
    await expect(this.dialog().getByText(/授权结果|成功/)).toBeVisible({ timeout: 30_000 });
  }
}
```

- [ ] **Step 3: 写 seed-user-auth.spec.ts**

```typescript
import { test, expect } from '@playwright/test';
import { UserAuthPage } from '@pages/admin/UserAuthPage';
import { appendAuth } from '@lib/catalog';
import { getAccount, hasAccount } from '@lib/loadAccounts';
import { tcAuthConfig } from '@lib/tcAuthConfig';

const auth = tcAuthConfig('admin');

function pad2(n: number) { return String(n).padStart(2, '0'); }
function fmt(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} 00:00:00`;
}

test.describe('Admin Seed 用户授权', () => {
  if (auth.ready && auth.storageState) {
    test.use({ storageState: auth.storageState });
  }

  test.beforeEach(() => {
    test.skip(!auth.ready, auth.skipReason);
    test.skip(!hasAccount('user'), '需要 accounts.local.json 中的 user 作为被授权账号');
  });

  test('SEED-AUTH-001 批量用户授权并写入 catalog', { tag: '@Seed' }, async ({ page }) => {
    const userAuth = new UserAuthPage(page);
    const account = getAccount('user').username;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);

    await userAuth.goto();
    await userAuth.openBatchDialog();
    const productName = await userAuth.pickFirstProduct();
    await userAuth.fillAccount(account);
    await userAuth.fillDateTime('授权开始时间', fmt(start));
    await userAuth.fillDateTime('授权结束时间', fmt(end));
    await userAuth.confirm();

    const runId = new Date().toISOString().replace(/[:.]/g, '-');
    appendAuth(
      { account, productName, start: fmt(start), end: fmt(end), createdAt: new Date().toISOString() },
      runId,
      process.env.ENV || 'tcQa',
    );
    expect(appendAuth).toBeTruthy();
  });
});
```

（最后一行改为 `expect(loadCatalog()?.auth.length).toBeGreaterThan(0)`。）

- [ ] **Step 4: package.json 脚本**

```json
"test:tc-admin:seed": "cross-env ENV=%ENV% playwright test --project=TC-Admin --grep @Seed --workers=1"
```

- [ ] **Step 5: 真跑首切片**

Run: `$env:ENV='tcQa'; pnpm run test:tc-admin:seed`  
Expected: SEED-AUTH-001 PASS；`catalog.json` 含 user 账号授权记录。

- [ ] **Step 6: 更新 README 管线说明 + Stage**

```bash
git add playwright.config.ts package.json pageFactory/pageRepository/admin/UserAuthPage.ts tests/tc-admin/seed-user-auth.spec.ts tests/tc-platform/README.md lib/BaseTest.ts
```

---

## Task 4: Website 消费 Catalog（接线，不强制本轮改业务断言）

**Files:**
- Create: `lib/loadTcTestData.ts`（courses/certs merge catalog）
- Modify: `tests/tc-platform/cert-exam.spec.ts` / `course-learning.spec.ts`（若有读 json 处改为 loadTcTestData）
- Modify: `tests/tc-platform/README.md`

**Interfaces:**
- Consumes: `loadCatalog()`
- Produces: `getCertId(): string | undefined`, `getCourseId(): string | undefined`

- [ ] **Step 1: merge 读取**

```typescript
// lib/loadTcTestData.ts
import fs from 'fs';
import path from 'path';
import { loadCatalog } from './catalog';

export function loadCertsJson() {
  const raw = JSON.parse(fs.readFileSync(path.resolve('tests/testData/certs.json'), 'utf8'));
  const catalog = loadCatalog();
  const fromCatalog = catalog?.certs?.[0] as { id?: string } | undefined;
  if (fromCatalog?.id) raw.firstCert.id = fromCatalog.id;
  return raw;
}
```

课程同理。本轮 catalog.certs 可能仍为空——函数必须安全回退静态 json。

- [ ] **Step 2: 文档写清推荐命令序**

```text
1) 填 accounts.local.json（admin + user）
2) ENV=tcQa pnpm run test:tc-admin:seed
3) ENV=tcQa pnpm run test:tc-platform:smoke
```

- [ ] **Step 3: Stage**

```bash
git add lib/loadTcTestData.ts tests/tc-platform/README.md
```

---

## 后续扩展（本 REQ 文档约定，下一批实现）

同一模式追加，不改管线：

| 优先级 | Seed 模块 | Admin 入口 | Catalog 字段 | 前台验证 |
|--------|-----------|------------|--------------|----------|
| P1 | 课程 | `system/course` | `courses[]` | TC-COURSE-* |
| P1 | 考试+试卷题目 | `exam/list` | `exams[]` | TC-CERT-002 |
| P1 | 认证资源绑定 | `platformAuth/productRes` | `certs[]` | TC-CERT-001 |
| P2 | 证书签发 | `certificate/sign` | `certificates[]` | TC-CERT-004 |
| P2 | NCRE / 公告 | `system/ncre` / announcement | 各自扩展 | 对应用例 |

每加一个 Seed：1 个 Admin PO + 1 个 `@Seed` spec + catalog 字段 + README 一行。

---

## 风险

- 共享测试环境写真实授权：Seed 必须 `--workers=1`，确认提交按钮仅在明确 `@Seed` 流程点击
- Admin 菜单权限因角色而异：accounts.admin 必须能进「用户授权」
- 产品下拉远程搜索：PO 需兼容空列表时输入关键字（可后续加强，首版选第一项）
- Website baseURL 是否已含 `/etcert`：实现 `adminBaseURL` 时用环境变量 `TC_ADMIN_BASE_URL` 兜底