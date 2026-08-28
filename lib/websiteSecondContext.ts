import type { Browser, Page } from '@playwright/test';
import { tcAuthConfig } from './tcAuthConfig';
import { gotoWebsitePage } from './websiteNavigate';

/**
 * 在管理员用例内额外开一个学员上下文（复用 .auth/user.json），
 * 用于「管理员分配 → 学员端收权」的跨账号断言。
 */
export async function withLearnerContext<T>(
    browser: Browser,
    fn: (page: Page) => Promise<T>,
): Promise<T> {
    const learnerAuth = tcAuthConfig('user');
    if (!learnerAuth.ready || !learnerAuth.storageState) {
        throw new Error(`Learner context unavailable: ${learnerAuth.skipReason}`);
    }

    const context = await browser.newContext({
        storageState: learnerAuth.storageState,
        viewport: { width: 1500, height: 730 },
    });
    const page = await context.newPage();
    try {
        return await fn(page);
    } finally {
        await context.close();
    }
}

/** 学员上下文是否可用（供 test.skip 判断，不抛异常） */
export function isLearnerContextReady(): { ready: boolean; skipReason: string } {
    const learnerAuth = tcAuthConfig('user');
    return { ready: learnerAuth.ready, skipReason: learnerAuth.skipReason };
}

/** 学员端打开个人中心某个子页 */
export async function gotoLearnerPage(page: Page, route: string): Promise<void> {
    await gotoWebsitePage(page, route, 'user');
}
