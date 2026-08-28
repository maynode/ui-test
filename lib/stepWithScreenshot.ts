import { Page, test } from '@playwright/test';

function sanitizeAttachmentName(title: string): string {
    return title.replace(/[^\w\u4e00-\u9fff-]+/g, '-').replace(/-+/g, '-').slice(0, 80);
}

/** 是否启用每步截图（环境变量 STEP_SCREENSHOT=1） */
export function isStepScreenshotEnabled(): boolean {
    return process.env.STEP_SCREENSHOT === '1' || process.env.STEP_SCREENSHOT === 'true';
}

/**
 * 带截图的 test.step：步骤结束后 attach 到 HTML 报告。
 * 开启：pnpm run test:main-flow:screenshots:tcTest
 */
export async function stepWithScreenshot(page: Page, title: string, body: () => Promise<void>): Promise<void> {
    await test.step(title, async () => {
        await body();
        if (!isStepScreenshotEnabled()) {
            return;
        }
        const screenshot = await page.screenshot({ fullPage: true });
        await test.info().attach(sanitizeAttachmentName(title), {
            body: screenshot,
            contentType: 'image/png',
        });
    });
}
