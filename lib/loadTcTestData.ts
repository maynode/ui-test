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

type ExamsJson = {
    firstExam: { id: string; [key: string]: unknown };
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

/** 可选：静态 exams.json 不存在时仅从 catalog 取 */
export function getExamId(): string | undefined {
    const catalog = loadCatalog();
    const fromCatalog = catalog?.exams?.[0] as { id?: string } | undefined;
    if (fromCatalog?.id?.trim()) {
        return fromCatalog.id.trim();
    }
    const examsPath = path.resolve('tests/testData/exams.json');
    if (!fs.existsSync(examsPath)) {
        return undefined;
    }
    const raw = JSON.parse(fs.readFileSync(examsPath, 'utf8')) as ExamsJson;
    const id = raw.firstExam?.id?.trim();
    return id || undefined;
}

export function getCertId(): string | undefined {
    const id = loadCertsJson().firstCert?.id?.trim();
    return id || undefined;
}

export function getCertName(): string | undefined {
    const catalog = loadCatalog();
    const name = catalog?.certs?.[0]?.name?.trim();
    return name || undefined;
}

export function getCourseId(): string | undefined {
    const id = loadCoursesJson().firstCourse?.id?.trim();
    return id || undefined;
}
