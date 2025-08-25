/**
 * Automatic Metadata Validation Fixture for Playwright
 *
 * This fixture automatically validates test metadata (tags and annotations)
 * without requiring manual beforeEach setup. Just import and use this test
 * object instead of the default Playwright test.
 *
 * Usage:
 * 1. Import { test } from this file instead of from '@playwright/test'
 * 2. Tests will automatically validate metadata on each run
 * 3. Profit
 */

import { test as base, expect, TestInfo } from '@playwright/test';
import { validateTestMetadata, ValidationConfig } from '../lib/index.js';

// Configuration for metadata validation
const VALIDATION_CONFIG: ValidationConfig = {
  // Fail tests on validation errors in CI, warn only in development
  failOnValidationError:
    process.env.CI === 'true' || process.env.FAIL_ON_METADATA_ERRORS === 'true',
  logWarnings: true,
  logger: (message: string) => {
    console.warn(`[Metadata Validation] ${message}`);
  },
};

// Define fixtures type
type MetadataValidationFixtures = {
  /** Automatic metadata validation fixture */
  metadataValidation: void;
};

/**
 * Extended test with automatic metadata validation
 *
 * This test object includes an auto fixture that validates test metadata
 * before each test runs.
 */
export const test = base.extend<MetadataValidationFixtures>({
  metadataValidation: [
    async ({}, use, testInfo: TestInfo) => {
      // Validate the test metadata
      const validationResult = validateTestMetadata(testInfo, {
        ...VALIDATION_CONFIG,
        logWarnings: false, // Handle logging ourselves for better control
      });

      if (!validationResult.isAllValid) {
        const errorMessages = validationResult.allErrors;

        if (VALIDATION_CONFIG.logWarnings) {
          errorMessages.forEach((error) => {
            if (VALIDATION_CONFIG.logger) {
              VALIDATION_CONFIG.logger(error);
            }
          });
        }

        if (VALIDATION_CONFIG.failOnValidationError) {
          const fullErrorMessage = `Test metadata validation failed for "${testInfo.title}":\n${errorMessages.join('\n')}`;
          throw new Error(fullErrorMessage);
        }
      }

      await use(); // void but must call use
    },
    { auto: true },
  ], // Auto fixture runs automatically before each test
});

// Re-export expect for convenience
export { expect };

// Export types for advanced usage
export type { MetadataValidationFixtures };

/**
 * Override default configuration for specific test files
 *
 * @example
 * ```typescript
 * import { test, expect, configureValidation } from './fixtures/metadata-validation';
 *
 * configureValidation({ failOnValidationError: true });
 *
 * test('My test', async ({ page }) => {
 *   // This test will fail if metadata is invalid
 * });
 * ```
 */
export function configureValidation(config: Partial<ValidationConfig>): void {
  Object.assign(VALIDATION_CONFIG, config);
}
