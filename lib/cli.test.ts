/**
 * Unit tests for the CLI functionality
 * Tests the CLI argument parsing, demo validation, and configuration loading
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, unlinkSync, mkdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// We need to mock the CLI module since it has side effects
// First, let's test the individual functions by importing them

// Mock console methods
let originalConsoleLog: typeof console.log;
let originalConsoleWarn: typeof console.warn;
let originalConsoleError: typeof console.error;
let originalProcessExit: typeof process.exit;
let originalProcessArgv: string[];

let capturedOutput: string[] = [];
let capturedWarnings: string[] = [];
let capturedErrors: string[] = [];
let exitCode: number | null = null;

function setupMocks() {
  capturedOutput = [];
  capturedWarnings = [];
  capturedErrors = [];
  exitCode = null;

  originalConsoleLog = console.log;
  originalConsoleWarn = console.warn;
  originalConsoleError = console.error;
  originalProcessExit = process.exit;
  originalProcessArgv = [...process.argv];

  console.log = (...args: unknown[]) => {
    capturedOutput.push(args.join(' '));
  };
  console.warn = (...args: unknown[]) => {
    capturedWarnings.push(args.join(' '));
  };
  console.error = (...args: unknown[]) => {
    capturedErrors.push(args.join(' '));
  };
  process.exit = ((code?: number) => {
    exitCode = code || 0;
    throw new Error(`Process exit called with code ${code || 0}`);
  }) as typeof process.exit;
}

function restoreMocks() {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
  process.exit = originalProcessExit;
  process.argv = originalProcessArgv;
}

describe('CLI Functionality Tests', () => {
  let tempDir: string;
  let tempConfigFile: string;

  beforeEach(() => {
    setupMocks();
    // Create a temporary directory for test files
    tempDir = join(tmpdir(), 'playwright-meta-schema-test-' + Date.now());
    mkdirSync(tempDir, { recursive: true });
    tempConfigFile = join(tempDir, 'test-config.json');
  });

  afterEach(() => {
    restoreMocks();
    // Clean up temporary files
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('parseArgs function', () => {
    it('should parse fail-on-error flag', async () => {
      const { parseArgs } = await import('./cli.js');
      const result = parseArgs(['--fail-on-error']);
      assert.strictEqual(result.failOnError, true);
    });

    it('should parse verbose flag', async () => {
      const { parseArgs } = await import('./cli.js');
      const result = parseArgs(['--verbose']);
      assert.strictEqual(result.verbose, true);
    });

    it('should parse config flag with value', async () => {
      const { parseArgs } = await import('./cli.js');
      const result = parseArgs(['--config', '/path/to/config.json']);
      assert.strictEqual(result.config, '/path/to/config.json');
    });

    it('should parse short flags', async () => {
      const { parseArgs } = await import('./cli.js');
      const result = parseArgs(['-f', '-v', '-c', '/path/to/config.json']);
      assert.strictEqual(result.failOnError, true);
      assert.strictEqual(result.verbose, true);
      assert.strictEqual(result.config, '/path/to/config.json');
    });

    it('should handle multiple flags', async () => {
      const { parseArgs } = await import('./cli.js');
      const result = parseArgs(['--fail-on-error', '--verbose']);
      assert.strictEqual(result.failOnError, true);
      assert.strictEqual(result.verbose, true);
    });

    it('should handle help flag and exit', async () => {
      const { parseArgs } = await import('./cli.js');

      try {
        parseArgs(['--help']);
        assert.fail('Should have thrown due to process.exit');
      } catch {
        assert.ok(
          capturedOutput.some((line) =>
            line.includes('Playwright Metadata Validator'),
          ),
        );
        assert.strictEqual(exitCode, 0);
      }
    });

    it('should handle -h flag and exit', async () => {
      const { parseArgs } = await import('./cli.js');

      try {
        parseArgs(['-h']);
        assert.fail('Should have thrown due to process.exit');
      } catch {
        assert.ok(capturedOutput.some((line) => line.includes('Usage:')));
        assert.strictEqual(exitCode, 0);
      }
    });

    it('should return empty object for no arguments', async () => {
      const { parseArgs } = await import('./cli.js');
      const result = parseArgs([]);
      assert.deepStrictEqual(result, {});
    });
  });

  describe('printHelp function', () => {
    it('should print help information', async () => {
      const { printHelp } = await import('./cli.js');
      printHelp();

      assert.ok(
        capturedOutput.some((line) =>
          line.includes('Playwright Metadata Validator'),
        ),
      );
      assert.ok(capturedOutput.some((line) => line.includes('Usage:')));
      assert.ok(
        capturedOutput.some((line) => line.includes('--fail-on-error')),
      );
      assert.ok(capturedOutput.some((line) => line.includes('--verbose')));
      assert.ok(capturedOutput.some((line) => line.includes('--config')));
      assert.ok(capturedOutput.some((line) => line.includes('Examples:')));
    });
  });

  describe('loadConfig function', () => {
    it('should load valid JSON configuration', async () => {
      const { loadConfig } = await import('./cli.js');
      const testConfig = {
        failOnValidationError: true,
        logWarnings: false,
        logger: 'console.error',
      };

      writeFileSync(tempConfigFile, JSON.stringify(testConfig));

      const result = loadConfig(tempConfigFile);
      assert.deepStrictEqual(result, testConfig);
    });

    it('should return empty config for non-existent file', async () => {
      const { loadConfig } = await import('./cli.js');
      const nonExistentFile = join(tempDir, 'non-existent.json');

      const result = loadConfig(nonExistentFile);
      assert.deepStrictEqual(result, {});
      assert.ok(
        capturedWarnings.some((w) =>
          w.includes('Configuration file not found'),
        ),
      );
    });

    it('should handle invalid JSON gracefully', async () => {
      const { loadConfig } = await import('./cli.js');
      writeFileSync(tempConfigFile, '{ invalid json }');

      const result = loadConfig(tempConfigFile);
      assert.deepStrictEqual(result, {});
      assert.ok(
        capturedWarnings.some((w) =>
          w.includes('Failed to load configuration'),
        ),
      );
    });

    it('should resolve relative paths', async () => {
      const { loadConfig } = await import('./cli.js');
      const relativePath = './test-config.json';
      const testConfig = { logWarnings: true };

      // Create file in current directory
      writeFileSync('test-config.json', JSON.stringify(testConfig));

      try {
        const result = loadConfig(relativePath);
        assert.deepStrictEqual(result, testConfig);
      } finally {
        // Clean up
        try {
          unlinkSync('test-config.json');
        } catch {
          // Ignore cleanup errors
        }
      }
    });
  });

  describe('runDemoValidation function', () => {
    it('should run demo validation successfully with valid metadata', async () => {
      const { runDemoValidation } = await import('./cli.js');
      const config = { logWarnings: false };

      const result = runDemoValidation(config);

      assert.strictEqual(result, false); // Demo includes invalid cases
      assert.ok(
        capturedOutput.some((line) => line.includes('Running demo validation')),
      );
      assert.ok(capturedOutput.some((line) => line.includes('Test 1:')));
      assert.ok(
        capturedOutput.some((line) => line.includes('All metadata is valid')),
      );
      assert.ok(
        capturedOutput.some((line) => line.includes('Validation errors found')),
      );
    });

    it('should handle verbose configuration', async () => {
      const { runDemoValidation } = await import('./cli.js');
      const config = { logWarnings: true, verbose: true };

      const result = runDemoValidation(config);

      assert.strictEqual(typeof result, 'boolean');
      assert.ok(capturedOutput.length > 0);
    });

    it('should validate all test cases', async () => {
      const { runDemoValidation } = await import('./cli.js');
      const config = { logWarnings: false };

      runDemoValidation(config);

      // Should test at least 3 different scenarios
      assert.ok(capturedOutput.some((line) => line.includes('Test 1:')));
      assert.ok(capturedOutput.some((line) => line.includes('Test 2:')));
      assert.ok(capturedOutput.some((line) => line.includes('Test 3:')));
    });

    it('should identify invalid tags and annotations', async () => {
      const { runDemoValidation } = await import('./cli.js');
      const config = { logWarnings: false };

      runDemoValidation(config);

      assert.ok(capturedOutput.some((line) => line.includes('Invalid tag:')));
      assert.ok(
        capturedOutput.some((line) => line.includes('Invalid annotation:')),
      );
    });
  });

  describe('main function integration', () => {
    it('should run successfully with no arguments', async () => {
      // Reset process.argv to simulate no CLI arguments
      process.argv = ['node', 'cli.js'];

      try {
        const { main } = await import('./cli.js');
        await main();
        assert.fail('Should have thrown due to process.exit');
      } catch {
        assert.ok(
          capturedOutput.some((line) => line.includes('Demo validation')),
        );
        assert.ok(
          capturedOutput.some((line) => line.includes('To use this library')),
        );
        assert.strictEqual(exitCode, 1); // Demo validation finds errors
      }
    });

    it('should run with fail-on-error flag', async () => {
      process.argv = ['node', 'cli.js', '--fail-on-error'];

      try {
        const { main } = await import('./cli.js');
        await main();
        assert.fail('Should have thrown due to process.exit');
      } catch {
        assert.strictEqual(exitCode, 1); // Should fail due to demo validation errors
      }
    });

    it('should run with verbose flag', async () => {
      process.argv = ['node', 'cli.js', '--verbose'];

      try {
        const { main } = await import('./cli.js');
        await main();
        assert.fail('Should have thrown due to process.exit');
      } catch {
        assert.ok(capturedOutput.length > 0);
        assert.strictEqual(exitCode, 1);
      }
    });

    it('should load and use custom configuration', async () => {
      const testConfig = {
        failOnValidationError: false,
        logWarnings: true,
      };
      writeFileSync(tempConfigFile, JSON.stringify(testConfig));

      process.argv = ['node', 'cli.js', '--config', tempConfigFile];

      try {
        const { main } = await import('./cli.js');
        await main();
        assert.fail('Should have thrown due to process.exit');
      } catch {
        // Should run without failing even with invalid demo data since failOnValidationError is false
        assert.strictEqual(exitCode, 1); // Demo still finds errors and exits with 1
      }
    });

    it('should handle configuration loading errors gracefully', async () => {
      const invalidConfigFile = join(tempDir, 'invalid.json');
      writeFileSync(invalidConfigFile, '{ invalid }');

      process.argv = ['node', 'cli.js', '--config', invalidConfigFile];

      try {
        const { main } = await import('./cli.js');
        await main();
        assert.fail('Should have thrown due to process.exit');
      } catch {
        assert.ok(
          capturedWarnings.some((w) =>
            w.includes('Failed to load configuration'),
          ),
        );
        assert.strictEqual(exitCode, 1);
      }
    });

    it('should handle unexpected errors', async () => {
      // Mock a function to throw an error by creating a temporary invalid config file
      const invalidConfigFile = join(tempDir, 'throw-error.json');
      // This will cause JSON.parse to throw
      writeFileSync(invalidConfigFile, '{ "test": }');

      process.argv = ['node', 'cli.js', '--config', invalidConfigFile];

      try {
        const { main } = await import('./cli.js');
        await main();
        assert.fail('Should have thrown due to process.exit');
      } catch {
        assert.strictEqual(exitCode, 1);
        // Should handle the JSON parsing error gracefully
        assert.ok(
          capturedWarnings.some((w) =>
            w.includes('Failed to load configuration'),
          ),
        );
      }
    });
  });

  describe('CLI output formatting', () => {
    it('should provide helpful usage instructions', async () => {
      process.argv = ['node', 'cli.js'];

      try {
        const { main } = await import('./cli.js');
        await main();
        assert.fail('Should have thrown due to process.exit');
      } catch {
        assert.ok(
          capturedOutput.some((line) =>
            line.includes('To use this library in your Playwright tests'),
          ),
        );
        assert.ok(
          capturedOutput.some((line) =>
            line.includes('import { createMetadataValidationHook }'),
          ),
        );
        assert.ok(
          capturedOutput.some((line) => line.includes('test.beforeEach')),
        );
      }
    });

    it('should show completion message', async () => {
      process.argv = ['node', 'cli.js'];

      try {
        const { main } = await import('./cli.js');
        await main();
        assert.fail('Should have thrown due to process.exit');
      } catch {
        assert.ok(
          capturedOutput.some((line) => line.includes('Demo validation')),
        );
        assert.ok(capturedOutput.some((line) => line.includes('=')));
      }
    });
  });
});
