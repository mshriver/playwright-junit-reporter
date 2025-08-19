# TypeScript Tag Validation System for Playwright

This schema provides a comprehensive TypeScript type system for validating Playwright tags using template literal types, mapped types, and conditional types.

## Key Features

### 1. Template Literal Types for Tag Validation

The system uses TypeScript's template literal types to ensure all tags have the correct `@` prefix:

```typescript
type PW_PREFIX = '@';
export type Tag = `${PW_PREFIX}${string}`;
export type ValidPlaywrightTags = `${PW_PREFIX}${TagValueTypes}`;
```

### 2. Strong Type Safety

All valid tags are strictly typed using union types:

```typescript
export type ValidTags = ValidPlaywrightTags | ValidCustomTags;
export type ValidTagsArray = ValidTags[];
```

### 3. Conditional Types for Validation

The system includes conditional types for compile-time validation:

```typescript
export type IsValidTag<T extends string> = T extends ValidTags ? true : false;
```

### 4. Mapped Types for Tag Processing

Extract tag values without the `@` prefix:

```typescript
export type ExtractTagValue<T extends ValidTags> = T extends `${PW_PREFIX}${infer U}` ? U : never;
```

## Usage Examples

### Basic Tag Validation

```typescript
import { isValidTag, areValidTags } from './tags.types';

const tag = '@smoke';
if (isValidTag(tag)) {
  // TypeScript knows this is a ValidTags type
  console.log('Valid tag:', tag);
}

const tags = ['@smoke', '@slow', '@skip'];
if (areValidTags(tags)) {
  // TypeScript knows this is ValidTags[]
  console.log('All tags valid:', tags);
}
```

### Integration with Test Case Metadata

```typescript
import { TestCaseMetadata, validateTestCaseMetadata } from './testcase-metadata.types';

const metadata: TestCaseMetadata = {
  component: 'authentication',
  importance: 'critical',
  tags: ['@smoke', '@critical', '@ui'] // Type-safe tag array
};

if (validateTestCaseMetadata(metadata)) {
  // Fully validated metadata
  console.log('Metadata is valid');
}
```

### Playwright Integration

```typescript
import { createValidTagsArray } from './tags.types';

// Extract and validate tags from Playwright test info
function processPlaywrightTags(playwrightTags: string[]) {
  const validTags = createValidTagsArray(playwrightTags);
  return validTags; // Returns only valid tags, filters out invalid ones
}
```

## Supported Tag Categories

### 1. Importance Tags
- `@critical`
- `@high`
- `@medium`
- `@low`

### 2. Interface Type Tags
- `@ui`
- `@api`
- `@cli`
- `@db`

### 3. Test Type Tags
- `@unit`
- `@functional`
- `@system`
- `@integration`
- `@performance`

### 4. Custom Tags
- `@smoke`
- `@regression`
- `@sanity`
- `@e2e`
- `@slow`
- `@fast`
- `@flaky`
- `@skip`

## Advanced Type Features

### Type-Level Validation

```typescript
// These types are resolved at compile time
type IsSmokeValid = IsValidTag<'@smoke'>; // true
type IsInvalidValid = IsValidTag<'@invalid'>; // false
```

### Tag Value Extraction

```typescript
// Extract the value part of a tag (without @)
type SmokeValue = ExtractTagValue<'@smoke'>; // 'smoke'
type AllValues = ExtractTagValue<ValidTags>; // 'smoke' | 'critical' | 'ui' | ...
```

### Runtime Validation with Type Guards

```typescript
// Type guards provide both runtime validation and type narrowing
function processTag(tag: string) {
  if (isValidTag(tag)) {
    // TypeScript knows 'tag' is ValidTags here
    console.log(`Processing valid tag: ${tag}`);
  } else {
    console.warn(`Invalid tag: ${tag}`);
  }
}
```

## Benefits

1. **Compile-time Safety**: Invalid tags are caught during TypeScript compilation
2. **Runtime Validation**: Type guards provide runtime validation with type narrowing
3. **IntelliSense Support**: Full autocomplete and type checking in IDEs
4. **Extensible**: Easy to add new tag categories or custom tags
5. **Playwright Integration**: Seamless integration with Playwright's tag system
6. **Filtering Capability**: Automatically filter out invalid tags from arrays

This system ensures that your Playwright test tags are always valid and provides excellent developer experience with full TypeScript support.
