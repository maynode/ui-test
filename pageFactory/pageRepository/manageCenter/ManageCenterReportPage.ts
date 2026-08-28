import { Page, Locator } from '@playwright/test';
import { gotoManageCenterPage } from '@lib/manageCenterNavigate';

/**
 * 管理中心 · 报表分析 Page Object
 * 对应路由：/manageCenter/report/
 * 对应前端：website/src/pages/manageCenter/report/components/ReportAnalysis.vue
 */
export class ManageCenterReportPage {
    readonly page: Page;
    readonly container: Locator;
    readonly analysis: Locator;
    readonly summary: Locator;
    readonly detailPanel: Locator;
    readonly detailTitle: Locator;
    readonly search: Locator;
    readonly resetBtn: Locator;
    readonly exportBtn: Locator;
    readonly table: Locator;
    readonly tableRows: Locator;
    readonly emptyText: Locator;
    readonly certFilterHeader: Locator;
    readonly statusFilterHeader: Locator;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.report-page');
        this.analysis = page.locator('.report-analysis');
        // CardSummary.vue 根 class 是 .card-summary；ReportAnalysis.vue 里的 :deep(.report-summary) 是失效残留
        this.summary = page.locator('.card-summary');
        this.detailPanel = page.locator('.report-analysis-panel');
        this.detailTitle = page.getByText('学习情况明细表', { exact: true });
        this.search = page.locator('.report-analysis-search');
        this.resetBtn = this.analysis.getByRole('button', { name: '重置' });
        this.exportBtn = this.analysis.getByRole('button', { name: '导出' });
        this.table = page.locator('.report-analysis-table');
        this.tableRows = this.table.locator('.el-table__body-wrapper tbody tr');
        this.emptyText = page.getByText('暂无相关学习数据');
        this.certFilterHeader = this.table.getByText('认证考试', { exact: true });
        this.statusFilterHeader = this.table.getByText('认证状态', { exact: true });
    }

    async goto() {
        await gotoManageCenterPage(this.page, 'report');
        await this.container.waitFor({ state: 'visible' });
        await this.analysis.waitFor({ state: 'visible' });
    }

    async rowCount() {
        return this.tableRows.count();
    }

    async isEmptyState() {
        return this.emptyText.isVisible();
    }

    /** 读取报表汇总卡片项总数 */
    async getSummaryCardsCount(): Promise<number> {
        return await this.summary.locator('.card-item, .summary-item, .el-card').count();
    }

    /** 按姓名/联系方式搜索明细表 */
    async searchByKeyword(keyword: string) {
        const input = this.search.locator('input').first();
        await input.fill(keyword);
        await input.press('Enter');
        await this.page.waitForTimeout(1_000);
        return this.rowCount();
    }
}
