import { Page, expect } from '@playwright/test';
import { adminPageUrl } from '@lib/tcAdminConfig';
import {
    fillFormInput,
    pickFirstSelectOption,
    readFirstRowCell,
    readRowCellByName,
} from './adminUi';

export class CourseManagePage {
    constructor(private page: Page) {}

    dialog() {
        return this.page.getByRole('dialog').filter({
            has: this.page.getByText(/新建课程|编辑课程|预览课程/),
        });
    }

    async goto(): Promise<void> {
        await this.page.goto(adminPageUrl('/system/course'), { waitUntil: 'domcontentloaded' });
        await this.page.getByRole('button', { name: '新增课程' }).waitFor({ state: 'visible', timeout: 30_000 });
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

    async harvestFirstCourse(): Promise<{ id: string; name: string }> {
        const id = await readFirstRowCell(this.page, '课程ID');
        const name = await readFirstRowCell(this.page, '课程名称');
        if (!id) throw new Error('课程表无课程ID');
        return { id, name };
    }

    async openCreate(): Promise<void> {
        await this.page.getByRole('button', { name: '新增课程' }).click();
        await expect(this.dialog().getByText('新建课程')).toBeVisible({ timeout: 15_000 });
    }

    /** 必填：分类 / 标签 / 付费 / 语言 / 名称；选项取下拉第一项 */
    async fillRequired(courseName: string): Promise<void> {
        const d = this.dialog();
        await pickFirstSelectOption(d, this.page, '课程分类');
        await pickFirstSelectOption(d, this.page, '付费类型');
        await pickFirstSelectOption(d, this.page, '资源语言');
        await pickFirstSelectOption(d, this.page, '课程标签');
        await fillFormInput(d, '课程名称', courseName);
    }

    async submitCreate(): Promise<void> {
        await this.dialog().getByRole('button', { name: /提\s*交/ }).click();
        await expect(this.page.getByText('新建课程成功')).toBeVisible({ timeout: 30_000 });
    }

    /** 新建成功后会跳学习内容；从 URL 解析 courseId，失败则回列表按名查找 */
    async resolveCourseIdAfterCreate(courseName: string): Promise<string> {
        const url = this.page.url();
        const fromUrl =
            url.match(/courseId[=/]([^&#?/]+)/i)?.[1] ||
            url.match(/\/course\/[^/]+\/([^&#?/]+)/i)?.[1] ||
            url.match(/#\/.*?\/(\d+)(?:\?|$)/)?.[1];
        if (fromUrl && /^\d+$/.test(fromUrl)) {
            return fromUrl;
        }

        await this.goto();
        const search = this.page.getByPlaceholder('课程名称');
        if (await search.isVisible().catch(() => false)) {
            await search.fill(courseName);
            const refresh = this.page.getByRole('button', { name: /查\s*询|搜索|刷新/ }).first();
            if (await refresh.isVisible().catch(() => false)) {
                await refresh.click();
            } else {
                await search.press('Enter');
            }
            await expect(this.page.locator('.el-table__body')).toBeVisible();
        }
        const found = await readRowCellByName(this.page, '课程名称', courseName, '课程ID');
        return found.id;
    }

    /**
     * 优先新建；仅「打开/填表/提交」失败时收编首行。
     * 提交已成功后的 ID 解析失败直接抛出，避免静默收编错行。
     */
    async ensureCourseId(uniqueName: string): Promise<{ id: string; name: string; created: boolean }> {
        await this.goto();
        try {
            await this.openCreate();
            await this.fillRequired(uniqueName);
            await this.submitCreate();
        } catch (err) {
            await this.page.keyboard.press('Escape').catch(() => undefined);
            await this.goto();
            if (!(await this.tableHasRows())) {
                throw err;
            }
            const harvested = await this.harvestFirstCourse();
            return { ...harvested, created: false };
        }
        const id = await this.resolveCourseIdAfterCreate(uniqueName);
        if (!id?.trim()) {
            throw new Error(`新建课程成功但未能解析 courseId（name=${uniqueName}）`);
        }
        return { id: id.trim(), name: uniqueName, created: true };
    }
}
