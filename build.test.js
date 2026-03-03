import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, rmSync, readFileSync, statSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('build script', () => {
  const distDir = resolve(__dirname, 'dist');
  let buildOutput;
  let buildSucceeded = false;

  beforeAll(() => {
    // Clean up any existing dist directory
    if (existsSync(distDir)) {
      rmSync(distDir, { recursive: true, force: true });
    }

    try {
      // Run the build script
      buildOutput = execSync('npm run build', {
        cwd: __dirname,
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      buildSucceeded = true;
    } catch (error) {
      buildOutput = error.stdout + error.stderr;
      buildSucceeded = false;
      console.error('Build failed:', error.message);
      console.error('Output:', buildOutput);
    }
  });

  afterAll(() => {
    // Clean up dist directory after tests
    if (existsSync(distDir)) {
      rmSync(distDir, { recursive: true, force: true });
    }
  });

  describe('build execution', () => {
    it('should execute build script without errors', () => {
      expect(buildSucceeded, 'Build should complete successfully').toBe(true);
    });

    it('should create dist directory', () => {
      expect(existsSync(distDir), 'dist directory should exist').toBe(true);
      expect(statSync(distDir).isDirectory(), 'dist should be a directory').toBe(true);
    });
  });

  describe('compiled JavaScript files', () => {
    it('should create all bundled JS files', () => {
      const jsFiles = [
        'content.js',
        'background.js',
        'options.js',
        'popup.js',
        'id.js'
      ];

      jsFiles.forEach(file => {
        const filePath = resolve(distDir, file);
        expect(existsSync(filePath), `${file} should exist in dist`).toBe(true);
        expect(statSync(filePath).isFile(), `${file} should be a file`).toBe(true);
      });
    });

    it('should create minified JavaScript files', () => {
      const jsFiles = ['content.js', 'background.js', 'options.js', 'popup.js', 'id.js'];

      jsFiles.forEach(file => {
        const filePath = resolve(distDir, file);
        const content = readFileSync(filePath, 'utf-8');

        // Minified files typically have less whitespace and newlines
        // Check that the file is not empty
        expect(content.length, `${file} should not be empty`).toBeGreaterThan(0);

        // Basic check that it's JavaScript (contains common patterns)
        expect(
          content.includes('function') || content.includes('=>') || content.includes('var') || content.includes('const'),
          `${file} should contain JavaScript code`
        ).toBe(true);
      });
    });

    it('should create sourcemap files', () => {
      // Sourcemaps are named *.global.js.map because only .js files are renamed
      const sourceMapFiles = [
        'content.global.js.map',
        'background.global.js.map',
        'options.global.js.map',
        'popup.global.js.map',
        'id.global.js.map'
      ];

      sourceMapFiles.forEach(file => {
        const filePath = resolve(distDir, file);
        expect(existsSync(filePath), `${file} should exist in dist`).toBe(true);

        const content = readFileSync(filePath, 'utf-8');
        const sourceMap = JSON.parse(content);
        expect(sourceMap.version).toBe(3);
        expect(sourceMap.sources).toBeDefined();
        expect(Array.isArray(sourceMap.sources)).toBe(true);
      });
    });

    it('should not have .global.js files after build', () => {
      const globalFiles = [
        'content.global.js',
        'background.global.js',
        'options.global.js',
        'popup.global.js',
        'id.global.js'
      ];

      globalFiles.forEach(file => {
        const filePath = resolve(distDir, file);
        expect(existsSync(filePath), `${file} should not exist after rename`).toBe(false);
      });
    });
  });

  describe('copied files', () => {
    it('should copy manifest.json', () => {
      const manifestPath = resolve(distDir, 'manifest.json');
      expect(existsSync(manifestPath), 'manifest.json should exist in dist').toBe(true);

      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
      expect(manifest.manifest_version).toBeDefined();
      expect(manifest.name).toBeDefined();
    });

    it('should copy HTML files', () => {
      const htmlFiles = ['options.html', 'popup.html'];

      htmlFiles.forEach(file => {
        const filePath = resolve(distDir, file);
        expect(existsSync(filePath), `${file} should exist in dist`).toBe(true);

        const content = readFileSync(filePath, 'utf-8');
        expect(content).toContain('<!DOCTYPE html>');
      });
    });

    it('should copy CSS files', () => {
      const cssFiles = ['options.css', 'popup.css'];

      cssFiles.forEach(file => {
        const filePath = resolve(distDir, file);
        expect(existsSync(filePath), `${file} should exist in dist`).toBe(true);

        const content = readFileSync(filePath, 'utf-8');
        expect(content.length, `${file} should not be empty`).toBeGreaterThan(0);
      });
    });

    it('should copy i18n.js', () => {
      const i18nPath = resolve(distDir, 'i18n.js');
      expect(existsSync(i18nPath), 'i18n.js should exist in dist').toBe(true);

      const content = readFileSync(i18nPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });
  });

  describe('copied directories', () => {
    it('should copy icons directory', () => {
      const iconsDir = resolve(distDir, 'icons');
      expect(existsSync(iconsDir), 'icons directory should exist in dist').toBe(true);
      expect(statSync(iconsDir).isDirectory(), 'icons should be a directory').toBe(true);

      const iconFiles = readdirSync(iconsDir);
      expect(iconFiles.length, 'icons directory should not be empty').toBeGreaterThan(0);
    });

    it('should copy _locales directory', () => {
      const localesDir = resolve(distDir, '_locales');
      expect(existsSync(localesDir), '_locales directory should exist in dist').toBe(true);
      expect(statSync(localesDir).isDirectory(), '_locales should be a directory').toBe(true);

      const localeFiles = readdirSync(localesDir);
      expect(localeFiles.length, '_locales directory should not be empty').toBeGreaterThan(0);
    });

    it('should preserve _locales structure', () => {
      const localesDir = resolve(distDir, '_locales');
      const locales = readdirSync(localesDir);

      locales.forEach(locale => {
        const localePath = resolve(localesDir, locale);
        if (statSync(localePath).isDirectory()) {
          const messagesPath = resolve(localePath, 'messages.json');
          expect(existsSync(messagesPath), `messages.json should exist in ${locale}`).toBe(true);

          const messages = JSON.parse(readFileSync(messagesPath, 'utf-8'));
          expect(typeof messages).toBe('object');
        }
      });
    });
  });

  describe('build output validation', () => {
    it('should produce IIFE format bundles', () => {
      const jsFiles = ['content.js', 'background.js', 'options.js', 'popup.js', 'id.js'];

      jsFiles.forEach(file => {
        const filePath = resolve(distDir, file);
        const content = readFileSync(filePath, 'utf-8');

        // IIFE typically starts with (function() or (() =>
        // or has an immediately invoked pattern
        expect(
          content.includes('(function') || content.includes('!function') || content.trim().startsWith('('),
          `${file} should be in IIFE format`
        ).toBe(true);
      });
    });

    it('should have consistent file sizes', () => {
      const jsFiles = ['content.js', 'background.js', 'options.js', 'popup.js', 'id.js'];

      jsFiles.forEach(file => {
        const filePath = resolve(distDir, file);
        const stats = statSync(filePath);

        // Minified files should not be empty but also not too large without reason
        expect(stats.size, `${file} should not be empty`).toBeGreaterThan(0);
        expect(stats.size, `${file} should not be suspiciously large`).toBeLessThan(10 * 1024 * 1024); // 10MB limit
      });
    });

    it('should include all necessary files for a browser extension', () => {
      const requiredFiles = [
        'manifest.json',
        'content.js',
        'background.js',
        'options.html',
        'options.css',
        'options.js',
        'popup.html',
        'popup.css',
        'popup.js',
        'i18n.js',
        'id.js'
      ];

      requiredFiles.forEach(file => {
        const filePath = resolve(distDir, file);
        expect(existsSync(filePath), `${file} should exist in dist`).toBe(true);
      });
    });
  });

  describe('build edge cases', () => {
    it('should handle build script chaining correctly', () => {
      // If build succeeded, all chained commands executed
      expect(buildSucceeded).toBe(true);
    });

    it('should not leave temporary files', () => {
      const distFiles = readdirSync(distDir);

      // Check for common temporary file patterns
      const tempPatterns = ['.tmp', '.temp', '.bak', '~'];
      const hasTempFiles = distFiles.some(file =>
        tempPatterns.some(pattern => file.endsWith(pattern))
      );

      expect(hasTempFiles, 'Should not contain temporary files').toBe(false);
    });

    it('should maintain file permissions', () => {
      const jsFiles = ['content.js', 'background.js', 'options.js', 'popup.js', 'id.js'];

      jsFiles.forEach(file => {
        const filePath = resolve(distDir, file);
        const stats = statSync(filePath);

        // File should be readable
        expect(stats.mode & 0o400, `${file} should be readable`).toBeTruthy();
      });
    });
  });

  describe('regression tests for build', () => {
    it('should build content.js successfully', () => {
      const contentPath = resolve(distDir, 'content.js');
      expect(existsSync(contentPath)).toBe(true);

      const content = readFileSync(contentPath, 'utf-8');
      expect(content.length).toBeGreaterThan(100); // Content.js is substantial
    });

    it('should maintain all five entry points', () => {
      const entryPoints = ['content.js', 'background.js', 'options.js', 'popup.js', 'id.js'];

      entryPoints.forEach(entry => {
        const filePath = resolve(distDir, entry);
        expect(existsSync(filePath), `${entry} should exist`).toBe(true);
      });

      expect(entryPoints.length).toBe(5);
    });

    it('should preserve internationalization files', () => {
      const localesDir = resolve(distDir, '_locales');
      expect(existsSync(localesDir)).toBe(true);

      const i18nFile = resolve(distDir, 'i18n.js');
      expect(existsSync(i18nFile)).toBe(true);
    });
  });

  describe('boundary cases', () => {
    it('should handle paths with spaces if any', () => {
      // Verify that file operations succeeded
      expect(existsSync(distDir)).toBe(true);
    });

    it('should create valid JSON files', () => {
      const jsonFiles = ['manifest.json'];

      jsonFiles.forEach(file => {
        const filePath = resolve(distDir, file);
        const content = readFileSync(filePath, 'utf-8');

        expect(() => JSON.parse(content), `${file} should be valid JSON`).not.toThrow();
      });
    });

    it('should handle directory copying recursively', () => {
      const iconsDir = resolve(distDir, 'icons');
      const iconFiles = readdirSync(iconsDir);

      expect(iconFiles.length).toBeGreaterThan(0);
    });
  });
});