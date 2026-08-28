import { Page, Locator, expect } from '@playwright/test';
import { dismissBlockingWebsiteDialogs } from '@lib/websiteDialog';

/**
 * 课程详情 / 学习页 Page Object
 * 对应前端：website/src/pages/course/index.vue
 */
export class CourseDetailPage {
    readonly page: Page;
    readonly container: Locator;
    readonly studyContainer: Locator;
    readonly ctaButton: Locator;
    readonly favoriteButton: Locator;
    readonly videoArea: Locator;
    readonly videoPlayer: Locator;
    readonly pdfContent: Locator;
    readonly sidebarUnits: Locator;

    readonly videoPlayPoster: Locator;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.course-detail-page');
        this.studyContainer = page.locator('.zw-course-study');
        this.ctaButton = page.getByRole('button', { name: /开始学习|继续学习/ });
        this.favoriteButton = page.getByRole('button', { name: /^收藏|已收藏$/ });
        this.videoArea = page.locator('.zw-course-video');
        this.videoPlayer = page.locator('.zw-course-video video, .zw-course-video .video-render, .zw-course-video .prism-player');
        this.videoPlayPoster = page.locator('.course-video-early-poster__play, .course-video-login-gate');
        this.pdfContent = page.locator('.course-pdf-player, .zw-course-pdf-content, .pdf-player-container');
        this.sidebarUnits = page.locator('.course-study-sidebar__catalog .course-chapter-unit');
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
