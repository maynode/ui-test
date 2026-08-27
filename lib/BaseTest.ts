import { TestInfo, test as baseTest } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { ElementsPage } from '@pages/ElementsPage';
import { AlertsFrameWindowsPage } from '@pages/AlertsFrameWindowsPage';
import { WidgetsPage } from '@pages/WidgetsPage';
import { InteractionsPage } from '@pages/InteractionsPage';
import { CourseListPage } from '@pages/CourseListPage';
import { CourseDetailPage } from '@pages/CourseDetailPage';
import { CertDetailPage } from '@pages/CertDetailPage';
import { ExamPage } from '@pages/ExamPage';
import { MyExamPage } from '@pages/MyExamPage';
import { MyCertPage } from '@pages/MyCertPage';
import { MyTeamPage } from '@pages/MyTeamPage';
import { NcrePage } from '@pages/NcrePage';
import { PartnerCertPage } from '@pages/PartnerCertPage';
import { SeatsManagePage } from '@pages/SeatsManagePage';
import { WebActions } from '@lib/WebActions';
import AxeBuilder from '@axe-core/playwright';

const test = baseTest.extend<{
    webActions: WebActions;
    loginPage: LoginPage;
    elementsPage: ElementsPage;
    alertsFrameWindowsPage: AlertsFrameWindowsPage;
    widgetsPage: WidgetsPage;
    interactionsPage: InteractionsPage;
    courseListPage: CourseListPage;
    courseDetailPage: CourseDetailPage;
    certDetailPage: CertDetailPage;
    examPage: ExamPage;
    myExamPage: MyExamPage;
    myCertPage: MyCertPage;
    myTeamPage: MyTeamPage;
    ncrePage: NcrePage;
    partnerCertPage: PartnerCertPage;
    seatsManagePage: SeatsManagePage;
    makeAxeBuilder: AxeBuilder;
    testInfo: TestInfo;
}>({
    webActions: async ({ page, context }, use) => {
        await use(new WebActions(page, context));
    },
    loginPage: async ({ page, context }, use) => {
        await use(new LoginPage(page, context));
    },
    elementsPage: async ({ page, context }, use) => {
        await use(new ElementsPage(page, context));
    },
    alertsFrameWindowsPage: async ({ page, context }, use) => {
        await use(new AlertsFrameWindowsPage(page, context));
    },
    widgetsPage: async ({ page, context }, use) => {
        await use(new WidgetsPage(page, context));
    },
    interactionsPage: async ({ page, context }, use) => {
        await use(new InteractionsPage(page, context));
    },
    courseListPage: async ({ page }, use) => {
        await use(new CourseListPage(page));
    },
    courseDetailPage: async ({ page }, use) => {
        await use(new CourseDetailPage(page));
    },
    certDetailPage: async ({ page }, use) => {
        await use(new CertDetailPage(page));
    },
    examPage: async ({ page }, use) => {
        await use(new ExamPage(page));
    },
    myExamPage: async ({ page }, use) => {
        await use(new MyExamPage(page));
    },
    myCertPage: async ({ page }, use) => {
        await use(new MyCertPage(page));
    },
    myTeamPage: async ({ page }, use) => {
        await use(new MyTeamPage(page));
    },
    ncrePage: async ({ page }, use) => {
        await use(new NcrePage(page));
    },
    partnerCertPage: async ({ page }, use) => {
        await use(new PartnerCertPage(page));
    },
    seatsManagePage: async ({ page }, use) => {
        await use(new SeatsManagePage(page));
    },
    makeAxeBuilder: async ({ page }, use) => {
        await use(new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .exclude('#commonly-reused-element-with-known-issue'));
    }
})

export default test;
