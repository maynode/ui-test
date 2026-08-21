import { Page, expect } from '@playwright/test';
import { adminPageUrl } from '@lib/tcAdminConfig';

export class UserAuthPage {
    constructor(private page: Page) {}

    async goto(): Promise<void> {
        await this.page.goto(adminPageUrl('/platformAuth/user'), { waitUntil: 'domcontentloaded' });
        await this.page.getByRole('button', { name: '新增授权' }).waitFor({ state: 'visible', timeout: 30_000 });
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
        const select = this.dialog().locator('.el-form-item').filter({ hasText: '授权产品' }).locator('.el-select');
        await select.locator('.el-select__caret, .el-select__suffix').first().click();
        const opt = this.page.locator('.el-select-dropdown:visible .el-select-dropdown__item:not(.is-disabled)').first();
        await opt.waitFor({ state: 'visible', timeout: 10_000 });
        const name = (await opt.innerText()).trim();
        await opt.click();
        await expect(this.dialog().getByText('产品个人编码')).toBeVisible();
        return name;
    }

    async fillAccount(account: string): Promise<void> {
        const textarea = this.dialog().locator('.el-form-item').filter({ hasText: '授权账号' }).locator('textarea');
        await textarea.fill(account);
    }

    async fillDateTime(label: string, value: string): Promise<void> {
        const input = this.dialog().locator('.el-form-item').filter({ hasText: label }).locator('input').first();
        await input.fill(value);
        await input.press('Enter');
    }

    async confirm(): Promise<void> {
        await this.dialog().getByRole('button', { name: '确认' }).click();
        await expect(this.dialog().getByText(/授权结果|成功/)).toBeVisible({ timeout: 30_000 });
    }
}
