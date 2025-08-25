# Playwright JUnit Reporter

[![CI](https://github.com/RedHatQE/playwright-meta-schema/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/RedHatQE/playwright-meta-schema/actions/workflows/ci.yml)
[![Coverage Status](https://img.shields.io/codecov/c/github/RedHatQE/playwright-meta-schema/main.svg)](https://codecov.io/gh/RedHatQE/playwright-meta-schema)
[![Node.js Version](https://img.shields.io/node/v/playwright-meta-schema.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A TypeScript library that provides validation for Playwright test metadata including tags and annotations. This library helps ensure consistent and valid metadata across your Playwright test suite, with built-in support for JUnit reporting integration.

## Features

- ✅ **Tag Validation**: Validates Playwright test tags against predefined valid tags
- ✅ **Annotation Validation**: Validates test annotations with type-safe descriptions
- ✅ **TypeScript Support**: Full TypeScript support with comprehensive type definitions
- ✅ **Playwright Integration**: Easy integration with Playwright's test.beforeEach hooks
- ✅ **CLI Tool**: Command-line interface for validation
- ✅ **Configurable**: Flexible configuration options for different environments
- ✅ **Comprehensive Testing**: Extensive test suite with 132+ tests

## Installation

```bash
npm install playwright-meta-schema
# or
yarn add playwright-meta-schema
```

## Quick Start

### Automatic Fixture (Recommended)

Create a fixture file that automatically validates metadata:

```typescript
// fixtures/metadata-validation.ts
import { test as base, expect } from '@playwright/test';
import { validateTestMetadata, ValidationConfig } from 'playwright-meta-schema';

const VALIDATION_CONFIG: ValidationConfig = {
  failOnValidationError: process.env.CI === 'true',
  logWarnings: true,
};

type MetadataValidationFixtures = {
  metadataValidation: void;
};

export const test = base.extend<MetadataValidationFixtures>({
  metadataValidation: [
    async ({}, testInfo) => {
      const result = validateTestMetadata(testInfo, VALIDATION_CONFIG);
      if (!result.isAllValid && VALIDATION_CONFIG.failOnValidationError) {
        throw new Error(`Validation failed: ${result.allErrors.join(', ')}`);
      }
    },
    { auto: true },
  ], // Automatic validation
});

export { expect };
```

Then use in your tests:

```typescript
// Use your custom test instead of @playwright/test
import { test, expect } from './fixtures/metadata-validation';

test('Example test @smoke @regression', async ({ page }) => {
  await test.info().annotate({ type: 'importance', description: 'critical' });
  // Validation runs automatically - no manual setup needed!

  await page.goto('/');
});
```

### Manual Hook (Alternative)

```typescript
import { test } from '@playwright/test';
import { createMetadataValidationHook } from 'playwright-meta-schema';

// Add validation to all tests
test.beforeEach(createMetadataValidationHook());

test('Example test @smoke @regression', async ({ page }) => {
  await test.info().annotate({ type: 'importance', description: 'critical' });
  await page.goto('/');
});
```

### Configuration

```typescript
import { createMetadataValidationHook } from 'playwright-meta-schema';

// Fail tests on validation errors
test.beforeEach(
  createMetadataValidationHook({
    failOnValidationError: true,
  }),
);

// Environment-based configuration
test.beforeEach(
  createMetadataValidationHook({
    failOnValidationError: process.env.CI === 'true',
    logWarnings: true,
    logger: (message) => console.error(`[Validation] ${message}`),
  }),
);
```

## Valid Tags

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

### Links and Assignees

```typescript
await test.info().annotate({
  type: 'link',
  description: 'https://jira.example.com/TICKET-123',
});
await test
  .info()
  .annotate({ type: 'assignee', description: 'john.doe@example.com' });
```

## CLI Usage

```bash
# Run demo validation
npx playwright-meta-schema

# Verbose output
npx playwright-meta-schema --verbose

# Fail on validation errors
npx playwright-meta-schema --fail-on-error
```

## Examples

See the `examples/` directory for:

- Basic usage examples
- Integration guide for content-sources-frontend
- Advanced configuration patterns

## Development

```bash
# Install dependencies
yarn install

# Build the project
yarn build

# Run tests
yarn test

# Run tests with coverage
yarn test:coverage

# Lint and format code
yarn lint

# Test CLI
yarn validate:playwright
```

## Versioning

Semantic versioning will be used. Repository tags and GitHub release(s) will be provided.

## Releases

Releases will be done ad-hoc, automated and executed by CI, and will be triggered by repository tagging.

## Contributing

[![pre-commit](https://img.shields.io/badge/pre--commit-enabled-brightgreen?logo=pre-commit)](https://github.com/pre-commit/pre-commit)
