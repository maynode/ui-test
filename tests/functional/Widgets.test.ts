import test from '@lib/BaseTest';
import { expect } from '@playwright/test';

test(`Verify Widgets Page`, { tag: '@Smoke'}, async ({ loginPage, widgetsPage, webActions }) => {
    await loginPage.navigateToURL();
    await webActions.clickByText('Widgets'); // Click on Widgets Icon identified via text selector
    await webActions.clickByText('Auto Complete');
    await widgetsPage.enterAutocompleteEditbox('Bl');
    await expect(widgetsPage.BLUE_COLOUR_TEXT).toBeVisible();
    await webActions.clickByText('Tool Tips');
    await widgetsPage.hoverButtonForTooltip();
    await expect(widgetsPage.TOOL_TIP_TEXT).toContainText(`You hovered over the Button`);
    await webActions.clickByText('Select Menu');
    await widgetsPage.oldStyleSelectColour('Aqua');
});
