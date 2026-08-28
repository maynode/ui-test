# 主流程重构批次一：管理中心 E2E 闭环与旧团队用例下架 Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为「管理中心」（原团队服务）建立 5 条端到端主流程用例，其中席位分配走通「管理员分配 → 名额扣减 → 学员端跨账号收权」真实闭环，同时下架 3 条指向已移除入口的旧团队用例。

**Architecture:** 沿用现有 Playwright + Page Object 分层：新增 5 个管理中心 POM 到 `pageFactory/pageRepository/manageCenter/`，通过 `lib/BaseTest.ts` 注入 fixture；管理中心页面全部走 `admin` 角色的 C 端登录态（`.auth/admin-website.json`），复用 `gotoWebsitePage(page, route, 'admin')`。跨账号验证新增 `lib/websiteSecondContext.ts`，在同一条用例里用 `browser.newContext({ storageState: '.auth/user.json' })` 开第二个上下文扮演学员，避免引入新账号角色。名额扣减断言以页面上「已分配名额/总名额」文本的前后差值为依据，不依赖接口 mock。旧团队用例整体删除而非 skip，防止后续误以为仍有覆盖。

**Tech Stack:** Playwright 1.60（`@playwright/test`）、TypeScript 6、Element Plus 选择器、ESLint 9

**req_type:** frontend

## Global Constraints

- 仅改动 `etcert-e2e/`，不得修改 `tc-platform-merge/` 下任何业务代码。
- 管理中心用例统一使用 `admin` 角色 C 端登录态（`tcWebsiteAdminAuthConfig()`），禁止误用后台 `.auth/admin.json`。
- 新增用例 tag 一律 `@MainFlow`；本批次不产生 `@Destructive` 用例。
- 数据前置缺失时用 `test.skip(condition, reason)` 显式跳过并写明原因，禁止静默通过。
- 被分配学员固定为 `accounts.local.json` 的 `user` 账号（`zrg_dev@163.com`），不新增 `AccountRole` 枚举值。
- POM 类头必须带「对应路由 / 对应前端」注释块，与现有 `CertDetailPage.ts` 风格一致。
- 本工程无单元测试基建（无 vitest/jest），验收方式为运行对应 Playwright 用例 + `eslint` + `tsc --noEmit`。
- 所有步骤只 `git add` 暂存，不执行 `git commit`。

---

## 页面结构与路由

| 路由 | 布局 | 页面根选择器 | 侧栏 |
|------|------|--------------|------|
| `/manageCenter/` | manage-center | 无（`router.replace` 到 `/manageCenter/seat/`） | 有 |
| `/manageCenter/seat/` | manage-center | `.seat-allocation` > `.team-service-panel` | 有 |
| `/manageCenter/seat/manage?teamId=xxx` | manage-center | `.manage-center-seat-manage` | 有 |
| `/manageCenter/member/` | manage-center | `.member-info` | 有 |
| `/manageCenter/report/` | manage-center | `.report-page` > `.report-analysis` | **无**（`showSideMenu: false`） |

**严格模式陷阱（必须遵守）**：`.manage-center-layout` 这个 class 同时出现在两处且互相嵌套 —— `layouts/manage-center.vue` 的 `<main class="manage-center-layout">` 与 `pages/manageCenter/components/ManageCenterLayout.vue` 的 `<div class="manage-center-layout">`。直接 `page.locator('.manage-center-layout')` 会命中 2 个元素并让 `expect().toBeVisible()` 报 `resolved to 2 elements`。**统一改用内层独有的 `.manage-center-layout-page` 作为布局锚点。**

布局容器：`.manage-center-layout-page`（锚点）/ `.manage-center-layout-left`（侧栏，含 `.user-menu`）/ `.manage-center-layout-right` / `.manage-center-layout-content`。
侧栏菜单项顺序：`坐席分配` → `成员信息`。顶栏由 `ZwHeader` 渲染（根 class `.zw-header`，标题文本 `中望软件培训认证管理中心`），导航项 `培训管理`（`/manageCenter/`）/ `报表分析`（`/manageCenter/report/`）。

## 组件树与关键交互元素

**坐席分配 `/manageCenter/seat/`**

- 空态文案：`暂无团队信息，开通团队服务为您的团队成员批量开通培训认证服务，按需购买名额数`
- 非空：按类型渲染折叠面板，标题为 `课程订阅` / `认证考试` / `维保服务` / `365服务`，默认展开
- 每行操作列按钮：`名额管理`；名额列文本格式 `{已分配}/{总数}`
- 点击 `名额管理` → `router.push('/manageCenter/seat/manage?teamId=xxx')`（同标签页，非新窗口）

**名额管理 `/manageCenter/seat/manage`**

- 头部 `.seats-header`（订单名、创建时间、总名额、已分配）
- 主体 `.manage-center-seats-manage` > `.seats-manage`
- 工具栏 `.seats-manage-tools` 按钮：`选择成员`（管理中心独有）、`分配成员`、`批量导入成员`、`移除`
- 可分配名额为 0 时 `选择成员` / `分配成员` / `批量导入成员` 被 `disabled`
- `选择成员` 弹窗：`.select-member-dialog`，标题 `选择成员`，Tab `全部成员 (N)` / `已选择 (n/max)`，表格 `.select-member-dialog-table`（列：勾选、序号、成员姓名、手机号/邮箱），姓名搜索 placeholder `搜索姓名`，底部 `取消` / `确认`
- 勾选超出剩余名额：ElMessage warning `已超出可分配名额数`
- 含未激活成员时二次确认：ElMessageBox 标题 `提示`，确认按钮 `确认添加`
- 分配成功：ElMessage success `操作成功`，随后表格与订单头部刷新

**成员信息 `/manageCenter/member/`**

- 根 `.member-info`，搜索区 `.member-search`，工具区 `.member-info-tools`
- 按钮：`重置`、`添加成员`（hover 下拉，项为 `单个添加` / `批量添加`）、`批量移除`
- 表格 `.member-info-table`，表头含 `账号状态` 枚举筛选
- 未勾选点 `批量移除`：ElMessage warning `请选择要移除的成员`

**报表分析 `/manageCenter/report/`**

- 根 `.report-analysis`，统计卡区 `.card-summary`（注意：`ReportAnalysis.vue` 里的 `:deep(.report-summary)` 是失效残留选择器，`CardSummary.vue` 实际根 class 是 `.card-summary`，勿用 `.report-summary`）
- 明细面板 `.report-analysis-panel`，标题 `学习情况明细表`
- 工具：搜索框 `.report-analysis-search`、`重置`、`导出`
- 表格 `.report-analysis-table`，表头含 `认证考试` / `认证状态` 勾选筛选、`学习总时长（分钟）` 排序、`最后一次学习时间` 排序
- 空态：`暂无相关学习数据`

## 数据流与登录态

```
global-setup (ENV=tc*)
  └─ setupTcAuthStates() → .auth/user.json / .auth/admin.json / .auth/admin-website.json

TC-MainFlow project
  └─ 默认 storageState = .auth/user.json
       └─ mf-manage-center.spec.ts 用 test.use({ storageState: '.auth/admin-website.json' })  ← 管理员视角
            └─ MF-MC-004 内额外 browser.newContext({ storageState: '.auth/user.json' })  ← 学员视角
```

## 状态管理

无前端状态改动。测试侧状态仅为用例内局部变量（分配前后名额快照、被分配学员联系方式）。

---

## 前置条件（已确认）

| 前置 | 状态 |
|------|------|
| `admin` 账号在管理中心有真实团队订单与可分配名额 | 已确认存在 |
| 被分配学员账号 | 复用 `user`（`zrg_dev@163.com`），需已在 admin 的团队成员池中 |
| `user.json` / `admin-website.json` 登录态 | 由 `global-setup` 生成 |

若 `user` 尚未进入成员池，MF-MC-003/004 会因「成员池无 zrg_dev@163.com」而 skip，此时先在管理中心「成员信息 → 添加成员 → 单个添加」手工加入一次。

---

## 后续批次（本 plan 不实现，仅登记范围）

