import { Page, Locator } from '@playwright/test';

/**
 * 课程入口页 Page Object
 * 对应路由：/course?courseId=xxx
 * 对应前端：website/src/pages/course/index.vue → CourseDetail/index.vue
 */
export class CourseListPage {
    readonly page: Page;
    readonly container: Locator;
    readonly ctaButton: Locator;
    readonly favoriteButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.course-detail-page');
        this.ctaButton = page.getByRole('button', { name: /开始学习|继续学习/ });
        this.favoriteButton = page.locator('.course-detail-page__favorite');
    }

    /** 导航到课程页（无 courseId 时使用平台默认课程） */
    async goto(courseId?: string) {
        const url = courseId ? `/course?courseId=${courseId}` : '/course';
        await this.page.goto(url);
        await this.container.waitFor({ state: 'visible' });
    }

    async getCourseCount() {
        const visible = await this.container.isVisible();
        return visible ? 1 : 0;
    }

    async openFirstCourse() {
        await this.ctaButton.click();
    }
}
