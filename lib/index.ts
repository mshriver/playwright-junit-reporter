/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Playwright JUnit Reporter - Main Exports
 *
 * This module provides validation functions for Playwright test metadata
 * including tags and annotations. It can be used as a library dependency
 * or run as a CLI tool for validation.
 */

import {
  isValidTag,
  areValidTags,
  createValidTagsArray,
  ValidTags,
  ValidTagsArray,
} from '../schema/tags.types.js';

import { TestInfo } from '@playwright/test';
import {
  isValidAnnotation,
  areValidAnnotations,
  createValidAnnotationsArray,
  ValidAnnotation,
  ValidAnnotationsArray,
} from '../schema/annotations.types.js';

// Re-export schema types and functions for external use
export {
  // Tag types and validators
  ValidTags,
  ValidTagsArray,
  isValidTag,
  areValidTags,
  createValidTagsArray,
} from '../schema/tags.types.js';

export {
  // Annotation types and validators
  ValidAnnotation,
  ValidAnnotationsArray,
  isValidAnnotation,
  areValidAnnotations,
  createValidAnnotationsArray,
  ValidAnnotationTypes,
  LinkAnnotation,
  ImportanceAnnotation,
  InterfaceAnnotation,
  CategoryAnnotation,
  AssigneeAnnotation,
  createLinkAnnotation,
  createImportanceAnnotation,
  createInterfaceAnnotation,
  createCategoryAnnotation,
  createAssigneeAnnotation,
} from '../schema/annotations.types.js';

/**
 * Configuration options for validation behavior
 */
export interface ValidationConfig {
  /** Whether to fail tests when validation errors occur (default: false - just warn) */
  failOnValidationError?: boolean;
  /** Whether to log validation warnings (default: true) */
  logWarnings?: boolean;
  /** Custom logger function (default: console.warn) */
  logger?: (message: string) => void;
}

/**
 * Result of tag validation
 */
export interface TagValidationResult {
  /** Whether all tags are valid */
  isValid: boolean;
  /** Array of valid tags found */
  validTags: ValidTagsArray;
  /** Array of invalid tags found */
  invalidTags: string[];
  /** Error messages for invalid tags */
  errors: string[];
}

/**
 * Result of annotation validation
 */
export interface AnnotationValidationResult {
  /** Whether all annotations are valid */
  isValid: boolean;
  /** Array of valid annotations found */
  validAnnotations: ValidAnnotationsArray;
  /** Array of invalid annotations found */
  invalidAnnotations: unknown[];
  /** Error messages for invalid annotations */
  errors: string[];
}

/**
 * Combined validation result for both tags and annotations
 */
export interface MetadataValidationResult {
  /** Tag validation results */
  tags: TagValidationResult;
  /** Annotation validation results */
  annotations: AnnotationValidationResult;
  /** Whether all metadata is valid */
  isAllValid: boolean;
  /** All error messages combined */
  allErrors: string[];
}

/**
 * Validates Playwright test tags from a TestInfo object
 *
 * @param testInfo - Playwright TestInfo object containing tags
 * @param config - Optional validation configuration
 * @returns Validation result with details about valid/invalid tags
 */
export function validateTestTags(
  testInfo: TestInfo,
  config: ValidationConfig = {},
): TagValidationResult {
  const { logWarnings = true, logger = console.warn } = config;
  const tags = testInfo.tags || [];

  const validTags: ValidTagsArray = [];
  const invalidTags: string[] = [];
  const errors: string[] = [];

  for (const tag of tags) {
    if (isValidTag(tag)) {
      validTags.push(tag);
    } else {
      invalidTags.push(tag);
      errors.push(`Invalid tag: "${tag}" - not in list of valid tags`);
    }
  }

  const isValid = invalidTags.length === 0;

  if (!isValid && logWarnings) {
    errors.forEach((error) => logger(error));
  }

  return {
    isValid,
    validTags,
    invalidTags,
    errors,
  };
}

/**
 * Validates Playwright test annotations from a TestInfo object
 *
 * @param testInfo - Playwright TestInfo object containing annotations
 * @param config - Optional validation configuration
 * @returns Validation result with details about valid/invalid annotations
 */
