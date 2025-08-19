/**
 * TypeScript interface definitions for testcase metadata schema
 * Generated from testcase-metadata.yaml
 */

import { LinkAnnote } from './annotations.types';
import { ValidTagsArray, areValidTags } from './tags.types';

// Enum types for valid values

export type Importance = 'critical' | 'high' | 'medium' | 'low';

export type InterfaceType = 'ui' | 'api' | 'cli' | 'db';

export type TestType = 'unit' | 'functional' | 'system' | 'integration' | 'performance';


export interface RequiredTestCaseMetadata {
  component: string;
  importance: Importance;
}

export interface TestCaseMetadata extends RequiredTestCaseMetadata {
  assignee?: string;
  interface_type?: InterfaceType;
  test_links?: LinkAnnote[];
  test_type?: TestType;
  tags?: ValidTagsArray; // Add tags support
}

export interface IgnoredFields {
  description: string;
}

// Type guard functions
export function isValidImportance(value: string): value is Importance {
  return ['critical', 'high', 'medium', 'low'].includes(value);
}

export function isValidInterfaceType(value: string): value is InterfaceType {
  return ['ui', 'api', 'cli', 'db'].includes(value);
}

export function isValidTestType(value: string): value is TestType {
  return ['unit', 'functional', 'system', 'integration', 'performance'].includes(value);
}

// Validation function for complete metadata
export function validateTestCaseMetadata(metadata: Partial<TestCaseMetadata>): metadata is TestCaseMetadata {
  // Check required fields
  const requiredFields: (keyof RequiredTestCaseMetadata)[] = ['component', 'importance'];
  for (const field of requiredFields) {
    if (!metadata[field]) {
      return false;
    }
  }

  if (!isValidImportance(metadata.importance!)) {
    return false;
  }

  if (metadata.interface_type && !isValidInterfaceType(metadata.interface_type)) {
    return false;
  }

  if (metadata.test_type && !isValidTestType(metadata.test_type)) {
    return false;
  }

  // Validate tags if present
  if (metadata.tags && !areValidTags(metadata.tags)) {
    return false;
  }

  return true;
}

// Helper function to create metadata with defaults
export function createTestCaseMetadata(
  required: RequiredTestCaseMetadata,
  optional: Partial<Omit<TestCaseMetadata, keyof RequiredTestCaseMetadata>> = {}
): TestCaseMetadata {
  return {
    ...required,
    ...optional
  };
}
