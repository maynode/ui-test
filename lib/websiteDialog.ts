import { expect, type Page } from '@playwright/test';

/** 关闭登录后可能出现的「账号权益」弹窗，避免挡住后续点击 */
export async function dismissAccountBenefitDialog(page: Page): Promise<boolean> {
    const dialog = page.getByRole('dialog', { name: '账号权益' });
    if (!(await dialog.isVisible().catch(() => false))) {
        return false;
    }

    const notRemind = dialog.getByRole('checkbox', { name: '30天内不再提醒' });
    if (await notRemind.isVisible().catch(() => false)) {
        await notRemind.check({ force: true }).catch(() => undefined);
    }

    await dialog.getByRole('button', { name: '知道了' }).click();
    await dialog.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => undefined);
    return true;
}

/** 团队服务页：未完成席位分配提醒 */
export async function dismissTeamSeatReminderDialog(page: Page): Promise<boolean> {
    const dialog = page.getByRole('dialog').filter({ hasText: '您尚未完成团队席位分配' });
    if (!(await dialog.isVisible().catch(() => false))) {
        return false;
    }

    const notRemind = dialog.getByRole('button', { name: '不再提醒' });
    if (await notRemind.isVisible().catch(() => false)) {
        await notRemind.click();
    } else {
        await dialog.getByRole('button', { name: /Close this dialog|关闭/ }).click();
    }
    await dialog.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => undefined);
    return true;
}

/** 点击 Element Plus MessageBox（customClass: zw-confirm）的确认钮 */
export async function confirmZwDialog(page: Page, confirmLabel: string | RegExp = '确认'): Promise<void> {
    const box = page.locator('.el-message-box.zw-confirm, .zw-confirm').last();
    await expect(box).toBeVisible({ timeout: 30_000 });
    await box.getByRole('button', { name: confirmLabel }).click();
    await box.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => undefined);
}

/** 若出现则确认，未出现则跳过（用于可选二次确认） */
export async function confirmZwDialogIfVisible(
    page: Page,
    confirmLabel: string | RegExp = '确认',
    timeoutMs = 5_000,
): Promise<boolean> {
    const box = page.locator('.el-message-box.zw-confirm, .zw-confirm').last();
    if (!(await box.isVisible({ timeout: timeoutMs }).catch(() => false))) {
        return false;
    }
    await box.getByRole('button', { name: confirmLabel }).click();
    await box.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => undefined);
    return true;
}

/**
 * 关闭可能阻塞点击的弹窗。
 * 账号权益弹窗常在导航后异步弹出，故短轮询数次直至无弹窗。
 */
export async function dismissBlockingWebsiteDialogs(page: Page): Promise<void> {
    for (let attempt = 0; attempt < 8; attempt++) {
        const dismissedBenefit = await dismissAccountBenefitDialog(page);
        const dismissedTeam = await dismissTeamSeatReminderDialog(page);
        if (!dismissedBenefit && !dismissedTeam) {
            if (attempt === 0) {
                await page.waitForTimeout(400);
                continue;
            }
            break;
        }
        await page.waitForTimeout(250);
    }
}

/** 关键点击前调用：确保无弹窗遮挡 */
export async function ensureNoBlockingDialogs(page: Page): Promise<void> {
    await dismissBlockingWebsiteDialogs(page);
}
