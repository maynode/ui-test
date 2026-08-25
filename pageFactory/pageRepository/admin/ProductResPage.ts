import { Page, expect } from '@playwright/test';
import { adminPageUrl } from '@lib/tcAdminConfig';
import { readFirstRowCell } from './adminUi';

export class ProductResPage {
    constructor(private page: Page) {}

    dialog() {
        return this.page.getByRole('dialog').filter({ has: this.page.getByText('产品资源') });
    }

    async gotoProductList(): Promise<void> {
        await this.page.goto(adminPageUrl('/platformAuth/product'), { waitUntil: 'domcontentloaded' });
        await this.page.getByRole('button', { name: '新增产品' }).waitFor({ state: 'visible', timeout: 30_000 });
    }

    async gotoProductRes(productId: string): Promise<void> {
        await this.page.goto(adminPageUrl(`/platformAuth/productRes?id=${productId}`), {
            waitUntil: 'domcontentloaded',
        });
        await this.page.getByRole('button', { name: '新增认证资源' }).waitFor({
            state: 'visible',
            timeout: 30_000,
        });
    }

    /** 打开列表第一行「详情」进入产品资源页 */
    async openFirstProductDetail(): Promise<void> {
        const detail = this.page.getByRole('button', { name: '详情' }).first();
        await expect(detail).toBeVisible({ timeout: 30_000 });
        await detail.click();
        await this.page.getByRole('button', { name: '新增认证资源' }).waitFor({
            state: 'visible',
            timeout: 30_000,
        });
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

    async readFirstCertRes(): Promise<{ id: string; name: string }> {
        const id = await readFirstRowCell(this.page, '资源ID');
        const name = await readFirstRowCell(this.page, '资源名称').catch(() => id);
        if (!id) throw new Error('产品资源表无资源ID');
        return { id, name };
    }

    async openAddCertRes(): Promise<void> {
        await this.page.getByRole('button', { name: '新增认证资源' }).click();
        await expect(this.dialog()).toBeVisible();
    }

    /**
     * 在「资源」autocomplete 中触发建议并选第一项。
     * query 为空时仍 focus + 输入空格触发 fetch。
     */
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

    /**
     * 若表已有资源则直接读首行；否则新增认证资源并再读首行。
     * 可用 TC_SEED_PRODUCT_ID 直达；否则从产品列表进详情。
     */
    async ensureCertResId(): Promise<{ id: string; name: string }> {
        const productId = process.env.TC_SEED_PRODUCT_ID?.trim();
        if (productId) {
            await this.gotoProductRes(productId);
        } else {
            await this.gotoProductList();
            await this.openFirstProductDetail();
        }

        if (await this.tableHasRows()) {
            return this.readFirstCertRes();
        }

        await this.openAddCertRes();
        const query = process.env.TC_SEED_CERT_QUERY?.trim() || '';
        const name = await this.pickFirstResourceSuggestion(query);
        await this.confirmAdd();
        const id = await readFirstRowCell(this.page, '资源ID');
        if (!id?.trim()) {
            throw new Error('新增认证资源后表无资源ID');
        }
        return { id: id.trim(), name };
    }
}