| 批次 | 范围 |
|------|------|
| 批次二 | 课程视频播控 3 条：真实起播/倍速/全屏、连播与选节、60s 试看拦截 |
| 批次三 | 考试闭环 2 条：及格发证、不及格补考（含考试次数重置造数） |
| 批次四 | 其余补齐：认证前置合并链路、知识点与讨论区、我的考试状态机、证书查验、个人中心与全局拦截 |

---

## Task 1: 管理中心导航工具与 MC 子集跑测脚本

**Files:**
- Create: `lib/manageCenterNavigate.ts`
- Modify: `package.json:24-30`（scripts 区，`test:main-flow:destructive:tcTest` 之后追加两条）

**Interfaces:**
- Consumes: `lib/websiteNavigate.ts` 的 `gotoWebsitePage`
- Produces: `MANAGE_CENTER_ROUTES`、`gotoManageCenterPage(page, routeKey, query?)`

- [ ] **Step 1: 创建导航工具**

创建 `lib/manageCenterNavigate.ts`：

```ts
import type { Page } from '@playwright/test';
import { gotoWebsitePage } from './websiteNavigate';

/** 管理中心（原团队服务）路由表，对应前端 constants/manageCenterSideMenu.ts 与 manageCenterNav.ts */
export const MANAGE_CENTER_ROUTES = {
    home: '/manageCenter/',
    seat: '/manageCenter/seat/',
    seatManage: '/manageCenter/seat/manage',
    member: '/manageCenter/member/',
    report: '/manageCenter/report/',
} as const;

export type ManageCenterRouteKey = keyof typeof MANAGE_CENTER_ROUTES;

/** 管理中心页面一律用 admin 账号的 C 端登录态（.auth/admin-website.json） */
export async function gotoManageCenterPage(
    page: Page,
    routeKey: ManageCenterRouteKey,
    query?: Record<string, string>,
): Promise<void> {
    const search = query ? `?${new URLSearchParams(query).toString()}` : '';
    await gotoWebsitePage(page, `${MANAGE_CENTER_ROUTES[routeKey]}${search}`, 'admin');
}
```

- [ ] **Step 2: 追加跑测脚本**

在 `package.json` 的 `scripts` 中，`"test:main-flow:destructive:tcTest"` 那一行之后插入：

```json
"test:main-flow:mc": "playwright test --project=TC-MainFlow --grep @MainFlow --grep-invert @Destructive --workers=1 mf-manage-center",
"test:main-flow:mc:tcTest": "cross-env ENV=tcTest playwright test --project=TC-MainFlow --grep @MainFlow --grep-invert @Destructive --workers=1 mf-manage-center",
```

- [ ] **Step 3: Verify**

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
pnpm exec tsc --noEmit
pnpm exec eslint lib/manageCenterNavigate.ts
```

预期：`tsc` 无输出（成功），`eslint` 无错误输出。

- [ ] **Step 4: Stage changes**

```powershell
git add etcert-e2e/lib/manageCenterNavigate.ts etcert-e2e/package.json
```

---

## Task 2: 管理中心布局 Page Object

**Files:**
- Create: `pageFactory/pageRepository/manageCenter/ManageCenterPage.ts`
- Modify: `lib/BaseTest.ts`（import 区 + fixture 类型 + fixture 实现）

**Interfaces:**
- Consumes: `lib/manageCenterNavigate.ts`、`lib/websitePopup.ts`
- Produces: `ManageCenterPage` 类；fixture `manageCenterPage`

- [ ] **Step 1: 创建 POM**

创建 `pageFactory/pageRepository/manageCenter/ManageCenterPage.ts`：

```ts
import { Page, Locator } from '@playwright/test';
import { gotoManageCenterPage, type ManageCenterRouteKey } from '@lib/manageCenterNavigate';
import { waitForWebsitePopupUrl } from '@lib/websitePopup';
import { gotoWebsitePage } from '@lib/websiteNavigate';

/**
 * 管理中心布局 Page Object
 * 对应路由：/manageCenter/ · /manageCenter/seat/ · /manageCenter/member/ · /manageCenter/report/
 * 对应前端：website/src/pages/manageCenter/components/ManageCenterLayout.vue
 */
export class ManageCenterPage {
    readonly page: Page;
    readonly layout: Locator;
    readonly header: Locator;
    readonly headerTitle: Locator;
    readonly sideMenu: Locator;
    readonly content: Locator;
    readonly seatMenuItem: Locator;
    readonly memberMenuItem: Locator;
    readonly trainingNav: Locator;
    readonly reportNav: Locator;

    constructor(page: Page) {
        this.page = page;
        // 不要用 .manage-center-layout：layouts/manage-center.vue 与 ManageCenterLayout.vue 同名嵌套，会命中 2 个元素
        this.layout = page.locator('.manage-center-layout-page');
        this.header = page.locator('.zw-header');
        this.headerTitle = this.header.getByText('中望软件培训认证管理中心');
        this.sideMenu = page.locator('.manage-center-layout-left .user-menu');
        this.content = page.locator('.manage-center-layout-content');
        this.seatMenuItem = this.sideMenu.getByText('坐席分配', { exact: true });
        this.memberMenuItem = this.sideMenu.getByText('成员信息', { exact: true });
        this.trainingNav = this.header.getByText('培训管理', { exact: true });
        this.reportNav = this.header.getByText('报表分析', { exact: true });
    }

    async goto(routeKey: ManageCenterRouteKey = 'home') {
        await gotoManageCenterPage(this.page, routeKey);
        await this.layout.waitFor({ state: 'visible' });
    }

    /** 从个人中心点「管理中心」按钮：前端用 window.open 新开标签页 */
    async openFromUserCenter() {
        await gotoWebsitePage(this.page, '/user/', 'admin');
        const button = this.page.getByRole('button', { name: '管理中心' });
        await button.waitFor({ state: 'visible' });
        return waitForWebsitePopupUrl(
            this.page.context(),
            async () => {
                await button.click();
            },
            /\/manageCenter/,
        );
    }

    async clickSideMenu(label: '坐席分配' | '成员信息') {
        const item = label === '坐席分配' ? this.seatMenuItem : this.memberMenuItem;
        await item.click();
    }

    async isSideMenuVisible() {
        return this.sideMenu.isVisible();
    }
}
```

- [ ] **Step 2: 注册 fixture**

在 `lib/BaseTest.ts` 的 import 区追加：

```ts
import { ManageCenterPage } from '@pages/manageCenter/ManageCenterPage';
```

**BaseTest.ts 插入规则（Task 4 / 6 / 10 同样适用）**：`makeAxeBuilder` 是类型定义和 fixture 实现的**最后一项，且其实现后没有尾逗号**。所有新 fixture 一律插在 `makeAxeBuilder` **之前**，不要追加到末尾，否则语法错误。另注意 `testInfo: TestInfo` 只在类型里声明、没有对应实现，属现状，勿动。

在 fixture 类型定义中，`makeAxeBuilder: AxeBuilder;` 之前插入：

```ts
    manageCenterPage: ManageCenterPage;
