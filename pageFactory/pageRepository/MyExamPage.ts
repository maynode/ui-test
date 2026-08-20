import { Page, Locator } from '@playwright/test';

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
        await this.page.goto('/user/myExam');
        await this.container.waitFor({ state: 'visible' });
    }

    async hasExamRecords() {
        return this.examTable.isVisible();
    }
}
