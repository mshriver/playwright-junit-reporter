import { CustomTags, CustomTagPrimitives } from './tags-custom.types.js';
/**
 * Represents a tag, using 'value' as the identifier.
 *
 * https://playwright.dev/docs/test-annotations#tag-tests
 */
const PW_PREFIX = '@' as const;

export type Tag = `${typeof PW_PREFIX}${string}`;

/**
 * Base tag value types without the @ prefix
 */
const PlaywrightTagValues = ['skip', 'fail', 'fixme', 'slow', 'fast'] as const;
export type PlaywrightTagPrimitives = (typeof PlaywrightTagValues)[number];

/**
 * Maps tag value types to their prefixed versions
 * This creates valid Playwright tags like @critical, @ui, @functional, etc.
 */
export type ValidPlaywrightTags =
  `${typeof PW_PREFIX}${PlaywrightTagPrimitives}`;

/**
 * All valid custom tags with @ prefix
 */
export type ValidCustomTags = `${typeof PW_PREFIX}${CustomTags}`;

/**
 * Complete union of all valid tags
 */
export type ValidTags = ValidPlaywrightTags | ValidCustomTags;

/**
 * Array type for valid tags
 */
export type ValidTagsArray = ValidTags[];

/**
 * Conditional type to check if a tag is valid
 */
export type IsValidTag<T extends string> = T extends ValidTags ? true : false;

/**
 * Mapped type to extract the tag value (without @) from a valid tag
 */
export type ExtractTagValue<T extends ValidTags> =
  T extends `${typeof PW_PREFIX}${infer U}` ? U : never;

/**
 * Utility type to get all possible tag values without the @ prefix
 */
export type AllTagValues = ExtractTagValue<ValidTags>;

/**
 * Interface for test case tags with validation
 */
export interface TestCaseTags {
  tags: ValidTagsArray;
}

/**
 * Type guard to validate if a string is a valid tag
 */
export function isValidTag(tag: string): tag is ValidTags {
  const validTags: ValidTags[] = [
    // PW tags
    ...PlaywrightTagValues.map(
      (value) => `${PW_PREFIX}${value}` as ValidPlaywrightTags,
    ),
    // Custom tags
    ...CustomTagPrimitives.map(
      (value) => `${PW_PREFIX}${value}` as ValidCustomTags,
    ),
  ];

  return validTags.includes(tag as ValidTags);
}

/**
 * Type guard to validate an array of tags
 */
export function areValidTags(tags: string[]): tags is ValidTags[] {
  return tags.every((tag) => isValidTag(tag));
}

/**
 * Helper function to create a validated tag array
 */
export function createValidTagsArray(tags: string[]): ValidTags[] {
  const validTags = tags.filter(isValidTag);
  if (validTags.length !== tags.length) {
    const invalidTags = tags.filter((tag) => !isValidTag(tag));
    console.warn(
      `Invalid tags found and filtered out: ${invalidTags.join(', ')}`,
    );
  }
  return validTags;
}
