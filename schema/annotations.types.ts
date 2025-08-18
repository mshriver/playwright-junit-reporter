/**
 * Represents a generic annotation with a type and description.
 * @remarks
 * The `description` field may be further refined with a type union for custom annotation validation.
 */
export type Annotation = {
  type: string;
  description: string;
}

/**
 * Represents a link annotation, extending the generic Annotation type.
 * @property type - The annotation type, always 'link'.
 * @property description - The URL or link text associated with the annotation.
 */
export interface LinkAnnote extends Annotation{
  type: 'link';
  description: string; // URL or link text
}

/**
 * Defines the expected schema fields for Playwright annotations.
 * @property links - An array containing a single LinkAnnote object.
 * @property [key: string] - Allows for custom annotation arrays keyed by annotation type.
 */
export type AnnotationsFields = {
  links?: [LinkAnnote];
  [key: string]: Annotation[] | undefined; // for custom annotations
}
