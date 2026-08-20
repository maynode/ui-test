import { Locator, Page, BrowserContext } from '@playwright/test';

export class InteractionsPage {
    readonly page: Page;
    readonly context: BrowserContext;
    readonly DRAGGABLE: Locator;
    readonly DROPPABLE: Locator;
    readonly DROPPABLE_READY: Locator;

    constructor(page: Page, context: BrowserContext) {
        this.page = page;
        this.context = context;
        const simpleTab = page.getByRole('tabpanel', { name: 'Simple' });
        this.DRAGGABLE = simpleTab.locator('#draggable');
        this.DROPPABLE = simpleTab.locator('#droppable');
        this.DROPPABLE_READY = simpleTab.locator('#droppable.ui-droppable');
    }

    async dragAndDrop(): Promise<void> {
        await this.DROPPABLE_READY.waitFor();
        await this.DRAGGABLE.dragTo(this.DROPPABLE);
    }
}
