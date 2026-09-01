import { Page, Locator, expect } from '@playwright/test';
import { gotoWebsitePage } from '@lib/websiteNavigate';
import { dismissBlockingWebsiteDialogs } from '@lib/websiteDialog';

/**
 * 我的考试页 Page Object
 * 对应路由：/user/myExam
 * 对应前端：website/src/pages/user/myExam/components/MyExam.vue
 */
export class MyExamPage {
    readonly page: Page;
    readonly container: Locator;
    readonly examTable: Locator;
    readonly emptyText: Locator;
    readonly examChildRows: Locator;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.my-exam');
        this.examTable = page.locator('.my-exam .el-table');
        this.emptyText = page.getByText('暂无考试信息');
        this.examChildRows = page.locator('.my-exam .el-table__body-wrapper tbody tr.el-table__row--level-1');
    }

    async goto() {
        await gotoWebsitePage(this.page, '/user/myExam');
        await this.container.waitFor({ state: 'visible' });
        await dismissBlockingWebsiteDialogs(this.page);
        await this.waitForListReady();
    }

    /** 等待 UserSuspense 加载完成：表格或空态二选一 */
    async waitForListReady() {
        await expect
            .poll(
                async () => {
                    if (await this.emptyText.isVisible().catch(() => false)) return 'empty';
                    if (await this.examTable.isVisible().catch(() => false)) return 'table';
                    const loading = await this.container.getByText('加载中', { exact: true }).isVisible().catch(() => false);
                    return loading ? 'loading' : 'pending';
                },
                { timeout: 30_000, intervals: [300, 500, 1000] },
            )
            .not.toBe('loading');

        await expect
            .poll(
                async () => (await this.emptyText.isVisible().catch(() => false)) || (await this.examTable.isVisible().catch(() => false)),
                { timeout: 30_000, intervals: [300, 500, 1000] },
            )
            .toBe(true);
    }

    async hasExamRecords() {
        await this.waitForListReady();
        return this.examTable.isVisible();
    }

    async getExamRowCount(): Promise<number> {
        if (!(await this.hasExamRecords())) return 0;
        return await this.examChildRows.count();
    }

    /**
     * 读取第一条子行考试记录（树表父行为认证包，子行为具体考试）
     */
    async readFirstExamRecord(): Promise<{ name: string; status: string; score: string }> {
        await this.waitForListReady();
        const firstChild = this.examChildRows.first();
        await expect(firstChild).toBeVisible({ timeout: 15_000 });
        const name = (await firstChild.locator('.exam-child-slot__label, td.exam-name-column').first().innerText()).trim();
        const status = (await firstChild.locator('td:nth-child(3)').innerText()).trim();
        const score = (await firstChild.locator('td:nth-child(4)').innerText()).trim();
        return { name, status, score };
    }
}
