import type { Page } from '@playwright/test';
import type { AccountRole } from './loadAccounts';
import { assertWebsiteLoggedIn, ensureWebsiteLoggedIn } from './websiteSession';
import { dismissBlockingWebsiteDialogs } from './websiteDialog';
import { websitePath } from './websitePath';

/** 未登录回归：直进业务页，不触发 ensureWebsiteLoggedIn / OAuth */
export async function gotoWebsitePageWithoutLogin(page: Page, route: string): Promise<void> {
    await gotoWithRetry(page, websitePath(route));
}

/** 先登录并确认，再进入业务页，进入后再次确认顶栏登录态 */
export async function gotoWebsitePage(
    page: Page,
    route: string,
    role: AccountRole = 'user',
): Promise<void> {
    await ensureWebsiteLoggedIn(page, role);
    await gotoWithRetry(page, websitePath(route));
    await assertWebsiteLoggedIn(page);
    await dismissBlockingWebsiteDialogs(page);
}

export async function gotoWithRetry(page: Page, url: string, attempts = 3): Promise<void> {
    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt++) {
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            return;
        } catch (error) {
            lastError = error;
            const message = String(error);
            if (!message.includes('ERR_ABORTED') && !message.includes('NS_BINDING_ABORTED')) {
                throw error;
            }
            await page.waitForTimeout(300 * (attempt + 1));
        }
    }
    throw lastError;
}
