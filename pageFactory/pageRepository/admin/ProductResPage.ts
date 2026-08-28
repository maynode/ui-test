import { Page, expect } from '@playwright/test';
import {
    ADMIN_ROUTES,
    gotoAdminHashPage,
} from './adminNavigate';
import {
    isExamCertResourceName,
    isExamProductRowText,
    resolveSeedCertQuery,
    resolveSeedProductSearchQueries,
} from '@lib/seedConfig';
import { readFirstRowCell } from './adminUi';

export class ProductResPage {
    constructor(private page: Page) {}

    dialog() {
        return this.page.getByRole('dialog').filter({ has: this.page.getByText('产品资源') });
    }

    async gotoProductList(): Promise<void> {
        const ready = this.page.getByRole('button', { name: '新增产品' });
        await gotoAdminHashPage(this.page, ADMIN_ROUTES.productList, ready, {
            menuPath: ['授权中心', '产品定义'],
        });
    }

    async gotoProductRes(productId: string): Promise<void> {
        const ready = this.page.getByRole('button', { name: '新增认证资源' });
        await gotoAdminHashPage(
            this.page,
            `${ADMIN_ROUTES.productRes}?id=${productId}`,
            ready,
            { menuPath: ['授权中心', '产品定义'] },
        );
    }

    async searchProductList(keyword: string): Promise<void> {
        const input = this.page.getByRole('textbox', { name: '产品名称' });
        await input.fill(keyword);
        await this.page.getByRole('button', { name: '查询' }).click();
        await this.page.locator('.el-table__body tr').first().waitFor({ state: 'visible', timeout: 15_000 });
    }

    async resetProductSearch(): Promise<void> {
        const reset = this.page.getByRole('button', { name: '重置' });
        if (await reset.isVisible().catch(() => false)) {
            await reset.click();
            await this.page.locator('.el-table__body tr').first().waitFor({ state: 'visible', timeout: 15_000 });
        }
    }

