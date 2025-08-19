/**
 * TypeScript interface definitions for testcase metadata schema
 * Designed to model Playwright testcase objects with proper annotation and tag composition
 */

import {
  ImportanceAnnotation,
  CategoryAnnotation,
  AssigneeAnnotation,
  InterfaceAnnotation,
  LinkAnnotation,
  ValidAnnotation,
  ValidAnnotationsArray,
  isValidAnnotation,
  isImportanceAnnotation,
  isCategoryAnnotation,
  isAssigneeAnnotation,
  isInterfaceAnnotation,
  isLinkAnnotation,
  createImportanceAnnotation,
  createCategoryAnnotation,
  createAssigneeAnnotation,
  createInterfaceAnnotation,
  createLinkAnnotation
} from './annotations.types.js';

import {
  ValidTagsArray,
  areValidTags,
  createValidTagsArray
} from './tags.types.js';

import {
  Importance,
  Category,
  InterfaceType
} from './annotations-custom.types.js';

/**
 * Core test case metadata interface modeling Playwright testcase data structure.
 * Composed of tags array and key:value pairs for each annotation type.
 * Only importance and category are required for junit reporting.
 */
export interface TestCaseMetadata {
  // Required annotations for junit reporting
  importance: ImportanceAnnotation;
  category: CategoryAnnotation;

  // Optional annotations
  assignee?: AssigneeAnnotation;
  interface?: InterfaceAnnotation;
  links?: LinkAnnotation[];

  // Tags array (Playwright or custom)
  tags?: ValidTagsArray;

  // Allow for custom annotation fields
  [key: string]: ValidAnnotation | ValidAnnotation[] | ValidTagsArray | undefined;
}

/**
 * Input structure for creating test case metadata from raw Playwright data
 */
export interface TestCaseMetadataInput {
  importance: Importance;
  category: Category;
  assignee?: string;
  interface?: InterfaceType;
  links?: string[];
  tags?: string[];
  [key: string]: unknown;
}

/**
 * Validation function for complete test case metadata
 */
export function validateTestCaseMetadata(metadata: unknown): metadata is TestCaseMetadata {
  if (typeof metadata !== 'object' || metadata === null) {
    return false;
  }

  const meta = metadata as Record<string, unknown>;

  // Check required fields - must be valid annotation objects
  if (!meta.importance || !isValidAnnotation(meta.importance) || !isImportanceAnnotation(meta.importance as ValidAnnotation)) {
    return false;
  }

  if (!meta.category || !isValidAnnotation(meta.category) || !isCategoryAnnotation(meta.category as ValidAnnotation)) {
    return false;
  }

  // Validate optional fields if present
  if (meta.assignee && (!isValidAnnotation(meta.assignee) || !isAssigneeAnnotation(meta.assignee as ValidAnnotation))) {
    return false;
  }

  if (meta.interface && (!isValidAnnotation(meta.interface) || !isInterfaceAnnotation(meta.interface as ValidAnnotation))) {
    return false;
  }

  if (meta.links) {
    if (!Array.isArray(meta.links) || !meta.links.every(link => isValidAnnotation(link) && isLinkAnnotation(link as ValidAnnotation))) {
      return false;
    }
  }

  if (meta.tags && !areValidTags(meta.tags as string[])) {
    return false;
  }

  return true;
}

/**
 * Helper function to create test case metadata from ValidTags array and ValidAnnotations array
 */
export function createTestCaseMetadataFromArrays(
  tags: string[],
  annotations: unknown[]
): TestCaseMetadata | null {
  // Validate and filter tags
  const validTags = createValidTagsArray(tags);

  // Validate and filter annotations
  const validAnnotations = annotations.filter(isValidAnnotation);

  // Find required annotations
  const importance = validAnnotations.find(isImportanceAnnotation);
  const category = validAnnotations.find(isCategoryAnnotation);

  if (!importance || !category) {
    console.warn('Missing required annotations: importance and category are required');
    return null;
  }

  // Find optional annotations
  const assignee = validAnnotations.find(isAssigneeAnnotation);
  const interfaceAnnotation = validAnnotations.find(isInterfaceAnnotation);
  const links = validAnnotations.filter(isLinkAnnotation);

  const metadata: TestCaseMetadata = {
    importance,
    category,
    tags: validTags.length > 0 ? validTags : undefined
  };

  if (assignee) metadata.assignee = assignee;
  if (interfaceAnnotation) metadata.interface = interfaceAnnotation;
  if (links.length > 0) metadata.links = links;

  return metadata;
}

/**
 * Helper function to create test case metadata from input structure
 */
export function createTestCaseMetadata(input: TestCaseMetadataInput): TestCaseMetadata {
  const metadata: TestCaseMetadata = {
    importance: createImportanceAnnotation(input.importance),
    category: createCategoryAnnotation(input.category)
  };

  // Add optional fields
  if (input.assignee) {
    metadata.assignee = createAssigneeAnnotation(input.assignee);
  }

  if (input.interface) {
    metadata.interface = createInterfaceAnnotation(input.interface);
  }

  if (input.links && input.links.length > 0) {
    metadata.links = input.links.map(createLinkAnnotation);
  }

  if (input.tags && input.tags.length > 0) {
    metadata.tags = createValidTagsArray(input.tags);
  }

  return metadata;
}

/**
 * Helper function to extract annotations array from test case metadata
 */
export function extractAnnotationsFromMetadata(metadata: TestCaseMetadata): ValidAnnotationsArray {
  const annotations: ValidAnnotation[] = [
    metadata.importance,
    metadata.category
  ];

  if (metadata.assignee) annotations.push(metadata.assignee);
  if (metadata.interface) annotations.push(metadata.interface);
  if (metadata.links) annotations.push(...metadata.links);

  return annotations;
}

/**
 * Helper function to extract tags array from test case metadata
 */
export function extractTagsFromMetadata(metadata: TestCaseMetadata): ValidTagsArray {
  return metadata.tags || [];
}

/**
 * Type guard to check if metadata has all required fields
 */
export function hasRequiredMetadata(metadata: Partial<TestCaseMetadata>): metadata is TestCaseMetadata {
  return !!(metadata.importance && metadata.category);
}

/**
 * Utility function to merge multiple test case metadata objects
 */
export function mergeTestCaseMetadata(...metadataObjects: Partial<TestCaseMetadata>[]): TestCaseMetadata | null {
  const merged: Partial<TestCaseMetadata> = {};
  const allTags: string[] = [];

  for (const metadata of metadataObjects) {
    // Collect tags separately before merging other fields
    if (metadata.tags) {
      allTags.push(...metadata.tags);
    }

    // Merge all fields except tags
    for (const [key, value] of Object.entries(metadata)) {
      if (key !== 'tags') {
        (merged as Record<string, unknown>)[key] = value;
      }
    }
  }

  // Set merged tags if any were found
  if (allTags.length > 0) {
    merged.tags = createValidTagsArray(allTags);
  }

  if (!hasRequiredMetadata(merged)) {
    console.warn('Merged metadata missing required fields: importance and category');
    return null;
  }

  return merged;
}
