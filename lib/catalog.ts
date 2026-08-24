import fs from 'fs';
import path from 'path';

export type CatalogAuth = {
    account: string;
    productName: string;
    start: string;
    end: string;
    createdAt: string;
};

export type CatalogEntity = {
    id: string;
    name?: string;
    createdAt?: string;
    [key: string]: unknown;
};

export type Catalog = {
    version: 1;
    runId: string;
    env: string;
    auth: CatalogAuth[];
    courses: CatalogEntity[];
    exams: CatalogEntity[];
    certs: CatalogEntity[];
    certificates: CatalogEntity[];
};

export const CATALOG_PATH = path.resolve(process.cwd(), 'tests/testData/generated/catalog.json');

export function emptyCatalog(runId: string, env: string): Catalog {
    return { version: 1, runId, env, auth: [], courses: [], exams: [], certs: [], certificates: [] };
}

export function loadCatalog(): Catalog | null {
    if (!fs.existsSync(CATALOG_PATH)) return null;
    return JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8')) as Catalog;
}

export function saveCatalog(catalog: Catalog): void {
    fs.mkdirSync(path.dirname(CATALOG_PATH), { recursive: true });
    fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
}

function ensureCatalog(runId: string, env: string): Catalog {
    return loadCatalog() ?? emptyCatalog(runId, env);
}

export function appendAuth(entry: CatalogAuth, runId: string, env: string): Catalog {
    const current = ensureCatalog(runId, env);
    current.auth.push(entry);
    current.runId = runId;
    current.env = env;
    saveCatalog(current);
    return current;
}

export function appendCert(entry: CatalogEntity, runId: string, env: string): Catalog {
    const current = ensureCatalog(runId, env);
    if (!entry.id?.trim()) {
        throw new Error('appendCert: entry.id is required');
    }
    current.certs.push(entry);
    current.runId = runId;
    current.env = env;
    saveCatalog(current);
    return current;
}

export function appendCourse(entry: CatalogEntity, runId: string, env: string): Catalog {
    const current = ensureCatalog(runId, env);
    if (!entry.id?.trim()) {
        throw new Error('appendCourse: entry.id is required');
    }
    current.courses.push(entry);
    current.runId = runId;
    current.env = env;
    saveCatalog(current);
    return current;
}

export function appendExam(entry: CatalogEntity, runId: string, env: string): Catalog {
    const current = ensureCatalog(runId, env);
    if (!entry.id?.trim()) {
        throw new Error('appendExam: entry.id is required');
    }
    current.exams.push(entry);
    current.runId = runId;
    current.env = env;
    saveCatalog(current);
    return current;
}
