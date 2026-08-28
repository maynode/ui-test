import type { BrowserContext, Page } from '@playwright/test';

const EXAM_ENTRY_URL = /\/cert\/(notice|binding)|etcert-exam/;

/** C 端 router.open 默认新开标签页，等待弹窗并匹配 URL */
export async function waitForWebsitePopupUrl(
    context: BrowserContext,
    trigger: () => Promise<void>,
    urlPattern: RegExp = EXAM_ENTRY_URL,
    timeoutMs = 90_000,
): Promise<Page> {
    const popupPromise = context.waitForEvent('page', { timeout: timeoutMs });
    await trigger();
    const popup = await popupPromise;
    await popup.waitForURL(urlPattern, { timeout: timeoutMs });
    await popup.waitForLoadState('domcontentloaded');
    return popup;
}

export { EXAM_ENTRY_URL };
