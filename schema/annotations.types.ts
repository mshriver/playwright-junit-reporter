import {
  AnnotationTypeField,
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
  CategoryPrimitives
} from './annotations-custom.types.js';

/**
 * All valid annotation types (currently all custom since Playwright doesn't define annotation types)
 */
export type ValidAnnotationTypes = AnnotationTypeField;

/**
 * Array type for valid annotation types
 */
export type ValidAnnotationTypesArray = ValidAnnotationTypes[];

/**
 * Conditional type to check if an annotation type is valid
 */
export type IsValidAnnotationType<T extends string> = T extends ValidAnnotationTypes ? true : false;

/**
 * Strongly typed annotation interface using valid annotation types
 */
export interface ValidAnnotation {
  type: ValidAnnotationTypes;
  description: string;
}

/**
 * Represents a link annotation, extending the ValidAnnotation type.
 * @property type - The annotation type, always 'link'.
 * @property description - The URL or link text associated with the annotation.
 */
export interface LinkAnnotation extends ValidAnnotation {
  type: typeof LINK_TYPE;
  description: string; // URL or link text
}

/**
 * Represents an importance annotation, extending the ValidAnnotation type.
 * @property type - The annotation type, always 'importance'.
 * @property description - The importance level (critical, high, medium, low).
 */
export interface ImportanceAnnotation extends ValidAnnotation {
  type: typeof IMPORTANCE_TYPE;
  description: Importance;
}

/**
 * Represents an interface annotation, extending the ValidAnnotation type.
 * @property type - The annotation type, always 'interface'.
 * @property description - The interface type (ui, api, cli, db).
 */
export interface InterfaceAnnotation extends ValidAnnotation {
  type: typeof INTERFACE_TYPE;
  description: InterfaceType;
}

/**
 * Represents a category annotation, extending the ValidAnnotation type.
 * @property type - The annotation type, always 'category'.
 * @property description - The test category (unit, functional, system, integration, performance).
 */
export interface CategoryAnnotation extends ValidAnnotation {
  type: typeof CATEGORY_TYPE;
  description: Category;
}

/**
 * Represents an assignee annotation, extending the ValidAnnotation type.
 * @property type - The annotation type, always 'assignee'.
 * @property description - The name/email of the assignee.
 */
export interface AssigneeAnnotation extends ValidAnnotation {
  type: typeof ASSIGNEE_TYPE;
  description: string;
}

/**
 * Union type of all specific annotation interfaces
 */
export type SpecificAnnotation = LinkAnnotation | ImportanceAnnotation | InterfaceAnnotation | CategoryAnnotation | AssigneeAnnotation;

/**
 * Array type for valid annotations
 */
export type ValidAnnotationsArray = ValidAnnotation[];

/**
 * Defines the expected schema fields for Playwright annotations.
 * Each annotation field contains a single annotation object.
 * @property assignee - A single AssigneeAnnotation object.
 * @property category - A single CategoryAnnotation object.
 * @property importance - A single ImportanceAnnotation object.
 * @property interface - A single InterfaceAnnotation object.
 * @property links - An array of LinkAnnotation objects (links can be multiple).
 * @property [key: string] - Allows for custom annotations keyed by annotation type.
 */
export type AnnotationsFields = {
  assignee?: AssigneeAnnotation;
  category?: CategoryAnnotation;
  importance?: ImportanceAnnotation;
  interface?: InterfaceAnnotation;
  links?: LinkAnnotation[];

  // for custom annotations
  [key: string]: ValidAnnotation | ValidAnnotation[] | undefined;
}

/**
 * Interface-based version of AnnotationsFields that enforces type safety for annotation validation.
 * This provides stronger type safety for annotation validation in Playwright testcase contexts.
 */
export interface AnnotationsFieldsInterface {
  assignee?: AssigneeAnnotation;
  category?: CategoryAnnotation;
  importance?: ImportanceAnnotation;
  interface?: InterfaceAnnotation;
  links?: LinkAnnotation[];
  [key: string]: ValidAnnotation | ValidAnnotation[] | undefined;
}

/**
 * Type guard to validate if an object conforms to AnnotationsFieldsInterface
 */
export function isValidAnnotationsFields(obj: unknown): obj is AnnotationsFieldsInterface {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return false;
  }

  const fields = obj as Record<string, unknown>;

  // Check each known property to ensure it's valid
  if (fields.assignee !== undefined && !isValidAnnotation(fields.assignee)) {
    return false;
  }

  if (fields.category !== undefined && !isValidAnnotation(fields.category)) {
    return false;
  }

  if (fields.importance !== undefined && !isValidAnnotation(fields.importance)) {
    return false;
  }

  if (fields.interface !== undefined && !isValidAnnotation(fields.interface)) {
    return false;
  }

  if (fields.links !== undefined) {
    if (!Array.isArray(fields.links) || !areValidAnnotations(fields.links)) {
      return false;
    }
  }

  // Check other properties (custom annotations) - can be single or array
  for (const [key, value] of Object.entries(fields)) {
    if (!['assignee', 'category', 'importance', 'interface', 'links'].includes(key)) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          if (!areValidAnnotations(value)) {
            return false;
          }
        } else {
          if (!isValidAnnotation(value)) {
            return false;
          }
        }
      }
    }
  }

  return true;
}

