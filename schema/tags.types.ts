import { Importance, InterfaceType, TestType } from './testcase-metadata.types';


/**
 * Represents a tag, using 'value' as the identifier.
 *
 * https://playwright.dev/docs/test-annotations#tag-tests
 */
export type Tag<TagType> = {
  tag: TagType;
}


/**
 * Represents the expected schema fields that will be used for Playwright tags.
 * @remarks
 * This type is used to define the valid tag fields that can be applied to test cases.
 *
 * @example
 * ```typescript
 * test('playwright test with a tag', {
 *   tag: ['@critical', '@ui', '@integration'],
 * })
 * ```
 */
export type TagTypes = Importance | InterfaceType | TestType;
