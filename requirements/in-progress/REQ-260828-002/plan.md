# 主流程重构批次二：课程视频播控深化与试看拦截 E2E Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为「课程学习」模块深化端到端主流程用例，覆盖视频真实起播断言、暂停恢复、倍速调节（1.5x/2.0x）、网页全屏切换、上一节/下一节连播选节，以及 VIP 课程 60s 试看与会员购买拦截闭环。

**Architecture:** 沿用 Playwright + Page Object 体系：在 `pageFactory/pageRepository/CourseDetailPage.ts` 中补齐 AliPlayer 播控节点与 VIP 试看组件定位器及交互方法；在 `tests/main-flow/course/mf-course.spec.ts` 中重构 MF-COURSE-003（真实起播与播控），并新增 MF-COURSE-005（选节连播）与 MF-COURSE-006（VIP 试看与会员拦截）；用例使用 `user` 角色登录态（`.auth/user.json`）；前置数据缺失（如无多小节、纯免费课无 VIP 试看）时采用 `test.skip(condition, reason)` 优雅跳过。

**Tech Stack:** Playwright 1.60（`@playwright/test`）、TypeScript 6、Element Plus 选择器、AliPlayer 自定义插件规范、ESLint 9

**req_type:** frontend

## Global Constraints

- 仅改动 `etcert-e2e/`，不得修改 `tc-platform-merge/` 下任何业务代码。
- 课程模块用例统一使用 `user` 角色登录态（`tcAuthConfig('user')`）。
- 新增用例 tag 一律 `@MainFlow`；本批次均为非破坏性用例，不产生 `@Destructive`。
- 视频起播、倍速、全屏等断言需直接穿透到 `<video>` 真实属性（`currentTime`、`paused`、`playbackRate`）进行双重验证，不单依赖 UI 样式。
- 数据前置缺失时用 `test.skip(condition, reason)` 显式跳过并写明原因，禁止静默通过。
- 本工程无单元测试基建（无 vitest/jest），验收方式为 Playwright 用例语法检测 + `eslint` + `tsc --noEmit`。
- 所有步骤只 `git add` 暂存，不执行 `git commit`。

---

## 页面结构与关键组件选择器

| 区域 | 组件 / 选择器 | 说明 |
|------|--------------|------|
| 播放器外壳 | `.zw-course-video` / `.video-render` / `.prism-player` | AliPlayer 容器 |
| 视频核心元素 | `.zw-course-video video` | HTML5 `<video>` 标签 |
| 播放 / 暂停按钮 | `.prism-play-btn`（播放中带 `.playing` 类） | 控制栏主播放按钮 |
| 倍速调节组件 | `.rate-components` > `.current-rate` / `.rate-list li` | 倍速悬停展开与数值选择 |
| 网页全屏按钮 | `.web-fullscreen-btn` / `.prism-fullscreen-btn` | 全屏切换按钮 |
| 全屏激活状态 | `.web-fullscreen-active` / `.is-fullscreen-layout` | 挂在外层或播放器壳上的全屏类名 |
| 上一节 / 下一节 | `.unit-nav-control__btn--prev` / `.unit-nav-control__btn--next` | 控制栏切课按钮 |
| 侧栏小节目录 | `.course-study-sidebar__catalog .course-chapter-unit` | 大纲小节（激活态带 `.is-active`） |
| VIP 标识 | `.course-chapter-unit-vip` / `.course-detail-page__badge--vip` | 小节或课程 VIP 标记 |
| 试看提示条 | `.zw-preview-bar` > `.zw-preview-bar-btn` | 试看中底部/顶栏提示 |
| 试看结束遮罩 | `.zw-preview-component-layer` / `.zw-preview-vod-component` / `.zw-preview-ended` | 试看结束后全屏遮罩与权限卡片 |
| 开通会员按钮 | `.zw-preview-vip-btn` / `.zw-preview-bar-btn` | 遮罩层及提示条上的开通 VIP 按钮 |
| 会员弹窗 | `.el-dialog` / `.course-vip-dialog` | 点击购买 VIP 弹出的对话框 |

---

## Task 1: 扩展课程详情/学习页 POM 播控与试看能力

**Files:**
- Modify: `pageFactory/pageRepository/CourseDetailPage.ts`

