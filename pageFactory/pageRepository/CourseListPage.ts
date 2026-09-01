import { Page, Locator } from '@playwright/test';
import { gotoWebsitePage, gotoWebsitePageWithoutLogin } from '@lib/websiteNavigate';
import { ensureNoBlockingDialogs } from '@lib/websiteDialog';

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
        this.favoriteButton = page.getByRole('button', { name: /^收藏|已收藏$/ });
    }

    private courseRoute(courseId?: string) {
        return courseId ? `/course?courseId=${courseId}` : '/course';
    }

    /** 导航到课程页（无 courseId 时使用平台默认课程）；会先登录并确保处于详情页模式 */
    async goto(courseId?: string) {
        await gotoWebsitePage(this.page, this.courseRoute(courseId));
        await this.ensureDetailMode();
    }

    async ensureDetailMode() {
        const backBtn = this.page.getByRole('button', { name: '返回课程详情' });
        try {
            await Promise.race([
                this.container.waitFor({ state: 'visible', timeout: 8000 }),
                backBtn.waitFor({ state: 'visible', timeout: 8000 }),
            ]);
        } catch {
            // ignore
        }

        if (await backBtn.isVisible().catch(() => false)) {
            await ensureNoBlockingDialogs(this.page);
            await backBtn.click();
        }
        await this.container.waitFor({ state: 'visible', timeout: 15_000 });
        await ensureNoBlockingDialogs(this.page);
    }

    /** 未登录场景直进课程页（如 TC-AUTH-002），不触发 OAuth */
    async gotoWithoutLogin(courseId?: string) {
        await gotoWebsitePageWithoutLogin(this.page, this.courseRoute(courseId));
        await this.container.waitFor({ state: 'visible' });
    }

    async getCourseCount() {
        const visible = await this.container.isVisible();
        return visible ? 1 : 0;
    }

    async openFirstCourse() {
        await ensureNoBlockingDialogs(this.page);
        await this.ctaButton.click();
    }
}
