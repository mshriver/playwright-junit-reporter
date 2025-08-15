/**
 * TypeScript interface definitions for testcase metadata schema
 * Generated from testcase-metadata.yaml
 */

// Enum types for valid values
export type AutomationStatus = 'automated' | 'not_automated' | 'manual_only';

export type Importance = 'critical' | 'high' | 'medium' | 'low';

export type InterfaceType = 'ui' | 'api' | 'cli' | 'db' | 'other';

export type TestType = 'unit' | 'functional' | 'system' | 'integration' | 'performance' | 'regression';

// Requirement link interface
export interface RequirementLink {
  id: string;
  url: string;
  description: string;
}

// Main testcase metadata interface
export interface TestCaseMetadata {
  assignee?: string;
  automation_status?: AutomationStatus;
  customer_scenario?: boolean;
  component: string; // Required field
  expected_results?: string;
  importance: Importance; // Required field
  interface_type?: InterfaceType;
  requirement_links?: RequirementLink[] | ['none'];
  type?: TestType;
}

// Schema configuration interfaces
export interface DefaultFields {
  assignee: string;
  automation_status: string;
  customer_scenario: boolean;
  component: string;
  expected_results: string;
  importance: Importance;
  interface_type: InterfaceType;
  requirement_links: RequirementLink[] | ['none'];
  type: TestType;
}

export interface ValidValues {
  automation_status: AutomationStatus[];
  importance: Importance[];
  interface_type: InterfaceType[];
  test_type: TestType[];
  component: string[]; // Customizable
  requirement_links: RequirementLink[];
}

export interface IgnoredFields {
  description: string;
}

export interface TestCaseMetadataSchema {
  default_fields: DefaultFields;
  required_fields: (keyof TestCaseMetadata)[];
  marker_fields: Record<string, unknown>;
  ignored_fields: IgnoredFields;
  valid_values: ValidValues;
}

// Utility types for validation
export type RequiredTestCaseFields = Pick<TestCaseMetadata, 'component' | 'importance'>;
export type OptionalTestCaseFields = Omit<TestCaseMetadata, 'component' | 'importance'>;

// Type guard functions
export function isValidAutomationStatus(value: string): value is AutomationStatus {
  return ['automated', 'not_automated', 'manual_only'].includes(value);
}

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
  if (!metadata.component || !metadata.importance) {
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
