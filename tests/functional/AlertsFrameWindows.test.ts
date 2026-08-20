import test from '@lib/BaseTest';
import { expect } from '@playwright/test';

test(`Verify Alerts, Frame & Windows Page`, { tag: '@Smoke'}, async ({ loginPage, alertsFrameWindowsPage, webActions }) => {
    await loginPage.navigateToURL();
    await webActions.clickByText('Alerts, Frame & Windows'); // Click on Alerts, Frame & Windows icon
    await webActions.clickByText('Browser Windows'); // Click on Browser Windows navigation side bar
    const newTab = await alertsFrameWindowsPage.openNewTab();
    expect(newTab.url()).toBe(`https://demoqa.com/sample`);
    await expect(newTab.locator(`#sampleHeading`)).toContainText(`This is a sample page`);
    await newTab.close();

    const newWindow = await alertsFrameWindowsPage.openNewWindow();
    expect(newWindow.url()).toBe(`https://demoqa.com/sample`);
    await newWindow.close();
    await webActions.clickByText('Alerts');
    await alertsFrameWindowsPage.enterTextAndAccept(`Hello`); // Enter Text Hello in alert prompt and click ok
    await expect(alertsFrameWindowsPage.PROMPT_RESULT).toContainText(`You entered Hello`);
    await webActions.clickByText('Frames');
    await expect(alertsFrameWindowsPage.FRAME_LOCATOR).toHaveText(`This is a sample page`);
    await webActions.clickByText('Nested Frames');
    await expect(alertsFrameWindowsPage.NESTED_CHILDFRAME_LOCATOR).toBeVisible();
});