```

在 fixture 实现中，`makeAxeBuilder: async ({ page }, use) => {` 之前插入：

```ts
    manageCenterPage: async ({ page }, use) => {
        await use(new ManageCenterPage(page));
    },
```

- [ ] **Step 3: Verify**

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
pnpm exec tsc --noEmit
pnpm exec eslint pageFactory/pageRepository/manageCenter/ManageCenterPage.ts lib/BaseTest.ts
```

预期：均无错误输出。

- [ ] **Step 4: Stage changes**

```powershell
git add etcert-e2e/pageFactory/pageRepository/manageCenter/ManageCenterPage.ts etcert-e2e/lib/BaseTest.ts
```

---

## Task 3: MF-MC-001 管理中心入口与布局

**Files:**
- Create: `tests/main-flow/manage-center/mf-manage-center.spec.ts`

**Interfaces:**
- Consumes: fixture `manageCenterPage`、`tcWebsiteAdminAuthConfig()`
- Produces: 用例 `MF-MC-001 管理中心入口与布局`

**验收标准：** 个人中心点「管理中心」能新开标签并落到 `/manageCenter`；侧栏含「坐席分配」「成员信息」两项；点侧栏可在两页间切换并命中对应 URL；进入报表分析页时侧栏隐藏。

- [ ] **Step 1: 创建 spec**

创建 `tests/main-flow/manage-center/mf-manage-center.spec.ts`：

```ts
import test from '@lib/BaseTest';
import { expect } from '@playwright/test';
import { tcWebsiteAdminAuthConfig } from '@lib/tcAuthConfig';

const auth = tcWebsiteAdminAuthConfig();

/**
 * 主流程 · 管理中心（原团队服务）
 * 对照：tests/MAIN-FLOW-MATRIX.md §3
 * 登录态：admin 账号经 Website OAuth（.auth/admin-website.json）
 */
test.describe('主流程 · 管理中心', () => {
    if (auth.ready && auth.storageState) {
        test.use({ storageState: auth.storageState });
    }

    test.beforeEach(async () => {
        test.skip(!auth.ready, auth.skipReason);
    });

    test('MF-MC-001 管理中心入口与布局', { tag: '@MainFlow' }, async ({ manageCenterPage }) => {
        test.setTimeout(180_000);

        const popup = await manageCenterPage.openFromUserCenter();
        expect(popup.url()).toContain('/manageCenter');
        await popup.close();

        await manageCenterPage.goto('home');
        await expect(manageCenterPage.headerTitle).toBeVisible();
        await expect(manageCenterPage.trainingNav).toBeVisible();
        await expect(manageCenterPage.reportNav).toBeVisible();
        await expect(manageCenterPage.sideMenu).toBeVisible();
        await expect(manageCenterPage.seatMenuItem).toBeVisible();
        await expect(manageCenterPage.memberMenuItem).toBeVisible();
        await expect(manageCenterPage.page).toHaveURL(/\/manageCenter\/seat/);

        await manageCenterPage.clickSideMenu('成员信息');
        await expect(manageCenterPage.page).toHaveURL(/\/manageCenter\/member/);

        await manageCenterPage.clickSideMenu('坐席分配');
        await expect(manageCenterPage.page).toHaveURL(/\/manageCenter\/seat/);

        await manageCenterPage.goto('report');
        await expect(manageCenterPage.layout).toBeVisible();
        await expect(manageCenterPage.sideMenu).toBeHidden();
    });
});
```

- [ ] **Step 2: Verify**

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
pnpm exec cross-env ENV=tcTest SKIP_TC_AUTH_SETUP=1 playwright test --project=TC-MainFlow --grep "MF-MC-001" --workers=1
```

预期：`1 passed`。若 admin 登录态过期，去掉 `SKIP_TC_AUTH_SETUP=1` 重跑一次。

- [ ] **Step 3: Stage changes**

```powershell
git add etcert-e2e/tests/main-flow/manage-center/mf-manage-center.spec.ts
```

---

## Task 4: 成员信息 Page Object

**Files:**
- Create: `pageFactory/pageRepository/manageCenter/ManageCenterMemberPage.ts`
- Modify: `lib/BaseTest.ts`（import + fixture 类型 + fixture 实现）

**Interfaces:**
- Consumes: `lib/manageCenterNavigate.ts`
- Produces: `ManageCenterMemberPage` 类；fixture `manageCenterMemberPage`

- [ ] **Step 1: 创建 POM**

创建 `pageFactory/pageRepository/manageCenter/ManageCenterMemberPage.ts`：

```ts
import { Page, Locator } from '@playwright/test';
import { gotoManageCenterPage } from '@lib/manageCenterNavigate';

/**
 * 管理中心 · 成员信息 Page Object
 * 对应路由：/manageCenter/member/
 * 对应前端：website/src/pages/manageCenter/member/components/MemberInfo.vue
 */
export class ManageCenterMemberPage {
    readonly page: Page;
    readonly container: Locator;
    readonly search: Locator;
    readonly resetBtn: Locator;
    readonly addMemberBtn: Locator;
    readonly batchRemoveBtn: Locator;
    readonly table: Locator;
    readonly tableRows: Locator;
    readonly addSingleItem: Locator;
    readonly addBatchItem: Locator;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.member-info');
        this.search = page.locator('.member-search');
        this.resetBtn = page.getByRole('button', { name: '重置' });
        this.addMemberBtn = page.getByRole('button', { name: /添加成员/ });
        this.batchRemoveBtn = page.getByRole('button', { name: '批量移除' });
        this.table = page.locator('.member-info-table');
        this.tableRows = this.table.locator('.el-table__body-wrapper tbody tr');
        // el-dropdown-item 的 role 随 EP 版本变化，用稳定的 EP class + 文本过滤
        this.addSingleItem = page.locator('.el-dropdown-menu__item').filter({ hasText: '单个添加' });
        this.addBatchItem = page.locator('.el-dropdown-menu__item').filter({ hasText: '批量添加' });
    }

    async goto() {
        await gotoManageCenterPage(this.page, 'member');
        await this.container.waitFor({ state: 'visible' });
        await this.table.waitFor({ state: 'visible' });
    }

    async rowCount() {
        return this.tableRows.count();
    }

    /** hover 展开「添加成员」下拉 */
    async openAddMemberDropdown() {
        await this.addMemberBtn.hover();
        await this.addSingleItem.waitFor({ state: 'visible' });
    }

    /** 搜索联系方式（手机号/邮箱），返回命中行数 */
    async searchByKeyword(keyword: string) {
        const input = this.search.locator('input').first();
        await input.fill(keyword);
        await input.press('Enter');
        await this.page.waitForTimeout(1_000);
        return this.rowCount();
    }
}
```

- [ ] **Step 2: 注册 fixture**

在 `lib/BaseTest.ts` import 区追加：

```ts
import { ManageCenterMemberPage } from '@pages/manageCenter/ManageCenterMemberPage';
```

fixture 类型追加：

```ts
    manageCenterMemberPage: ManageCenterMemberPage;
```

fixture 实现追加：

```ts
    manageCenterMemberPage: async ({ page }, use) => {
        await use(new ManageCenterMemberPage(page));
    },
```

- [ ] **Step 3: Verify**

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
pnpm exec tsc --noEmit
pnpm exec eslint pageFactory/pageRepository/manageCenter/ManageCenterMemberPage.ts lib/BaseTest.ts
```

预期：无错误输出。

- [ ] **Step 4: Stage changes**

```powershell
git add etcert-e2e/pageFactory/pageRepository/manageCenter/ManageCenterMemberPage.ts etcert-e2e/lib/BaseTest.ts
```

---

## Task 5: MF-MC-002 成员信息列表与添加入口

**Files:**
- Modify: `tests/main-flow/manage-center/mf-manage-center.spec.ts`（在 MF-MC-001 之后追加用例）

**Interfaces:**
- Consumes: fixture `manageCenterMemberPage`
- Produces: 用例 `MF-MC-002 成员信息列表与添加入口`

**验收标准：** 成员信息页表格可见；「添加成员」下拉能展开且含「单个添加」「批量添加」；未勾选点「批量移除」弹出「请选择要移除的成员」提示；成员数为 0 时 skip 并说明需先添加成员。

- [ ] **Step 1: 追加用例**

在 `mf-manage-center.spec.ts` 的 `MF-MC-001` 用例之后插入：

```ts
    test('MF-MC-002 成员信息列表与添加入口', { tag: '@MainFlow' }, async ({ manageCenterMemberPage }) => {
        test.setTimeout(120_000);

        await manageCenterMemberPage.goto();
        await expect(manageCenterMemberPage.container).toBeVisible();
        await expect(manageCenterMemberPage.search).toBeVisible();

        const total = await manageCenterMemberPage.rowCount();
        test.skip(total === 0, '成员池为空，请先在管理中心「成员信息 → 添加成员」加入至少一名成员');

        await manageCenterMemberPage.openAddMemberDropdown();
        await expect(manageCenterMemberPage.addSingleItem).toBeVisible();
        await expect(manageCenterMemberPage.addBatchItem).toBeVisible();
        await manageCenterMemberPage.page.keyboard.press('Escape');

        await manageCenterMemberPage.batchRemoveBtn.click();
        await expect(manageCenterMemberPage.page.getByText('请选择要移除的成员')).toBeVisible();
    });
```

