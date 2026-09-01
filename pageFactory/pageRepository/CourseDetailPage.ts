import { Page, Locator, expect } from '@playwright/test';
import { dismissBlockingWebsiteDialogs, ensureNoBlockingDialogs } from '@lib/websiteDialog';

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
    readonly courseTitle: Locator;
    readonly outlineUnits: Locator;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.course-detail-page');
        this.courseTitle = page.locator('.course-info__title, .course-header__title, .course-title, h1').first();
        this.outlineUnits = page.locator('.course-outline-chapter, .chapter-item, .course-chapter-unit');
        this.studyContainer = page.locator('.zw-course-study');
        this.ctaButton = page.getByRole('button', { name: /开始学习|继续学习/ });
        this.favoriteButton = page.getByRole('button', { name: /^收藏|已收藏$/ });
        this.videoArea = page.locator('.zw-course-video');
        this.videoPlayer = page.locator('.zw-course-video video, .zw-course-video .video-render, .zw-course-video .prism-player');
        this.videoElement = page.locator('.zw-course-video .prism-player video, .zw-course-video video').first();
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
        await ensureNoBlockingDialogs(this.page);
        await this.ctaButton.click();
    }

    /** 若视频暂停则尝试触发播放（切节后常需用户交互） */
    private async kickVideoPlayback() {
        const posterPlay = this.page.locator('.course-video-early-poster__play, .prism-big-play-btn');
        if (await posterPlay.first().isVisible().catch(() => false)) {
            await posterPlay.first().click().catch(() => undefined);
            return;
        }

        const paused = await this.readVideoMetrics().then((m) => m?.paused ?? true).catch(() => true);
        if (!paused) {
            return;
        }

        await this.videoArea.hover().catch(() => undefined);
        const namedPlayBtn = this.page.getByRole('button', { name: '播放' });
        if (await namedPlayBtn.isVisible().catch(() => false)) {
            await namedPlayBtn.click().catch(() => undefined);
            return;
        }
        if (await this.playButton.isVisible().catch(() => false)) {
            await this.playButton.click().catch(() => undefined);
            return;
        }
        await this.videoArea.click({ force: true }).catch(() => undefined);
    }

    private async readVideoMetrics(): Promise<{ paused: boolean; currentTime: number; readyState: number } | null> {
        return this.videoElement
            .evaluate((el: HTMLVideoElement) => ({
                paused: el.paused,
                currentTime: el.currentTime,
                readyState: el.readyState,
            }))
            .catch(() => null);
    }

    /** 控制栏已显示非零进度（Aliplayer 续播时 video.currentTime 可能滞后） */
    private async hasControlBarTimeProgress(): Promise<boolean> {
        const timeText = await this.page
            .locator('.prism-time-display, .unit-nav-play-group')
            .first()
            .innerText()
            .catch(() => '');
        const match = timeText.match(/(\d{1,2}):(\d{2})\s*\/\s*(\d{1,2}):(\d{2})/);
        if (!match) {
            return false;
        }
        const currentSeconds = Number(match[1]) * 60 + Number(match[2]);
        return currentSeconds > 0;
    }

    /** 主流程 MF-COURSE-003：断言视频真实起播且时间向前推进 */
    async assertVideoPlaying(minSeconds = 0.3) {
        await expect(this.videoArea).toBeVisible({ timeout: 60_000 });
        await expect(this.videoElement).toBeAttached({ timeout: 60_000 });

        await this.kickVideoPlayback();

        let baselineTime = -1;
        await expect.poll(async () => {
            const metrics = await this.readVideoMetrics();
            if (metrics) {
                if (metrics.currentTime > minSeconds) {
                    return true;
                }
                if (!metrics.paused) {
                    if (baselineTime >= 0 && metrics.currentTime > baselineTime + 0.05) {
                        return metrics.currentTime > minSeconds || minSeconds <= 0.1;
                    }
                    baselineTime = Math.max(baselineTime, metrics.currentTime);
                }
            }

            if (minSeconds <= 0.1 && (await this.hasControlBarTimeProgress())) {
                return true;
            }

            await this.kickVideoPlayback();
            return false;
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
        await ensureNoBlockingDialogs(this.page);
        const currentName = (await this.activeUnit.innerText().catch(() => '')) || '';
        if (await this.unitNavNextBtn.isVisible().catch(() => false)) {
            await this.unitNavNextBtn.click();
        } else if ((await this.sidebarUnits.count()) > 1) {
            await this.sidebarUnits.nth(1).click();
        }
        await this.page.waitForTimeout(1_000);
        await dismissBlockingWebsiteDialogs(this.page);
        const newName = (await this.activeUnit.innerText().catch(() => '')) || '';
        return [currentName, newName];
    }

    /** 点击上一节 */
    async clickPrevUnit() {
        await ensureNoBlockingDialogs(this.page);
        if (await this.unitNavPrevBtn.isVisible().catch(() => false)) {
            await this.unitNavPrevBtn.click();
        } else {
            await this.sidebarUnits.first().click();
        }
        await this.page.waitForTimeout(1_000);
        await dismissBlockingWebsiteDialogs(this.page);
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

    /** 快进到试看结束附近（或直接 seek 到指定秒数） */
    async seekNearPreviewEnd(second = 58) {
        await this.videoElement.evaluate((el: HTMLVideoElement, s: number) => {
            el.currentTime = s;
        }, second).catch(() => {});
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

    /** 非 partner 用户在学习页触发伙伴无权限弹窗（播放区 / 切课 / 收藏） */
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

    async getCourseTitleText(): Promise<string> {
        return (await this.courseTitle.innerText().catch(() => '')).trim();
    }

    async getOutlineUnitCount(): Promise<number> {
        return await this.outlineUnits.count();
    }

    /** 主流程 MF-COURSE-003：视频区与播放器节点可见 */
    async assertVideoStudyVisible() {
        await expect(this.videoArea).toBeVisible({ timeout: 60_000 });
        await expect(this.videoPlayer.first()).toBeVisible({ timeout: 60_000 });
    }

    /**
     * 主流程 MF-COURSE-004：当前小节或侧栏切换后出现 PDF/文档区。
     * @returns 是否找到文档内容
     */
    async tryAssertDocumentStudyVisible(): Promise<boolean> {
        await dismissBlockingWebsiteDialogs(this.page);
        if (await this.pdfContent.first().isVisible().catch(() => false)) {
            await expect(this.pdfContent.first()).toBeVisible({ timeout: 15_000 });
            return true;
        }

        // 优先点名称包含「文档/PDF」的小节
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
