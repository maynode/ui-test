import { Page, expect } from '@playwright/test';
import { adminPageUrl } from '@lib/tcAdminConfig';
import { readFirstRowCell } from './adminUi';

export class MembershipResPage {
    constructor(private page: Page) {}

    async gotoMembershipList(): Promise<void> {
        await this.page.goto(adminPageUrl('/platformAuth/membership'), { waitUntil: 'domcontentloaded' });
        await this.page.getByRole('button', { name: '新增' }).first().waitFor({ state: 'visible', timeout: 30_000 });
    }

    async openFirstMembershipDetail(): Promise<string> {
        const detail = this.page.getByRole('button', { name: '详情' }).first();
        await expect(detail).toBeVisible({ timeout: 30_000 });
        await detail.click();
        await this.page.getByRole('button', { name: '新增' }).waitFor({ state: 'visible', timeout: 30_000 });
        const url = new URL(this.page.url());
        const membershipId = url.searchParams.get('id') || '';
        if (!membershipId) {
            throw new Error('进入会员详情后 URL 缺少 id');
        }
        return membershipId;
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

    async readFirstMembershipRes(): Promise<{ id: string; name: string }> {
        const id = await readFirstRowCell(this.page, '资源ID');
        const name = await readFirstRowCell(this.page, '资源名称').catch(() => id);
        if (!id) throw new Error('会员资源表无资源ID');
        return { id, name };
    }

    /**
     * 会员列表 → 首个会员详情 → 收编首行会员资源。
     * 可用 TC_SEED_MEMBERSHIP_ID 直达详情页。
     */
    async ensureMembershipResId(): Promise<{ membershipId: string; id: string; name: string }> {
        const membershipIdEnv = process.env.TC_SEED_MEMBERSHIP_ID?.trim();
        let membershipId = membershipIdEnv || '';

        if (membershipId) {
            await this.page.goto(adminPageUrl(`/platformAuth/membershipRes?id=${membershipId}`), {
                waitUntil: 'domcontentloaded',
            });
            await this.page.getByRole('button', { name: '新增' }).waitFor({ state: 'visible', timeout: 30_000 });
        } else {
            await this.gotoMembershipList();
            membershipId = await this.openFirstMembershipDetail();
        }

        if (!(await this.tableHasRows())) {
            throw new Error('会员资源表为空，请在 Admin 手工绑定课程/认证后再跑 SEED-MEMBER-RES-001');
        }

        const { id, name } = await this.readFirstMembershipRes();
        return { membershipId, id: id.trim(), name };
    }
}