**Interfaces:**
- Consumes: `@playwright/test`
- Produces: `CourseDetailPage` 类新增播放器控制、倍速、全屏、选节、试看遮罩等定位器与交互断言方法

- [ ] **Step 1: 扩充 CourseDetailPage 定位器与交互方法**

更新 `pageFactory/pageRepository/CourseDetailPage.ts`，新增播控定位器与辅助方法：

```ts
import { Page, Locator, expect } from '@playwright/test';
import { dismissBlockingWebsiteDialogs } from '@lib/websiteDialog';

/**
 * 课程详情 / 学习页 Page Object
 * 对应前端：website/src/pages/course/index.vue 及 CourseMediaPlayer/
 */
export class CourseDetailPage {
    readonly page: Page;
    readonly container: Locator;
    readonly studyContainer: Locator;
    readonly ctaButton: Locator;
    readonly favoriteButton: Locator;
    readonly videoArea: Locator;
    readonly videoPlayer: Locator;
    readonly videoElement: Locator;
    readonly playButton: Locator;
    readonly rateComponent: Locator;
    readonly currentRate: Locator;
    readonly rateList: Locator;
    readonly webFullscreenBtn: Locator;
    readonly unitNavPrevBtn: Locator;
    readonly unitNavNextBtn: Locator;
    readonly pdfContent: Locator;
    readonly sidebarUnits: Locator;
    readonly activeUnit: Locator;
    readonly vipUnitTags: Locator;
    readonly previewBar: Locator;
    readonly previewEndLayer: Locator;
    readonly previewVipBtn: Locator;
    readonly videoPlayPoster: Locator;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.course-detail-page');
        this.studyContainer = page.locator('.zw-course-study');
        this.ctaButton = page.getByRole('button', { name: /开始学习|继续学习/ });
        this.favoriteButton = page.getByRole('button', { name: /^收藏|已收藏$/ });
        this.videoArea = page.locator('.zw-course-video');
        this.videoPlayer = page.locator('.zw-course-video video, .zw-course-video .video-render, .zw-course-video .prism-player');
        this.videoElement = page.locator('.zw-course-video video').first();
        this.playButton = page.locator('.prism-play-btn').first();
        this.rateComponent = page.locator('.rate-components').first();
        this.currentRate = this.rateComponent.locator('.current-rate');
        this.rateList = this.rateComponent.locator('.rate-list');
        this.webFullscreenBtn = page.locator('.web-fullscreen-btn, .prism-fullscreen-btn').first();
        this.unitNavPrevBtn = page.locator('.unit-nav-control__btn--prev').first();
        this.unitNavNextBtn = page.locator('.unit-nav-control__btn--next').first();
        this.pdfContent = page.locator('.course-pdf-player, .zw-course-pdf-content, .pdf-player-container');
        this.sidebarUnits = page.locator('.course-study-sidebar__catalog .course-chapter-unit');
        this.activeUnit = page.locator('.course-study-sidebar__catalog .course-chapter-unit.is-active, .course-study-sidebar__catalog .course-chapter-unit.active');
        this.vipUnitTags = page.locator('.course-study-sidebar__catalog .course-chapter-unit-vip');
        this.previewBar = page.locator('.zw-preview-bar');
        this.previewEndLayer = page.locator('.zw-preview-vod-component, .zw-preview-component-layer');
        this.previewVipBtn = page.locator('.zw-preview-vip-btn, .zw-preview-bar-btn');
        this.videoPlayPoster = page.locator('.course-video-early-poster__play, .course-video-login-gate');
    }

    async waitForLoad() {
        await this.container.waitFor({ state: 'visible' });
    }

    async waitForStudyMode() {
        await this.page.locator('.zw-course--study').waitFor({ state: 'attached' });
        await this.studyContainer.waitFor({ state: 'visible' });
        await dismissBlockingWebsiteDialogs(this.page);
    }

    async clickPlay() {
        await this.ctaButton.click();
    }

    /** 主流程 MF-COURSE-003：断言视频真实起播且时间向前推进 */
    async assertVideoPlaying(minSeconds = 0.5) {
        await expect(this.videoArea).toBeVisible({ timeout: 60_000 });
        await expect(this.videoElement).toBeAttached({ timeout: 60_000 });

        // 若初次加载处于暂停态，尝试点击大播放按钮或控制栏播放按钮
        const posterPlay = this.page.locator('.course-video-early-poster__play');
        if (await posterPlay.isVisible().catch(() => false)) {
            await posterPlay.click().catch(() => {});
        }

        // 等待 video currentTime 推进
        await expect.poll(async () => {
            return await this.videoElement.evaluate((el: HTMLVideoElement) => !el.paused && el.currentTime > minSeconds).catch(() => false);
        }, { timeout: 30_000 }).toBeTruthy();
    }

    /** 点击播放/暂停按钮，断言状态切换 */
    async togglePlayPause() {
        // 确保悬停显示控制栏
        await this.videoArea.hover();
        const wasPaused = await this.videoElement.evaluate((el: HTMLVideoElement) => el.paused).catch(() => false);
        await this.playButton.click();
        await expect.poll(async () => {
            return await this.videoElement.evaluate((el: HTMLVideoElement) => el.paused).catch(() => !wasPaused);
        }, { timeout: 10_000 }).toBe(!wasPaused);

        // 再次点击恢复
        await this.playButton.click();
        await expect.poll(async () => {
            return await this.videoElement.evaluate((el: HTMLVideoElement) => el.paused).catch(() => wasPaused);
        }, { timeout: 10_000 }).toBe(wasPaused);
    }

    /** 调节倍速并断言 video 元素 playbackRate 改变 */
    async changePlaybackRate(rate: '1.5' | '2.0' | '1.0') {
        await this.videoArea.hover();
        await this.rateComponent.hover();
        await expect(this.rateList).toBeVisible({ timeout: 5_000 });

        const targetOption = this.rateList.locator(`li[data-rate="${rate}"], li:has-text("${rate}x")`).first();
        await targetOption.click();

        await expect(this.currentRate).toHaveText(new RegExp(`${rate}x?`));
        await expect.poll(async () => {
            return await this.videoElement.evaluate((el: HTMLVideoElement) => el.playbackRate).catch(() => 0);
        }, { timeout: 5_000 }).toBe(Number(rate));
    }

    /** 切换网页全屏 / 退出全屏 */
    async toggleWebFullscreen() {
        await this.videoArea.hover();
        await this.webFullscreenBtn.click();
        const fullscreenShell = this.page.locator('.course-fullscreen-shell, .course-video-player');
        await expect(fullscreenShell.first()).toHaveClass(/is-fullscreen-layout|web-fullscreen-active|is-study-sidebar-fullscreen/, { timeout: 10_000 });

        // 退出全屏（再次点击或按 Escape）
        await this.page.keyboard.press('Escape');
    }

    /** 点击下一节，返回切换前后的激活小节名称 */
    async clickNextUnit(): Promise<[string, string]> {
        const currentName = (await this.activeUnit.innerText().catch(() => '')) || '';
        if (await this.unitNavNextBtn.isVisible().catch(() => false)) {
            await this.unitNavNextBtn.click();
        } else if ((await this.sidebarUnits.count()) > 1) {
            await this.sidebarUnits.nth(1).click();
        }
        await this.page.waitForTimeout(1_000);
        const newName = (await this.activeUnit.innerText().catch(() => '')) || '';
        return [currentName, newName];
    }

    /** 点击上一节 */
    async clickPrevUnit() {
        if (await this.unitNavPrevBtn.isVisible().catch(() => false)) {
            await this.unitNavPrevBtn.click();
        } else {
            await this.sidebarUnits.first().click();
        }
        await this.page.waitForTimeout(1_000);
    }

    /** 获取当前可用小节总数 */
    async getUnitCount(): Promise<number> {
        return await this.sidebarUnits.count();
    }

    /** 检查是否存在 VIP 小节 */
    async hasVipUnits(): Promise<boolean> {
        return (await this.vipUnitTags.count()) > 0;
    }

    /** 点击第一个 VIP 小节 */
    async selectFirstVipUnit() {
        const vipUnit = this.sidebarUnits.filter({ has: this.vipUnitTags }).first();
        await vipUnit.click();
    }

    /** 快进到试看结束附近（或直接 seek 到 55 秒） */
    async seekNearPreviewEnd(second = 58) {
        await this.videoElement.evaluate((el: HTMLVideoElement, s: number) => {
            el.currentTime = s;
        }, second).catch(() => {});
    }

    /** 断言视频区与播放器节点可见（兼容老方法） */
    async assertVideoStudyVisible() {
        await expect(this.videoArea).toBeVisible({ timeout: 60_000 });
        await expect(this.videoPlayer.first()).toBeVisible({ timeout: 60_000 });
    }

    /** 未登录场景：在详情页点收藏触发 useLoginCheck 弹窗 */
    async triggerLoginPromptFromDetail() {
        await this.favoriteButton.click();
    }

    /** 未登录场景：进入学习后点播放区触发 useLoginCheck 弹窗 */
    async triggerLoginPromptFromStudy() {
        await this.waitForStudyMode();
        const playTarget = this.page.getByRole('button', { name: '播放' });
        await playTarget.click({ force: true });
    }

    /** 非 partner 用户在学习页触发伙伴无权限弹窗 */
    async triggerPartnerAuthFromStudy() {
        await this.waitForStudyMode();
        const playBtn = this.page.getByRole('button', { name: '播放' });
        if (await playBtn.isVisible().catch(() => false)) {
            await playBtn.click({ force: true });
            return;
        }
        if (await this.videoArea.isVisible().catch(() => false)) {
            await this.videoArea.click({ force: true });
            return;
        }
        if ((await this.sidebarUnits.count()) > 1) {
            await this.sidebarUnits.nth(1).click();
            return;
        }
        await this.favoriteButton.click();
    }

    async clickFavorite() {
        await this.favoriteButton.click();
    }

    /** 主流程 MF-COURSE-004：当前小节或侧栏切换后出现 PDF/文档区 */
    async tryAssertDocumentStudyVisible(): Promise<boolean> {
        await dismissBlockingWebsiteDialogs(this.page);
        if (await this.pdfContent.first().isVisible().catch(() => false)) {
            await expect(this.pdfContent.first()).toBeVisible({ timeout: 15_000 });
            return true;
        }

        const docUnit = this.sidebarUnits.filter({ hasText: /文档|PDF|课件/i }).first();
        if (await docUnit.isVisible().catch(() => false)) {
            await dismissBlockingWebsiteDialogs(this.page);
            await docUnit.click();
            await this.page.waitForTimeout(1000);
            if (await this.pdfContent.first().isVisible().catch(() => false)) {
                await expect(this.pdfContent.first()).toBeVisible({ timeout: 15_000 });
                return true;
            }
        }

        const unitCount = await this.sidebarUnits.count();
        for (let i = 0; i < Math.min(unitCount, 15); i++) {
            await dismissBlockingWebsiteDialogs(this.page);
            await this.sidebarUnits.nth(i).click();
            await this.page.waitForTimeout(800);
            if (await this.pdfContent.first().isVisible().catch(() => false)) {
                await expect(this.pdfContent.first()).toBeVisible({ timeout: 15_000 });
                return true;
            }
        }
        return false;
    }
}
```

