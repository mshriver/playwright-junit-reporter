/**
 * Additional custom tags that might be used in testing
 */
export const CustomTagPrimitives = [
  'smoke',
  'regression',
  'sanity',
  'e2e',
] as const;
export type CustomTags = (typeof CustomTagPrimitives)[number];
