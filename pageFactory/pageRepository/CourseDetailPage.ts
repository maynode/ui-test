import { Page, Locator, expect } from '@playwright/test';

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

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.course-detail-page');
        this.studyContainer = page.locator('.zw-course-study');
        this.ctaButton = page.getByRole('button', { name: /开始学习|继续学习/ });
        this.favoriteButton = page.locator('.course-detail-page__favorite');
        this.videoArea = page.locator('.zw-course-video');
        this.videoPlayer = page.locator('.zw-course-video video, .zw-course-video .video-render, .zw-course-video .prism-player');
        this.pdfContent = page.locator('.zw-course-pdf-content');
        this.sidebarUnits = page.locator('.course-study-sidebar__catalog .course-chapter-unit');
    }

    async waitForLoad() {
        await this.container.waitFor({ state: 'visible' });
    }

    async waitForStudyMode() {
        await this.page.locator('.zw-course--study').waitFor({ state: 'attached' });
        await this.studyContainer.waitFor({ state: 'visible' });
    }

    async clickPlay() {
        await this.ctaButton.click();
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
        if (await this.pdfContent.isVisible().catch(() => false)) {
            await expect(this.pdfContent).toBeVisible();
            return true;
        }

        const unitCount = await this.sidebarUnits.count();
        for (let i = 0; i < Math.min(unitCount, 8); i++) {
            await this.sidebarUnits.nth(i).click();
            await this.page.waitForTimeout(800);
            if (await this.pdfContent.isVisible().catch(() => false)) {
                await expect(this.pdfContent).toBeVisible();
                return true;
            }
        }
        return false;
    }
}