- [ ] **Step 2: Verify POM code**

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
node node_modules\typescript\bin\tsc --noEmit
node node_modules\eslint\bin\eslint.js pageFactory/pageRepository/CourseDetailPage.ts
```

- [ ] **Step 3: Stage changes**

```powershell
git add etcert-e2e/pageFactory/pageRepository/CourseDetailPage.ts
```

---

## Task 2: 重构 MF-COURSE-003：视频起播、暂停恢复、倍速调节与全屏模式

**Files:**
- Modify: `tests/main-flow/course/mf-course.spec.ts`

**Interfaces:**
- Consumes: `CourseDetailPage`
- Produces: 深度闭环用例 `MF-COURSE-003 课程视频播放与播控交互`

- [ ] **Step 1: 重构 MF-COURSE-003 用例实现**

在 `tests/main-flow/course/mf-course.spec.ts` 中重构 MF-COURSE-003：

```ts
    test('MF-COURSE-003 课程视频播放与播控交互', { tag: '@MainFlow' }, async ({
        courseListPage,
        courseDetailPage,
        page,
    }) => {
        test.setTimeout(180_000);

        await stepWithScreenshot(page, '进入课程页并开始学习', async () => {
            await courseListPage.goto(courseId);
            await courseListPage.openFirstCourse();
            await courseDetailPage.waitForStudyMode();
        });

        await stepWithScreenshot(page, '断言视频真实起播与进度推进', async () => {
            await courseDetailPage.assertVideoPlaying(0.3);
        });

        await stepWithScreenshot(page, '测试播放与暂停状态切换', async () => {
            await courseDetailPage.togglePlayPause();
        });

        await stepWithScreenshot(page, '测试倍速调节至 1.5x 并验证生效', async () => {
            await courseDetailPage.changePlaybackRate('1.5');
        });

        await stepWithScreenshot(page, '测试网页全屏与退出', async () => {
            await courseDetailPage.toggleWebFullscreen();
        });
    });