export function validateTestAnnotations(
  testInfo: TestInfo,
  config: ValidationConfig = {},
): AnnotationValidationResult {
  const { logWarnings = true, logger = console.warn } = config;
  const annotations = testInfo.annotations || [];

  const validAnnotations: ValidAnnotationsArray = [];
  const invalidAnnotations: unknown[] = [];
  const errors: string[] = [];

  for (const annotation of annotations) {
    if (isValidAnnotation(annotation)) {
      validAnnotations.push(annotation);
    } else {
      invalidAnnotations.push(annotation);

      // Create specific error messages based on the type of validation failure
      if (typeof annotation !== 'object' || annotation === null) {
        errors.push(
          `Invalid annotation: must be an object, got ${typeof annotation}`,
        );
      } else {
        const obj = annotation as Record<string, unknown>;
        if (!obj.type) {
          errors.push(`Invalid annotation: missing "type" property`);
        } else if (!obj.description) {
          errors.push(`Invalid annotation: missing "description" property`);
        } else {
          errors.push(
            `Invalid annotation: type="${obj.type}" with description="${obj.description}" - ` +
              `either invalid type or invalid description value for that type`,
          );
        }
      }
    }
  }

  const isValid = invalidAnnotations.length === 0;

  if (!isValid && logWarnings) {
    errors.forEach((error) => logger(error));
  }

  return {
    isValid,
    validAnnotations,
    invalidAnnotations,
    errors,
  };
}

/**
 * Validates both tags and annotations from a Playwright TestInfo object
 *
 * @param testInfo - Playwright TestInfo object containing tags and annotations
 * @param config - Optional validation configuration
 * @returns Combined validation result for both tags and annotations
 */
export function validateTestMetadata(
  testInfo: TestInfo,
  config: ValidationConfig = {},
): MetadataValidationResult {
  const tagResults = validateTestTags(testInfo, config);
  const annotationResults = validateTestAnnotations(testInfo, config);

  const isAllValid = tagResults.isValid && annotationResults.isValid;
  const allErrors = [...tagResults.errors, ...annotationResults.errors];

  return {
    tags: tagResults,
    annotations: annotationResults,
    isAllValid,
    allErrors,
  };
}

/**
 * Creates a Playwright test.beforeEach hook that validates test metadata
 *
 * This function can be imported and used in Playwright test files to automatically
 * validate tags and annotations before each test runs.
 *
 * @param config - Validation configuration
 * @returns A function that can be passed to test.beforeEach()
 *
 * @example
 * ```typescript
 * import { test } from '@playwright/test';
 * import { createMetadataValidationHook } from 'playwright-meta-schema';
 *
 * // Warn on validation errors (default)
 * test.beforeEach(createMetadataValidationHook());
 *
 * // Fail tests on validation errors
 * test.beforeEach(createMetadataValidationHook({ failOnValidationError: true }));
 * ```
 */
export function createMetadataValidationHook(config: ValidationConfig = {}) {
  return async ({}, testInfo: TestInfo) => {
    const { failOnValidationError = false } = config;

    const validationResult = validateTestMetadata(testInfo, config);

    if (!validationResult.isAllValid && failOnValidationError) {
      const errorMessage = `Test metadata validation failed:\n${validationResult.allErrors.join('\n')}`;
      throw new Error(errorMessage);
    }
  };
}

/**
 * Default validation configuration
 */
export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  failOnValidationError: false,
  logWarnings: true,
  logger: console.warn,
};

/**
 * Creates a validation configuration merger utility
 *
 * This utility function helps merge validation configurations in fixture files.
 *
 * @param baseConfig - Base configuration object
 * @param overrides - Configuration overrides
 * @returns Merged configuration
 *
 * @example
 * ```typescript
 * const config = mergeValidationConfig(DEFAULT_VALIDATION_CONFIG, {
 *   failOnValidationError: process.env.CI === 'true'
 * });
 * ```
 */
export function mergeValidationConfig(
  baseConfig: ValidationConfig,
  overrides: Partial<ValidationConfig>,
): ValidationConfig {
  return { ...baseConfig, ...overrides };
}
