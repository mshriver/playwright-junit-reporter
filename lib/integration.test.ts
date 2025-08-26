/**
 * Integration tests for the main validation functions
 * Tests the exported validation functions from the index module
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TestInfo } from '@playwright/test';
import {
  validateTestTags,
  validateTestAnnotations,
  validateTestMetadata,
  createMetadataValidationHook,
  mergeValidationConfig,
  DEFAULT_VALIDATION_CONFIG,
} from './index.js';

describe('Validation Functions Integration Tests', () => {
  describe('validateTestTags function', () => {
    it('should validate valid tags correctly', () => {
      const testInfo: Partial<TestInfo> = {
        title: 'Test with valid tags',
        file: 'test.spec.ts',
        tags: ['@smoke', '@regression', '@e2e'],
        annotations: [],
      };

      const result = validateTestTags(testInfo as TestInfo, {
        logWarnings: false,
      });

      assert.strictEqual(result.isValid, true);
      assert.deepStrictEqual(result.validTags, [
        '@smoke',
        '@regression',
        '@e2e',
      ]);
      assert.deepStrictEqual(result.invalidTags, []);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should identify invalid tags', () => {
      const testInfo: Partial<TestInfo> = {
        title: 'Test with invalid tags',
        file: 'test.spec.ts',
        tags: ['@smoke', '@invalid-tag', '@another-invalid'],
        annotations: [],
      };

      const result = validateTestTags(testInfo as TestInfo, {
        logWarnings: false,
      });

      assert.strictEqual(result.isValid, false);
      assert.deepStrictEqual(result.validTags, ['@smoke']);
      assert.deepStrictEqual(result.invalidTags, [
        '@invalid-tag',
        '@another-invalid',
      ]);
      assert.strictEqual(result.errors.length, 2);
      assert.ok(result.errors[0].includes('Invalid tag: "@invalid-tag"'));
      assert.ok(result.errors[1].includes('Invalid tag: "@another-invalid"'));
    });

    it('should handle empty tags array', () => {
      const testInfo: Partial<TestInfo> = {
        title: 'Test with no tags',
        file: 'test.spec.ts',
        tags: [],
        annotations: [],
      };

      const result = validateTestTags(testInfo as TestInfo, {
        logWarnings: false,
      });

      assert.strictEqual(result.isValid, true);
      assert.deepStrictEqual(result.validTags, []);
      assert.deepStrictEqual(result.invalidTags, []);
      assert.strictEqual(result.errors.length, 0);
    });
  });

  describe('validateTestAnnotations function', () => {
    it('should validate valid annotations correctly', () => {
      const testInfo: Partial<TestInfo> = {
        title: 'Test with valid annotations',
        file: 'test.spec.ts',
        tags: [],
        annotations: [
          { type: 'importance', description: 'critical' },
          { type: 'link', description: 'https://example.com' },
          { type: 'interface', description: 'api' },
          { type: 'category', description: 'unit' },
        ],
      };

      const result = validateTestAnnotations(testInfo as TestInfo, {
        logWarnings: false,
      });

      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.validAnnotations.length, 4);
      assert.strictEqual(result.invalidAnnotations.length, 0);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should identify invalid annotation types', () => {
      const testInfo: Partial<TestInfo> = {
        title: 'Test with invalid annotation type',
        file: 'test.spec.ts',
        tags: [],
        annotations: [
          { type: 'importance', description: 'critical' },
          { type: 'invalid-type', description: 'some value' },
        ],
      };

      const result = validateTestAnnotations(testInfo as TestInfo, {
        logWarnings: false,
      });

      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.validAnnotations.length, 1);
      assert.strictEqual(result.invalidAnnotations.length, 1);
      assert.strictEqual(result.errors.length, 1);
      assert.ok(result.errors[0].includes('type="invalid-type"'));
    });

    it('should identify invalid annotation values', () => {
      const testInfo: Partial<TestInfo> = {
        title: 'Test with invalid annotation values',
        file: 'test.spec.ts',
        tags: [],
        annotations: [
          { type: 'importance', description: 'urgent' }, // invalid value
          { type: 'interface', description: 'mobile' }, // invalid value
          { type: 'category', description: 'smoke' }, // invalid value
        ],
      };

      const result = validateTestAnnotations(testInfo as TestInfo, {
        logWarnings: false,
      });

      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.validAnnotations.length, 0);
      assert.strictEqual(result.invalidAnnotations.length, 3);
      assert.strictEqual(result.errors.length, 3);
    });

    it('should handle empty annotations array', () => {
      const testInfo: Partial<TestInfo> = {
        title: 'Test with no annotations',
        file: 'test.spec.ts',
        tags: [],
        annotations: [],
      };

      const result = validateTestAnnotations(testInfo as TestInfo, {
        logWarnings: false,
      });

      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.validAnnotations.length, 0);
      assert.strictEqual(result.invalidAnnotations.length, 0);
      assert.strictEqual(result.errors.length, 0);
    });
  });

  describe('validateTestMetadata function', () => {
    it('should validate both tags and annotations together', () => {
      const testInfo: Partial<TestInfo> = {
        title: 'Test with valid metadata',
        file: 'test.spec.ts',
        tags: ['@smoke', '@regression'],
        annotations: [
          { type: 'importance', description: 'high' },
          { type: 'category', description: 'function' },
        ],
      };

      const result = validateTestMetadata(testInfo as TestInfo, {
        logWarnings: false,
      });

      assert.strictEqual(result.isAllValid, true);
      assert.strictEqual(result.tags.isValid, true);
      assert.strictEqual(result.annotations.isValid, true);
      assert.strictEqual(result.allErrors.length, 0);
    });

    it('should identify mixed valid and invalid metadata', () => {
      const testInfo: Partial<TestInfo> = {
        title: 'Test with mixed metadata',
        file: 'test.spec.ts',
        tags: ['@smoke', '@invalid-tag'],
        annotations: [
          { type: 'importance', description: 'high' },
          { type: 'invalid-type', description: 'test' },
        ],
      };

      const result = validateTestMetadata(testInfo as TestInfo, {
        logWarnings: false,
      });

      assert.strictEqual(result.isAllValid, false);
      assert.strictEqual(result.tags.isValid, false);
      assert.strictEqual(result.annotations.isValid, false);
      assert.strictEqual(result.allErrors.length, 2);
      assert.ok(
        result.allErrors.some((error) => error.includes('@invalid-tag')),
      );
      assert.ok(
        result.allErrors.some((error) => error.includes('invalid-type')),
      );
    });
  });

  describe('createMetadataValidationHook function', () => {
    it('should create a function that validates metadata without failing', async () => {
      const validationHook = createMetadataValidationHook({
        failOnValidationError: false,
        logWarnings: false,
      });

      const testInfo: Partial<TestInfo> = {
        title: 'Test with invalid metadata',
        file: 'test.spec.ts',
        tags: ['@invalid-tag'],
        annotations: [{ type: 'invalid-type', description: 'test' }],
      };

      // Should not throw an error even with invalid metadata
      await assert.doesNotReject(async () => {
        await validationHook({}, testInfo as TestInfo);
      });
    });

    it('should create a function that fails on validation errors when configured', async () => {
      const validationHook = createMetadataValidationHook({
        failOnValidationError: true,
        logWarnings: false,
      });

      const testInfo: Partial<TestInfo> = {
        title: 'Test with invalid metadata',
        file: 'test.spec.ts',
        tags: ['@invalid-tag'],
        annotations: [{ type: 'invalid-type', description: 'test' }],
      };

      // Should throw an error with invalid metadata
      await assert.rejects(async () => {
        await validationHook({}, testInfo as TestInfo);
      }, /Test metadata validation failed/);
    });

    it('should not fail with valid metadata', async () => {
      const validationHook = createMetadataValidationHook({
        failOnValidationError: true,
        logWarnings: false,
      });

      const testInfo: Partial<TestInfo> = {
        title: 'Test with valid metadata',
        file: 'test.spec.ts',
        tags: ['@smoke'],
        annotations: [{ type: 'importance', description: 'high' }],
      };

      // Should not throw an error with valid metadata
      await assert.doesNotReject(async () => {
        await validationHook({}, testInfo as TestInfo);
      });
    });
  });

  describe('Configuration options', () => {
    it('should respect logWarnings configuration', () => {
      const testInfo: Partial<TestInfo> = {
        title: 'Test with invalid tag',
        file: 'test.spec.ts',
        tags: ['@invalid-tag'],
        annotations: [],
      };

      // Mock console.warn to capture warnings
      const originalWarn = console.warn;
      let warningCalled = false;
      console.warn = () => {
        warningCalled = true;
      };

      try {
        // Should log warnings when logWarnings is true (default)
        validateTestTags(testInfo as TestInfo, { logWarnings: true });
        assert.strictEqual(warningCalled, true);

        // Reset
        warningCalled = false;

        // Should not log warnings when logWarnings is false
        validateTestTags(testInfo as TestInfo, { logWarnings: false });
        assert.strictEqual(warningCalled, false);
      } finally {
        console.warn = originalWarn;
      }
    });

    it('should use custom logger when provided', () => {
      const testInfo: Partial<TestInfo> = {
        title: 'Test with invalid tag',
        file: 'test.spec.ts',
        tags: ['@invalid-tag'],
        annotations: [],
      };

      let customLoggerCalled = false;
      let loggedMessage = '';

      const customLogger = (message: string) => {
        customLoggerCalled = true;
        loggedMessage = message;
      };

      validateTestTags(testInfo as TestInfo, {
        logWarnings: true,
        logger: customLogger,
      });

      assert.strictEqual(customLoggerCalled, true);
      assert.ok(loggedMessage.includes('@invalid-tag'));
    });

    it('should handle null annotations correctly', () => {
      const testInfo: Partial<TestInfo> = {
        title: 'Test with null annotation',
        file: 'test.spec.ts',
        tags: [],
        annotations: [null as unknown as { type: string; description: string }],
      };

      const result = validateTestAnnotations(testInfo as TestInfo, {
        logWarnings: false,
      });

      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.validAnnotations.length, 0);
      assert.strictEqual(result.invalidAnnotations.length, 1);
      assert.strictEqual(result.errors.length, 1);
      assert.ok(result.errors[0].includes('must be an object, got object'));
    });

    it('should handle non-object annotations correctly', () => {
      const testInfo: Partial<TestInfo> = {
        title: 'Test with non-object annotation',
        file: 'test.spec.ts',
        tags: [],
        annotations: [
          'string annotation' as unknown as {
            type: string;
            description: string;
          },
          123 as unknown as { type: string; description: string },
        ],
      };

      const result = validateTestAnnotations(testInfo as TestInfo, {
        logWarnings: false,
      });

      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.validAnnotations.length, 0);
      assert.strictEqual(result.invalidAnnotations.length, 2);
      assert.strictEqual(result.errors.length, 2);
      assert.ok(result.errors[0].includes('must be an object, got string'));
      assert.ok(result.errors[1].includes('must be an object, got number'));
    });

    it('should handle annotations missing type property', () => {
      const testInfo: Partial<TestInfo> = {
        title: 'Test with annotation missing type',
        file: 'test.spec.ts',
        tags: [],
        annotations: [
          { description: 'missing type' } as unknown as {
            type: string;
            description: string;
          },
        ],
      };

      const result = validateTestAnnotations(testInfo as TestInfo, {
        logWarnings: false,
      });

      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.errors.length, 1);
      assert.ok(result.errors[0].includes('missing "type" property'));
    });

    it('should handle annotations missing description property', () => {
      const testInfo: Partial<TestInfo> = {
        title: 'Test with annotation missing description',
        file: 'test.spec.ts',
        tags: [],
        annotations: [
          { type: 'importance' } as unknown as {
            type: string;
            description: string;
          },
        ],
      };

      const result = validateTestAnnotations(testInfo as TestInfo, {
        logWarnings: false,
      });

      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.errors.length, 1);
      assert.ok(result.errors[0].includes('missing "description" property'));
    });
  });

  describe('Utility Functions', () => {
    it('should merge validation configurations correctly', () => {
      const baseConfig = {
        failOnValidationError: false,
        logWarnings: true,
        logger: console.warn,
      };

      const overrides = {
        failOnValidationError: true,
        logWarnings: false,
      };

      const result = mergeValidationConfig(baseConfig, overrides);

      assert.strictEqual(result.failOnValidationError, true);
      assert.strictEqual(result.logWarnings, false);
      assert.strictEqual(result.logger, console.warn); // Should preserve base config value
    });

    it('should handle empty overrides', () => {
      const baseConfig = {
        failOnValidationError: true,
        logWarnings: false,
      };

      const result = mergeValidationConfig(baseConfig, {});

      assert.deepStrictEqual(result, baseConfig);
    });

    it('should handle partial overrides', () => {
      const baseConfig = {
        failOnValidationError: false,
        logWarnings: true,
        logger: console.warn,
      };

      const overrides = {
        failOnValidationError: true,
      };

      const result = mergeValidationConfig(baseConfig, overrides);

      assert.strictEqual(result.failOnValidationError, true);
      assert.strictEqual(result.logWarnings, true);
      assert.strictEqual(result.logger, console.warn);
    });

    it('should work with DEFAULT_VALIDATION_CONFIG', () => {
      const overrides = {
        failOnValidationError: true,
      };

      const result = mergeValidationConfig(
        DEFAULT_VALIDATION_CONFIG,
        overrides,
      );

      assert.strictEqual(result.failOnValidationError, true);
      assert.strictEqual(
        result.logWarnings,
        DEFAULT_VALIDATION_CONFIG.logWarnings,
      );
      assert.strictEqual(result.logger, DEFAULT_VALIDATION_CONFIG.logger);
    });
  });
});
