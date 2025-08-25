import {
  ValidAnnotationTypes,
  AnnotationTypePrimitives,
  LINK_TYPE,
  IMPORTANCE_TYPE,
  INTERFACE_TYPE,
  CATEGORY_TYPE,
  ASSIGNEE_TYPE,
  Importance,
  InterfaceType,
  Category,
  ImportancePrimitives,
  InterfaceTypePrimitives,
  CategoryPrimitives,
} from './annotations-custom.types.js';

// Re-export ValidAnnotationTypes for external use
export { ValidAnnotationTypes };

/**
 * Type mapping for annotation descriptions based on their type
 * This ensures each annotation type has the correct description type
 */
export type AnnotationDescriptionMap = {
  [LINK_TYPE]: string;
  [IMPORTANCE_TYPE]: Importance;
  [INTERFACE_TYPE]: InterfaceType;
  [CATEGORY_TYPE]: Category;
  [ASSIGNEE_TYPE]: string;
};

/**
 * Type mapping for validation primitives arrays
 */
type ValidationPrimitivesMap = {
  [IMPORTANCE_TYPE]: typeof ImportancePrimitives;
  [INTERFACE_TYPE]: typeof InterfaceTypePrimitives;
  [CATEGORY_TYPE]: typeof CategoryPrimitives;
};

/**
 * Generic annotation interface that maps the description type based on the annotation type
 * This provides compile-time type safety for description values
 */
export interface TypedAnnotation<T extends ValidAnnotationTypes> {
  type: T;
  description: AnnotationDescriptionMap[T];
}

/**
 * Strongly typed annotation interface using valid annotation types
 * This is a union of all possible typed annotations
 */
export type ValidAnnotation = {
  [T in ValidAnnotationTypes]: TypedAnnotation<T>;
}[ValidAnnotationTypes];

/**
 * Utility type to extract the description type for a given annotation type
 */
export type DescriptionType<T extends ValidAnnotationTypes> =
  AnnotationDescriptionMap[T];

/**
 * Utility type to create a strongly typed annotation factory function signature
 */
export type AnnotationFactory<T extends ValidAnnotationTypes> = (
  description: DescriptionType<T>,
) => TypedAnnotation<T>;

/**
 * Mapped type for all annotation factory functions
 */
export type AnnotationFactories = {
  [T in ValidAnnotationTypes as `create${Capitalize<T>}Annotation`]: AnnotationFactory<T>;
};

/**
 * Mapped type for all specific annotation types
 */
export type SpecificAnnotationMap = {
  [LINK_TYPE]: TypedAnnotation<typeof LINK_TYPE>;
  [IMPORTANCE_TYPE]: TypedAnnotation<typeof IMPORTANCE_TYPE>;
  [INTERFACE_TYPE]: TypedAnnotation<typeof INTERFACE_TYPE>;
  [CATEGORY_TYPE]: TypedAnnotation<typeof CATEGORY_TYPE>;
  [ASSIGNEE_TYPE]: TypedAnnotation<typeof ASSIGNEE_TYPE>;
};

/**
 * Represents a link annotation, extending the TypedAnnotation type.
 * @property type - The annotation type, always 'link'.
 * @property description - The URL or link text associated with the annotation.
 */
export type LinkAnnotation = SpecificAnnotationMap[typeof LINK_TYPE];

/**
 * Represents an importance annotation, extending the TypedAnnotation type.
 * @property type - The annotation type, always 'importance'.
 * @property description - The importance level (critical, high, medium, low).
 */
export type ImportanceAnnotation =
  SpecificAnnotationMap[typeof IMPORTANCE_TYPE];

/**
 * Represents an interface annotation, extending the TypedAnnotation type.
 * @property type - The annotation type, always 'interface'.
 * @property description - The interface type (ui, api, cli, db).
 */
export type InterfaceAnnotation = SpecificAnnotationMap[typeof INTERFACE_TYPE];

/**
 * Represents a category annotation, extending the TypedAnnotation type.
 * @property type - The annotation type, always 'category'.
 * @property description - The test category (unit, functional, system, integration, performance).
 */
export type CategoryAnnotation = SpecificAnnotationMap[typeof CATEGORY_TYPE];

/**
 * Represents an assignee annotation, extending the TypedAnnotation type.
 * @property type - The annotation type, always 'assignee'.
 * @property description - The name/email of the assignee.
 */
export type AssigneeAnnotation = SpecificAnnotationMap[typeof ASSIGNEE_TYPE];

/**
 * Union type of all specific annotation interfaces
 */
export type SpecificAnnotation =
  | LinkAnnotation
  | ImportanceAnnotation
  | InterfaceAnnotation
  | CategoryAnnotation
  | AssigneeAnnotation;

/**
 * Array type for valid annotations
 */
export type ValidAnnotationsArray = ValidAnnotation[];

/**
 * Generic validation function for typed values
 */
