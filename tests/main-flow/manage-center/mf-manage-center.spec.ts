import test from '@lib/BaseTest';
import { expect } from '@playwright/test';
import { tcWebsiteAdminAuthConfig } from '@lib/tcAuthConfig';
import { resolveAssignTargetContact } from './assignTarget';
import { gotoLearnerPage, isLearnerContextReady, withLearnerContext } from '@lib/websiteSecondContext';

const auth = tcWebsiteAdminAuthConfig();

/**
 * 主流程 · 管理中心（原团队服务）
 * 对照：tests/MAIN-FLOW-MATRIX.md §3
 * 登录态：admin 账号经 Website OAuth（.auth/admin-website.json）
 */
test.describe('主流程 · 管理中心', () => {
    if (auth.ready && auth.storageState) {
        test.use({ storageState: auth.storageState });
    }

    test.beforeEach(async () => {
        test.skip(!auth.ready, auth.skipReason);
    });

    test('MF-MC-001 管理中心入口与布局', { tag: '@MainFlow' }, async ({ manageCenterPage }) => {
        test.setTimeout(180_000);

        const popup = await manageCenterPage.openFromUserCenter();
        expect(popup.url()).toContain('/manageCenter');
        await popup.close();

        await manageCenterPage.goto('home');
        await expect(manageCenterPage.headerTitle).toBeVisible();
        await expect(manageCenterPage.trainingNav).toBeVisible();
        await expect(manageCenterPage.reportNav).toBeVisible();
        await expect(manageCenterPage.sideMenu).toBeVisible();
        await expect(manageCenterPage.seatMenuItem).toBeVisible();
        await expect(manageCenterPage.memberMenuItem).toBeVisible();
        await expect(manageCenterPage.page).toHaveURL(/\/manageCenter\/seat/);

        await manageCenterPage.clickSideMenu('成员信息');
        await expect(manageCenterPage.page).toHaveURL(/\/manageCenter\/member/);

        await manageCenterPage.clickSideMenu('坐席分配');
        await expect(manageCenterPage.page).toHaveURL(/\/manageCenter\/seat/);

        await manageCenterPage.goto('report');
        await expect(manageCenterPage.layout).toBeVisible();
        await expect(manageCenterPage.sideMenu).toBeHidden();
    });

    test('MF-MC-002 成员信息列表与添加入口', { tag: '@MainFlow' }, async ({ manageCenterMemberPage }) => {
        test.setTimeout(120_000);

        await manageCenterMemberPage.goto();
        await expect(manageCenterMemberPage.container).toBeVisible();
        await expect(manageCenterMemberPage.search).toBeVisible();

        const total = await manageCenterMemberPage.rowCount();
        test.skip(total === 0, '成员池为空，请先在管理中心「成员信息 → 添加成员」加入至少一名成员');

        await manageCenterMemberPage.openAddMemberDropdown();
        await expect(manageCenterMemberPage.addSingleItem).toBeVisible();
        await expect(manageCenterMemberPage.addBatchItem).toBeVisible();
        await manageCenterMemberPage.page.keyboard.press('Escape');

        await manageCenterMemberPage.batchRemoveBtn.click();
        await expect(manageCenterMemberPage.page.getByText('请选择要移除的成员')).toBeVisible();
    });

    test('MF-MC-003 坐席分配闭环与名额扣减', { tag: '@MainFlow' }, async ({
        manageCenterSeatPage,
        manageCenterSeatsManagePage,
    }) => {
        test.setTimeout(240_000);

        await manageCenterSeatPage.goto();
        test.skip(await manageCenterSeatPage.isEmptyState(), 'admin 账号在管理中心无团队订阅数据');
        test.skip((await manageCenterSeatPage.seatManageCount()) === 0, '团队表格内无名额管理入口');

        await manageCenterSeatPage.openFirstSeatManage();
        await manageCenterSeatsManagePage.waitForLoad();

        const [allocatedBefore, total] = await manageCenterSeatsManagePage.readHeaderQuota();
        test.skip(total - allocatedBefore <= 0, `剩余可分配名额为 0（已分配 ${allocatedBefore}/${total}）`);
        test.skip(!(await manageCenterSeatsManagePage.isSelectMemberEnabled()), '「选择成员」按钮不可用');

        const rowsBefore = await manageCenterSeatsManagePage.seatsRowCount();

        await manageCenterSeatsManagePage.openSelectMemberDialog();
        await expect(manageCenterSeatsManagePage.selectDialogAllTab).toBeVisible();

        const contact = resolveAssignTargetContact();
        const matched = await manageCenterSeatsManagePage.checkMemberByContact(contact);
        if (!matched) {
            await manageCenterSeatsManagePage.selectDialogCancelBtn.click();
        }
        test.skip(!matched, `成员池中未找到 ${contact}，请先在「成员信息 → 添加成员」加入该账号`);

        await expect(manageCenterSeatsManagePage.selectDialogSelectedTab).toContainText('1/');
        await manageCenterSeatsManagePage.confirmAssign();

        await expect
            .poll(async () => (await manageCenterSeatsManagePage.readHeaderQuota())[0], { timeout: 30_000 })
            .toBe(allocatedBefore + 1);
        await expect
            .poll(async () => manageCenterSeatsManagePage.seatsRowCount(), { timeout: 30_000 })
            .toBeGreaterThan(rowsBefore);
    });

    test('MF-MC-004 学员端跨账号收权', { tag: '@MainFlow' }, async ({
        browser,
        manageCenterSeatPage,
        manageCenterSeatsManagePage,
    }) => {
        test.setTimeout(240_000);

        const learner = isLearnerContextReady();
        test.skip(!learner.ready, learner.skipReason);

        await manageCenterSeatPage.goto();
        test.skip(await manageCenterSeatPage.isEmptyState(), 'admin 账号在管理中心无团队订阅数据');
        test.skip((await manageCenterSeatPage.seatManageCount()) === 0, '团队表格内无名额管理入口');

        await manageCenterSeatPage.openFirstSeatManage();
        await manageCenterSeatsManagePage.waitForLoad();

        const contact = resolveAssignTargetContact();
        const assignedRow = manageCenterSeatsManagePage.seatsTableRows.filter({ hasText: contact }).first();
        test.skip(
            (await assignedRow.count()) === 0,
            `名额管理表格内无 ${contact}，请先跑 MF-MC-003 完成分配`,
        );
        await expect(assignedRow).toBeVisible();

        await withLearnerContext(browser, async (learnerPage) => {
            await gotoLearnerPage(learnerPage, '/user/myCourse/');
            const courseRoot = learnerPage.locator('.user-layout, .my-course').first();
            await expect(courseRoot).toBeVisible({ timeout: 60_000 });
            const courseItems = await learnerPage.locator('.el-table__body-wrapper tbody tr, .course-card').count();

            await gotoLearnerPage(learnerPage, '/user/myExam/');
            const examRoot = learnerPage.locator('.user-layout, .my-exam').first();
            await expect(examRoot).toBeVisible({ timeout: 60_000 });
            const examItems = await learnerPage.locator('.el-table__body-wrapper tbody tr').count();

            expect(courseItems + examItems).toBeGreaterThan(0);
        });
    });

    test('MF-MC-005 报表分析统计与明细表', { tag: '@MainFlow' }, async ({ manageCenterReportPage }) => {
        test.setTimeout(150_000);

        await manageCenterReportPage.goto();
        await expect(manageCenterReportPage.summary).toBeVisible();
        expect(await manageCenterReportPage.getSummaryCardsCount()).toBeGreaterThan(0);
        await expect(manageCenterReportPage.detailPanel).toBeVisible();
        await expect(manageCenterReportPage.detailTitle).toBeVisible();
        await expect(manageCenterReportPage.certFilterHeader).toBeVisible();
        await expect(manageCenterReportPage.statusFilterHeader).toBeVisible();
        await expect(manageCenterReportPage.exportBtn).toBeVisible();

        const rows = await manageCenterReportPage.rowCount();
        const isEmpty = await manageCenterReportPage.isEmptyState();
        expect(rows > 0 || isEmpty).toBeTruthy();

        test.skip(rows === 0, '团队暂无学习数据，明细表为空态');

        await manageCenterReportPage.resetBtn.click();
        await expect(manageCenterReportPage.table).toBeVisible();
        await expect.poll(async () => manageCenterReportPage.rowCount(), { timeout: 30_000 }).toBeGreaterThan(0);
    });
});
