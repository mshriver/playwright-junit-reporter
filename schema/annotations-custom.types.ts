// Enum types for valid values

export const ImportancePrimitives = [
  'critical',
  'high',
  'medium',
  'low',
] as const;
export type Importance = (typeof ImportancePrimitives)[number];

export const InterfaceTypePrimitives = ['ui', 'api', 'cli', 'db'] as const;
export type InterfaceType = (typeof InterfaceTypePrimitives)[number];

export const CategoryPrimitives = [
  'unit',
  'function',
  'system',
  'integration',
  'performance',
] as const;
export type Category = (typeof CategoryPrimitives)[number];

/**
 * Annotation type primitives
 * Since there are no Playwright-defined annotation types, these are all custom
 */
export const LINK_TYPE = 'link';
export const IMPORTANCE_TYPE = 'importance';
export const INTERFACE_TYPE = 'interface';
export const CATEGORY_TYPE = 'category';
export const ASSIGNEE_TYPE = 'assignee';

export const AnnotationTypePrimitives = [
  LINK_TYPE,
  IMPORTANCE_TYPE,
  INTERFACE_TYPE,
  CATEGORY_TYPE,
  ASSIGNEE_TYPE,
] as const;
export type ValidAnnotationTypes = (typeof AnnotationTypePrimitives)[number];