function createValueValidator<T extends keyof ValidationPrimitivesMap>(
  primitives: ValidationPrimitivesMap[T],
) {
  return function (value: string): value is ValidationPrimitivesMap[T][number] {
    return (primitives as readonly string[]).includes(value);
  };
}

/**
 * Type guard to validate if a string is a valid annotation type
 */
export function isValidAnnotationType(
  type: string,
): type is ValidAnnotationTypes {
  return AnnotationTypePrimitives.includes(type as ValidAnnotationTypes);
}

/**
 * Type guard to validate if a string is a valid importance value
 */
export const isValidImportanceValue =
  createValueValidator(ImportancePrimitives);

/**
 * Type guard to validate if a string is a valid interface type value
 */
export const isValidInterfaceTypeValue = createValueValidator(
  InterfaceTypePrimitives,
);

/**
 * Type guard to validate if a string is a valid category value
 */
export const isValidCategoryValue = createValueValidator(CategoryPrimitives);

/**
 * Enhanced type guard to validate if an object is a valid annotation with typed descriptions
 */
export function isValidAnnotation(
  annotation: unknown,
): annotation is ValidAnnotation {
  if (
    typeof annotation !== 'object' ||
    annotation === null ||
    typeof (annotation as Record<string, unknown>).type !== 'string' ||
    typeof (annotation as Record<string, unknown>).description !== 'string'
  ) {
    return false;
  }

  const { type, description } = annotation as {
    type: string;
    description: string;
  };

  if (!isValidAnnotationType(type)) {
    return false;
  }

  // Validate description based on annotation type
  switch (type) {
    case LINK_TYPE:
    case ASSIGNEE_TYPE:
      // For link and assignee annotations, any string description is valid
      return typeof description === 'string';
    case IMPORTANCE_TYPE:
      return isValidImportanceValue(description);
    case INTERFACE_TYPE:
      return isValidInterfaceTypeValue(description);
    case CATEGORY_TYPE:
      return isValidCategoryValue(description);
    default:
      return false;
  }
}

/**
 * Type guard to validate an array of annotations
 */
export function areValidAnnotations(
  annotations: unknown[],
): annotations is ValidAnnotation[] {
  return annotations.every((annotation) => isValidAnnotation(annotation));
}

/**
 * Helper function to create a validated annotations array
 */
export function createValidAnnotationsArray(
  annotations: unknown[],
): ValidAnnotation[] {
  const validAnnotations = annotations.filter(isValidAnnotation);
  if (validAnnotations.length !== annotations.length) {
    const invalidAnnotations = annotations.filter(
      (annotation) => !isValidAnnotation(annotation),
    );
    console.warn(
      `Invalid annotations found and filtered out: ${invalidAnnotations.map((a) => (a as Record<string, unknown>)?.type || 'unknown').join(', ')}`,
    );
  }
  return validAnnotations;
}

/**
 * Generic type guard factory for specific annotation types
 */
function createAnnotationTypeGuard<T extends ValidAnnotationTypes>(
  expectedType: T,
) {
  return function (
    annotation: ValidAnnotation,
  ): annotation is SpecificAnnotationMap[T] {
    return annotation.type === expectedType;
  };
}

/**
 * Type guard for link annotations specifically
 */
export const isLinkAnnotation = createAnnotationTypeGuard(LINK_TYPE);

/**
 * Type guard for importance annotations specifically
 */
export const isImportanceAnnotation =
  createAnnotationTypeGuard(IMPORTANCE_TYPE);

/**
 * Type guard for interface annotations specifically
 */
export const isInterfaceAnnotation = createAnnotationTypeGuard(INTERFACE_TYPE);

/**
 * Type guard for category annotations specifically
 */
export const isCategoryAnnotation = createAnnotationTypeGuard(CATEGORY_TYPE);

/**
 * Type guard for assignee annotations specifically
 */
export const isAssigneeAnnotation = createAnnotationTypeGuard(ASSIGNEE_TYPE);

/**
 * Generic annotation factory function
 */
function createAnnotationFactory<T extends ValidAnnotationTypes>(type: T) {
  return function (
    description: AnnotationDescriptionMap[T],
  ): TypedAnnotation<T> {
    return {
      type,
      description,
    } as TypedAnnotation<T>;
  };
}

/**
 * Helper function to create a link annotation
 */
export const createLinkAnnotation = createAnnotationFactory(LINK_TYPE);

/**
 * Helper function to create an importance annotation
 */
export const createImportanceAnnotation =
  createAnnotationFactory(IMPORTANCE_TYPE);

/**
 * Helper function to create an interface annotation
 */
export const createInterfaceAnnotation =
  createAnnotationFactory(INTERFACE_TYPE);

/**
 * Helper function to create a category annotation
 */
export const createCategoryAnnotation = createAnnotationFactory(CATEGORY_TYPE);

/**
 * Helper function to create an assignee annotation
 */
export const createAssigneeAnnotation = createAnnotationFactory(ASSIGNEE_TYPE);
