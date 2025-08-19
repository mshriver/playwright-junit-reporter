/**
 * Unit tests for the annotation validation system
 * Tests the annotation validation utility functions and type guards using Node.js built-in test runner
 *
 * Run with: yarn test (after building)
 * Or: yarn test:dev (direct TypeScript execution)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidAnnotationType,
  isValidAnnotation,
  areValidAnnotations,
  createValidAnnotationsArray,
  isLinkAnnotation,
  isImportanceAnnotation,
  isInterfaceAnnotation,
  isCategoryAnnotation,
  isAssigneeAnnotation,
  createLinkAnnotation,
  createImportanceAnnotation,
  createInterfaceAnnotation,
  createCategoryAnnotation,
  createAssigneeAnnotation,
  isValidImportanceValue,
  isValidInterfaceTypeValue,
  isValidCategoryValue,
  isValidAnnotationsFields,
  createValidAnnotationsFields,
  ValidAnnotation,
  LinkAnnotation,
  ImportanceAnnotation,
  InterfaceAnnotation,
  CategoryAnnotation,
  AssigneeAnnotation,
  ValidAnnotationsArray,
  ValidAnnotationTypes,
  AnnotationsFields,
  AnnotationsFieldsInterface
} from './annotations.types.js';

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

describe('Annotation Validation System', () => {
  describe('isValidAnnotationType function', () => {
    it('should validate known annotation types', () => {
      assert.strictEqual(isValidAnnotationType('link'), true);
      assert.strictEqual(isValidAnnotationType('importance'), true);
      assert.strictEqual(isValidAnnotationType('interface'), true);
      assert.strictEqual(isValidAnnotationType('category'), true);
      assert.strictEqual(isValidAnnotationType('assignee'), true);
    });

    it('should reject invalid annotation types', () => {
      assert.strictEqual(isValidAnnotationType('invalid'), false);
      assert.strictEqual(isValidAnnotationType(''), false);
      assert.strictEqual(isValidAnnotationType('test'), false);
      assert.strictEqual(isValidAnnotationType('url'), false);
      assert.strictEqual(isValidAnnotationType('priority'), false);
    });

    it('should handle edge cases', () => {
      assert.strictEqual(isValidAnnotationType('LINK'), false); // case sensitive
      assert.strictEqual(isValidAnnotationType(' link '), false); // no whitespace
      assert.strictEqual(isValidAnnotationType('IMPORTANCE'), false); // case sensitive
      assert.strictEqual(isValidAnnotationType('Interface'), false); // case sensitive
      assert.strictEqual(isValidAnnotationType('CATEGORY'), false); // case sensitive
    });

    it('should properly narrow types (type guard behavior)', () => {
      const unknownType: string = 'link';
      if (isValidAnnotationType(unknownType)) {
        // TypeScript should know this is ValidAnnotationTypes
        const validType: ValidAnnotationTypes = unknownType;
        assert.strictEqual(validType, 'link');
      }
    });
  });

  describe('Individual value validation functions', () => {
    describe('isValidImportanceValue function', () => {
      it('should validate valid importance values', () => {
        assert.strictEqual(isValidImportanceValue('critical'), true);
        assert.strictEqual(isValidImportanceValue('high'), true);
        assert.strictEqual(isValidImportanceValue('medium'), true);
        assert.strictEqual(isValidImportanceValue('low'), true);
      });

      it('should reject invalid importance values', () => {
        assert.strictEqual(isValidImportanceValue('urgent'), false);
        assert.strictEqual(isValidImportanceValue('normal'), false);
        assert.strictEqual(isValidImportanceValue(''), false);
        assert.strictEqual(isValidImportanceValue('CRITICAL'), false); // case sensitive
      });
    });

    describe('isValidInterfaceTypeValue function', () => {
      it('should validate valid interface type values', () => {
        assert.strictEqual(isValidInterfaceTypeValue('ui'), true);
        assert.strictEqual(isValidInterfaceTypeValue('api'), true);
        assert.strictEqual(isValidInterfaceTypeValue('cli'), true);
        assert.strictEqual(isValidInterfaceTypeValue('db'), true);
      });

      it('should reject invalid interface type values', () => {
        assert.strictEqual(isValidInterfaceTypeValue('web'), false);
        assert.strictEqual(isValidInterfaceTypeValue('mobile'), false);
        assert.strictEqual(isValidInterfaceTypeValue(''), false);
        assert.strictEqual(isValidInterfaceTypeValue('UI'), false); // case sensitive
      });
    });

    describe('isValidCategoryValue function', () => {
      it('should validate valid category values', () => {
        assert.strictEqual(isValidCategoryValue('unit'), true);
        assert.strictEqual(isValidCategoryValue('function'), true);
        assert.strictEqual(isValidCategoryValue('system'), true);
        assert.strictEqual(isValidCategoryValue('integration'), true);
        assert.strictEqual(isValidCategoryValue('performance'), true);
      });

      it('should reject invalid category values', () => {
        assert.strictEqual(isValidCategoryValue('e2e'), false);
        assert.strictEqual(isValidCategoryValue('smoke'), false);
        assert.strictEqual(isValidCategoryValue(''), false);
        assert.strictEqual(isValidCategoryValue('UNIT'), false); // case sensitive
      });
    });
  });

  describe('isValidAnnotation function', () => {
    it('should validate valid annotation objects', () => {
      const linkAnnotation = { type: 'link', description: 'https://example.com' };
      const importanceAnnotation = { type: 'importance', description: 'critical' };
      const interfaceAnnotation = { type: 'interface', description: 'ui' };
      const categoryAnnotation = { type: 'category', description: 'unit' };
      const assigneeAnnotation = { type: 'assignee', description: 'user@example.com' };

      assert.strictEqual(isValidAnnotation(linkAnnotation), true);
      assert.strictEqual(isValidAnnotation(importanceAnnotation), true);
      assert.strictEqual(isValidAnnotation(interfaceAnnotation), true);
      assert.strictEqual(isValidAnnotation(categoryAnnotation), true);
      assert.strictEqual(isValidAnnotation(assigneeAnnotation), true);
    });

    it('should reject invalid annotation objects', () => {
      // Invalid annotation types
      assert.strictEqual(isValidAnnotation({ type: 'invalid', description: 'test' }), false);

      // Missing fields
      assert.strictEqual(isValidAnnotation({ type: 'link' }), false); // missing description
      assert.strictEqual(isValidAnnotation({ description: 'test' }), false); // missing type

      // Invalid description values for typed annotations
      assert.strictEqual(isValidAnnotation({ type: 'importance', description: 'urgent' }), false);
      assert.strictEqual(isValidAnnotation({ type: 'interface', description: 'web' }), false);
      assert.strictEqual(isValidAnnotation({ type: 'category', description: 'smoke' }), false);

      // Non-objects
      assert.strictEqual(isValidAnnotation(null), false);
      assert.strictEqual(isValidAnnotation(undefined), false);
      assert.strictEqual(isValidAnnotation('string'), false);
      assert.strictEqual(isValidAnnotation(123), false);
    });

    it('should handle edge cases', () => {
      assert.strictEqual(isValidAnnotation({}), false);
      assert.strictEqual(isValidAnnotation({ type: 'link', description: '' }), true); // empty description is valid for links
      assert.strictEqual(isValidAnnotation({ type: '', description: 'test' }), false); // empty type is invalid
      assert.strictEqual(isValidAnnotation({ type: 'importance', description: '' }), false); // empty description invalid for importance
    });

    it('should properly narrow types (type guard behavior)', () => {
      const unknownObject: unknown = { type: 'link', description: 'test' };
      if (isValidAnnotation(unknownObject)) {
        // TypeScript should know this is ValidAnnotation
        const validAnnotation: ValidAnnotation = unknownObject;
        assert.strictEqual(validAnnotation.type, 'link');
        assert.strictEqual(validAnnotation.description, 'test');
      }

      const importanceObject: unknown = { type: 'importance', description: 'high' };
      if (isValidAnnotation(importanceObject)) {
        const validAnnotation: ValidAnnotation = importanceObject;
        assert.strictEqual(validAnnotation.type, 'importance');
        assert.strictEqual(validAnnotation.description, 'high');
      }
    });
  });

  describe('areValidAnnotations function', () => {
    it('should validate arrays of valid annotations', () => {
      const validAnnotations = [
        { type: 'link', description: 'https://example.com' },
        { type: 'importance', description: 'critical' },
        { type: 'interface', description: 'api' },
        { type: 'category', description: 'function' }
      ];
      assert.strictEqual(areValidAnnotations(validAnnotations), true);
    });

    it('should reject arrays containing invalid annotations', () => {
      const mixedAnnotations = [
        { type: 'link', description: 'https://example.com' },
        { type: 'invalid', description: 'test' }
      ];
      assert.strictEqual(areValidAnnotations(mixedAnnotations), false);

      const invalidDescriptions = [
        { type: 'link', description: 'https://example.com' },
        { type: 'importance', description: 'urgent' } // invalid importance value
      ];
      assert.strictEqual(areValidAnnotations(invalidDescriptions), false);
    });

    it('should handle empty arrays', () => {
      assert.strictEqual(areValidAnnotations([]), true);
    });

    it('should properly type guard arrays', () => {
      const unknownArray: unknown[] = [
        { type: 'link', description: 'https://example.com' },
        { type: 'importance', description: 'high' }
      ];
      if (areValidAnnotations(unknownArray)) {
        // TypeScript should know this is ValidAnnotation[]
        const validAnnotations: ValidAnnotation[] = unknownArray;
        assert.strictEqual(validAnnotations[0].type, 'link');
        assert.strictEqual(validAnnotations[1].type, 'importance');
      }
    });
  });

  describe('createValidAnnotationsArray function', () => {
    it('should clear warnings before each test', () => {
      warningMessages = [];
    });

    it('should return valid annotations and filter out invalid ones', () => {
      warningMessages = [];
      const mixedAnnotations = [
        { type: 'link', description: 'https://example.com' },
        { type: 'invalid', description: 'test' },
        { type: 'importance', description: 'critical' },
        { type: 'interface', description: 'web' }, // invalid interface value
        { type: 'category', description: 'unit' }
      ];
      const result = createValidAnnotationsArray(mixedAnnotations);

      assert.deepStrictEqual(result, [
        { type: 'link', description: 'https://example.com' },
        { type: 'importance', description: 'critical' },
        { type: 'category', description: 'unit' }
      ]);
    });

    it('should return all annotations when all are valid', () => {
      const validAnnotations = [
        { type: 'link', description: 'https://example.com' },
        { type: 'importance', description: 'high' },
        { type: 'interface', description: 'api' },
        { type: 'category', description: 'function' }
      ];
      const result = createValidAnnotationsArray(validAnnotations);

      assert.deepStrictEqual(result, validAnnotations);
    });

    it('should return empty array when all annotations are invalid', () => {
      const invalidAnnotations = [
        { type: 'invalid', description: 'test' },
        { type: 'another-invalid', description: 'test2' }
      ];
      const result = createValidAnnotationsArray(invalidAnnotations);

      assert.deepStrictEqual(result, []);
    });

    it('should log warning when invalid annotations are filtered out', () => {
      const mixedAnnotations = [
        { type: 'link', description: 'https://example.com' },
        { type: 'invalid', description: 'test' }
      ];
      createValidAnnotationsArray(mixedAnnotations);

      expectWarningCalled('Invalid annotations found and filtered out: invalid');
    });

    it('should handle empty input array', () => {
      const result = createValidAnnotationsArray([]);
      assert.deepStrictEqual(result, []);
    });

    it('should return correctly typed ValidAnnotationsArray', () => {
      const validAnnotations = [
        { type: 'link', description: 'https://example.com' }
      ];
      const result = createValidAnnotationsArray(validAnnotations);

      // This should compile without type errors
      const typedResult: ValidAnnotationsArray = result;
      assert.deepStrictEqual(typedResult, validAnnotations);
    });

    it('should preserve order of valid annotations', () => {
      const mixedAnnotations = [
        { type: 'link', description: 'https://first.com' },
        { type: 'invalid', description: 'test' },
        { type: 'link', description: 'https://second.com' },
        { type: 'link', description: 'https://third.com' }
      ];
      const result = createValidAnnotationsArray(mixedAnnotations);

      assert.deepStrictEqual(result, [
        { type: 'link', description: 'https://first.com' },
        { type: 'link', description: 'https://second.com' },
        { type: 'link', description: 'https://third.com' }
      ]);
    });
  });

  describe('Annotation Type Helpers', () => {
    describe('isLinkAnnotation function', () => {
      it('should identify link annotations correctly', () => {
        const linkAnnotation: ValidAnnotation = { type: 'link', description: 'https://example.com' };
        const importanceAnnotation: ValidAnnotation = { type: 'importance', description: 'critical' };

        assert.strictEqual(isLinkAnnotation(linkAnnotation), true);
        assert.strictEqual(isLinkAnnotation(importanceAnnotation), false);
      });

      it('should properly narrow types', () => {
        const annotation: ValidAnnotation = { type: 'link', description: 'https://example.com' };
        if (isLinkAnnotation(annotation)) {
          // TypeScript should know this is LinkAnnotation
          const linkAnnotation: LinkAnnotation = annotation;
          assert.strictEqual(linkAnnotation.type, 'link');
        }
      });
    });

    describe('isImportanceAnnotation function', () => {
      it('should identify importance annotations correctly', () => {
        const importanceAnnotation: ValidAnnotation = { type: 'importance', description: 'critical' };
        const linkAnnotation: ValidAnnotation = { type: 'link', description: 'https://example.com' };

        assert.strictEqual(isImportanceAnnotation(importanceAnnotation), true);
        assert.strictEqual(isImportanceAnnotation(linkAnnotation), false);
      });

      it('should properly narrow types', () => {
        const annotation: ValidAnnotation = { type: 'importance', description: 'high' };
        if (isImportanceAnnotation(annotation)) {
          // TypeScript should know this is ImportanceAnnotation
          const importanceAnnotation: ImportanceAnnotation = annotation;
          assert.strictEqual(importanceAnnotation.type, 'importance');
          assert.strictEqual(importanceAnnotation.description, 'high');
        }
      });
    });

    describe('isInterfaceAnnotation function', () => {
      it('should identify interface annotations correctly', () => {
        const interfaceAnnotation: ValidAnnotation = { type: 'interface', description: 'api' };
        const categoryAnnotation: ValidAnnotation = { type: 'category', description: 'unit' };

        assert.strictEqual(isInterfaceAnnotation(interfaceAnnotation), true);
        assert.strictEqual(isInterfaceAnnotation(categoryAnnotation), false);
      });

      it('should properly narrow types', () => {
        const annotation: ValidAnnotation = { type: 'interface', description: 'ui' };
        if (isInterfaceAnnotation(annotation)) {
          // TypeScript should know this is InterfaceAnnotation
          const interfaceAnnotation: InterfaceAnnotation = annotation;
          assert.strictEqual(interfaceAnnotation.type, 'interface');
          assert.strictEqual(interfaceAnnotation.description, 'ui');
        }
      });
    });

    describe('isCategoryAnnotation function', () => {
      it('should identify category annotations correctly', () => {
        const categoryAnnotation: ValidAnnotation = { type: 'category', description: 'function' };
        const linkAnnotation: ValidAnnotation = { type: 'link', description: 'https://example.com' };

        assert.strictEqual(isCategoryAnnotation(categoryAnnotation), true);
        assert.strictEqual(isCategoryAnnotation(linkAnnotation), false);
      });

      it('should properly narrow types', () => {
        const annotation: ValidAnnotation = { type: 'category', description: 'integration' };
        if (isCategoryAnnotation(annotation)) {
          // TypeScript should know this is CategoryAnnotation
          const categoryAnnotation: CategoryAnnotation = annotation;
          assert.strictEqual(categoryAnnotation.type, 'category');
          assert.strictEqual(categoryAnnotation.description, 'integration');
        }
      });
    });

    describe('createLinkAnnotation function', () => {
      it('should create valid link annotations', () => {
        const link = createLinkAnnotation('https://example.com');

        assert.strictEqual(link.type, 'link');
        assert.strictEqual(link.description, 'https://example.com');
        assert.strictEqual(isValidAnnotation(link), true);
        assert.strictEqual(isLinkAnnotation(link), true);
      });

      it('should handle empty descriptions', () => {
        const link = createLinkAnnotation('');

        assert.strictEqual(link.type, 'link');
        assert.strictEqual(link.description, '');
        assert.strictEqual(isValidAnnotation(link), true);
      });
    });

    describe('createImportanceAnnotation function', () => {
      it('should create valid importance annotations', () => {
        const importance = createImportanceAnnotation('critical');

        assert.strictEqual(importance.type, 'importance');
        assert.strictEqual(importance.description, 'critical');
        assert.strictEqual(isValidAnnotation(importance), true);
        assert.strictEqual(isImportanceAnnotation(importance), true);
      });

      it('should work with all importance levels', () => {
        const levels: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low'];

        levels.forEach(level => {
          const annotation = createImportanceAnnotation(level);
          assert.strictEqual(annotation.description, level);
          assert.strictEqual(isValidAnnotation(annotation), true);
        });
      });
    });

    describe('createInterfaceAnnotation function', () => {
      it('should create valid interface annotations', () => {
        const interfaceAnnotation = createInterfaceAnnotation('api');

        assert.strictEqual(interfaceAnnotation.type, 'interface');
        assert.strictEqual(interfaceAnnotation.description, 'api');
        assert.strictEqual(isValidAnnotation(interfaceAnnotation), true);
        assert.strictEqual(isInterfaceAnnotation(interfaceAnnotation), true);
      });

      it('should work with all interface types', () => {
        const types: Array<'ui' | 'api' | 'cli' | 'db'> = ['ui', 'api', 'cli', 'db'];

        types.forEach(type => {
          const annotation = createInterfaceAnnotation(type);
          assert.strictEqual(annotation.description, type);
          assert.strictEqual(isValidAnnotation(annotation), true);
        });
      });
    });

    describe('createCategoryAnnotation function', () => {
      it('should create valid category annotations', () => {
        const category = createCategoryAnnotation('unit');

        assert.strictEqual(category.type, 'category');
        assert.strictEqual(category.description, 'unit');
        assert.strictEqual(isValidAnnotation(category), true);
        assert.strictEqual(isCategoryAnnotation(category), true);
      });

      it('should work with all category types', () => {
        const categories: Array<'unit' | 'function' | 'system' | 'integration' | 'performance'> =
          ['unit', 'function', 'system', 'integration', 'performance'];

        categories.forEach(category => {
          const annotation = createCategoryAnnotation(category);
          assert.strictEqual(annotation.description, category);
          assert.strictEqual(isValidAnnotation(annotation), true);
        });
      });
    });

    describe('isAssigneeAnnotation function', () => {
      it('should identify assignee annotations correctly', () => {
        const assigneeAnnotation = createAssigneeAnnotation('john.doe@example.com');
        const linkAnnotation = createLinkAnnotation('https://example.com');

        assert.strictEqual(isAssigneeAnnotation(assigneeAnnotation), true);
        assert.strictEqual(isAssigneeAnnotation(linkAnnotation), false);
      });

      it('should properly narrow types', () => {
        const annotation: ValidAnnotation = createAssigneeAnnotation('jane.smith@example.com');
        if (isAssigneeAnnotation(annotation)) {
          // This should compile without type errors - we know it's an AssigneeAnnotation
          assert.strictEqual(annotation.type, 'assignee');
          assert.strictEqual(annotation.description, 'jane.smith@example.com');
        }
      });
    });

    describe('createAssigneeAnnotation function', () => {
      it('should create valid assignee annotations', () => {
        const assignee = createAssigneeAnnotation('test.user@example.com');

        assert.strictEqual(assignee.type, 'assignee');
        assert.strictEqual(assignee.description, 'test.user@example.com');
        assert.strictEqual(isValidAnnotation(assignee), true);
        assert.strictEqual(isAssigneeAnnotation(assignee), true);
      });

      it('should handle different assignee formats', () => {
        const formats = [
          'user@example.com',
          'John Doe',
          'john.doe',
          '@username',
          'Team Lead'
        ];

        formats.forEach(format => {
          const annotation = createAssigneeAnnotation(format);
          assert.strictEqual(annotation.description, format);
          assert.strictEqual(isValidAnnotation(annotation), true);
        });
      });

      it('should handle empty descriptions', () => {
        const assignee = createAssigneeAnnotation('');
        assert.strictEqual(assignee.description, '');
        assert.strictEqual(isValidAnnotation(assignee), true);
      });
    });
  });

  describe('Integration and Advanced Usage', () => {
    it('should work with array filter method', () => {
      const mixedAnnotations = [
        { type: 'link', description: 'https://example.com' },
        { type: 'invalid', description: 'test' },
        { type: 'importance', description: 'urgent' }, // invalid value
        { type: 'interface', description: 'api' },
        { type: 'category', description: 'unit' }
      ];

      const validAnnotations = mixedAnnotations.filter(isValidAnnotation);
      assert.deepStrictEqual(validAnnotations, [
        { type: 'link', description: 'https://example.com' },
        { type: 'interface', description: 'api' },
        { type: 'category', description: 'unit' }
      ]);
    });

    it('should work with AnnotationsFields type', () => {
      const annotationsFields: AnnotationsFields = {
        links: [
          createLinkAnnotation('https://example.com'),
          createLinkAnnotation('https://docs.example.com')
        ],
        importance: createImportanceAnnotation('critical'),
        interface: createInterfaceAnnotation('api'),
        category: createCategoryAnnotation('unit'),
        assignee: createAssigneeAnnotation('john.doe@example.com')
      };

      assert.strictEqual(Array.isArray(annotationsFields.links), true);
      assert.strictEqual(annotationsFields.links?.length, 2);
      assert.strictEqual(annotationsFields.links?.[0].type, 'link');

      assert.strictEqual(annotationsFields.importance?.type, 'importance');
      assert.strictEqual(annotationsFields.importance?.description, 'critical');

      assert.strictEqual(annotationsFields.interface?.type, 'interface');
      assert.strictEqual(annotationsFields.interface?.description, 'api');

      assert.strictEqual(annotationsFields.category?.type, 'category');
      assert.strictEqual(annotationsFields.category?.description, 'unit');

      assert.strictEqual(annotationsFields.assignee?.type, 'assignee');
      assert.strictEqual(annotationsFields.assignee?.description, 'john.doe@example.com');
    });

    it('should support validation function pattern', () => {
      const validateAndProcessAnnotations = (annotations: unknown[]) => {
        const validAnnotations = createValidAnnotationsArray(annotations);
        return validAnnotations.map(annotation => ({
          ...annotation,
          processed: true
        }));
      };

      const input = [
        { type: 'link', description: 'https://example.com' },
        { type: 'invalid', description: 'test' },
        { type: 'importance', description: 'high' }
      ];

      const result = validateAndProcessAnnotations(input);
      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].type, 'link');
      assert.strictEqual(result[1].type, 'importance');
      assert.strictEqual((result[0] as { processed: boolean }).processed, true);
    });

    it('should work with conditional processing', () => {
      const annotation: unknown = { type: 'importance', description: 'critical' };

      let message: string;
      if (isValidAnnotation(annotation)) {
        message = `Processing valid annotation: ${annotation.type}`;
      } else {
        message = `Invalid annotation: ${annotation}`;
      }

      assert.strictEqual(message, 'Processing valid annotation: importance');
    });

    it('should support type-specific processing', () => {
      const annotations: ValidAnnotation[] = [
        createLinkAnnotation('https://example.com'),
        createImportanceAnnotation('critical'),
        createInterfaceAnnotation('api'),
        createCategoryAnnotation('unit')
      ];

      const linkCount = annotations.filter(isLinkAnnotation).length;
      const importanceCount = annotations.filter(isImportanceAnnotation).length;
      const interfaceCount = annotations.filter(isInterfaceAnnotation).length;
      const categoryCount = annotations.filter(isCategoryAnnotation).length;

      assert.strictEqual(linkCount, 1);
      assert.strictEqual(importanceCount, 1);
      assert.strictEqual(interfaceCount, 1);
      assert.strictEqual(categoryCount, 1);
    });
  });

  describe('Type System Verification', () => {
    it('should compile with correct type relationships', () => {
      // These should all compile without TypeScript errors
      const annotationType: ValidAnnotationTypes = 'link';
      const annotation: ValidAnnotation = { type: 'link', description: 'test' };
      const linkAnnotation: LinkAnnotation = { type: 'link', description: 'test' };
      const importanceAnnotation: ImportanceAnnotation = { type: 'importance', description: 'critical' };
      const interfaceAnnotation: InterfaceAnnotation = { type: 'interface', description: 'api' };
      const categoryAnnotation: CategoryAnnotation = { type: 'category', description: 'unit' };
      const annotationsArray: ValidAnnotationsArray = [
        annotation,
        linkAnnotation,
        importanceAnnotation,
        interfaceAnnotation,
        categoryAnnotation
      ];

      // Verify the values are correct
      assert.strictEqual(annotationType, 'link');
      assert.strictEqual(annotation.type, 'link');
      assert.strictEqual(linkAnnotation.type, 'link');
      assert.strictEqual(importanceAnnotation.description, 'critical');
      assert.strictEqual(interfaceAnnotation.description, 'api');
      assert.strictEqual(categoryAnnotation.description, 'unit');
      assert.strictEqual(annotationsArray.length, 5);
    });

    it('should enforce correct description types at compile time', () => {
      // These should compile without errors
      const validImportance: ImportanceAnnotation = { type: 'importance', description: 'high' };
      const validInterface: InterfaceAnnotation = { type: 'interface', description: 'ui' };
      const validCategory: CategoryAnnotation = { type: 'category', description: 'function' };

      assert.strictEqual(validImportance.description, 'high');
      assert.strictEqual(validInterface.description, 'ui');
      assert.strictEqual(validCategory.description, 'function');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should clear warnings before performance tests', () => {
      warningMessages = [];
    });

    it('should handle large arrays efficiently', () => {
      // Create large array with mixed valid/invalid annotations
      const largeMixedArray = Array.from({ length: 1000 }, (_, i) => {
        const types = ['link', 'importance', 'interface', 'category', 'invalid'];
        const type = types[i % 5];

        let description: string;
        switch (type) {
          case 'link':
            description = `https://test-${i}.com`;
            break;
          case 'importance':
            description = ['critical', 'high', 'medium', 'low'][i % 4];
            break;
          case 'interface':
            description = ['ui', 'api', 'cli', 'db'][i % 4];
            break;
          case 'category':
            description = ['unit', 'function', 'system', 'integration', 'performance'][i % 5];
            break;
          default:
            description = `invalid-${i}`;
        }

        return { type, description };
      });

      const start = Date.now();
      const result = createValidAnnotationsArray(largeMixedArray);
      const end = Date.now();

      // Should complete quickly (less than 100ms for 1000 items)
      assert.ok(end - start < 100, 'Performance should be acceptable for large arrays');

      // Should have correct number of valid annotations (4/5 of input = 800)
      assert.strictEqual(result.length, 800);
    });

    it('should handle duplicate annotations correctly', () => {
      const duplicateAnnotations = [
        { type: 'link', description: 'https://example.com' },
        { type: 'link', description: 'https://example.com' },
        { type: 'importance', description: 'critical' },
        { type: 'importance', description: 'critical' },
        { type: 'invalid', description: 'test' }
      ];
      const result = createValidAnnotationsArray(duplicateAnnotations);

      // Should preserve duplicates in valid annotations
      assert.deepStrictEqual(result, [
        { type: 'link', description: 'https://example.com' },
        { type: 'link', description: 'https://example.com' },
        { type: 'importance', description: 'critical' },
        { type: 'importance', description: 'critical' }
      ]);
    });

    it('should handle malformed objects gracefully', () => {
      const malformedObjects = [
        null,
        undefined,
        'string',
        123,
        [],
        { type: 'link' }, // missing description
        { description: 'test' }, // missing type
        { type: null, description: 'test' },
        { type: 'link', description: null },
        { type: 'importance', description: 'invalid-importance' },
        { type: 'interface', description: 'invalid-interface' },
        { type: 'category', description: 'invalid-category' }
      ];

      const result = createValidAnnotationsArray(malformedObjects);
      assert.deepStrictEqual(result, []);
    });
  });

  describe('AnnotationsFields Interface Validation', () => {
    it('should clear warnings before interface tests', () => {
      warningMessages = [];
    });

    describe('isValidAnnotationsFields function', () => {
      it('should validate valid AnnotationsFields objects', () => {
        const validFields: AnnotationsFieldsInterface = {
          assignee: createAssigneeAnnotation('user@example.com'),
          category: createCategoryAnnotation('unit'),
          importance: createImportanceAnnotation('high'),
          interface: createInterfaceAnnotation('api'),
          links: [
            createLinkAnnotation('https://example.com'),
            createLinkAnnotation('https://docs.example.com')
          ]
        };

        assert.strictEqual(isValidAnnotationsFields(validFields), true);
      });

      it('should validate empty AnnotationsFields objects', () => {
        assert.strictEqual(isValidAnnotationsFields({}), true);
      });

      it('should validate partial AnnotationsFields objects', () => {
        const partialFields = {
          assignee: createAssigneeAnnotation('user@example.com'),
          importance: createImportanceAnnotation('critical')
        };

        assert.strictEqual(isValidAnnotationsFields(partialFields), true);
      });

      it('should validate custom annotation fields', () => {
        const fieldsWithCustom = {
          assignee: createAssigneeAnnotation('user@example.com'),
          customSingle: createLinkAnnotation('https://custom.com'),
          customArray: [
            createLinkAnnotation('https://custom1.com'),
            createLinkAnnotation('https://custom2.com')
          ]
        };

        assert.strictEqual(isValidAnnotationsFields(fieldsWithCustom), true);
      });

      it('should reject invalid AnnotationsFields objects', () => {
        // Invalid assignee
        assert.strictEqual(isValidAnnotationsFields({
          assignee: { type: 'assignee', description: 123 }
        }), false);

        // Invalid category
        assert.strictEqual(isValidAnnotationsFields({
          category: { type: 'category', description: 'invalid-category' }
        }), false);

        // Invalid importance
        assert.strictEqual(isValidAnnotationsFields({
          importance: { type: 'importance', description: 'urgent' }
        }), false);

        // Invalid interface
        assert.strictEqual(isValidAnnotationsFields({
          interface: { type: 'interface', description: 'web' }
        }), false);

        // Invalid links array
        assert.strictEqual(isValidAnnotationsFields({
          links: [{ type: 'invalid', description: 'test' }]
        }), false);

        // Non-object input
        assert.strictEqual(isValidAnnotationsFields(null), false);
        assert.strictEqual(isValidAnnotationsFields('string'), false);
        assert.strictEqual(isValidAnnotationsFields(123), false);
      });

      it('should reject invalid custom annotations', () => {
        // Invalid custom single annotation
        assert.strictEqual(isValidAnnotationsFields({
          customField: { type: 'invalid', description: 'test' }
        }), false);

        // Invalid custom array annotation
        assert.strictEqual(isValidAnnotationsFields({
          customArray: [
            createLinkAnnotation('https://valid.com'),
            { type: 'invalid', description: 'test' }
          ]
        }), false);
      });

      it('should properly narrow types (type guard behavior)', () => {
        const unknownObject: unknown = {
          assignee: createAssigneeAnnotation('user@example.com'),
          importance: createImportanceAnnotation('high')
        };

        if (isValidAnnotationsFields(unknownObject)) {
          // This should compile without type errors
          assert.strictEqual(unknownObject.assignee?.type, 'assignee');
          assert.strictEqual(unknownObject.importance?.description, 'high');
        }
      });
    });

    describe('createValidAnnotationsFields function', () => {
      it('should return valid AnnotationsFields objects unchanged', () => {
        const validFields = {
          assignee: createAssigneeAnnotation('user@example.com'),
          category: createCategoryAnnotation('integration'),
          links: [createLinkAnnotation('https://example.com')]
        };

        const result = createValidAnnotationsFields(validFields);
        assert.deepStrictEqual(result, validFields);
      });

      it('should return empty object for invalid input', () => {
        const invalidFields = {
          assignee: { type: 'invalid', description: 'test' }
        };

        const result = createValidAnnotationsFields(invalidFields);
        assert.deepStrictEqual(result, {});
      });

      it('should log warning for invalid input', () => {
        warningMessages = [];
        const invalidFields = {
          category: { type: 'category', description: 'invalid-value' }
        };

        createValidAnnotationsFields(invalidFields);
        expectWarningCalled('Invalid annotations fields provided, returning empty object');
      });

      it('should handle non-object input gracefully', () => {
        assert.deepStrictEqual(createValidAnnotationsFields(null), {});
        assert.deepStrictEqual(createValidAnnotationsFields('string'), {});
        assert.deepStrictEqual(createValidAnnotationsFields(123), {});
        assert.deepStrictEqual(createValidAnnotationsFields([]), {});
      });

      it('should return correctly typed AnnotationsFieldsInterface', () => {
        const validFields = {
          assignee: createAssigneeAnnotation('user@example.com')
        };

        const result = createValidAnnotationsFields(validFields);

        // This should compile without type errors
        const typedResult: AnnotationsFieldsInterface = result;
        assert.deepStrictEqual(typedResult, validFields);
      });
    });

    describe('Integration with specific annotation types', () => {
      it('should work with assignee annotations specifically', () => {
        const fields = {
          assignee: createAssigneeAnnotation('john.doe@company.com')
        };

        assert.strictEqual(isValidAnnotationsFields(fields), true);

        const result = createValidAnnotationsFields(fields);
        assert.strictEqual(result.assignee?.type, 'assignee');
        assert.strictEqual(result.assignee?.description, 'john.doe@company.com');

        if (result.assignee && isAssigneeAnnotation(result.assignee)) {
          assert.strictEqual(result.assignee.description, 'john.doe@company.com');
        }
      });

      it('should support all annotation types together', () => {
        const completeFields = {
          assignee: createAssigneeAnnotation('team-lead@company.com'),
          category: createCategoryAnnotation('system'),
          importance: createImportanceAnnotation('critical'),
          interface: createInterfaceAnnotation('cli'),
          links: [
            createLinkAnnotation('https://docs.example.com'),
            createLinkAnnotation('https://api.example.com')
          ]
        };

        assert.strictEqual(isValidAnnotationsFields(completeFields), true);

        const result = createValidAnnotationsFields(completeFields);
        assert.strictEqual(result.assignee?.description, 'team-lead@company.com');
        assert.strictEqual(result.category?.description, 'system');
        assert.strictEqual(result.importance?.description, 'critical');
        assert.strictEqual(result.interface?.description, 'cli');
        assert.strictEqual(result.links?.length, 2);
      });
    });
  });
});
