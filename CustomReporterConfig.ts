import { Reporter, TestCase, TestError, TestResult, TestStep } from "@playwright/test/reporter";
const winston = require(`winston`);
const envLabel = process.env.ENV || process.env.npm_config_ENV || 'unknown-env';

const console = new winston.transports.Console();
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        // - Write all logs with importance level of `info` or less than it
        new winston.transports.File({ filename: 'logs/info.log', level: 'info' }),
    ],
});

// Writes logs to console
logger.add(console);

export default class CustomReporterConfig implements Reporter {

    onTestBegin(test: TestCase): void {
        logger.info(`[ENV=${envLabel}] Test Case Started : ${test.title}`);
    }

    onTestEnd(test: TestCase, result: TestResult): void {
        logger.info(`[ENV=${envLabel}] Test Case Completed : ${test.title} Status : ${result.status}`);
    }

    onStepBegin(test: TestCase, result: TestResult, step: TestStep): void {
        if (step.category === `test.step`) {
            logger.info(`[ENV=${envLabel}] Executing Step : ${step.title}`);
        }
    }

    onError(error: TestError): void {
        logger.error(error.message);
    }
}