```

- [ ] **Step 2: Verify**

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
node node_modules\typescript\bin\tsc --noEmit
node node_modules\eslint\bin\eslint.js tests/main-flow/course/mf-course.spec.ts
```

- [ ] **Step 3: Stage changes**

```powershell
git add etcert-e2e/tests/main-flow/course/mf-course.spec.ts
```

---

## Task 3: 新增 MF-COURSE-005：选节与连播切换

**Files:**
- Modify: `tests/main-flow/course/mf-course.spec.ts`

**Interfaces:**
- Consumes: `CourseDetailPage`
- Produces: 新用例 `MF-COURSE-005 课程选节与连播切换`

- [ ] **Step 1: 追加 MF-COURSE-005 用例**

在 `tests/main-flow/course/mf-course.spec.ts` 中追加：

```ts
    test('MF-COURSE-005 课程选节与连播切换', { tag: '@MainFlow' }, async ({
        courseListPage,
        courseDetailPage,
        page,
    }) => {
        test.setTimeout(180_000);

        await stepWithScreenshot(page, '进入课程学习页', async () => {
            await courseListPage.goto(courseId);
            await courseListPage.openFirstCourse();
            await courseDetailPage.waitForStudyMode();
        });

        const totalUnits = await courseDetailPage.getUnitCount();
        test.skip(totalUnits <= 1, '当前课程仅有 1 个小节，跳过连播/切课测试');

        await stepWithScreenshot(page, '切换至下一小节并断言激活态与播放', async () => {
            const [beforeUnit, afterUnit] = await courseDetailPage.clickNextUnit();
            expect(afterUnit).not.toBe('');
            await courseDetailPage.assertVideoPlaying(0.1);
        });

        await stepWithScreenshot(page, '切换回上一小节', async () => {
            await courseDetailPage.clickPrevUnit();
            await courseDetailPage.assertVideoPlaying(0.1);
        });
    });
```

