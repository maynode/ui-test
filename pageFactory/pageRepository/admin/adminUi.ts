import { Locator, Page, expect } from '@playwright/test';

type Scope = Page | Locator;

function formItem(scope: Scope, label: string) {
    return scope.locator('.el-form-item').filter({ hasText: label });
}

/** 打开可见下拉并点选第一项可用 option，返回文案 */
export async function pickFirstSelectOption(scope: Scope, page: Page, label: string): Promise<string> {
    await page.keyboard.press('Escape').catch(() => undefined);
    const item = formItem(scope, label);
    const select = item.locator('.el-select').first();
    await select.click();

    const listboxOption = page.getByRole('listbox').last().getByRole('option').first();
    const legacyOption = page
        .locator('.el-select-dropdown:visible .el-select-dropdown__item:not(.is-disabled)')
        .first();

    const opt = (await listboxOption.isVisible().catch(() => false)) ? listboxOption : legacyOption;
    await opt.waitFor({ state: 'visible', timeout: 15_000 });
    const name = (await opt.innerText()).trim();
    await opt.click();
    await page.keyboard.press('Escape').catch(() => undefined);
    return name;
}

/** 课程分类等 el-cascader：逐级点第一个可用节点直到叶子 */
export async function pickFirstCascaderOption(scope: Scope, page: Page, label: string): Promise<string> {
    const item = formItem(scope, label);
    const cascader = item.locator('.el-cascader').first();
    if (await cascader.count()) {
        await cascader.click();
    } else {
        await item.getByRole('textbox').click();
    }
    const panel = page.locator('.el-cascader-panel:visible').first();
    await panel.waitFor({ state: 'visible', timeout: 15_000 });

    let picked = '';
    for (let depth = 0; depth < 4; depth++) {
        const panels = page.locator('.el-cascader-panel:visible');
        const panelCount = await panels.count();
        if (panelCount === 0) break;
        const panelAt = panels.nth(panelCount - 1);
        const node = panelAt.locator('.el-cascader-node:not(.is-disabled)').first();
        await node.waitFor({ state: 'visible', timeout: 10_000 });
        picked = (await node.innerText()).trim();
        await node.click();
        await page.waitForTimeout(200);
        if (!(await page.locator('.el-cascader-panel:visible').first().isVisible().catch(() => false))) {
            break;
        }
        if ((await panels.count()) <= panelCount) {
            break;
        }
    }
    return picked;
}

export async function fillFormInput(scope: Scope, label: string, value: string): Promise<void> {
    const input = formItem(scope, label).locator('input:not([type="hidden"])').first();
    await input.fill(value);
}

export async function setInputNumber(scope: Scope, label: string, value: number): Promise<void> {
    const input = formItem(scope, label).locator('.el-input-number input, input').first();
    await input.fill(String(value));
    await input.blur();
}

export async function clickRadioByText(scope: Scope, groupLabel: string, optionText: string): Promise<void> {
    await formItem(scope, groupLabel).getByText(optionText, { exact: false }).first().click();
}

/** 表体第一行指定列（按表头文案）单元格文本 */
export async function readFirstRowCell(page: Page, columnHeader: string): Promise<string> {
    const table = page.locator('.el-table').first();
    await expect(table.locator('.el-table__body tr').first()).toBeVisible({ timeout: 30_000 });
    const headers = table.locator('.el-table__header th');
    const count = await headers.count();
    let col = -1;
    const want = columnHeader.replace(/\s+/g, '');
    for (let i = 0; i < count; i++) {
        const text = (await headers.nth(i).innerText()).replace(/\s+/g, '');
        if (text.includes(want)) {
            col = i;
            break;
        }
    }
    if (col < 0) {
        throw new Error(`Column not found: ${columnHeader}`);
    }
    const cell = table.locator('.el-table__body tr').first().locator('td').nth(col);
    return (await cell.innerText()).trim();
}

export async function readRowCellByName(
    page: Page,
    nameColumn: string,
    nameValue: string,
    idColumn: string,
): Promise<{ id: string; name: string }> {
    const table = page.locator('.el-table').first();
    await expect(table.locator('.el-table__body tr').first()).toBeVisible({ timeout: 30_000 });
    const headers = table.locator('.el-table__header th');
    const count = await headers.count();
    let nameIdx = -1;
    let idIdx = -1;
    const nameWant = nameColumn.replace(/\s+/g, '');
    const idWant = idColumn.replace(/\s+/g, '');
    for (let i = 0; i < count; i++) {
        const text = (await headers.nth(i).innerText()).replace(/\s+/g, '');
        if (text.includes(nameWant)) nameIdx = i;
        if (text.includes(idWant)) idIdx = i;
    }
    if (nameIdx < 0 || idIdx < 0) {
        throw new Error(`Columns not found: ${nameColumn} / ${idColumn}`);
    }
    const rows = table.locator('.el-table__body tr');
    const rowCount = await rows.count();
    for (let r = 0; r < rowCount; r++) {
        const name = (await rows.nth(r).locator('td').nth(nameIdx).innerText()).trim();
        if (name.includes(nameValue)) {
            const id = (await rows.nth(r).locator('td').nth(idIdx).innerText()).trim();
            return { id, name };
        }
    }
    throw new Error(`Row not found for name containing: ${nameValue}`);
}

export function seedRunId(): string {
    return new Date().toISOString().replace(/[:.]/g, '-');
}

export function seedEnv(): string {
    return process.env.ENV || 'tcQa';
}