    private productNameFromRow(rowText: string): string {
        const lines = rowText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean);
        const nameLine = lines.find((line) => !/^\d{10,}$/.test(line) && !line.includes('EDU_'));
        return nameLine || lines[1] || lines[0] || '';
    }

    private async openProductRowDetail(row: ReturnType<Page['locator']>): Promise<string> {
        const productName = this.productNameFromRow(await row.innerText());
        await row.getByRole('button', { name: '详情' }).click();
        await this.page.getByRole('button', { name: '新增认证资源' }).waitFor({
            state: 'visible',
            timeout: 30_000,
        });
        return productName;
    }

    /** 列表中找第一个可考试类产品并打开详情 */
    async openFirstExamProductDetail(): Promise<string> {
        await this.gotoProductList();
        const rows = this.page.locator('.el-table__body tr');
        const count = await rows.count();
        for (let i = 0; i < count; i++) {
            const row = rows.nth(i);
            const text = await row.innerText();
            if (!isExamProductRowText(text)) continue;
            return this.openProductRowDetail(row);
        }
        throw new Error('产品列表中未找到可考试类产品（非课程订阅）');
    }

    /** 按关键词搜索产品并打开详情 */
    async openProductDetailBySearch(productQuery: string): Promise<string | null> {
        await this.searchProductList(productQuery);
        const row = this.page.locator('.el-table__body tr').filter({ hasText: productQuery }).first();
        if (!(await row.isVisible().catch(() => false))) {
            return null;
        }
        return this.openProductRowDetail(row);
    }

    async openProductDetailForSeed(): Promise<string> {
        const productId = process.env.TC_SEED_PRODUCT_ID?.trim();
        if (productId) {
            await this.gotoProductRes(productId);
            return productId;
        }

        await this.gotoProductList();
        for (const query of resolveSeedProductSearchQueries()) {
            const name = await this.openProductDetailBySearch(query).catch(() => null);
            if (name) return name;
            await this.gotoProductList();
        }

        return this.openFirstExamProductDetail();
    }

    async tableHasRows(): Promise<boolean> {
        const rows = this.page.locator('.el-table__body tr');
        try {
            await rows.first().waitFor({ state: 'visible', timeout: 5_000 });
            return (await rows.count()) > 0;
        } catch {
            return false;
        }
    }

    async readAllCertRes(): Promise<{ id: string; name: string }[]> {
        const table = this.page.locator('.el-table').first();
        await expect(table.locator('.el-table__body tr').first()).toBeVisible({ timeout: 30_000 });
        const headers = table.locator('.el-table__header th');
        const headerCount = await headers.count();
        let nameIdx = -1;
        let idIdx = -1;
        for (let i = 0; i < headerCount; i++) {
            const text = (await headers.nth(i).innerText()).replace(/\s+/g, '');
            if (text.includes('资源名称')) nameIdx = i;
            if (text.includes('资源ID')) idIdx = i;
        }
        if (nameIdx < 0 || idIdx < 0) {
            throw new Error('产品资源表缺少「资源名称」或「资源ID」列');
        }

        const rows = table.locator('.el-table__body tr');
        const rowCount = await rows.count();
        const result: { id: string; name: string }[] = [];
        for (let r = 0; r < rowCount; r++) {
            const cells = rows.nth(r).locator('td');
            const name = (await cells.nth(nameIdx).innerText()).trim();
            const id = (await cells.nth(idIdx).innerText()).trim();
            if (id) result.push({ id, name });
        }
        return result;
    }

    async readPreferredCertRes(): Promise<{ id: string; name: string }> {
        const rows = await this.readAllCertRes();
        if (rows.length === 0) {
            throw new Error('产品资源表无资源ID');
        }

        const query = resolveSeedCertQuery();
        const byQuery = rows.find((row) => row.name.includes(query) && isExamCertResourceName(row.name));
        if (byQuery) return byQuery;

        const examLike = rows.find((row) => isExamCertResourceName(row.name));
        if (examLike) return examLike;

        return rows[0]!;
    }

    async openAddCertRes(): Promise<void> {
        await this.page.getByRole('button', { name: '新增认证资源' }).click();
        await expect(this.dialog()).toBeVisible();
    }

    async pickFirstResourceSuggestion(query = ''): Promise<string> {
        const input = this.dialog()
            .locator('.el-form-item')
            .filter({ hasText: /^资源/ })
            .locator('input')
            .first();
        await input.click();
        await input.fill(query || ' ');
        const suggestion = this.page.locator('.el-autocomplete-suggestion:visible li, .el-popper:visible li').first();
        await suggestion.waitFor({ state: 'visible', timeout: 15_000 });
        const name = (await suggestion.innerText()).trim();
        await suggestion.click();
        return name;
    }

    async confirmAdd(): Promise<void> {
        await this.dialog().getByRole('button', { name: '确认' }).click();
        await expect(this.page.locator('.el-message').getByText(/新增成功/)).toBeVisible({ timeout: 30_000 });
    }

    private async addExamCertResource(): Promise<{ id: string; name: string }> {
        await this.openAddCertRes();
        const query = resolveSeedCertQuery();
        const name = await this.pickFirstResourceSuggestion(query);
        await this.confirmAdd();
        const id = await readFirstRowCell(this.page, '资源ID');
        if (!id?.trim()) {
            throw new Error('新增认证资源后表无资源ID');
        }
        return { id: id.trim(), name };
    }

    async ensureCertResId(): Promise<{ id: string; name: string; productName: string }> {
        const productName = await this.openProductDetailForSeed();

        if (await this.tableHasRows()) {
            const preferred = await this.readPreferredCertRes();
            if (isExamCertResourceName(preferred.name)) {
                return { ...preferred, productName };
            }
        }

        const added = await this.addExamCertResource();
        if (!isExamCertResourceName(added.name)) {
            throw new Error(
                `新增认证资源「${added.name}」仍不适合考试流程，请检查后台资源或设置 TC_SEED_CERT_QUERY`,
            );
        }
        return { ...added, productName };
    }
}
