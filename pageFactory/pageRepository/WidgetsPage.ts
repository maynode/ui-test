import { Locator, Page, BrowserContext } from '@playwright/test';

export class WidgetsPage {
    readonly page: Page;
    readonly context: BrowserContext;
    readonly AUTOCOMPLETE_EDITBOX: Locator;
    readonly BLUE_COLOUR_TEXT: Locator;
    readonly HOVER_BUTTON: Locator;
    readonly TOOL_TIP_TEXT: Locator;
    readonly OLD_SELECT_MENU: Locator;
    readonly MULTISELECT_MENU: Locator;

    constructor(page: Page, context: BrowserContext) {
        this.page = page;
        this.context = context;
        this.AUTOCOMPLETE_EDITBOX = page.locator('#autoCompleteSingleInput');
        this.BLUE_COLOUR_TEXT = page.getByText('Blue', { exact: true }); //Used to select Blue colour from Autocomplete editbox
        this.HOVER_BUTTON = page.getByRole('button', { name: 'Hover me to see' });
        this.TOOL_TIP_TEXT = page.getByRole("tooltip");
        this.OLD_SELECT_MENU = page.locator('#oldSelectMenu');
        this.MULTISELECT_MENU = page.getByText('Select...');
    }

    async enterAutocompleteEditbox(textValue: string): Promise<void> {
        await this.AUTOCOMPLETE_EDITBOX.fill(textValue);
        await this.BLUE_COLOUR_TEXT.click();
    }

    async hoverButtonForTooltip(): Promise<void> {
        await this.HOVER_BUTTON.hover();  //Hover over element
    }

    async oldStyleSelectColour(colourName: string): Promise<void> {
        await this.OLD_SELECT_MENU.selectOption(colourName);
    }
}
