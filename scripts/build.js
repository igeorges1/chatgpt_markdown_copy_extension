const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const { execSync } = require('child_process');

const BUILD_DIR = 'build';
const EXTENSION_DIR = 'extension';

async function build() {
    // Clean build directory
    console.log('Cleaning build directory...');
    await fs.remove(BUILD_DIR);
    await fs.ensureDir(BUILD_DIR);

    // Build for Chrome
    console.log('Building for Chrome...');
    const chromeTempDir = path.join(BUILD_DIR, 'chrome-temp');
    await fs.copy(EXTENSION_DIR, chromeTempDir);

    const manifestPath = path.join(chromeTempDir, 'manifest.json');
    const manifest = await fs.readJson(manifestPath);
    if (manifest.browser_specific_settings) {
        delete manifest.browser_specific_settings;
    }
    await fs.writeJson(manifestPath, manifest, { spaces: 2 });

    const chromeZipPath = path.join(BUILD_DIR, 'chatgpt-markdown-copy-chrome.zip');
    await zipDirectory(chromeTempDir, chromeZipPath);
    await fs.remove(chromeTempDir);
    console.log('Chrome build complete: ' + chromeZipPath);

    // Build for Firefox
    console.log('Building for Firefox...');
    const firefoxArtifactsDir = path.join(BUILD_DIR, 'firefox-artifacts');
    await fs.ensureDir(firefoxArtifactsDir);

    try {
        // web-ext build --source-dir extension --artifacts-dir build/firefox-artifacts --overwrite-dest
        // using npx to ensure we use the local version
        execSync(`npx web-ext build --source-dir ${EXTENSION_DIR} --artifacts-dir ${firefoxArtifactsDir} --overwrite-dest`, { stdio: 'inherit' });

        // Find the zip file
        const files = await fs.readdir(firefoxArtifactsDir);
        const zipFile = files.find(f => f.endsWith('.zip'));
        if (zipFile) {
            await fs.move(path.join(firefoxArtifactsDir, zipFile), path.join(BUILD_DIR, 'chatgpt-markdown-copy-firefox.zip'));
            console.log('Firefox build complete: ' + path.join(BUILD_DIR, 'chatgpt-markdown-copy-firefox.zip'));
        } else {
            console.error('No zip file found in Firefox artifacts.');
        }
        await fs.remove(firefoxArtifactsDir);
    } catch (error) {
        console.error('Firefox build failed:', error);
        process.exit(1);
    }
}

function zipDirectory(sourceDir, outPath) {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = fs.createWriteStream(outPath);

    return new Promise((resolve, reject) => {
        archive
            .directory(sourceDir, false)
            .on('error', err => reject(err))
            .pipe(stream);

        stream.on('close', () => resolve());
        archive.finalize();
    });
}

build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});
