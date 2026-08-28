import { BrowserContext, Page, Locator } from '@playwright/test';
import type { AccountRole } from '@lib/loadAccounts';
import { waitForWebsiteAuthSettled } from '@lib/websiteSession';
import { gotoWebsitePage } from '@lib/websiteNavigate';
import { dismissBlockingWebsiteDialogs } from '@lib/websiteDialog';

/**
 * 伙伴认证页 Page Object
 * 对应路由：/partnerCert
 * 对应前端：website/src/pages/partnerCert/index.vue（岗位区块平铺，无 Tab）
 */
export class PartnerCertPage {
    readonly page: Page;
    readonly container: Locator;
    readonly sectionList: Locator;
    readonly sectionBlocks: Locator;
    readonly courseItems: Locator;
    readonly partnerExclusiveLabel: Locator;
    readonly goExamBtns: Locator;
    readonly studyBtns: Locator;
    readonly stageTitles: Locator;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.partner-cert-page');
        this.sectionList = page.locator('.partner-section-list');
        this.sectionBlocks = page.locator('.partner-cert-course');
        this.courseItems = page.locator('.partner-cert-course .course-item');
        this.partnerExclusiveLabel = page.getByText('伙伴专属', { exact: true });
        this.goExamBtns = page.getByTestId('partner-go-exam');
        this.studyBtns = page.getByTestId('partner-study-btn');
        this.stageTitles = page.locator('.partner-cert-course .stage__title');
    }

    async goto(role: AccountRole = 'user') {
        await gotoWebsitePage(this.page, '/partnerCert', role);
        await this.container.waitFor({ state: 'visible' });
        await dismissBlockingWebsiteDialogs(this.page);
    }

    async getSectionCount() {
        return this.sectionBlocks.count();
    }

    async getCourseCount() {
        return this.courseItems.count();
    }

    async getGoExamCount() {
        return this.goExamBtns.count();
    }

    async getStudyCount() {
        return this.studyBtns.count();
    }

    async getStageTitleCount() {
        return this.stageTitles.count();
    }

    async isPartnerExclusiveVisible() {
        return this.partnerExclusiveLabel.isVisible();
    }

    async openFirstStudyInNewPage(context: BrowserContext) {
        await dismissBlockingWebsiteDialogs(this.page);
        const popupPromise = context.waitForEvent('page');
        await this.studyBtns.first().click();
        const popup = await popupPromise;
        await popup.waitForLoadState('domcontentloaded');
        await waitForWebsiteAuthSettled(popup);
        await dismissBlockingWebsiteDialogs(popup);
        return popup;
    }

    async openFirstGoExamInNewPage(context: BrowserContext) {
        await dismissBlockingWebsiteDialogs(this.page);
        const popupPromise = context.waitForEvent('page');
        await this.goExamBtns.first().click();
        const popup = await popupPromise;
        await popup.waitForLoadState('domcontentloaded');
        await waitForWebsiteAuthSettled(popup);
        await dismissBlockingWebsiteDialogs(popup);
        return popup;
    }
}
