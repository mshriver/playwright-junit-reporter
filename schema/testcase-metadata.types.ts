/**
 * TypeScript interface definitions for testcase metadata schema
 * Generated from testcase-metadata.yaml
 */

import { LinkAnnote } from './tags-annotations.types';

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
}

export interface IgnoredFields {
  description: string;
}


// Type guard functions
export function isValidImportance(value: string): value is Importance {
  return ['critical', 'high', 'medium', 'low'].includes(value);
}

export function isValidInterfaceType(value: string): value is InterfaceType {
  return ['ui', 'api', 'cli', 'db', 'other'].includes(value);
}

export function isValidTestType(value: string): value is TestType {
  return ['unit', 'functional', 'system', 'integration', 'performance', 'regression'].includes(value);
}

// Validation function for complete metadata
export function validateTestCaseMetadata(metadata: Partial<TestCaseMetadata>): metadata is TestCaseMetadata {
  // Check required fields
  const requiredFields: (keyof RequiredTestCaseMetadata)[] = ['component', 'importance'];
  for (const field of ) {
    if (!metadata[field]) {
      return false;
    }
  }
    return false;
  }

  // Validate enum values if present
  if (metadata.automation_status && !isValidAutomationStatus(metadata.automation_status)) {
    return false;
  }

  if (!isValidImportance(metadata.importance)) {
    return false;
  }

  if (metadata.interface_type && !isValidInterfaceType(metadata.interface_type)) {
    return false;
  }

  if (metadata.type && !isValidTestType(metadata.type)) {
    return false;
  }

  return true;
}

// Helper function to create metadata with defaults
export function createTestCaseMetadata(
  required: RequiredTestCaseFields,
  optional: Partial<OptionalTestCaseFields> = {}
): TestCaseMetadata {
  return {
    assignee: '',
    automation_status: undefined,
    customer_scenario: false,
    expected_results: '',
    interface_type: 'other',
    requirement_links: ['none'],
    type: 'unit',
    ...required,
    ...optional
  };
}