- [ ] **Step 2: Verify**

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
pnpm exec cross-env ENV=tcTest SKIP_TC_AUTH_SETUP=1 playwright test --project=TC-MainFlow --grep "MF-MC-002" --workers=1
```

预期：`1 passed`（或 `1 skipped` 并提示成员池为空）。

- [ ] **Step 3: Stage changes**

```powershell
git add etcert-e2e/tests/main-flow/manage-center/mf-manage-center.spec.ts
```

---

## Task 6: 坐席分配与名额管理 Page Object

**Files:**
- Create: `pageFactory/pageRepository/manageCenter/ManageCenterSeatPage.ts`
- Create: `pageFactory/pageRepository/manageCenter/ManageCenterSeatsManagePage.ts`
- Modify: `lib/BaseTest.ts`（import + fixture 类型 + fixture 实现）

**Interfaces:**
- Consumes: `lib/manageCenterNavigate.ts`、`lib/websiteDialog.ts`
- Produces: `ManageCenterSeatPage`、`ManageCenterSeatsManagePage`；fixture `manageCenterSeatPage`、`manageCenterSeatsManagePage`

- [ ] **Step 1: 创建坐席分配 POM**

创建 `pageFactory/pageRepository/manageCenter/ManageCenterSeatPage.ts`：

```ts
import { Page, Locator } from '@playwright/test';
import { gotoManageCenterPage } from '@lib/manageCenterNavigate';

/**
 * 管理中心 · 坐席分配 Page Object
 * 对应路由：/manageCenter/seat/
 * 对应前端：website/src/pages/manageCenter/seat/components/TeamServicePanel.vue
 */
export class ManageCenterSeatPage {
    readonly page: Page;
    readonly container: Locator;
    readonly panel: Locator;
    readonly emptyGuide: Locator;
    readonly collapses: Locator;
    readonly seatManageBtns: Locator;
    readonly quotaCells: Locator;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.seat-allocation');
        this.panel = page.locator('.team-service-panel');
        this.emptyGuide = page.locator('.team-service-panel-empty');
        this.collapses = page.locator('.el-collapse-item');
        this.seatManageBtns = page.getByRole('button', { name: '名额管理' });
        this.quotaCells = page.locator('.el-table__body-wrapper tbody tr td').filter({ hasText: /^\s*\d+\/\d+\s*$/ });
    }

    async goto() {
        await gotoManageCenterPage(this.page, 'seat');
        await this.container.waitFor({ state: 'visible' });
        await this.panel.waitFor({ state: 'visible' });
    }

    async isEmptyState() {
        return this.emptyGuide.isVisible();
    }

    async seatManageCount() {
        return this.seatManageBtns.count();
    }

    /** 读第一行「已分配名额/总名额」，返回 [已分配, 总数] */
    async readFirstQuota(): Promise<[number, number]> {
        const text = (await this.quotaCells.first().innerText()).trim();
        const [allocated, total] = text.split('/').map((part) => Number(part.trim()));
        return [allocated, total];
    }

    async openFirstSeatManage() {
        await this.seatManageBtns.first().click();
        await this.page.waitForURL(/\/manageCenter\/seat\/manage/, { timeout: 60_000 });
    }
}
```

- [ ] **Step 2: 创建名额管理 POM**

创建 `pageFactory/pageRepository/manageCenter/ManageCenterSeatsManagePage.ts`：

```ts
import { Page, Locator } from '@playwright/test';

/**
 * 管理中心 · 名额管理 Page Object
 * 对应路由：/manageCenter/seat/manage?teamId=xxx
 * 对应前端：website/src/pages/manageCenter/seat/manage/components/ManageCenterSeatsManage.vue
 */
export class ManageCenterSeatsManagePage {
    readonly page: Page;
    readonly container: Locator;
    readonly seatsHeader: Locator;
    readonly seatsManage: Locator;
    readonly selectMemberBtn: Locator;
    readonly assignMemberBtn: Locator;
    readonly batchImportBtn: Locator;
    readonly removeBtn: Locator;
    readonly selectDialog: Locator;
    readonly selectDialogAllTab: Locator;
    readonly selectDialogSelectedTab: Locator;
    readonly selectDialogTable: Locator;
    readonly selectDialogRows: Locator;
    readonly selectDialogNameSearch: Locator;
    readonly selectDialogConfirmBtn: Locator;
    readonly selectDialogCancelBtn: Locator;
    readonly seatsTableRows: Locator;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.manage-center-seat-manage');
        this.seatsHeader = page.locator('.seats-header');
        this.seatsManage = page.locator('.manage-center-seats-manage');
        this.selectMemberBtn = page.getByRole('button', { name: '选择成员' });
        this.assignMemberBtn = page.getByRole('button', { name: '分配成员' });
        this.batchImportBtn = page.getByRole('button', { name: '批量导入成员' });
        this.removeBtn = page.getByRole('button', { name: '移除' });
        this.selectDialog = page.locator('.select-member-dialog');
        this.selectDialogAllTab = this.selectDialog.getByRole('tab', { name: /全部成员/ });
        this.selectDialogSelectedTab = this.selectDialog.getByRole('tab', { name: /已选择/ });
        this.selectDialogTable = this.selectDialog.locator('.select-member-dialog-table').first();
        this.selectDialogRows = this.selectDialogTable.locator('.el-table__body-wrapper tbody tr');
        this.selectDialogNameSearch = this.selectDialog.getByPlaceholder('搜索姓名');
        this.selectDialogConfirmBtn = this.selectDialog.getByRole('button', { name: '确认' });
        this.selectDialogCancelBtn = this.selectDialog.getByRole('button', { name: '取消' });
        this.seatsTableRows = this.seatsManage.locator('.el-table__body-wrapper tbody tr');
    }

    async waitForLoad() {
        await this.container.waitFor({ state: 'visible' });
        await this.seatsHeader.waitFor({ state: 'visible' });
    }

    async isSelectMemberEnabled() {
        return this.selectMemberBtn.isEnabled();
    }

    async openSelectMemberDialog() {
        await this.selectMemberBtn.click();
        await this.selectDialog.waitFor({ state: 'visible' });
        await this.selectDialogTable.waitFor({ state: 'visible' });
    }

    /** 在「全部成员」表里按联系方式找行并勾选，返回是否命中 */
    async checkMemberByContact(contact: string): Promise<boolean> {
        const row = this.selectDialogRows.filter({ hasText: contact }).first();
        if ((await row.count()) === 0) {
            return false;
        }
        await row.locator('.el-checkbox').first().click();
        return true;
    }

    /** 提交分配：处理未激活成员二次确认，等成功提示 */
    async confirmAssign() {
        await this.selectDialogConfirmBtn.click();
        const inactiveConfirm = this.page.getByRole('button', { name: '确认添加' });
        if (await inactiveConfirm.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await inactiveConfirm.click();
        }
        await this.page.getByText('操作成功').waitFor({ state: 'visible', timeout: 30_000 });
        await this.selectDialog.waitFor({ state: 'hidden', timeout: 30_000 });
    }

    /**
     * 读头部「已分配 / 总名额」。
     * SeatsHeader.vue 实际文本：`{订单名} 共 N 名额 | 已分配：N | 待分配： N` + `开通时间：YYYY-MM-DD ...`
     * 必须按标签正则取，**不能**用「取最后两个数字」——开通时间的日期里也是数字。
     */
    async readHeaderQuota(): Promise<[number, number]> {
        const text = await this.seatsHeader.innerText();
        const total = Number(text.match(/共\s*(\d+)\s*名额/)?.[1] ?? 0);
        const allocated = Number(text.match(/已分配：\s*(\d+)/)?.[1] ?? 0);
        return [allocated, total];
    }

    async seatsRowCount() {
        return this.seatsTableRows.count();
    }
}
```

- [ ] **Step 3: 注册 fixture**

`lib/BaseTest.ts` import 区追加：

```ts
import { ManageCenterSeatPage } from '@pages/manageCenter/ManageCenterSeatPage';
import { ManageCenterSeatsManagePage } from '@pages/manageCenter/ManageCenterSeatsManagePage';
```

fixture 类型追加：

```ts
    manageCenterSeatPage: ManageCenterSeatPage;
    manageCenterSeatsManagePage: ManageCenterSeatsManagePage;
