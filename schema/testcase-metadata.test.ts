/**
 * Unit tests for the testcase metadata system
 * Tests the testcase metadata composition, validation, and utility functions
 *
 * Run with: yarn test (after building)
 * Or: yarn test:dev (direct TypeScript execution)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  TestCaseMetadata,
  TestCaseMetadataInput,
  validateTestCaseMetadata,
  createTestCaseMetadataFromArrays,
  createTestCaseMetadata,
  extractAnnotationsFromMetadata,
  extractTagsFromMetadata,
  hasRequiredMetadata,
  mergeTestCaseMetadata
} from './testcase-metadata.types.js';

import {
  createImportanceAnnotation,
  createCategoryAnnotation,
  createAssigneeAnnotation,
  createInterfaceAnnotation,
  createLinkAnnotation,
  ValidAnnotation
} from './annotations.types.js';

import {
  createValidTagsArray
} from './tags.types.js';

// Mock console.warn to capture warnings during testing
let originalConsoleWarn: typeof console.warn;
let warningMessages: string[] = [];

function expectWarningCalled(expectedMessage: string) {
  const found = warningMessages.some(msg => msg.includes(expectedMessage));
  assert.ok(found, `Expected warning "${expectedMessage}" but got: ${warningMessages.join(', ')}`);
}

before(() => {
  originalConsoleWarn = console.warn;
  console.warn = (message: string) => {
    warningMessages.push(message);
  };
});

after(() => {
  console.warn = originalConsoleWarn;
});

describe('TestCase Metadata System', () => {
  describe('TestCaseMetadata interface structure', () => {
    it('should create valid metadata with required fields only', () => {
      const metadata: TestCaseMetadata = {
        importance: createImportanceAnnotation('critical'),
        category: createCategoryAnnotation('unit')
      };

      assert.strictEqual(metadata.importance.type, 'importance');
      assert.strictEqual(metadata.importance.description, 'critical');
      assert.strictEqual(metadata.category.type, 'category');
      assert.strictEqual(metadata.category.description, 'unit');
    });

    it('should create valid metadata with all optional fields', () => {
      const metadata: TestCaseMetadata = {
        importance: createImportanceAnnotation('high'),
        category: createCategoryAnnotation('integration'),
        assignee: createAssigneeAnnotation('team@example.com'),
        interface: createInterfaceAnnotation('api'),
        links: [
          createLinkAnnotation('https://docs.example.com'),
          createLinkAnnotation('https://api.example.com')
        ],
        tags: createValidTagsArray(['@smoke', '@regression'])
      };

      assert.strictEqual(metadata.importance.description, 'high');
      assert.strictEqual(metadata.category.description, 'integration');
      assert.strictEqual(metadata.assignee?.description, 'team@example.com');
      assert.strictEqual(metadata.interface?.description, 'api');
      assert.strictEqual(metadata.links?.length, 2);
      assert.strictEqual(metadata.tags?.length, 2);
    });

    it('should support custom annotation fields', () => {
      const metadata: TestCaseMetadata = {
        importance: createImportanceAnnotation('medium'),
        category: createCategoryAnnotation('function'),
        customField: createLinkAnnotation('https://custom.example.com'),
        customArray: [
          createLinkAnnotation('https://custom1.example.com'),
          createLinkAnnotation('https://custom2.example.com')
        ]
      };

      assert.strictEqual(metadata.importance.description, 'medium');
      assert.strictEqual(metadata.category.description, 'function');

      const customField = metadata.customField as ValidAnnotation;
      assert.strictEqual(customField.type, 'link');
      assert.strictEqual(customField.description, 'https://custom.example.com');

      const customArray = metadata.customArray as ValidAnnotation[];
      assert.strictEqual(customArray.length, 2);
      assert.strictEqual(customArray[0].description, 'https://custom1.example.com');
    });
  });

  describe('validateTestCaseMetadata function', () => {
    it('should validate complete valid metadata', () => {
      const validMetadata = {
        importance: createImportanceAnnotation('critical'),
        category: createCategoryAnnotation('system'),
        assignee: createAssigneeAnnotation('dev@example.com'),
        interface: createInterfaceAnnotation('ui'),
        links: [createLinkAnnotation('https://example.com')],
        tags: createValidTagsArray(['@smoke'])
      };

      assert.strictEqual(validateTestCaseMetadata(validMetadata), true);
    });

    it('should validate minimal valid metadata', () => {
      const minimalMetadata = {
        importance: createImportanceAnnotation('low'),
        category: createCategoryAnnotation('unit')
      };

      assert.strictEqual(validateTestCaseMetadata(minimalMetadata), true);
    });

    it('should reject metadata missing required fields', () => {
      // Missing importance
      assert.strictEqual(validateTestCaseMetadata({
        category: createCategoryAnnotation('unit')
      }), false);

      // Missing category
      assert.strictEqual(validateTestCaseMetadata({
        importance: createImportanceAnnotation('high')
      }), false);

      // Missing both
      assert.strictEqual(validateTestCaseMetadata({}), false);
    });

    it('should reject metadata with invalid annotation objects', () => {
      // Invalid importance annotation
      assert.strictEqual(validateTestCaseMetadata({
        importance: { type: 'importance', description: 'invalid-value' },
        category: createCategoryAnnotation('unit')
      }), false);

      // Invalid category annotation
      assert.strictEqual(validateTestCaseMetadata({
        importance: createImportanceAnnotation('high'),
        category: { type: 'category', description: 'invalid-category' }
      }), false);

      // Invalid assignee annotation
      assert.strictEqual(validateTestCaseMetadata({
        importance: createImportanceAnnotation('high'),
        category: createCategoryAnnotation('unit'),
        assignee: { type: 'invalid', description: 'test' }
      }), false);
    });

    it('should reject non-object input', () => {
      assert.strictEqual(validateTestCaseMetadata(null), false);
      assert.strictEqual(validateTestCaseMetadata(undefined), false);
      assert.strictEqual(validateTestCaseMetadata('string'), false);
      assert.strictEqual(validateTestCaseMetadata(123), false);
      assert.strictEqual(validateTestCaseMetadata([]), false);
    });

    it('should reject metadata with invalid tags', () => {
      assert.strictEqual(validateTestCaseMetadata({
        importance: createImportanceAnnotation('high'),
        category: createCategoryAnnotation('unit'),
        tags: ['@invalid-tag', '@another-invalid']
      }), false);
    });

    it('should reject metadata with invalid links array', () => {
      assert.strictEqual(validateTestCaseMetadata({
        importance: createImportanceAnnotation('high'),
        category: createCategoryAnnotation('unit'),
        links: [{ type: 'invalid', description: 'test' }]
      }), false);
    });
  });

  describe('createTestCaseMetadataFromArrays function', () => {
    it('should create metadata from valid tags and annotations arrays', () => {
      warningMessages = [];

      const tags = ['@smoke', '@regression', '@invalid-tag'];
      const annotations = [
        createImportanceAnnotation('critical'),
        createCategoryAnnotation('integration'),
        createAssigneeAnnotation('team@example.com'),
        createLinkAnnotation('https://docs.example.com'),
        { type: 'invalid', description: 'test' } // invalid annotation
      ];

      const result = createTestCaseMetadataFromArrays(tags, annotations);

      assert.ok(result !== null);
      assert.strictEqual(result.importance.description, 'critical');
      assert.strictEqual(result.category.description, 'integration');
      assert.strictEqual(result.assignee?.description, 'team@example.com');
      assert.strictEqual(result.links?.length, 1);
      assert.strictEqual(result.links?.[0].description, 'https://docs.example.com');
      assert.strictEqual(result.tags?.length, 2); // filtered valid tags
      assert.ok(result.tags?.includes('@smoke'));
      assert.ok(result.tags?.includes('@regression'));
    });

    it('should return null when required annotations are missing', () => {
      warningMessages = [];

      const tags = ['@smoke'];
      const annotations = [
        createAssigneeAnnotation('team@example.com'),
        createLinkAnnotation('https://docs.example.com')
        // Missing importance and category
      ];

      const result = createTestCaseMetadataFromArrays(tags, annotations);

      assert.strictEqual(result, null);
      expectWarningCalled('Missing required annotations: importance and category are required');
    });

    it('should handle empty arrays', () => {
      warningMessages = [];

      const result = createTestCaseMetadataFromArrays([], []);
      assert.strictEqual(result, null);
    });

    it('should handle multiple links', () => {
      const tags = ['@e2e'];
      const annotations = [
        createImportanceAnnotation('high'),
        createCategoryAnnotation('system'),
        createLinkAnnotation('https://docs.example.com'),
        createLinkAnnotation('https://api.example.com'),
        createLinkAnnotation('https://repo.example.com')
      ];

      const result = createTestCaseMetadataFromArrays(tags, annotations);

      assert.ok(result !== null);
      assert.strictEqual(result.links?.length, 3);
      assert.strictEqual(result.links?.[0].description, 'https://docs.example.com');
      assert.strictEqual(result.links?.[1].description, 'https://api.example.com');
      assert.strictEqual(result.links?.[2].description, 'https://repo.example.com');
    });

    it('should not include tags or optional fields when none are present', () => {
      const tags: string[] = [];
      const annotations = [
        createImportanceAnnotation('low'),
        createCategoryAnnotation('unit')
      ];

      const result = createTestCaseMetadataFromArrays(tags, annotations);

      assert.ok(result !== null);
      assert.strictEqual(result.tags, undefined);
      assert.strictEqual(result.assignee, undefined);
      assert.strictEqual(result.interface, undefined);
      assert.strictEqual(result.links, undefined);
    });
  });

  describe('createTestCaseMetadata function', () => {
    it('should create metadata from input structure', () => {
      const input: TestCaseMetadataInput = {
        importance: 'critical',
        category: 'integration',
        assignee: 'dev@example.com',
        interface: 'api',
        links: ['https://docs.example.com', 'https://api.example.com'],
        tags: ['@smoke', '@regression']
      };

      const result = createTestCaseMetadata(input);

      assert.strictEqual(result.importance.description, 'critical');
      assert.strictEqual(result.category.description, 'integration');
      assert.strictEqual(result.assignee?.description, 'dev@example.com');
      assert.strictEqual(result.interface?.description, 'api');
      assert.strictEqual(result.links?.length, 2);
      assert.strictEqual(result.tags?.length, 2);
    });

    it('should create minimal metadata with required fields only', () => {
      const input: TestCaseMetadataInput = {
        importance: 'medium',
        category: 'unit'
      };

      const result = createTestCaseMetadata(input);

      assert.strictEqual(result.importance.description, 'medium');
      assert.strictEqual(result.category.description, 'unit');
      assert.strictEqual(result.assignee, undefined);
      assert.strictEqual(result.interface, undefined);
      assert.strictEqual(result.links, undefined);
      assert.strictEqual(result.tags, undefined);
    });

    it('should handle empty arrays gracefully', () => {
      const input: TestCaseMetadataInput = {
        importance: 'high',
        category: 'function',
        links: [],
        tags: []
      };

      const result = createTestCaseMetadata(input);

      assert.strictEqual(result.importance.description, 'high');
      assert.strictEqual(result.category.description, 'function');
      assert.strictEqual(result.links, undefined); // empty array not included
      assert.strictEqual(result.tags, undefined); // empty array not included
    });

    it('should support custom fields in input', () => {
      const input: TestCaseMetadataInput = {
        importance: 'low',
        category: 'performance',
        customField: 'custom-value',
        customNumber: 42
      };

      const result = createTestCaseMetadata(input);

      assert.strictEqual(result.importance.description, 'low');
      assert.strictEqual(result.category.description, 'performance');
      // Custom fields are preserved in input but not processed into annotations
      // This is expected behavior as they need explicit handling
    });
  });

  describe('extractAnnotationsFromMetadata function', () => {
    it('should extract all annotations from complete metadata', () => {
      const metadata: TestCaseMetadata = {
        importance: createImportanceAnnotation('critical'),
        category: createCategoryAnnotation('system'),
        assignee: createAssigneeAnnotation('team@example.com'),
        interface: createInterfaceAnnotation('ui'),
        links: [
          createLinkAnnotation('https://docs.example.com'),
          createLinkAnnotation('https://api.example.com')
        ]
      };

      const annotations = extractAnnotationsFromMetadata(metadata);

      assert.strictEqual(annotations.length, 6); // importance + category + assignee + interface + 2 links
      assert.strictEqual(annotations[0].type, 'importance');
      assert.strictEqual(annotations[1].type, 'category');
      assert.strictEqual(annotations[2].type, 'assignee');
      assert.strictEqual(annotations[3].type, 'interface');
      assert.strictEqual(annotations[4].type, 'link');
    });

    it('should extract only required annotations from minimal metadata', () => {
      const metadata: TestCaseMetadata = {
        importance: createImportanceAnnotation('medium'),
        category: createCategoryAnnotation('unit')
      };

      const annotations = extractAnnotationsFromMetadata(metadata);

      assert.strictEqual(annotations.length, 2);
      assert.strictEqual(annotations[0].type, 'importance');
      assert.strictEqual(annotations[1].type, 'category');
    });

    it('should preserve annotation order', () => {
      const metadata: TestCaseMetadata = {
        importance: createImportanceAnnotation('high'),
        category: createCategoryAnnotation('integration'),
        links: [
          createLinkAnnotation('https://first.com'),
          createLinkAnnotation('https://second.com'),
          createLinkAnnotation('https://third.com')
        ]
      };

      const annotations = extractAnnotationsFromMetadata(metadata);

      assert.strictEqual(annotations.length, 5); // importance + category + 3 links
      assert.strictEqual(annotations[2].description, 'https://first.com');
      assert.strictEqual(annotations[3].description, 'https://second.com');
      assert.strictEqual(annotations[4].description, 'https://third.com');
    });
  });

  describe('extractTagsFromMetadata function', () => {
    it('should extract tags from metadata with tags', () => {
      const metadata: TestCaseMetadata = {
        importance: createImportanceAnnotation('critical'),
        category: createCategoryAnnotation('system'),
        tags: createValidTagsArray(['@smoke', '@regression', '@e2e'])
      };

      const tags = extractTagsFromMetadata(metadata);

      assert.strictEqual(tags.length, 3);
      assert.ok(tags.includes('@smoke'));
      assert.ok(tags.includes('@regression'));
      assert.ok(tags.includes('@e2e'));
    });

    it('should return empty array from metadata without tags', () => {
      const metadata: TestCaseMetadata = {
        importance: createImportanceAnnotation('low'),
        category: createCategoryAnnotation('unit')
      };

      const tags = extractTagsFromMetadata(metadata);

      assert.strictEqual(tags.length, 0);
      assert.ok(Array.isArray(tags));
    });
  });

  describe('hasRequiredMetadata function', () => {
    it('should return true for complete metadata', () => {
      const metadata: TestCaseMetadata = {
        importance: createImportanceAnnotation('high'),
        category: createCategoryAnnotation('integration'),
        assignee: createAssigneeAnnotation('dev@example.com')
      };

      assert.strictEqual(hasRequiredMetadata(metadata), true);
    });

    it('should return true for minimal valid metadata', () => {
      const metadata: Partial<TestCaseMetadata> = {
        importance: createImportanceAnnotation('medium'),
        category: createCategoryAnnotation('unit')
      };

      assert.strictEqual(hasRequiredMetadata(metadata), true);
    });

    it('should return false for incomplete metadata', () => {
      // Missing importance
      assert.strictEqual(hasRequiredMetadata({
        category: createCategoryAnnotation('unit')
      }), false);

      // Missing category
      assert.strictEqual(hasRequiredMetadata({
        importance: createImportanceAnnotation('high')
      }), false);

      // Missing both
      assert.strictEqual(hasRequiredMetadata({}), false);

      // Has other fields but missing required
      assert.strictEqual(hasRequiredMetadata({
        assignee: createAssigneeAnnotation('dev@example.com'),
        tags: createValidTagsArray(['@smoke'])
      }), false);
    });
  });

  describe('mergeTestCaseMetadata function', () => {
    it('should merge multiple metadata objects', () => {
      warningMessages = [];

      const metadata1: Partial<TestCaseMetadata> = {
        importance: createImportanceAnnotation('critical'),
        tags: createValidTagsArray(['@smoke'])
      };

      const metadata2: Partial<TestCaseMetadata> = {
        category: createCategoryAnnotation('integration'),
        assignee: createAssigneeAnnotation('team@example.com'),
        tags: createValidTagsArray(['@regression'])
      };

      const metadata3: Partial<TestCaseMetadata> = {
        interface: createInterfaceAnnotation('api'),
        tags: createValidTagsArray(['@e2e'])
      };

      const result = mergeTestCaseMetadata(metadata1, metadata2, metadata3);

      assert.ok(result !== null);
      assert.strictEqual(result.importance?.description, 'critical');
      assert.strictEqual(result.category?.description, 'integration');
      assert.strictEqual(result.assignee?.description, 'team@example.com');
      assert.strictEqual(result.interface?.description, 'api');
      assert.strictEqual(result.tags?.length, 3);
      assert.ok(result.tags?.includes('@smoke'));
      assert.ok(result.tags?.includes('@regression'));
      assert.ok(result.tags?.includes('@e2e'));
    });

    it('should handle overlapping fields (last one wins)', () => {
      const metadata1: Partial<TestCaseMetadata> = {
        importance: createImportanceAnnotation('low'),
        category: createCategoryAnnotation('unit'),
        assignee: createAssigneeAnnotation('dev1@example.com')
      };

      const metadata2: Partial<TestCaseMetadata> = {
        importance: createImportanceAnnotation('critical'), // overwrites
        assignee: createAssigneeAnnotation('dev2@example.com') // overwrites
      };

      const result = mergeTestCaseMetadata(metadata1, metadata2);

      assert.ok(result !== null);
      assert.strictEqual(result.importance?.description, 'critical'); // from metadata2
      assert.strictEqual(result.category?.description, 'unit'); // from metadata1
      assert.strictEqual(result.assignee?.description, 'dev2@example.com'); // from metadata2
    });

    it('should return null when merged result lacks required fields', () => {
      warningMessages = [];

      const metadata1: Partial<TestCaseMetadata> = {
        assignee: createAssigneeAnnotation('dev@example.com'),
        tags: createValidTagsArray(['@smoke'])
      };

      const metadata2: Partial<TestCaseMetadata> = {
        interface: createInterfaceAnnotation('ui'),
        tags: createValidTagsArray(['@regression'])
      };

      const result = mergeTestCaseMetadata(metadata1, metadata2);

      assert.strictEqual(result, null);
      expectWarningCalled('Merged metadata missing required fields: importance and category');
    });

    it('should handle empty input gracefully', () => {
      const result = mergeTestCaseMetadata();
      assert.strictEqual(result, null);
    });

    it('should merge tags from all sources', () => {
      const metadata1: Partial<TestCaseMetadata> = {
        importance: createImportanceAnnotation('high'),
        category: createCategoryAnnotation('function'),
        tags: createValidTagsArray(['@smoke', '@fast'])
      };

      const metadata2: Partial<TestCaseMetadata> = {
        tags: createValidTagsArray(['@regression', '@slow'])
      };

      const metadata3: Partial<TestCaseMetadata> = {
        tags: createValidTagsArray(['@e2e'])
      };

      const result = mergeTestCaseMetadata(metadata1, metadata2, metadata3);

      assert.ok(result !== null);
      assert.strictEqual(result.tags?.length, 5);
      assert.ok(result.tags?.includes('@smoke'));
      assert.ok(result.tags?.includes('@fast'));
      assert.ok(result.tags?.includes('@regression'));
      assert.ok(result.tags?.includes('@slow'));
      assert.ok(result.tags?.includes('@e2e'));
    });

    it('should handle duplicate tags', () => {
      const metadata1: Partial<TestCaseMetadata> = {
        importance: createImportanceAnnotation('medium'),
        category: createCategoryAnnotation('system'),
        tags: createValidTagsArray(['@smoke', '@regression'])
      };

      const metadata2: Partial<TestCaseMetadata> = {
        tags: createValidTagsArray(['@smoke', '@e2e']) // @smoke is duplicate
      };

      const result = mergeTestCaseMetadata(metadata1, metadata2);

      assert.ok(result !== null);
      assert.strictEqual(result.tags?.length, 4); // duplicates preserved
      assert.strictEqual(result.tags?.filter(tag => tag === '@smoke').length, 2);
    });
  });

  describe('Integration and Real-world Usage', () => {
    it('should support complete workflow from arrays to extraction', () => {
      // Step 1: Create metadata from arrays (simulating Playwright input)
      const playwrightTags = ['@smoke', '@regression', '@invalid-tag'];
      const playwrightAnnotations = [
        createImportanceAnnotation('critical'),
        createCategoryAnnotation('integration'),
        createAssigneeAnnotation('qa@example.com'),
        createInterfaceAnnotation('ui'),
        createLinkAnnotation('https://docs.example.com'),
        createLinkAnnotation('https://jira.example.com/TEST-123'),
        { type: 'invalid', description: 'should be filtered' }
      ];

      const metadata = createTestCaseMetadataFromArrays(playwrightTags, playwrightAnnotations);
      assert.ok(metadata !== null);

      // Step 2: Validate the created metadata
      assert.strictEqual(validateTestCaseMetadata(metadata), true);

      // Step 3: Extract annotations for junit reporting
      const extractedAnnotations = extractAnnotationsFromMetadata(metadata);
      assert.strictEqual(extractedAnnotations.length, 6); // all valid annotations

      // Step 4: Extract tags for junit reporting
      const extractedTags = extractTagsFromMetadata(metadata);
      assert.strictEqual(extractedTags.length, 2); // only valid tags

      // Step 5: Verify structure is suitable for junit reporting
      assert.strictEqual(metadata.importance.description, 'critical');
      assert.strictEqual(metadata.category.description, 'integration');
      assert.ok(extractedTags.includes('@smoke'));
      assert.ok(extractedTags.includes('@regression'));
    });

    it('should support metadata composition from multiple sources', () => {
      // Source 1: Default test configuration
      const defaultConfig: Partial<TestCaseMetadata> = {
        importance: createImportanceAnnotation('medium'),
        category: createCategoryAnnotation('unit'),
        tags: createValidTagsArray(['@regression'])
      };

      // Source 2: Test-specific annotations
      const testSpecific: Partial<TestCaseMetadata> = {
        assignee: createAssigneeAnnotation('dev@example.com'),
        interface: createInterfaceAnnotation('api'),
        tags: createValidTagsArray(['@smoke'])
      };

      // Source 3: Environment-specific overrides
      const envOverrides: Partial<TestCaseMetadata> = {
        importance: createImportanceAnnotation('critical'), // override
        tags: createValidTagsArray(['@e2e']) // use valid tag instead of @ci
      };

      const finalMetadata = mergeTestCaseMetadata(defaultConfig, testSpecific, envOverrides);

      assert.ok(finalMetadata !== null);
      assert.strictEqual(finalMetadata.importance?.description, 'critical'); // overridden
      assert.strictEqual(finalMetadata.category?.description, 'unit'); // from default
      assert.strictEqual(finalMetadata.assignee?.description, 'dev@example.com'); // from test-specific
      assert.strictEqual(finalMetadata.interface?.description, 'api'); // from test-specific
      assert.strictEqual(finalMetadata.tags?.length, 3); // merged from all sources
    });

    it('should handle edge case with minimal Playwright data', () => {
      // Simulate minimal Playwright test with just required data
      const minimalTags: string[] = [];
      const minimalAnnotations = [
        createImportanceAnnotation('low'),
        createCategoryAnnotation('unit')
      ];

      const metadata = createTestCaseMetadataFromArrays(minimalTags, minimalAnnotations);

      assert.ok(metadata !== null);
      assert.strictEqual(validateTestCaseMetadata(metadata), true);
      assert.strictEqual(metadata.tags, undefined);
      assert.strictEqual(metadata.assignee, undefined);
      assert.strictEqual(metadata.interface, undefined);
      assert.strictEqual(metadata.links, undefined);

      // Should still be usable for junit reporting
      const annotations = extractAnnotationsFromMetadata(metadata);
      assert.strictEqual(annotations.length, 2);
      assert.strictEqual(annotations[0].type, 'importance');
      assert.strictEqual(annotations[1].type, 'category');
    });
  });

  describe('Type Safety and Compile-time Verification', () => {
    it('should enforce correct type relationships', () => {
      // These should all compile without TypeScript errors
      const input: TestCaseMetadataInput = {
        importance: 'high',
        category: 'integration',
        assignee: 'dev@example.com',
        interface: 'api',
        links: ['https://example.com'],
        tags: ['@smoke']
      };

      const metadata: TestCaseMetadata = createTestCaseMetadata(input);

      // Type guards should work correctly
      if (validateTestCaseMetadata(metadata)) {
        const validMetadata: TestCaseMetadata = metadata;
        assert.strictEqual(validMetadata.importance.type, 'importance');
        assert.strictEqual(validMetadata.category.type, 'category');
      }

      // Required field checking should work
      if (hasRequiredMetadata(metadata)) {
        const completeMetadata: TestCaseMetadata = metadata;
        assert.ok(completeMetadata.importance);
        assert.ok(completeMetadata.category);
      }

      assert.ok(true, 'Type system compiles correctly');
    });
  });
});