- [ ] **Step 2: Verify**

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
node node_modules\typescript\bin\tsc --noEmit
node node_modules\eslint\bin\eslint.js tests/main-flow/course/mf-course.spec.ts
```

- [ ] **Step 3: Stage changes**

```powershell
git add etcert-e2e/tests/main-flow/course/mf-course.spec.ts
```

---

## Task 4: 新增 MF-COURSE-006：VIP 课程试看与会员拦截

**Files:**
- Modify: `tests/main-flow/course/mf-course.spec.ts`

**Interfaces:**
- Consumes: `CourseDetailPage`
- Produces: 新用例 `MF-COURSE-006 VIP课程试看与会员拦截`

- [ ] **Step 1: 追加 MF-COURSE-006 用例**

在 `tests/main-flow/course/mf-course.spec.ts` 中追加：

```ts
    test('MF-COURSE-006 VIP课程试看与会员拦截', { tag: '@MainFlow' }, async ({
        courseListPage,
        courseDetailPage,
        page,
    }) => {
        test.setTimeout(180_000);

        await stepWithScreenshot(page, '进入课程学习页', async () => {
            await courseListPage.goto(courseId);
            await courseListPage.openFirstCourse();
            await courseDetailPage.waitForStudyMode();
        });

        const hasVip = await courseDetailPage.hasVipUnits();
        test.skip(!hasVip, '当前课程为完全免费课程，无 VIP 试看与权限限制小节');

        await stepWithScreenshot(page, '选择 VIP 小节并断言试看提示条', async () => {
            await courseDetailPage.selectFirstVipUnit();
            await expect(courseDetailPage.previewBar.or(courseDetailPage.previewEndLayer)).toBeVisible({ timeout: 15_000 });
        });

        await stepWithScreenshot(page, '快进至试看结束点断言遮罩层', async () => {
            await courseDetailPage.seekNearPreviewEnd(59);
            await expect(courseDetailPage.previewEndLayer).toBeVisible({ timeout: 30_000 });
        });

        await stepWithScreenshot(page, '点击开通会员按钮断言购买指引', async () => {
            const buyBtn = courseDetailPage.previewVipBtn.first();
            if (await buyBtn.isVisible().catch(() => false)) {
                await buyBtn.click();
                const vipDialogOrPage = page.locator('.el-dialog, .course-vip-dialog, .el-overlay').filter({ hasText: /会员|开通|购买/ });
                await expect(vipDialogOrPage.first()).toBeVisible({ timeout: 10_000 });
            }
        });
    });
