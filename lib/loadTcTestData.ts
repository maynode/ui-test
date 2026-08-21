import fs from 'fs';
import path from 'path';
import { loadCatalog } from './catalog';

type CertsJson = {
    firstCert: { id: string; [key: string]: unknown };
    [key: string]: unknown;
};

type CoursesJson = {
    firstCourse: { id: string; [key: string]: unknown };
    [key: string]: unknown;
};

export function loadCertsJson(): CertsJson {
    const raw = JSON.parse(
        fs.readFileSync(path.resolve('tests/testData/certs.json'), 'utf8'),
    ) as CertsJson;
    const catalog = loadCatalog();
    const fromCatalog = catalog?.certs?.[0] as { id?: string } | undefined;
    if (fromCatalog?.id) {
        raw.firstCert.id = fromCatalog.id;
    }
    return raw;
}

export function loadCoursesJson(): CoursesJson {
    const raw = JSON.parse(
        fs.readFileSync(path.resolve('tests/testData/courses.json'), 'utf8'),
    ) as CoursesJson;
    const catalog = loadCatalog();
    const fromCatalog = catalog?.courses?.[0] as { id?: string } | undefined;
    if (fromCatalog?.id) {
        raw.firstCourse.id = fromCatalog.id;
    }
    return raw;
}

export function getCertId(): string | undefined {
    const id = loadCertsJson().firstCert?.id?.trim();
    return id || undefined;
}

export function getCourseId(): string | undefined {
    const id = loadCoursesJson().firstCourse?.id?.trim();
    return id || undefined;
}
