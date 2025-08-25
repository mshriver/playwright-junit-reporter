# TypeScript Schema Validation System for Playwright

This schema provides comprehensive TypeScript type systems for validating Playwright tags and annotations using template literal types, mapped types, and conditional types.

## Key Features

### 1. Template Literal Types for Tag Validation

The system uses TypeScript's template literal types to ensure all tags have the correct `@` prefix:

```typescript
const PW_PREFIX = '@' as const;
export type Tag = `${typeof PW_PREFIX}${string}`;
export type ValidPlaywrightTags =
  `${typeof PW_PREFIX}${PlaywrightTagPrimitives}`;
```

### 2. Strong Type Safety

All valid tags and annotations are strictly typed using union types derived from runtime constants:

```typescript
const PlaywrightTagValues = ['skip', 'fail', 'fixme', 'slow', 'fast'] as const;
export type PlaywrightTagPrimitives = (typeof PlaywrightTagValues)[number];
export type ValidTags = ValidPlaywrightTags | ValidCustomTags;
export type ValidTagsArray = ValidTags[];

const AnnotationTypePrimitives = ['link'] as const;
export type ValidAnnotationTypes = AnnotationType;
```

### 3. Conditional Types for Validation

The system includes conditional types for compile-time validation:

```typescript
export type IsValidTag<T extends string> = T extends ValidTags ? true : false;
export type IsValidAnnotationType<T extends string> =
  T extends ValidAnnotationTypes ? true : false;
```

### 4. Mapped Types for Tag Processing

Extract tag values without the `@` prefix:

```typescript
export type ExtractTagValue<T extends ValidTags> =
  T extends `${typeof PW_PREFIX}${infer U}` ? U : never;
```

## Usage Examples

### Basic Tag Validation

```typescript
import { isValidTag, areValidTags } from './tags.types';

// Example 1: Basic tag validation
const tag1 = '@smoke';
const tag2 = '@skip';
const tag3 = '@invalid'; // This would be invalid

console.log('Tag validation:');
console.log(`${tag1} is valid:`, isValidTag(tag1)); // true
console.log(`${tag2} is valid:`, isValidTag(tag2)); // true
console.log(`${tag3} is valid:`, isValidTag(tag3)); // false

// Example 2: Array validation
const tagArray1: string[] = ['@smoke', '@skip', '@fast'];
const tagArray2: string[] = ['@smoke', '@invalid', '@skip'];

console.log('\nArray validation:');
console.log('Array 1 valid:', areValidTags(tagArray1)); // true
console.log('Array 2 valid:', areValidTags(tagArray2)); // false
```

### Creating Validated Tag Arrays

```typescript
import { createValidTagsArray } from './tags.types';

// Example 3: Creating validated tag arrays (filters out invalid tags)
const mixedTags = ['@smoke', '@invalid', '@skip', '@badtag', '@fast'];
const validatedTags = createValidTagsArray(mixedTags);
console.log('\nFiltered tags:', validatedTags); // ['@smoke', '@skip', '@fast']
```

### Integration with Test Case Metadata

```typescript
import {
  TestCaseMetadata,
  validateTestCaseMetadata,
} from './testcase-metadata.types';

const metadata: TestCaseMetadata = {
  component: 'authentication',
  importance: 'critical',
  tags: ['@smoke', '@critical', '@ui'], // Type-safe tag array
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

// Example usage with mock Playwright test info
interface PlaywrightTestInfo {
  tags: string[];
  // ... other Playwright test properties
}

function extractValidTagsFromPlaywright(
  testInfo: PlaywrightTestInfo,
): ValidTagsArray {
  return createValidTagsArray(testInfo.tags);
}

const mockTestInfo: PlaywrightTestInfo = {
  tags: ['@smoke', '@e2e', '@skip', '@some-invalid-tag'],
};

const extractedTags = extractValidTagsFromPlaywright(mockTestInfo);
console.log('\nExtracted valid tags:', extractedTags); // ['@smoke', '@e2e', '@skip']
```

### Advanced Validation Function

```typescript
import { ValidTagsArray, isValidTag } from './tags.types';

// Creating a validation function for Playwright integration
export function validatePlaywrightTags(tags: string[]): {
  valid: ValidTagsArray;
  invalid: string[];
  isAllValid: boolean;
} {
  const valid: ValidTagsArray = [];
  const invalid: string[] = [];

  for (const tag of tags) {
    if (isValidTag(tag)) {
      valid.push(tag);
    } else {
      invalid.push(tag);
    }
  }

  return {
    valid,
    invalid,
    isAllValid: invalid.length === 0,
  };
}

// Example usage of validation function
const testTags = ['@smoke', '@regression', '@invalid-tag', '@skip'];
const validation = validatePlaywrightTags(testTags);

console.log('\nValidation result:');
console.log('Valid tags:', validation.valid);
console.log('Invalid tags:', validation.invalid);
console.log('All valid:', validation.isAllValid);
```

## Supported Tag Categories

### 1. Playwright Built-in Tags

- `@skip` - Skip test execution
- `@fail` - Expect test to fail
- `@fixme` - Mark test as needing fixes
- `@slow` - Mark test as slow running
- `@fast` - Mark test as fast running

### 2. Custom Testing Tags

- `@smoke` - Smoke tests
- `@regression` - Regression tests
- `@sanity` - Sanity tests
- `@e2e` - End-to-end tests

## Advanced Type Features

### Type-Level Validation

```typescript
// These types are resolved at compile time
type IsSkipValid = IsValidTag<'@skip'>; // true
type IsInvalidValid = IsValidTag<'@invalid'>; // false
```

### Tag Value Extraction

```typescript
// Extract the value part of a tag (without @)
type SkipValue = ExtractTagValue<'@skip'>; // 'skip'
type SmokeValue = ExtractTagValue<'@smoke'>; // 'smoke'
type AllValues = ExtractTagValue<ValidTags>; // 'skip' | 'fail' | 'smoke' | ...
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
