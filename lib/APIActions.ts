import fs from 'fs';
import { APIResponse, expect } from '@playwright/test';

export class APIActions {

    getReqResHeaders(): Record<string, string> {
        const apiKey = process.env.REQRES_API_KEY;
        if (!apiKey) {
            throw new Error(`REQRES_API_KEY is required because ReqRes now expects an x-api-key header.`);
        }
        return { 'x-api-key': apiKey };
    }

    async verifyStatusCode(response: APIResponse): Promise<void> {
        await expect(response, `200 Status code was not displayed.`).toBeOK();
    }

    async verifyResponseBody(expectedResponseBodyParams: string, responsePart: JSON, responseType: string): Promise<void> {
        let status = true;
        let fieldNames = `Parameter`;
        const headers = expectedResponseBodyParams.split("|");
        const responseToString = JSON.stringify(responsePart).trim();
        for (let headerKey of headers) {
            if (!(responseToString.includes(headerKey.trim()))) {
                status = false;
                fieldNames = fieldNames + `, ` + headerKey;
                break;
            }
        }
        expect(status, `${fieldNames} was not present in ${responseType}`).toBe(true);
    }

    async verifyResponseHeader(expectedResponseHeaderParams: string, responsePart: Array<{ name: string, value: string }>, responseType: string): Promise<void> {
        const expectedHeaders = expectedResponseHeaderParams
            .split(`,`)
            .map(header => header.trim().toLowerCase())
            .filter(Boolean);
        const actualHeaders = new Set(responsePart.map(header => header.name.trim().toLowerCase()));
        const missingHeaders = expectedHeaders.filter(header => !actualHeaders.has(header));

        expect(missingHeaders, `${missingHeaders.join(`, `)} was not present in ${responseType}`).toEqual([]);
    }

    async readValuesFromTextFile(fileName: string): Promise<string> {
        return fs.readFileSync(`./utils/api/${fileName}.txt`, `utf8`);
    }
}