```

fixture 实现追加：

```ts
    manageCenterSeatPage: async ({ page }, use) => {
        await use(new ManageCenterSeatPage(page));
    },
    manageCenterSeatsManagePage: async ({ page }, use) => {
        await use(new ManageCenterSeatsManagePage(page));
    },
```

- [ ] **Step 4: Verify**

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
pnpm exec tsc --noEmit
pnpm exec eslint pageFactory/pageRepository/manageCenter lib/BaseTest.ts
```

预期：无错误输出。

- [ ] **Step 5: Stage changes**

```powershell
git add etcert-e2e/pageFactory/pageRepository/manageCenter etcert-e2e/lib/BaseTest.ts
```

---

## Task 7: MF-MC-003 选择成员分配闭环与名额扣减

**Files:**
- Modify: `tests/main-flow/manage-center/mf-manage-center.spec.ts`（在 MF-MC-002 之后追加）
- Create: `tests/main-flow/manage-center/assignTarget.ts`

**Interfaces:**
- Consumes: fixture `manageCenterSeatPage`、`manageCenterSeatsManagePage`；`lib/loadAccounts.ts` 的 `getAccount`
- Produces: 用例 `MF-MC-003 坐席分配闭环与名额扣减`；导出 `resolveAssignTargetContact()`

**验收标准：** 坐席分配页有团队；进名额管理后「选择成员」可用；弹窗内能按 `user` 账号联系方式勾选；提交后出现「操作成功」；头部已分配数比分配前多 1；名额表格行数增加。任一前置缺失（无团队 / 剩余名额为 0 / 成员池无该联系方式）时 skip 并写明原因。

- [ ] **Step 1: 创建分配目标解析工具**

创建 `tests/main-flow/manage-center/assignTarget.ts`：

```ts
import { getAccount } from '@lib/loadAccounts';

/**
 * 被分配学员固定复用 user 账号：分配后可直接用 .auth/user.json 验证学员端收权。
 * 返回用于在成员池表格里定位行的联系方式（手机号或邮箱）。
 */
export function resolveAssignTargetContact(): string {
    return getAccount('user').username;
}
```

- [ ] **Step 2: 追加用例**

在 `mf-manage-center.spec.ts` 顶部 import 区追加：

```ts
import { resolveAssignTargetContact } from './assignTarget';
```

在 `MF-MC-002` 之后插入：

```ts
    test('MF-MC-003 坐席分配闭环与名额扣减', { tag: '@MainFlow' }, async ({
        manageCenterSeatPage,
        manageCenterSeatsManagePage,
    }) => {
        test.setTimeout(240_000);

        await manageCenterSeatPage.goto();
        test.skip(await manageCenterSeatPage.isEmptyState(), 'admin 账号在管理中心无团队订阅数据');
        test.skip((await manageCenterSeatPage.seatManageCount()) === 0, '团队表格内无名额管理入口');

        await manageCenterSeatPage.openFirstSeatManage();
        await manageCenterSeatsManagePage.waitForLoad();

        const [allocatedBefore, total] = await manageCenterSeatsManagePage.readHeaderQuota();
        test.skip(total - allocatedBefore <= 0, `剩余可分配名额为 0（已分配 ${allocatedBefore}/${total}）`);
        test.skip(!(await manageCenterSeatsManagePage.isSelectMemberEnabled()), '「选择成员」按钮不可用');

        const rowsBefore = await manageCenterSeatsManagePage.seatsRowCount();

        await manageCenterSeatsManagePage.openSelectMemberDialog();
        await expect(manageCenterSeatsManagePage.selectDialogAllTab).toBeVisible();

        const contact = resolveAssignTargetContact();
        const matched = await manageCenterSeatsManagePage.checkMemberByContact(contact);
        if (!matched) {
            await manageCenterSeatsManagePage.selectDialogCancelBtn.click();
        }
        test.skip(!matched, `成员池中未找到 ${contact}，请先在「成员信息 → 添加成员」加入该账号`);

        await expect(manageCenterSeatsManagePage.selectDialogSelectedTab).toContainText('1/');
        await manageCenterSeatsManagePage.confirmAssign();

        await expect
            .poll(async () => (await manageCenterSeatsManagePage.readHeaderQuota())[0], { timeout: 30_000 })
            .toBe(allocatedBefore + 1);
        await expect
            .poll(async () => manageCenterSeatsManagePage.seatsRowCount(), { timeout: 30_000 })
            .toBeGreaterThan(rowsBefore);
    });
```

- [ ] **Step 3: Verify**

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
pnpm exec cross-env ENV=tcTest SKIP_TC_AUTH_SETUP=1 playwright test --project=TC-MainFlow --grep "MF-MC-003" --workers=1
```

预期：`1 passed`。若输出 skip，按 skip 文案补齐数据后重跑（该用例会真实占用一个名额）。

- [ ] **Step 4: Stage changes**

```powershell
git add etcert-e2e/tests/main-flow/manage-center
```

---

## Task 8: 跨账号第二浏览器上下文工具

**Files:**
- Create: `lib/websiteSecondContext.ts`

**Interfaces:**
- Consumes: `lib/tcAuthConfig.ts`、`lib/websiteNavigate.ts`
- Produces: `withLearnerContext(browser, fn)`

- [ ] **Step 1: 创建工具**

创建 `lib/websiteSecondContext.ts`：

```ts
import type { Browser, Page } from '@playwright/test';
import { tcAuthConfig } from './tcAuthConfig';
import { gotoWebsitePage } from './websiteNavigate';

/**
 * 在管理员用例内额外开一个学员上下文（复用 .auth/user.json），
 * 用于「管理员分配 → 学员端收权」的跨账号断言。
 */
export async function withLearnerContext<T>(
    browser: Browser,
    fn: (page: Page) => Promise<T>,
): Promise<T> {
    const learnerAuth = tcAuthConfig('user');
    if (!learnerAuth.ready || !learnerAuth.storageState) {
        throw new Error(`Learner context unavailable: ${learnerAuth.skipReason}`);
    }

    const context = await browser.newContext({
        storageState: learnerAuth.storageState,
        viewport: { width: 1500, height: 730 },
    });
    const page = await context.newPage();
    try {
        return await fn(page);
    } finally {
        await context.close();
    }
}

/** 学员上下文是否可用（供 test.skip 判断，不抛异常） */
export function isLearnerContextReady(): { ready: boolean; skipReason: string } {
    const learnerAuth = tcAuthConfig('user');
    return { ready: learnerAuth.ready, skipReason: learnerAuth.skipReason };
}

/** 学员端打开个人中心某个子页 */
export async function gotoLearnerPage(page: Page, route: string): Promise<void> {
    await gotoWebsitePage(page, route, 'user');
}
```

- [ ] **Step 2: Verify**

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
pnpm exec tsc --noEmit
pnpm exec eslint lib/websiteSecondContext.ts
```

预期：无错误输出。

- [ ] **Step 3: Stage changes**

```powershell
git add etcert-e2e/lib/websiteSecondContext.ts
```

---

## Task 9: MF-MC-004 学员端跨账号收权验证

**Files:**
- Modify: `tests/main-flow/manage-center/mf-manage-center.spec.ts`（在 MF-MC-003 之后追加）

**Interfaces:**
- Consumes: `lib/websiteSecondContext.ts`、fixture `manageCenterSeatPage`、`manageCenterSeatsManagePage`
- Produces: 用例 `MF-MC-004 学员端跨账号收权`

**验收标准：** 管理员端确认目标学员已出现在名额管理表格中；随后在第二上下文以学员身份打开「我的课程」和「我的考试」，两页均正常渲染且至少一页有非空记录。学员登录态不可用或管理员端未找到该学员时 skip。

