import { Page, Locator } from '@playwright/test';
import { gotoWebsitePage } from '@lib/websiteNavigate';

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

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.my-exam');
        this.examTable = page.locator('.my-exam .el-table');
        this.emptyText = page.getByText('暂无考试信息');
    }

    async goto() {
        await gotoWebsitePage(this.page, '/user/myExam');
        await this.container.waitFor({ state: 'visible' });
    }

    async hasExamRecords() {
        return this.examTable.isVisible();
    }

    async getExamRowCount(): Promise<number> {
        if (!(await this.hasExamRecords())) return 0;
        return await this.page.locator('.my-exam .el-table__body-wrapper tbody tr').count();
    }

    /**
     * 读取第一条考试记录详情 [科目名, 考试状态, 分数]
     */
    async readFirstExamRecord(): Promise<{ name: string; status: string; score: string }> {
        const rows = this.page.locator('.my-exam .el-table__body-wrapper tbody tr');
        const firstRow = rows.first();
        const name = (await firstRow.locator('.exam-name-column, td:nth-child(1)').innerText()).trim();
        const status = (await firstRow.locator('td:nth-child(3)').innerText()).trim();
        const score = (await firstRow.locator('td:nth-child(4)').innerText()).trim();
        return { name, status, score };
    }
}
