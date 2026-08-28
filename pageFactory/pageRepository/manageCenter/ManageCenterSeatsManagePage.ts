import { Page, Locator } from '@playwright/test';

/**
 * 管理中心 · 名额管理 Page Object
 * 对应路由：/manageCenter/seat/manage?teamId=xxx
 * 对应前端：website/src/pages/manageCenter/seat/manage/components/ManageCenterSeatsManage.vue
 */
export class ManageCenterSeatsManagePage {
    readonly page: Page;
    readonly container: Locator;
    readonly seatsHeader: Locator;
    readonly seatsManage: Locator;
    readonly selectMemberBtn: Locator;
    readonly assignMemberBtn: Locator;
    readonly batchImportBtn: Locator;
    readonly removeBtn: Locator;
    readonly selectDialog: Locator;
    readonly selectDialogAllTab: Locator;
    readonly selectDialogSelectedTab: Locator;
    readonly selectDialogTable: Locator;
    readonly selectDialogRows: Locator;
    readonly selectDialogNameSearch: Locator;
    readonly selectDialogConfirmBtn: Locator;
    readonly selectDialogCancelBtn: Locator;
    readonly seatsTableRows: Locator;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.manage-center-seat-manage');
        this.seatsHeader = page.locator('.seats-header');
        this.seatsManage = page.locator('.manage-center-seats-manage');
        this.selectMemberBtn = page.getByRole('button', { name: '选择成员' });
        this.assignMemberBtn = page.getByRole('button', { name: '分配成员' });
        this.batchImportBtn = page.getByRole('button', { name: '批量导入成员' });
        this.removeBtn = page.getByRole('button', { name: '移除' });
        this.selectDialog = page.locator('.select-member-dialog');
        this.selectDialogAllTab = this.selectDialog.getByRole('tab', { name: /全部成员/ });
        this.selectDialogSelectedTab = this.selectDialog.getByRole('tab', { name: /已选择/ });
        this.selectDialogTable = this.selectDialog.locator('.select-member-dialog-table').first();
        this.selectDialogRows = this.selectDialogTable.locator('.el-table__body-wrapper tbody tr');
        this.selectDialogNameSearch = this.selectDialog.getByPlaceholder('搜索姓名');
        this.selectDialogConfirmBtn = this.selectDialog.getByRole('button', { name: '确认' });
        this.selectDialogCancelBtn = this.selectDialog.getByRole('button', { name: '取消' });
        this.seatsTableRows = this.seatsManage.locator('.el-table__body-wrapper tbody tr');
    }

    async waitForLoad() {
        await this.container.waitFor({ state: 'visible' });
        await this.seatsHeader.waitFor({ state: 'visible' });
    }

    async isSelectMemberEnabled() {
        return this.selectMemberBtn.isEnabled();
    }

    async openSelectMemberDialog() {
        await this.selectMemberBtn.click();
        await this.selectDialog.waitFor({ state: 'visible' });
        await this.selectDialogTable.waitFor({ state: 'visible' });
    }

    /** 在「全部成员」表里按联系方式找行并勾选，返回是否命中 */
    async checkMemberByContact(contact: string): Promise<boolean> {
        const row = this.selectDialogRows.filter({ hasText: contact }).first();
        if ((await row.count()) === 0) {
            return false;
        }
        await row.locator('.el-checkbox').first().click();
        return true;
    }

    /** 提交分配：处理未激活成员二次确认，等成功提示 */
    async confirmAssign() {
        await this.selectDialogConfirmBtn.click();
        const inactiveConfirm = this.page.getByRole('button', { name: '确认添加' });
        if (await inactiveConfirm.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await inactiveConfirm.click();
        }
        await this.page.getByText('操作成功').waitFor({ state: 'visible', timeout: 30_000 });
        await this.selectDialog.waitFor({ state: 'hidden', timeout: 30_000 });
    }

    /**
     * 读头部「已分配 / 总名额」。
     * SeatsHeader.vue 实际文本：`{订单名} 共 N 名额 | 已分配：N | 待分配： N` + `开通时间：YYYY-MM-DD ...`
     * 必须按标签正则取，**不能**用「取最后两个数字」——开通时间的日期里也是数字。
     */
    async readHeaderQuota(): Promise<[number, number]> {
        const text = await this.seatsHeader.innerText();
        const total = Number(text.match(/共\s*(\d+)\s*名额/)?.[1] ?? 0);
        const allocated = Number(text.match(/已分配：\s*(\d+)/)?.[1] ?? 0);
        return [allocated, total];
    }

    async seatsRowCount() {
        return this.seatsTableRows.count();
    }
}