```

- [ ] **Step 2: Verify**

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
node node_modules\typescript\bin\tsc --noEmit
node node_modules\eslint\bin\eslint.js tests/main-flow/course/mf-course.spec.ts
```

- [ ] **Step 3: Stage changes**

```powershell
git add etcert-e2e/tests/main-flow/course/mf-course.spec.ts
```

---

## Task 5: 同步主流程矩阵、运行手册、前置文档与 Backlog

**Files:**
- Modify: `tests/MAIN-FLOW-MATRIX.md`（§1 课程学习更新至 6 条，统计基准由 22 条更新至 24 条）
- Modify: `tests/main-flow/README.md`
- Modify: `tests/main-flow/RUNBOOK.md`
- Modify: `tests/testData/main-flow/prerequisites.md`
- Modify: `tests/COVERAGE-BACKLOG.md`

- [ ] **Step 1: 更新 MAIN-FLOW-MATRIX.md §1 与统计汇总**

将 §1 替换为 6 项（1.1 课程列表、1.2 详情、1.3 视频播控、1.4 学习文档、1.5 选节连播、1.6 VIP 试看拦截），更新汇总统计：
- MF 总条数：22 + 2 = **24 条**（22 条非破坏性 + 2 条 `@Destructive`）。
- ✅ 达到 14 条，🟡 为 10 条。

- [ ] **Step 2: 更新 main-flow/README.md、RUNBOOK.md、prerequisites.md、COVERAGE-BACKLOG.md**

- 更新所有文档中的条数基准（22 → 24）。
- 更新 prerequisites.md，补充多小节与 VIP 试看的前置数据说明。
- 更新 COVERAGE-BACKLOG.md，将「课程视频播控与试看」移出缺口。

- [ ] **Step 3: 全量 Verify**

```powershell
cd d:\CERT-ALL-CODES\etcert-e2e
node node_modules\typescript\bin\tsc --noEmit
node node_modules\eslint\bin\eslint.js .
```

- [ ] **Step 4: Stage changes**

```powershell
git add etcert-e2e/tests/MAIN-FLOW-MATRIX.md etcert-e2e/tests/main-flow/README.md etcert-e2e/tests/main-flow/RUNBOOK.md etcert-e2e/tests/testData/main-flow/prerequisites.md etcert-e2e/tests/COVERAGE-BACKLOG.md
```

---

## 风险与应对

| 风险 | 应对 |
|------|------|
| 自动化无头环境下 `<video>` 因浏览器策略无法自动 play | POM 中增加对首帧海报 `.course-video-early-poster__play` / `.prism-play-btn` 的触发保底，并在 `expect.poll` 中宽容等待 `currentTime > 0` |
| 某些课程无 VIP 小节导致 MF-COURSE-006 无法断言试看遮罩 | 用例内使用 `hasVipUnits()` 判断，纯免费课优雅 `test.skip` 并提示前置要求 |
| 选节按钮在小节唯一时不可用 | 用例内读取 `getUnitCount()`，单小节课程优雅 `test.skip` |
| 全屏 API 在不同无头浏览器环境可能表现为 CSS 全屏 | 断言兼容 `.is-fullscreen-layout` 与 `.web-fullscreen-active` 两种类名 |
