import { Page, expect } from '@playwright/test';
import { ADMIN_ROUTES, gotoAdminHashPage } from './adminNavigate';

export class UserAuthPage {
    constructor(private page: Page) {}

    async goto(): Promise<void> {
        const ready = this.page.getByRole('button', { name: '新增授权' });
        await gotoAdminHashPage(this.page, ADMIN_ROUTES.userAuth, ready, {
            menuPath: ['授权中心', '用户授权'],
        });
    }

    dialog() {
        return this.page.getByRole('dialog').filter({
            has: this.page.getByText(/批量添加用户授权|授权结果/),
        });
    }

    async openBatchDialog(): Promise<void> {
        await this.page.getByRole('button', { name: '新增授权' }).click();
        await expect(this.dialog().getByText('批量添加用户授权')).toBeVisible();
    }

    async pickFirstProduct(): Promise<string> {
        return this.pickProductByKeyword(process.env.TC_SEED_PRODUCT_QUERY?.trim() || '工程师');
    }

    /** 与 catalog.certs[0].productName 对齐授权 */
    async pickProductByName(productName: string): Promise<string> {
        const keyword = productName.replace(/^产品-/, '').trim() || productName;
        return this.pickProductByKeyword(keyword);
    }

    private async pickProductByKeyword(keyword: string): Promise<string> {
        const select = this.dialog().locator('.el-form-item').filter({ hasText: '授权产品' }).locator('.el-select');
        const input = select.locator('input').first();
        await input.click();
        await input.fill(keyword);
        await this.page.waitForTimeout(700);

        const options = this.page.locator('.el-select-dropdown:visible .el-select-dropdown__item:not(.is-disabled)');
        await options.first().waitFor({ state: 'visible', timeout: 20_000 });

        const count = await options.count();
        for (let i = 0; i < count; i++) {
            const opt = options.nth(i);
            const name = (await opt.innerText()).trim();
            if (name.includes(keyword) || keyword.includes(name.replace(/^产品-/, ''))) {
                await opt.click();
                await expect(this.dialog().getByText('产品个人编码')).toBeVisible({ timeout: 15_000 });
                return name;
            }
        }

        const name = (await options.first().innerText()).trim();
        await options.first().click();
        await expect(this.dialog().getByText('产品个人编码')).toBeVisible({ timeout: 15_000 });
        return name;
    }

    async fillAccount(account: string): Promise<void> {
        const textarea = this.dialog().locator('.el-form-item').filter({ hasText: '授权账号' }).locator('textarea');
        await textarea.fill(account);
    }

    async fillDateTime(label: string, value: string): Promise<void> {
        const input = this.dialog().locator('.el-form-item').filter({ hasText: label }).locator('input').first();
        await input.click();
        await input.fill(value);
        await input.press('Enter');
        await input.blur();
    }

    async confirm(): Promise<void> {
        await this.dialog().getByRole('button', { name: '确认' }).click();
        await expect(this.dialog().getByRole('heading', { name: '授权结果' })).toBeVisible({ timeout: 30_000 });
        await expect(this.dialog().getByText(/成功个数：\d+/).first()).toBeVisible();
    }
}
