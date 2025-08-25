#!/usr/bin/env node

/**
 * CLI tool for validating Playwright test metadata (tags and annotations)
 *
 * This tool provides basic validation capabilities for Playwright test metadata.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import {
  validateTestTags,
  validateTestAnnotations,
  ValidationConfig,
  TestInfo,
} from './index.js';
import { pathToFileURL } from 'url';

interface CLIOptions {
  /** Whether to fail on validation errors (default: false) */
  failOnError?: boolean;
  /** Whether to show verbose output (default: false) */
  verbose?: boolean;
  /** Configuration file path */
  config?: string;
}

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--fail-on-error':
      case '-f':
        options.failOnError = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--config':
      case '-c':
        options.config = args[++i];
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

/**
 * Print help information
 */
function printHelp(): void {
  console.log(`
Playwright Metadata Validator

Usage: npx playwright-meta-validator [options]

Options:
  -f, --fail-on-error      Exit with error code if validation fails
  -v, --verbose            Show verbose output
  -c, --config <file>      Configuration file path
  -h, --help               Show this help message

This tool validates Playwright test metadata (tags and annotations).
For file-based validation, use it as a library in your test setup.

Examples:
  npx playwright-meta-validator --fail-on-error
  npx playwright-meta-validator --verbose
`);
}

/**
 * Load configuration from file
 */
function loadConfig(configPath: string): ValidationConfig {
  try {
    const fullPath = resolve(configPath);
    if (!existsSync(fullPath)) {
      console.warn(`Configuration file not found: ${fullPath}`);
      return {};
    }

    const configContent = readFileSync(fullPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    console.warn(`Failed to load configuration from ${configPath}:`, error);
    return {};
  }
}

/**
 * Demo validation function
 */
function runDemoValidation(config: ValidationConfig): boolean {
  console.log('Running demo validation...\n');

  // Example test cases
  const testCases: TestInfo[] = [
    {
      title: 'Valid test with good metadata',
      file: 'example.spec.ts',
      tags: ['@smoke', '@regression'],
      annotations: [
        { type: 'importance', description: 'critical' },
        { type: 'link', description: 'https://example.com/ticket-123' },
      ],
    },
    {
      title: 'Test with invalid tag',
      file: 'example.spec.ts',
      tags: ['@smoke', '@invalid-tag'],
      annotations: [{ type: 'importance', description: 'high' }],
    },
    {
      title: 'Test with invalid annotation',
      file: 'example.spec.ts',
      tags: ['@e2e'],
      annotations: [
        { type: 'importance', description: 'urgent' }, // invalid value
        { type: 'interface', description: 'api' },
      ],
    },
  ];

  let hasErrors = false;

  testCases.forEach((testInfo, index) => {
    console.log(`Test ${index + 1}: "${testInfo.title}"`);

    const tagResult = validateTestTags(testInfo, {
      ...config,
      logWarnings: false,
    });
    const annotationResult = validateTestAnnotations(testInfo, {
      ...config,
      logWarnings: false,
    });

    if (tagResult.isValid && annotationResult.isValid) {
      console.log('  All metadata is valid');
    } else {
      hasErrors = true;
      console.log('  Validation errors found:');

      if (!tagResult.isValid) {
        tagResult.errors.forEach((error) => console.log(`    - ${error}`));
      }

      if (!annotationResult.isValid) {
        annotationResult.errors.forEach((error) =>
          console.log(`    - ${error}`),
        );
      }
    }

    console.log('');
  });

  return !hasErrors;
}

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  try {
    // Load configuration
    const config: ValidationConfig = options.config
      ? loadConfig(options.config)
      : {};
    config.failOnValidationError = options.failOnError;
    config.logWarnings = options.verbose;

    const success = runDemoValidation(config);

    console.log('='.repeat(50));
    if (success) {
      console.log('Demo validation completed successfully');
    } else {
      console.log('Demo validation found errors');
    }

    console.log('\nTo use this library in your Playwright tests:');
    console.log(
      '1. Import: import { createMetadataValidationHook } from "playwright-meta-schema"',
    );
    console.log(
      '2. Add hook: test.beforeEach(createMetadataValidationHook({ failOnValidationError: true }))',
    );

    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Error during validation:', error);
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}