/**
 * Helper function to create a validated AnnotationsFieldsInterface from unknown input
 */
export function createValidAnnotationsFields(input: unknown): AnnotationsFieldsInterface {
  if (!isValidAnnotationsFields(input)) {
    console.warn('Invalid annotations fields provided, returning empty object');
    return {};
  }
  return input;
}



/**
 * Type guard to validate if a string is a valid annotation type
 */
export function isValidAnnotationType(type: string): type is ValidAnnotationTypes {
  return AnnotationTypePrimitives.includes(type as AnnotationTypeField);
}

/**
 * Type guard to validate if a string is a valid importance value
 */
export function isValidImportanceValue(value: string): value is Importance {
  return ImportancePrimitives.includes(value as Importance);
}

/**
 * Type guard to validate if a string is a valid interface type value
 */
export function isValidInterfaceTypeValue(value: string): value is InterfaceType {
  return InterfaceTypePrimitives.includes(value as InterfaceType);
}

/**
 * Type guard to validate if a string is a valid category value
 */
export function isValidCategoryValue(value: string): value is Category {
  return CategoryPrimitives.includes(value as Category);
}

/**
 * Enhanced type guard to validate if an object is a valid annotation with typed descriptions
 */
export function isValidAnnotation(annotation: unknown): annotation is ValidAnnotation {
  if (
    typeof annotation !== 'object' ||
    annotation === null ||
    typeof (annotation as Record<string, unknown>).type !== 'string' ||
    typeof (annotation as Record<string, unknown>).description !== 'string'
  ) {
    return false;
  }

  const { type, description } = annotation as { type: string; description: string };

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
export function areValidAnnotations(annotations: unknown[]): annotations is ValidAnnotation[] {
  return annotations.every(annotation => isValidAnnotation(annotation));
}

/**
 * Helper function to create a validated annotations array
 */
export function createValidAnnotationsArray(annotations: unknown[]): ValidAnnotation[] {
  const validAnnotations = annotations.filter(isValidAnnotation);
  if (validAnnotations.length !== annotations.length) {
    const invalidAnnotations = annotations.filter(annotation => !isValidAnnotation(annotation));
    console.warn(`Invalid annotations found and filtered out: ${invalidAnnotations.map(a => (a as Record<string, unknown>)?.type || 'unknown').join(', ')}`);
  }
  return validAnnotations;
}

/**
 * Type guard for link annotations specifically
 */
export function isLinkAnnotation(annotation: ValidAnnotation): annotation is LinkAnnotation {
  return annotation.type === LINK_TYPE;
}

/**
 * Type guard for importance annotations specifically
 */
export function isImportanceAnnotation(annotation: ValidAnnotation): annotation is ImportanceAnnotation {
  return annotation.type === IMPORTANCE_TYPE;
}

/**
 * Type guard for interface annotations specifically
 */
export function isInterfaceAnnotation(annotation: ValidAnnotation): annotation is InterfaceAnnotation {
  return annotation.type === INTERFACE_TYPE;
}

/**
 * Type guard for category annotations specifically
 */
export function isCategoryAnnotation(annotation: ValidAnnotation): annotation is CategoryAnnotation {
  return annotation.type === CATEGORY_TYPE;
}

/**
 * Type guard for assignee annotations specifically
 */
export function isAssigneeAnnotation(annotation: ValidAnnotation): annotation is AssigneeAnnotation {
  return annotation.type === ASSIGNEE_TYPE;
}

/**
 * Helper function to create a link annotation
 */
export function createLinkAnnotation(description: string): LinkAnnotation {
  return {
    type: LINK_TYPE,
    description
  };
}

/**
 * Helper function to create an importance annotation
 */
export function createImportanceAnnotation(description: Importance): ImportanceAnnotation {
  return {
    type: IMPORTANCE_TYPE,
    description
  };
}

/**
 * Helper function to create an interface annotation
 */
export function createInterfaceAnnotation(description: InterfaceType): InterfaceAnnotation {
  return {
    type: INTERFACE_TYPE,
    description
  };
}

/**
 * Helper function to create a category annotation
 */
export function createCategoryAnnotation(description: Category): CategoryAnnotation {
  return {
    type: CATEGORY_TYPE,
    description
  };
}

/**
 * Helper function to create an assignee annotation
 */
export function createAssigneeAnnotation(description: string): AssigneeAnnotation {
  return {
    type: ASSIGNEE_TYPE,
    description
  };
}