- [ ] **Step 1: 追加用例**

在 `mf-manage-center.spec.ts` import 区追加：

```ts
import { gotoLearnerPage, isLearnerContextReady, withLearnerContext } from '@lib/websiteSecondContext';
```

在 `MF-MC-003` 之后插入：

```ts
    test('MF-MC-004 学员端跨账号收权', { tag: '@MainFlow' }, async ({
        browser,
        manageCenterSeatPage,
        manageCenterSeatsManagePage,
    }) => {
        test.setTimeout(240_000);

        const learner = isLearnerContextReady();
        test.skip(!learner.ready, learner.skipReason);

        await manageCenterSeatPage.goto();
        test.skip(await manageCenterSeatPage.isEmptyState(), 'admin 账号在管理中心无团队订阅数据');
        test.skip((await manageCenterSeatPage.seatManageCount()) === 0, '团队表格内无名额管理入口');

        await manageCenterSeatPage.openFirstSeatManage();
        await manageCenterSeatsManagePage.waitForLoad();

        const contact = resolveAssignTargetContact();
        const assignedRow = manageCenterSeatsManagePage.seatsTableRows.filter({ hasText: contact }).first();
        test.skip(
            (await assignedRow.count()) === 0,
            `名额管理表格内无 ${contact}，请先跑 MF-MC-003 完成分配`,
        );
        await expect(assignedRow).toBeVisible();

        await withLearnerContext(browser, async (learnerPage) => {
            await gotoLearnerPage(learnerPage, '/user/myCourse/');
            const courseRoot = learnerPage.locator('.user-layout, .my-course').first();
            await expect(courseRoot).toBeVisible({ timeout: 60_000 });
            const courseItems = await learnerPage.locator('.el-table__body-wrapper tbody tr, .course-card').count();

            await gotoLearnerPage(learnerPage, '/user/myExam/');
            const examRoot = learnerPage.locator('.user-layout, .my-exam').first();
            await expect(examRoot).toBeVisible({ timeout: 60_000 });
            const examItems = await learnerPage.locator('.el-table__body-wrapper tbody tr').count();

            expect(courseItems + examItems).toBeGreaterThan(0);
        });
    });
```

- [ ] **Step 2: Verify**

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
pnpm exec cross-env ENV=tcTest SKIP_TC_AUTH_SETUP=1 playwright test --project=TC-MainFlow --grep "MF-MC-004" --workers=1
```

预期：`1 passed`。若 `.user-layout` / `.my-course` / `.my-exam` 选择器未命中，先用 `--headed --debug` 定位学员页真实根节点类名并更新用例内选择器，再重跑。

- [ ] **Step 3: Stage changes**

```powershell
git add etcert-e2e/tests/main-flow/manage-center/mf-manage-center.spec.ts
```

---

## Task 10: 报表分析 Page Object

**Files:**
- Create: `pageFactory/pageRepository/manageCenter/ManageCenterReportPage.ts`
- Modify: `lib/BaseTest.ts`（import + fixture 类型 + fixture 实现）

**Interfaces:**
- Consumes: `lib/manageCenterNavigate.ts`
- Produces: `ManageCenterReportPage`；fixture `manageCenterReportPage`

- [ ] **Step 1: 创建 POM**

创建 `pageFactory/pageRepository/manageCenter/ManageCenterReportPage.ts`：

```ts
import { Page, Locator } from '@playwright/test';
import { gotoManageCenterPage } from '@lib/manageCenterNavigate';

/**
 * 管理中心 · 报表分析 Page Object
 * 对应路由：/manageCenter/report/
 * 对应前端：website/src/pages/manageCenter/report/components/ReportAnalysis.vue
 */
export class ManageCenterReportPage {
    readonly page: Page;
    readonly container: Locator;
    readonly analysis: Locator;
    readonly summary: Locator;
    readonly detailPanel: Locator;
    readonly detailTitle: Locator;
    readonly search: Locator;
    readonly resetBtn: Locator;
    readonly exportBtn: Locator;
    readonly table: Locator;
    readonly tableRows: Locator;
    readonly emptyText: Locator;
    readonly certFilterHeader: Locator;
    readonly statusFilterHeader: Locator;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.report-page');
        this.analysis = page.locator('.report-analysis');
        // CardSummary.vue 根 class 是 .card-summary；ReportAnalysis.vue 里的 :deep(.report-summary) 是失效残留
        this.summary = page.locator('.card-summary');
        this.detailPanel = page.locator('.report-analysis-panel');
        this.detailTitle = page.getByText('学习情况明细表', { exact: true });
        this.search = page.locator('.report-analysis-search');
        this.resetBtn = this.analysis.getByRole('button', { name: '重置' });
        this.exportBtn = this.analysis.getByRole('button', { name: '导出' });
        this.table = page.locator('.report-analysis-table');
        this.tableRows = this.table.locator('.el-table__body-wrapper tbody tr');
        this.emptyText = page.getByText('暂无相关学习数据');
        this.certFilterHeader = this.table.getByText('认证考试', { exact: true });
        this.statusFilterHeader = this.table.getByText('认证状态', { exact: true });
    }

    async goto() {
        await gotoManageCenterPage(this.page, 'report');
        await this.container.waitFor({ state: 'visible' });
        await this.analysis.waitFor({ state: 'visible' });
    }

    async rowCount() {
        return this.tableRows.count();
    }

    async isEmptyState() {
        return this.emptyText.isVisible();
    }

    /** 按姓名/联系方式搜索明细表 */
    async searchByKeyword(keyword: string) {
        const input = this.search.locator('input').first();
        await input.fill(keyword);
        await input.press('Enter');
        await this.page.waitForTimeout(1_000);
        return this.rowCount();
    }
}
```

- [ ] **Step 2: 注册 fixture**

`lib/BaseTest.ts` import 区追加：

```ts
import { ManageCenterReportPage } from '@pages/manageCenter/ManageCenterReportPage';
```

fixture 类型追加：

```ts
    manageCenterReportPage: ManageCenterReportPage;
```

fixture 实现追加：

```ts
    manageCenterReportPage: async ({ page }, use) => {
        await use(new ManageCenterReportPage(page));
    },
```

- [ ] **Step 3: Verify**

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
pnpm exec tsc --noEmit
pnpm exec eslint pageFactory/pageRepository/manageCenter/ManageCenterReportPage.ts lib/BaseTest.ts
```

预期：无错误输出。

- [ ] **Step 4: Stage changes**

```powershell
git add etcert-e2e/pageFactory/pageRepository/manageCenter/ManageCenterReportPage.ts etcert-e2e/lib/BaseTest.ts
```

---

## Task 11: MF-MC-005 报表分析统计与明细表

**Files:**
- Modify: `tests/main-flow/manage-center/mf-manage-center.spec.ts`（在 MF-MC-004 之后追加）

**Interfaces:**
- Consumes: fixture `manageCenterReportPage`
- Produces: 用例 `MF-MC-005 报表分析统计与明细表`

**验收标准：** 报表页统计卡区与「学习情况明细表」面板可见；表头含「认证考试」「认证状态」筛选；表格为有数据或空态二者之一（不能两者都不成立）；有数据时点「重置」后表格仍可见。

- [ ] **Step 1: 追加用例**

在 `mf-manage-center.spec.ts` 的 `MF-MC-004` 之后插入：

```ts
    test('MF-MC-005 报表分析统计与明细表', { tag: '@MainFlow' }, async ({ manageCenterReportPage }) => {
        test.setTimeout(150_000);

        await manageCenterReportPage.goto();
        await expect(manageCenterReportPage.summary).toBeVisible();
        await expect(manageCenterReportPage.detailPanel).toBeVisible();
        await expect(manageCenterReportPage.detailTitle).toBeVisible();
        await expect(manageCenterReportPage.certFilterHeader).toBeVisible();
        await expect(manageCenterReportPage.statusFilterHeader).toBeVisible();

        const rows = await manageCenterReportPage.rowCount();
        const isEmpty = await manageCenterReportPage.isEmptyState();
        expect(rows > 0 || isEmpty).toBeTruthy();

        test.skip(rows === 0, '团队暂无学习数据，明细表为空态');

        await manageCenterReportPage.resetBtn.click();
        await expect(manageCenterReportPage.table).toBeVisible();
        await expect.poll(async () => manageCenterReportPage.rowCount(), { timeout: 30_000 }).toBeGreaterThan(0);
    });
```

