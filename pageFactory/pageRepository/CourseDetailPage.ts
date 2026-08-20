import { Page, Locator } from '@playwright/test';

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

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.course-detail-page');
        this.studyContainer = page.locator('.zw-course-study');
        this.ctaButton = page.getByRole('button', { name: /开始学习|继续学习/ });
        this.favoriteButton = page.locator('.course-detail-page__favorite');
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
}
