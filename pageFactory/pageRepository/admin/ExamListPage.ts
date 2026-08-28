import { Page, expect } from '@playwright/test';
import {
    clickRadioByText,
    fillFormInput,
    pickFirstSelectOption,
    readFirstRowCell,
    readRowCellByName,
    setInputNumber,
} from './adminUi';
import { adminExamRoute, gotoAdminHashPage } from './adminNavigate';

export class ExamListPage {
    constructor(private page: Page) {}

    dialog() {
        return this.page.getByRole('dialog').filter({ has: this.page.getByText(/新增考试|修改考试|考试预览/) });
    }

    paperDialog() {
        return this.page.getByRole('dialog').filter({ has: this.page.getByText(/添加试卷|添加策略/) });
    }

    async goto(): Promise<void> {
        const ready = this.page.getByRole('button', { name: '新增考试' });
        await gotoAdminHashPage(this.page, adminExamRoute(), ready, {
            menuPath: ['考试中心', '随时考试'],
        });
    }

    async tableHasRows(): Promise<boolean> {
        const rows = this.page.locator('.el-table__body tr');
        try {
            await rows.first().waitFor({ state: 'visible', timeout: 5_000 });
            return (await rows.count()) > 0;
        } catch {
            return false;
        }
    }

    async harvestFirstExam(): Promise<{ id: string; name: string }> {
        const id = await readFirstRowCell(this.page, '考试ID');
        const name = await readFirstRowCell(this.page, '考试名称');
        if (!id) throw new Error('考试表无考试ID');
        return { id, name };
    }

    async openCreate(): Promise<void> {
        await this.page.getByRole('button', { name: '新增考试' }).click();
        await expect(this.dialog().getByText('新增考试')).toBeVisible({ timeout: 15_000 });
    }

    async fillBasic(examName: string): Promise<void> {
        const d = this.dialog();
        await fillFormInput(d, '考试名称', examName);
        await pickFirstSelectOption(d, this.page, '资源语言');
        await pickFirstSelectOption(d, this.page, '考试类型');
        await setInputNumber(d, '考试时长', 60);
        await setInputNumber(d, '结束提醒', 5);
        await setInputNumber(d, '可考次数', 3);
        await clickRadioByText(d, '试卷类型', '固定试卷');
        await clickRadioByText(d, '是否有试卷分类', '无试卷分类');
        await pickFirstSelectOption(d, this.page, '多选题规则');
    }

    /** 添加固定试卷：打开子 dialog，点选首行，确定 */
    async addFirstFixedPaper(): Promise<void> {
        const d = this.dialog();
        await d.getByRole('button', { name: '添加试卷' }).click();
        const paperDlg = this.paperDialog();
        await expect(paperDlg).toBeVisible({ timeout: 15_000 });
        const firstRow = paperDlg.locator('.el-table__body tr').first();
        await expect(firstRow).toBeVisible({ timeout: 15_000 });
        await firstRow.click();
        await paperDlg.getByRole('button', { name: '确定' }).click();
        await expect(paperDlg).toBeHidden({ timeout: 10_000 });
    }

    async submitCreate(): Promise<void> {
        await this.dialog().getByRole('button', { name: /新\s*增/ }).click();
        await expect(this.page.getByText(/新增考试成功/)).toBeVisible({ timeout: 30_000 });
    }

    async findExamByName(examName: string): Promise<{ id: string; name: string }> {
        await this.goto();
        const search = this.page.getByPlaceholder('请输入考试名称');
        if (await search.isVisible().catch(() => false)) {
            await search.fill(examName);
            const btn = this.page.getByRole('button', { name: /查\s*询|搜索|刷新/ }).first();
            if (await btn.isVisible().catch(() => false)) {
                await btn.click();
            } else {
                await search.press('Enter');
            }
            await expect(this.page.locator('.el-table__body')).toBeVisible();
        }
        return readRowCellByName(this.page, '考试名称', examName, '考试ID');
    }

    /**
     * 优先新建（依赖环境有固定试卷）；仅打开/填表/选卷/提交失败时收编首行。
     * 提交成功后按名查找失败直接抛出。
     */
    async ensureExamId(uniqueName: string): Promise<{ id: string; name: string; created: boolean }> {
        await this.goto();
        if (await this.tableHasRows()) {
            const harvested = await this.harvestFirstExam();
            return { ...harvested, created: false };
        }
        try {
            await this.openCreate();
            await this.fillBasic(uniqueName);
            await this.addFirstFixedPaper();
            await this.submitCreate();
        } catch (err) {
            await this.page.keyboard.press('Escape').catch(() => undefined);
            await this.page.keyboard.press('Escape').catch(() => undefined);
            await this.goto();
            if (!(await this.tableHasRows())) {
                throw err;
            }
            const harvested = await this.harvestFirstExam();
            return { ...harvested, created: false };
        }
        const found = await this.findExamByName(uniqueName);
        if (!found.id?.trim()) {
            throw new Error(`新建考试成功但未能解析 examId（name=${uniqueName}）`);
        }
        return { ...found, id: found.id.trim(), created: true };
    }
}