- [ ] **Step 2: Verify**

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
pnpm exec cross-env ENV=tcTest SKIP_TC_AUTH_SETUP=1 playwright test --project=TC-MainFlow --grep "MF-MC-005" --workers=1
```

预期：`1 passed`（或空态时 `1 skipped`）。

- [ ] **Step 3: Stage changes**

```powershell
git add etcert-e2e/tests/main-flow/manage-center/mf-manage-center.spec.ts
```

---

## Task 12: 旧团队服务用例与 Page Object 下架

**Files:**
- Delete: `tests/main-flow/team/mf-team.spec.ts`
- Delete: `pageFactory/pageRepository/MyTeamPage.ts`
- Delete: `pageFactory/pageRepository/SeatsManagePage.ts`
- Delete: `tests/tc-platform/team-management.spec.ts`
- Modify: `lib/BaseTest.ts`（移除 `myTeamPage`、`seatsManagePage` 的 import / 类型 / 实现）

**Interfaces:**
- Consumes: 无
- Produces: 无

**下架依据：** `/user/myTeam`、`/user/seatsMng` 已从个人中心侧栏与头像下拉全部移除，功能迁入管理中心；保留这些用例会造成「已有覆盖」的错觉。管理中心复用的 `SeatsHeader.vue` / `SeatsManage.vue` 是业务侧组件，不在本次删除范围。

- [ ] **Step 1: 删除旧 spec 与 POM**

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
git rm tests/main-flow/team/mf-team.spec.ts
git rm tests/tc-platform/team-management.spec.ts
git rm pageFactory/pageRepository/MyTeamPage.ts
git rm pageFactory/pageRepository/SeatsManagePage.ts
```

- [ ] **Step 2: 清理 fixture**

在 `lib/BaseTest.ts` 中删除以下三处内容：

- import：`import { MyTeamPage } from '@pages/MyTeamPage';` 与 `import { SeatsManagePage } from '@pages/SeatsManagePage';`
- fixture 类型：`myTeamPage: MyTeamPage;` 与 `seatsManagePage: SeatsManagePage;`
- fixture 实现：`myTeamPage: async ({ page }, use) => { await use(new MyTeamPage(page)); },` 与 `seatsManagePage: async ({ page }, use) => { await use(new SeatsManagePage(page)); },`

- [ ] **Step 3: 确认无残留引用**

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
pnpm exec eslint . 
pnpm exec tsc --noEmit
```

预期：`tsc` 无输出。若报 `Cannot find module '@pages/MyTeamPage'`，说明还有 spec 引用未清理，按报错文件继续删除引用。

- [ ] **Step 4: Stage changes**

```powershell
git add etcert-e2e/lib/BaseTest.ts
```

---

## Task 13: 文档同步与全量回归

**Files:**
- Modify: `tests/MAIN-FLOW-MATRIX.md`（§3 团队管理章节、按覆盖深度表、按模块表、统计基准、跑测命令表、变更记录）
- Modify: `tests/main-flow/README.md`（5 处）
- Modify: `tests/main-flow/RUNBOOK.md`（6 处）
- Modify: `tests/tc-platform/README.md`（TC-TEAM 下架后同步条数）
- Modify: `tests/testData/main-flow/prerequisites.md`
- Modify: `tests/COVERAGE-BACKLOG.md`

**Interfaces:**
- Consumes: 前 12 个 task 的产出
- Produces: 与代码一致的覆盖矩阵与运行说明

**验收标准：** 矩阵 §3 改为管理中心 5 条并给出覆盖深度；统计基准与实际用例数一致（主流程 `MF-*` = 20 − 3 + 5 = **22 条**，其中 2 条 `@Destructive`；`tc-platform` TC-* = 19 − 5 = **14 条**）；矩阵「按覆盖深度」与「按模块」两表口径互相自洽（✅11 / 🟡11 / ❌0 / 合计 22）；全仓不再出现 `MF-TEAM` / `TC-TEAM` / `myTeam` 字样（`git grep -n "MF-TEAM\|TC-TEAM"` 仅命中历史需求归档目录）；前置文档写明「被分配学员复用 user 账号，需先加入成员池」；RUNBOOK 与 README 收录 `test:main-flow:mc`；backlog 移除已完成的团队项、登记后续三个批次。

- [ ] **Step 1: 改写覆盖矩阵 §3**

将 `tests/MAIN-FLOW-MATRIX.md` 的「## 3. 团队管理」整节替换为：

```markdown
## 3. 管理中心（原团队服务）

> 入口：头像下拉「管理中心」新标签打开。`/user/myTeam`、`/user/seatsMng` 已从菜单移除，旧 MF-TEAM-001/002/003 已下架。

| # | 检查项 | MF 用例 | 覆盖 | 说明 |
|---|--------|---------|------|------|
| 3.1 | 管理中心入口与布局 | MF-MC-001 | ✅ | 新标签入口 + 侧栏切换 + 报表页无侧栏 |
| 3.2 | 成员信息列表与添加入口 | MF-MC-002 | ✅ | 表格 + 添加成员下拉 + 未选移除提示 |
| 3.3 | 坐席分配闭环与名额扣减 | MF-MC-003 | ✅ | 选择成员 → 确认分配 → 已分配 +1 |
| 3.4 | 学员端跨账号收权 | MF-MC-004 | ✅ | 第二上下文以学员身份验证权益入账 |
| 3.5 | 报表分析统计与明细表 | MF-MC-005 | 🟡 | 统计卡 + 明细表 + 筛选表头；无学习数据时空态 |

