# Playwright JUnit Reporter - Metadata Validation

This library provides validation functions for Playwright test metadata including tags and annotations. It helps ensure consistent and valid metadata across your test suite.

## Installation

```bash
npm install playwright-meta-schema
# or
yarn add playwright-meta-schema
```

## Usage

### Basic Validation Hook

Add metadata validation to your Playwright tests using the `createMetadataValidationHook`:

```typescript
import { test } from '@playwright/test';
import { createMetadataValidationHook } from 'playwright-meta-schema';

// Add metadata validation to all tests
test.beforeEach(createMetadataValidationHook());

test('Example test @smoke @regression', async ({ page }) => {
  await test.info().annotate({ type: 'importance', description: 'critical' });
  await test.info().annotate({
    type: 'link',
    description: 'https://jira.example.com/TICKET-123',
  });

  // Your test code here
  await page.goto('/');
});
```

### Configuration Options

You can configure the validation behavior:

```typescript
import { createMetadataValidationHook } from 'playwright-meta-schema';

// Fail tests when metadata validation errors occur
test.beforeEach(
  createMetadataValidationHook({
    failOnValidationError: true,
  }),
);

// Custom configuration
test.beforeEach(
  createMetadataValidationHook({
    failOnValidationError: process.env.CI === 'true', // Fail in CI only
    logWarnings: true,
    logger: (message) => console.error(`[Validation Error] ${message}`),
  }),
);
```

### Manual Validation

You can also validate metadata manually:

```typescript
import {
  validateTestTags,
  validateTestAnnotations,
} from 'playwright-meta-schema';

const testInfo = {
  title: 'My test',
  file: 'test.spec.ts',
  tags: ['@smoke', '@regression'],
  annotations: [
    { type: 'importance', description: 'critical' },
    { type: 'link', description: 'https://example.com' },
  ],
};

const tagResult = validateTestTags(testInfo);
const annotationResult = validateTestAnnotations(testInfo);

console.log('Tag validation:', tagResult.isValid);
console.log('Annotation validation:', annotationResult.isValid);
```

## Valid Tags

The following tags are supported:

### Playwright Built-in Tags

- `@skip` - Skip the test
- `@fail` - Mark test as expected to fail
- `@fixme` - Mark test as needing fixes
- `@slow` - Mark test as slow
- `@fast` - Mark test as fast

### Custom Tags

- `@smoke` - Smoke tests
- `@regression` - Regression tests
- `@sanity` - Sanity tests
- `@e2e` - End-to-end tests

## Valid Annotations

### Importance

```typescript
await test.info().annotate({ type: 'importance', description: 'critical' });
await test.info().annotate({ type: 'importance', description: 'high' });
await test.info().annotate({ type: 'importance', description: 'medium' });
await test.info().annotate({ type: 'importance', description: 'low' });
```

### Interface Type

```typescript
await test.info().annotate({ type: 'interface', description: 'ui' });
await test.info().annotate({ type: 'interface', description: 'api' });
await test.info().annotate({ type: 'interface', description: 'cli' });
await test.info().annotate({ type: 'interface', description: 'db' });
```

### Test Category

```typescript
await test.info().annotate({ type: 'category', description: 'unit' });
await test.info().annotate({ type: 'category', description: 'function' });
await test.info().annotate({ type: 'category', description: 'system' });
await test.info().annotate({ type: 'category', description: 'integration' });
await test.info().annotate({ type: 'category', description: 'performance' });
```

### Links

```typescript
await test.info().annotate({
  type: 'link',
  description: 'https://jira.example.com/TICKET-123',
});
await test.info().annotate({
  type: 'link',
  description: 'https://github.com/repo/issues/456',
});
```

### Assignee

```typescript
await test
  .info()
  .annotate({ type: 'assignee', description: 'john.doe@example.com' });
await test.info().annotate({ type: 'assignee', description: 'Team Lead' });
```

## CLI Usage

You can also run validation from the command line:

```bash
# Run demo validation
npx playwright-meta-schema

# Verbose output
npx playwright-meta-schema --verbose

# Fail on validation errors
npx playwright-meta-schema --fail-on-error
```

## Integration Example for content-sources-frontend

Add this to your `package.json`:

```json
{
  "scripts": {
    "test:lint-meta": "npx playwright-meta-schema --fail-on-error"
  }
}
```

Create a validation fixture file:

```typescript
// fixtures/metadata-validation.ts
import { test as base } from '@playwright/test';
import { createMetadataValidationHook } from 'playwright-meta-schema';

export const test = base.extend({});

// Set up validation based on environment
const shouldFailOnError = process.env.CI === 'true';

test.beforeEach(
  createMetadataValidationHook({
    failOnValidationError: shouldFailOnError,
    logWarnings: true,
  }),
);
```

Use in your test files:

```typescript
// tests/example.spec.ts
import { test, expect } from '../fixtures/metadata-validation';

test('Repository list loads @smoke @regression', async ({ page }) => {
  await test.info().annotate({ type: 'importance', description: 'critical' });
  await test.info().annotate({ type: 'interface', description: 'ui' });
  await test.info().annotate({ type: 'category', description: 'function' });

  await page.goto('/repositories');
  await expect(page.locator('[data-testid="repository-list"]')).toBeVisible();
});
```

## Configuration in playwright.config.ts

You can configure validation in your Playwright config:

```typescript
// playwright.config.ts
export default defineConfig({
  // ... other config

  // Custom property for metadata validation
  metadata: {
    validation: {
      enabled: true,
      failOnError: process.env.CI === 'true',
      logWarnings: true,
    },
  },
});
```

## Error Examples

Invalid tag:

```
❌ Invalid tag: "@invalid-tag" - not in list of valid tags
```

Invalid annotation:

```
❌ Invalid annotation: type="importance" with description="urgent" - either invalid type or invalid description value for that type
```

## Development

```bash
# Build the project
npm run build

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Lint and format
npm run lint
```
