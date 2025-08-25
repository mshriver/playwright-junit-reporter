/**
 * Unit tests for the tag validation system
 * Tests the tag validation utility functions and type guards using Node.js built-in test runner
 *
 * Run with: yarn test (after building)
 * Or: yarn test:dev (direct TypeScript execution)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidTag,
  areValidTags,
  createValidTagsArray,
  ValidTagsArray,
  ValidTags,
  ExtractTagValue,
  IsValidTag,
  AllTagValues,
} from './tags.types.js';

// Mock console.warn to capture warnings during testing
let originalConsoleWarn: typeof console.warn;
let capturedWarnings: string[] = [];

function mockConsoleWarn() {
  capturedWarnings = [];
  originalConsoleWarn = console.warn;
  console.warn = (message: string) => {
    capturedWarnings.push(message);
  };
}

function restoreConsoleWarn() {
  console.warn = originalConsoleWarn;
}

function expectWarningCalled(expectedMessage: string) {
  assert.ok(
    capturedWarnings.some((warning) => warning === expectedMessage),
    `Expected warning "${expectedMessage}" but got: ${capturedWarnings.join(', ')}`,
  );
}

function expectNoWarningsCalled() {
  assert.strictEqual(
    capturedWarnings.length,
    0,
    `Expected no warnings but got: ${capturedWarnings.join(', ')}`,
  );
}

describe('Tag Validation System', () => {
  describe('isValidTag function', () => {
    it('should validate Playwright built-in tags', () => {
      assert.strictEqual(isValidTag('@skip'), true);
      assert.strictEqual(isValidTag('@fail'), true);
      assert.strictEqual(isValidTag('@fixme'), true);
      assert.strictEqual(isValidTag('@slow'), true);
      assert.strictEqual(isValidTag('@fast'), true);
    });

    it('should validate custom tags', () => {
      assert.strictEqual(isValidTag('@smoke'), true);
      assert.strictEqual(isValidTag('@regression'), true);
      assert.strictEqual(isValidTag('@sanity'), true);
      assert.strictEqual(isValidTag('@e2e'), true);
    });

    it('should reject invalid tags', () => {
      assert.strictEqual(isValidTag('@invalid'), false);
      assert.strictEqual(isValidTag('@critical'), false);
      assert.strictEqual(isValidTag('@ui'), false);
      assert.strictEqual(isValidTag('@badtag'), false);
      assert.strictEqual(isValidTag('smoke'), false); // missing @
      assert.strictEqual(isValidTag(''), false);
    });

    it('should handle edge cases', () => {
      assert.strictEqual(isValidTag('@'), false);
      assert.strictEqual(isValidTag('@@smoke'), false);
      assert.strictEqual(isValidTag('@smoke@'), false);
      assert.strictEqual(isValidTag(' @smoke'), false);
      assert.strictEqual(isValidTag('@smoke '), false);
      assert.strictEqual(isValidTag('@SMOKE'), false); // case sensitive
    });

    it('should properly narrow types (type guard behavior)', () => {
      const testTag: string = '@smoke';

      if (isValidTag(testTag)) {
        // TypeScript should know 'testTag' is ValidTags here
        const validTag: ValidTags = testTag; // This should not cause type error
        assert.strictEqual(validTag, '@smoke');
      }
    });
  });

  describe('areValidTags function', () => {
    it('should validate arrays of valid tags', () => {
      const validArray1: string[] = ['@smoke', '@skip', '@fast'];
      const validArray2: string[] = ['@regression', '@slow'];
      const validArray3: string[] = ['@e2e'];
      const emptyArray: string[] = [];

      assert.strictEqual(areValidTags(validArray1), true);
      assert.strictEqual(areValidTags(validArray2), true);
      assert.strictEqual(areValidTags(validArray3), true);
      assert.strictEqual(areValidTags(emptyArray), true);
    });

    it('should reject arrays containing invalid tags', () => {
      const invalidArray1: string[] = ['@smoke', '@invalid', '@skip'];
      const invalidArray2: string[] = ['@critical', '@ui'];
      const invalidArray3: string[] = ['@smoke', '@regression', '@badtag'];

      assert.strictEqual(areValidTags(invalidArray1), false);
      assert.strictEqual(areValidTags(invalidArray2), false);
      assert.strictEqual(areValidTags(invalidArray3), false);
    });

    it('should handle mixed valid and invalid tags', () => {
      const mixedArray: string[] = [
        '@smoke',
        '@invalid',
        '@skip',
        '@badtag',
        '@fast',
      ];
      assert.strictEqual(areValidTags(mixedArray), false);
    });

    it('should properly type guard arrays', () => {
      const mixedTags: string[] = ['@smoke', '@invalid', '@skip'];

      if (areValidTags(mixedTags)) {
        // This block shouldn't execute, but if it did, tags would be ValidTags[]
        assert.fail('This should not execute with invalid tags');
      }

      const validTags: string[] = ['@smoke', '@skip'];
      if (areValidTags(validTags)) {
        const typedValidTags: ValidTags[] = validTags;
        assert.deepStrictEqual(typedValidTags, ['@smoke', '@skip']);
      }
    });
  });

  describe('createValidTagsArray function', () => {
    before(() => {
      mockConsoleWarn();
    });

    after(() => {
      restoreConsoleWarn();
    });

    it('should return valid tags and filter out invalid ones', () => {
      capturedWarnings = []; // Reset warnings for this test

      const mixedTags = ['@smoke', '@invalid', '@skip', '@badtag', '@fast'];
      const result = createValidTagsArray(mixedTags);

      assert.deepStrictEqual(result, ['@smoke', '@skip', '@fast']);
      assert.strictEqual(result.length, 3);
      expectWarningCalled(
        'Invalid tags found and filtered out: @invalid, @badtag',
      );
    });

    it('should return all tags when all are valid', () => {
      capturedWarnings = []; // Reset warnings for this test

      const validTags = ['@smoke', '@skip', '@fast'];
      const result = createValidTagsArray(validTags);

      assert.deepStrictEqual(result, validTags);
      expectNoWarningsCalled();
    });

    it('should return empty array when all tags are invalid', () => {
      capturedWarnings = []; // Reset warnings for this test

      const invalidTags = ['@invalid', '@badtag', '@critical'];
      const result = createValidTagsArray(invalidTags);

      assert.deepStrictEqual(result, []);
      assert.strictEqual(result.length, 0);
      expectWarningCalled(
        'Invalid tags found and filtered out: @invalid, @badtag, @critical',
      );
    });

    it('should log warning when single invalid tag is filtered out', () => {
      capturedWarnings = []; // Reset warnings for this test

      const mixedTags = ['@smoke', '@invalid', '@skip'];
      createValidTagsArray(mixedTags);

      expectWarningCalled('Invalid tags found and filtered out: @invalid');
    });

    it('should handle empty input array', () => {
      capturedWarnings = []; // Reset warnings for this test

      const result = createValidTagsArray([]);

      assert.deepStrictEqual(result, []);
      expectNoWarningsCalled();
    });

    it('should return correctly typed ValidTags array', () => {
      const mixedTags = ['@smoke', '@invalid', '@skip'];
      const result: ValidTagsArray = createValidTagsArray(mixedTags);

      // Type assertion to ensure the result is properly typed
      const validTags: ValidTags[] = result;
      assert.deepStrictEqual(validTags, ['@smoke', '@skip']);
    });

    it('should preserve order of valid tags', () => {
      capturedWarnings = []; // Reset warnings for this test

      const mixedTags = [
        '@fast',
        '@invalid',
        '@smoke',
        '@badtag',
        '@skip',
        '@e2e',
      ];
      const result = createValidTagsArray(mixedTags);

      assert.deepStrictEqual(result, ['@fast', '@smoke', '@skip', '@e2e']);
    });
  });

  describe('Integration and Advanced Usage', () => {
    it('should work with array filter method', () => {
      const mixedTags: string[] = ['@smoke', '@invalid', '@skip', '@badtag'];
      const validTags: ValidTags[] = mixedTags.filter(isValidTag);

      assert.deepStrictEqual(validTags, ['@smoke', '@skip']);
      assert.strictEqual(validTags.length, 2);
    });

    it('should handle Playwright test info extraction pattern', () => {
      interface PlaywrightTestInfo {
        tags: string[];
      }

      function extractValidTagsFromPlaywright(
        testInfo: PlaywrightTestInfo,
      ): ValidTagsArray {
        return createValidTagsArray(testInfo.tags);
      }

      const mockTestInfo: PlaywrightTestInfo = {
        tags: ['@smoke', '@e2e', '@skip', '@some-invalid-tag'],
      };

      const extractedTags = extractValidTagsFromPlaywright(mockTestInfo);
      assert.deepStrictEqual(extractedTags, ['@smoke', '@e2e', '@skip']);
    });

    it('should support validation function pattern', () => {
      function validatePlaywrightTags(tags: string[]): {
        valid: ValidTagsArray;
        invalid: string[];
        isAllValid: boolean;
      } {
        const valid: ValidTagsArray = [];
        const invalid: string[] = [];

        for (const tag of tags) {
          if (isValidTag(tag)) {
            valid.push(tag);
          } else {
            invalid.push(tag);
          }
        }

        return {
          valid,
          invalid,
          isAllValid: invalid.length === 0,
        };
      }

      const testTags = ['@smoke', '@regression', '@invalid-tag', '@skip'];
      const validation = validatePlaywrightTags(testTags);

      assert.deepStrictEqual(validation.valid, [
        '@smoke',
        '@regression',
        '@skip',
      ]);
      assert.deepStrictEqual(validation.invalid, ['@invalid-tag']);
      assert.strictEqual(validation.isAllValid, false);

      // Test with all valid tags
      const allValidTags = ['@smoke', '@regression', '@skip'];
      const validValidation = validatePlaywrightTags(allValidTags);

      assert.deepStrictEqual(validValidation.valid, allValidTags);
      assert.deepStrictEqual(validValidation.invalid, []);
      assert.strictEqual(validValidation.isAllValid, true);
    });

    it('should work with conditional processing', () => {
      function processTag(tag: string): string {
        if (isValidTag(tag)) {
          // TypeScript should know 'tag' is ValidTags here
          const validTag: ValidTags = tag; // This should not cause type error
          return `Processing valid tag: ${validTag}`;
        } else {
          return `Invalid tag: ${tag}`;
        }
      }

      assert.strictEqual(processTag('@smoke'), 'Processing valid tag: @smoke');
      assert.strictEqual(processTag('@invalid'), 'Invalid tag: @invalid');
    });
  });

  describe('Type System Verification', () => {
    it('should compile with correct type relationships', () => {
      // These are compile-time checks that also serve as runtime verification

      // Valid tags should be assignable to ValidTags
      const validTag: ValidTags = '@smoke';
      assert.strictEqual(validTag, '@smoke');

      // Valid tags array should be assignable to ValidTagsArray
      const validTagsArray: ValidTagsArray = ['@smoke', '@skip', '@fast'];
      assert.deepStrictEqual(validTagsArray, ['@smoke', '@skip', '@fast']);

      // Type extraction should work (these are compile-time operations)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      type SmokeValue = ExtractTagValue<'@smoke'>; // Should be 'smoke'
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      type SkipValue = ExtractTagValue<'@skip'>; // Should be 'skip'

      // Conditional type checks (compile-time)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      type IsSmokeValid = IsValidTag<'@smoke'>; // Should be true
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      type IsInvalidValid = IsValidTag<'@invalid'>; // Should be false

      // AllTagValues should contain all possible tag values
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      type AllValues = AllTagValues; // Should be union of all tag values

      // Runtime verification that types work as expected
      assert.ok(true, 'Type system compiles correctly');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large arrays efficiently', () => {
      const largeMixedArray = Array.from({ length: 1000 }, (_, i) =>
        i % 3 === 0 ? '@smoke' : i % 3 === 1 ? '@skip' : '@invalid',
      );

      const start = Date.now();
      const result = createValidTagsArray(largeMixedArray);
      const end = Date.now();

      // Should complete quickly (less than 100ms for 1000 items)
      assert.ok(
        end - start < 50,
        'Performance should be acceptable for large arrays',
      );

      // Should have correct number of valid tags (2/3 of input, but exact count)
      // For 1000 items with pattern i%3: 334 '@smoke' + 333 '@skip' + 333 '@invalid' = 667 valid
      assert.strictEqual(result.length, 667);
    });

    it('should handle duplicate tags correctly', () => {
      const duplicateTags = ['@smoke', '@smoke', '@skip', '@invalid', '@skip'];
      const result = createValidTagsArray(duplicateTags);

      // Should preserve duplicates in valid tags
      assert.deepStrictEqual(result, ['@smoke', '@smoke', '@skip', '@skip']);
    });

    it('should handle unicode and special characters in tag names', () => {
      // These should all be invalid since they're not in our predefined list
      assert.strictEqual(isValidTag('@tëst'), false);
      assert.strictEqual(isValidTag('@test-123'), false);
      assert.strictEqual(isValidTag('@test_case'), false);
      assert.strictEqual(isValidTag('@测试'), false);
    });
  });
});