**模块小结**：5 项均已接线；MF-MC-003 会真实占用一个名额，MF-MC-004 依赖 MF-MC-003 先跑。
```

- [ ] **Step 2: 更新统计基准与汇总（5 处，勿漏）**

条数口径先算清：主流程 20 − 3（MF-TEAM）+ 5（MF-MC）= **22 条**，其中 `@Destructive` 2 条，非破坏性 **20 条**。
`tc-platform` 现存 `test('TC-` 共 **19 条**（access-control 4 + team-management 5 + cert-exam 5 + partner-cert 2 + ncre 1 + course-learning 2；矩阵原文写「20 条」本身已不准），删除 team-management.spec.ts 后为 **14 条**。

2a. 第 7 行统计基准改为：

```markdown
**统计基准（2026-08-28）**：主流程 `MF-*` 22 条（20 非破坏性 + 2 `@Destructive`）；`tc-platform` TC-* 14 条保留作扩展回归（原 19 条，下架 TC-TEAM-001~005）；Admin Seed 5 条。
```

2b. 第 22 行改为（原文写「20 项」，实际是非破坏性条数）：

```markdown
- `pnpm run test:main-flow`：主流程 20 项（不含 `@Destructive`）
```

条数不变但语义已对，确认该行仍为 20 即可，无需改动。

2c. 「### 按覆盖深度（MF 套件）」表（第 95~100 行）三行改为 —— 注意原表 ✅7+🟡9+❌2=18 与「按模块」表的 🟡11 本来就自相矛盾，本次一并修正为两表一致：

```markdown
| ✅ | 11 | 视频、认证列表/详情、管理中心入口/成员/分配/跨账号、NCRE、伙伴三项等 |
| 🟡 | 11 | 自测/进考/交卷/同步/报表/文档等 |
| ❌ | 0 | 无 |
```

2d. 「### 按模块」表：团队管理行（第 108 行）替换 + 合计行（第 111 行）替换：

```markdown
| 管理中心 | 5 | 4 | 1 | 0 |
```

```markdown
| **合计** | **22** | **11** | **11** | **0** |
```

2e. 「## 跑测命令」表第 121 行改为：

```markdown
| `pnpm run test:main-flow` | MF 20 条（非破坏性） |
```

并在该表 `test:main-flow:destructive` 行之后追加：

```markdown
| `pnpm run test:main-flow:mc` | 仅管理中心 MF-MC-001~005 |
```

2f. 「## 变更记录」表末尾追加：

```markdown
| 2026-08-28 | 团队管理换轨为管理中心 MF-MC-001~005；下架 MF-TEAM-001/002/003 与 TC-TEAM-001~005；修正两张汇总表口径不一致 |
```

- [ ] **Step 3: 更新前置文档**

在 `tests/testData/main-flow/prerequisites.md` 末尾追加：

```markdown
## 管理中心（MF-MC-001 ~ 005）

| 前置 | 说明 |
|------|------|
| admin C 端登录态 | `.auth/admin-website.json`，由 global-setup 生成 |
| 团队订单与可分配名额 | admin 账号在「坐席分配」页须有非空团队且剩余名额 > 0 |
| 被分配学员 | 复用 `accounts.local.json` 的 `user` 账号；须先在「成员信息 → 添加成员 → 单个添加」加入成员池 |
| 执行顺序 | MF-MC-003 先跑完成分配，MF-MC-004 才能断言学员端收权 |
| 副作用 | MF-MC-003 每次成功都会真实占用一个名额，名额耗尽后该用例转为 skip |
```

- [ ] **Step 4: 更新 `tests/main-flow/README.md`（5 处）**

该文件的用例清单是**四列表格**，不是无序列表，替换时保持列数。

4a. 第 24 行表格行替换：

```markdown
| `manage-center/` | 管理中心 | `mf-manage-center.spec.ts` | 5 |
```

4b. 第 28 行改为：

```markdown
**合计 22 条**（`@MainFlow`）；其中 **2 条** 另标 `@Destructive`（MF-CERT-005/006）。
```

4c. 第 42 行注释改为 `# 2. 主流程（非破坏性，20 条）`。

4d. 第 108 行「与 tc-platform 的关系」表里 `产品验收清单 20 项` 改为 `产品验收清单 22 项`。

4e. 「## 当前 skip 项（预期）」表中删除 `MF-TEAM-001` / `MF-TEAM-003` 两行，追加：

```markdown
| MF-MC-003 | admin 无可分配团队 / 名额已耗尽 |
| MF-MC-004 | 依赖 MF-MC-003 成功分配；`.auth/user.json` 缺失时 skip |
| MF-MC-005 | 团队暂无学习数据时只断言空态 |
```

- [ ] **Step 5: 更新 `tests/main-flow/RUNBOOK.md`（6 处）**

5a. 第 3 行 `产品「主要功能流程」20 项验收` → `22 项验收`。

5b. 「## 一、跑什么」表（第 10~15 行）是**四列** `套件 | 条数 | 命令 | 说明`。把前两行的条数 18 → 20，并追加一行：

```markdown
| 仅管理中心 | 5 | `test:main-flow:mc` | MF-MC-001~005，需 admin 有团队名额 |
```

5c. 第 45 行账号表 `admin` 行的用途 `Seed 造数；团队 MF-TEAM-*（Website 登录态）` → `Seed 造数；管理中心 MF-MC-*（Website 登录态）`。

5d. 第 88 行 `# ② 主流程 18 条` → `# ② 主流程 20 条`。

5e. 「## 七、20 条用例一览」标题改为「## 七、22 条用例一览」，表中团队行替换为：

```markdown
| 管理中心 | MF-MC-001~005 | 入口布局 / 成员 / 分配闭环 / 跨账号收权 / 报表 |
```

并把末行路径 `tests/main-flow/{course|cert|team|ncre|partner}/mf-*.spec.ts` 的 `team` 改为 `manage-center`。

5f. 「### 常见 skip（预期）」表中删除 `MF-TEAM-001 / 003`、`MF-TEAM-002` 两行，追加 Step 4e 的三行 MF-MC skip 说明。

- [ ] **Step 6: 更新 `tests/tc-platform/README.md`**

删除 team-management.spec.ts 后此文档必须同步，否则 TC 条数与实际不符：

- 用例清单中移除 `team-management.spec.ts` 及 TC-TEAM-001~005 全部条目
- 条数统计由 19 改为 14（Smoke / Regression 分项按移除的 1 Smoke + 4 Regression 相应减少）
- 若有「团队服务」章节，替换为一句指向说明：团队服务已迁至管理中心，覆盖见 `tests/main-flow/manage-center/`

先通读该文件确认实际结构再改，不要照搬行号。

- [ ] **Step 7: 更新 backlog**

在 `tests/COVERAGE-BACKLOG.md` 的「## P0」表中删除「团队」那一行（若其中含 TC-TEAM-004/005 待办，一并删除，这两条已随 spec 下架）；在「## P1 — 主流程缺口（新用例）」表末尾追加三行：

```markdown
| 课程视频 | 真实起播断言 / 倍速 / 全屏 / 连播选节 / 60s 试看拦截 | 会员课 + 无会员账号 |
| 认证考试 | 及格发证闭环 / 不及格补考闭环 | 考试次数可重置 |
| 认证前置 | 方向绑定 → 须知 → 进考向导（实名 + 照片）合并链路 | 已实名 user |
```

- [ ] **Step 8: 全量回归**

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
pnpm exec cross-env ENV=tcTest SKIP_TC_AUTH_SETUP=1 playwright test --project=TC-MainFlow --grep @MainFlow --grep-invert @Destructive --workers=1
```

预期：合计 20 条非破坏性用例，`0 failed`；skip 项须能在 `prerequisites.md` 里找到对应说明。

再跑一次 tc-platform 确认删除没有连带破坏：

```powershell
pnpm exec cross-env ENV=tcTest SKIP_TC_AUTH_SETUP=1 playwright test --project=TC-Platform --grep-invert @Destructive
```

预期：收集到 14 条 TC-*，无 `Cannot find module` 类错误。

- [ ] **Step 9: Stage changes**

```powershell
git add etcert-e2e/tests/MAIN-FLOW-MATRIX.md etcert-e2e/tests/main-flow/README.md etcert-e2e/tests/main-flow/RUNBOOK.md etcert-e2e/tests/tc-platform/README.md etcert-e2e/tests/testData/main-flow/prerequisites.md etcert-e2e/tests/COVERAGE-BACKLOG.md
```

---

## 风险与应对

| 风险 | 应对 |
|------|------|
| MF-MC-003 每跑一次占用一个名额，名额有限 | 用例读取剩余名额，为 0 时 skip；名额耗尽后需在管理中心手动移除成员释放席位 |
| MF-MC-004 依赖 MF-MC-003 的执行结果 | `--workers=1` 串行执行，用例内先断言目标学员已在表格中，否则 skip 并提示先跑 003 |
| 学员端「我的课程/我的考试」根节点类名未经验证 | Task 9 的 Verify 步骤要求选择器不命中时用 `--headed --debug` 定位后更新 |
| 名额数字从页面文本正则提取，格式变化会失效 | 坐席分配页另有 `{已分配}/{总数}` 单元格可交叉校验；断言用 `expect.poll` 容忍异步刷新 |
| 报表接口无数据导致 MF-MC-005 长期 skip | 用例仍断言页面骨架与筛选表头，只在明细行断言处 skip |
| `.manage-center-layout` 在 layout 与 page 组件上重名嵌套，严格模式必报 `resolved to 2 elements` | 已在「页面结构」与 POM 代码中统一改用内层独有的 `.manage-center-layout-page` |
| `SeatsHeader` 文本尾部含「开通时间」日期，按位置取数字会取错 | `readHeaderQuota()` 改为按 `共 (\d+) 名额` / `已分配：(\d+)` 标签正则提取 |
| Element Plus 内部 DOM（下拉项 role、表格结构）随版本变化 | 一律优先 EP 稳定 class（`.el-dropdown-menu__item`、`.el-table__body-wrapper`）+ 文本过滤，不依赖 ARIA role |
| 学员端与报表内部若干 class 仍属未验证推断 | 各 Task 的 Verify 步骤强制 `--headed` 实跑确认；命中失败时先用 DevTools 校正选择器再改 POM，禁止直接放宽断言 |
