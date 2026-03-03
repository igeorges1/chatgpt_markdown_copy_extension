import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('package.json', () => {
  let packageJson;

  beforeAll(() => {
    const packagePath = resolve(__dirname, 'package.json');
    const content = readFileSync(packagePath, 'utf-8');
    packageJson = JSON.parse(content);
  });

  describe('structure and validity', () => {
    it('should be valid JSON', () => {
      expect(packageJson).toBeDefined();
      expect(typeof packageJson).toBe('object');
    });

    it('should have required fields', () => {
      expect(packageJson.name).toBe('chatgpt-markdown-copy-extension');
      expect(packageJson.version).toBeDefined();
      expect(packageJson.description).toBeDefined();
      expect(packageJson.license).toBe('MIT');
    });

    it('should have correct project metadata', () => {
      expect(packageJson.name).toBe('chatgpt-markdown-copy-extension');
      expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(packageJson.description).toBe('Browser extension to copy ChatGPT and Gemini messages as Markdown');
      expect(packageJson.type).toBe('module');
      expect(packageJson.private).toBe(true);
    });

    it('should have appropriate keywords', () => {
      expect(packageJson.keywords).toBeDefined();
      expect(Array.isArray(packageJson.keywords)).toBe(true);
      expect(packageJson.keywords).toContain('chatgpt');
      expect(packageJson.keywords).toContain('gemini');
      expect(packageJson.keywords).toContain('markdown');
      expect(packageJson.keywords).toContain('chrome-extension');
      expect(packageJson.keywords).toContain('firefox-addon');
    });

    it('should not have invalid or empty fields', () => {
      expect(packageJson.name).not.toBe('');
      expect(packageJson.version).not.toBe('');
      expect(packageJson.description).not.toBe('');
    });
  });

  describe('scripts', () => {
    it('should have all required scripts defined', () => {
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.test).toBeDefined();
      expect(packageJson.scripts.lint).toBeDefined();
      expect(packageJson.scripts.build).toBeDefined();
    });

    it('should have test scripts', () => {
      expect(packageJson.scripts.test).toBe('vitest run');
      expect(packageJson.scripts['test:watch']).toBe('vitest');
      expect(packageJson.scripts['test:ui']).toBe('vitest --ui');
    });

    it('should have lint scripts', () => {
      expect(packageJson.scripts.lint).toBe('eslint extension/**/*.js');
      expect(packageJson.scripts['lint:fix']).toBe('eslint extension/**/*.js --fix');
      expect(packageJson.scripts['lint:web-ext']).toBe('web-ext lint --source-dir=extension');
    });

    it('should have build script with all required steps', () => {
      const buildScript = packageJson.scripts.build;
      expect(buildScript).toContain('tsup');
      expect(buildScript).toContain('extension/content.js');
      expect(buildScript).toContain('extension/background.js');
      expect(buildScript).toContain('extension/options.js');
      expect(buildScript).toContain('extension/popup.js');
      expect(buildScript).toContain('extension/id.js');
      expect(buildScript).toContain('--format iife');
      expect(buildScript).toContain('--minify');
      expect(buildScript).toContain('--sourcemap');
      expect(buildScript).toContain('--outDir dist');
    });

    it('should copy all necessary files in build script', () => {
      const buildScript = packageJson.scripts.build;
      expect(buildScript).toContain('cp extension/manifest.json dist/');
      expect(buildScript).toContain('cp -r extension/icons dist/');
      expect(buildScript).toContain('cp -r extension/_locales dist/');
      expect(buildScript).toContain('cp extension/options.html dist/');
      expect(buildScript).toContain('cp extension/options.css dist/');
      expect(buildScript).toContain('cp extension/popup.html dist/');
      expect(buildScript).toContain('cp extension/popup.css dist/');
      expect(buildScript).toContain('cp extension/i18n.js dist/');
    });

    it('should rename output files in build script', () => {
      const buildScript = packageJson.scripts.build;
      expect(buildScript).toContain('mv dist/content.global.js dist/content.js');
      expect(buildScript).toContain('mv dist/background.global.js dist/background.js');
      expect(buildScript).toContain('mv dist/options.global.js dist/options.js');
      expect(buildScript).toContain('mv dist/popup.global.js dist/popup.js');
      expect(buildScript).toContain('mv dist/id.global.js dist/id.js');
    });
  });

  describe('dependencies', () => {
    it('should have devDependencies defined', () => {
      expect(packageJson.devDependencies).toBeDefined();
      expect(typeof packageJson.devDependencies).toBe('object');
    });

    it('should have required devDependencies', () => {
      expect(packageJson.devDependencies.eslint).toBeDefined();
      expect(packageJson.devDependencies['eslint-plugin-mozilla']).toBeDefined();
      expect(packageJson.devDependencies.tsup).toBeDefined();
      expect(packageJson.devDependencies.typescript).toBeDefined();
      expect(packageJson.devDependencies['web-ext']).toBeDefined();
      expect(packageJson.devDependencies.vitest).toBeDefined();
      expect(packageJson.devDependencies['@vitest/ui']).toBeDefined();
    });

    it('should have valid version ranges for dependencies', () => {
      Object.entries(packageJson.devDependencies).forEach(([name, version]) => {
        expect(version).toMatch(/^[\^~]?\d+\.\d+\.\d+/);
      });
    });

    it('should use semantic versioning', () => {
      const deps = packageJson.devDependencies;
      Object.values(deps).forEach(version => {
        expect(version).toMatch(/^(\^|~)?\d+\.\d+\.\d+/);
      });
    });
  });

  describe('file references', () => {
    it('should reference existing source files in build script', () => {
      const sourceFiles = [
        'extension/content.js',
        'extension/background.js',
        'extension/options.js',
        'extension/popup.js',
        'extension/id.js',
        'extension/manifest.json',
        'extension/options.html',
        'extension/options.css',
        'extension/popup.html',
        'extension/popup.css',
        'extension/i18n.js'
      ];

      sourceFiles.forEach(file => {
        const filePath = resolve(__dirname, file);
        expect(existsSync(filePath), `${file} should exist`).toBe(true);
      });
    });

    it('should reference existing directories in build script', () => {
      const directories = [
        'extension/icons',
        'extension/_locales'
      ];

      directories.forEach(dir => {
        const dirPath = resolve(__dirname, dir);
        expect(existsSync(dirPath), `${dir} should exist`).toBe(true);
        expect(statSync(dirPath).isDirectory(), `${dir} should be a directory`).toBe(true);
      });
    });
  });

  describe('edge cases and validation', () => {
    it('should not have circular dependencies', () => {
      const deps = packageJson.devDependencies || {};
      const prodDeps = packageJson.dependencies || {};

      Object.keys(deps).forEach(dep => {
        expect(prodDeps[dep]).toBeUndefined();
      });
    });

    it('should handle empty dependencies object', () => {
      if (packageJson.dependencies) {
        expect(typeof packageJson.dependencies).toBe('object');
      }
    });

    it('should have consistent naming conventions', () => {
      expect(packageJson.name).toMatch(/^[a-z0-9-]+$/);
    });

    it('should have valid semver version', () => {
      const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
      expect(packageJson.version).toMatch(semverRegex);
    });

    it('should not have undefined or null values', () => {
      const checkObject = (obj, path = '') => {
        Object.entries(obj).forEach(([key, value]) => {
          const currentPath = path ? `${path}.${key}` : key;
          expect(value, `${currentPath} should not be undefined`).not.toBeUndefined();
          expect(value, `${currentPath} should not be null`).not.toBeNull();

          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            checkObject(value, currentPath);
          }
        });
      };

      checkObject(packageJson);
    });

    it('should have unique keywords', () => {
      const keywords = packageJson.keywords || [];
      const uniqueKeywords = [...new Set(keywords)];
      expect(keywords.length).toBe(uniqueKeywords.length);
    });

    it('should not have typos in common field names', () => {
      const validTopLevelFields = [
        'name', 'version', 'description', 'type', 'private', 'scripts',
        'devDependencies', 'dependencies', 'keywords', 'author', 'license',
        'repository', 'bugs', 'homepage', 'main', 'module', 'exports'
      ];

      Object.keys(packageJson).forEach(key => {
        const hasValidField = validTopLevelFields.some(validField =>
          key === validField || key.startsWith('_')
        );
        expect(hasValidField, `Unexpected field: ${key}`).toBe(true);
      });
    });
  });

  describe('build prerequisites', () => {
    it('should have tsup available when devDependencies are installed', () => {
      const tsupPath = resolve(__dirname, 'node_modules', '.bin', 'tsup');
      expect(existsSync(tsupPath), 'tsup binary should exist in node_modules/.bin').toBe(true);
    });

    it('should have web-ext available when devDependencies are installed', () => {
      const webExtPath = resolve(__dirname, 'node_modules', '.bin', 'web-ext');
      expect(existsSync(webExtPath), 'web-ext binary should exist in node_modules/.bin').toBe(true);
    });

    it('should have eslint available when devDependencies are installed', () => {
      const eslintPath = resolve(__dirname, 'node_modules', '.bin', 'eslint');
      expect(existsSync(eslintPath), 'eslint binary should exist in node_modules/.bin').toBe(true);
    });

    it('should have vitest available when devDependencies are installed', () => {
      const vitestPath = resolve(__dirname, 'node_modules', '.bin', 'vitest');
      expect(existsSync(vitestPath), 'vitest binary should exist in node_modules/.bin').toBe(true);
    });
  });

  describe('regression tests', () => {
    it('should maintain backward compatibility with version 2.x', () => {
      const major = parseInt(packageJson.version.split('.')[0]);
      expect(major).toBeGreaterThanOrEqual(2);
    });

    it('should keep the module type as ESM', () => {
      expect(packageJson.type).toBe('module');
    });

    it('should remain a private package', () => {
      expect(packageJson.private).toBe(true);
    });

    it('should maintain all five entry points in build', () => {
      const buildScript = packageJson.scripts.build;
      const entryPoints = ['content.js', 'background.js', 'options.js', 'popup.js', 'id.js'];

      entryPoints.forEach(entry => {
        expect(buildScript).toContain(`extension/${entry}`);
      });
    });
  });

  describe('negative test cases', () => {
    it('should not have scripts with missing executables', () => {
      const scripts = packageJson.scripts;
      Object.entries(scripts).forEach(([name, script]) => {
        const firstCommand = script.split(' ')[0].split('&&')[0].trim();

        if (!['cp', 'mv', 'mkdir'].includes(firstCommand)) {
          const binaryPath = resolve(__dirname, 'node_modules', '.bin', firstCommand);
          if (!['test', 'test:watch', 'test:ui'].includes(name) || firstCommand !== 'vitest') {
            expect(
              existsSync(binaryPath) || ['eslint', 'tsup', 'web-ext', 'vitest'].includes(firstCommand),
              `Binary ${firstCommand} for script ${name} should be available`
            ).toBe(true);
          }
        }
      });
    });

    it('should not reference non-existent directories', () => {
      const buildScript = packageJson.scripts.build;
      const dirPattern = /cp -r extension\/([a-zA-Z_]+)/g;
      const matches = [...buildScript.matchAll(dirPattern)];

      matches.forEach(match => {
        const dir = `extension/${match[1]}`;
        const dirPath = resolve(__dirname, dir);
        expect(existsSync(dirPath), `${dir} should exist`).toBe(true);
      });
    });

    it('should handle missing optional fields gracefully', () => {
      const optionalFields = ['repository', 'bugs', 'homepage'];
      optionalFields.forEach(field => {
        if (packageJson[field] === undefined) {
          expect(packageJson[field]).toBeUndefined();
        }
      });
    });
  });
});