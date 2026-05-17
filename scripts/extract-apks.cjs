const fs = require('fs');
const fsp = require('fs/promises');
const https = require('https');
const path = require('path');
const { execFile } = require('child_process');
const util = require('util');

const execFilePromise = util.promisify(execFile);

const ROOT_DIR = path.resolve(__dirname, '..');
const APKS_FOLDER = path.join(ROOT_DIR, 'apks');
const EXTRACTED_FOLDER = path.join(ROOT_DIR, 'extracted');
const TOOLS_FOLDER = path.join(ROOT_DIR, 'tools');
const APKTOOL_PATH = path.join(TOOLS_FOLDER, 'apktool.jar');
const APKTOOL_URL =
  'https://bitbucket.org/iBotPeaches/apktool/downloads/apktool_2.9.3.jar';

async function pathExists(targetPath) {
  try {
    await fsp.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

function sanitizeOutputName(fileName) {
  return path
    .basename(fileName, path.extname(fileName))
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .trim();
}

async function discoverApks() {
  const cliApks = process.argv
    .slice(2)
    .map((filePath) => path.resolve(filePath))
    .filter((filePath) => filePath.toLowerCase().endsWith('.apk'));

  if (cliApks.length > 0) {
    return cliApks;
  }

  await ensureDir(APKS_FOLDER);

  const entries = await fsp.readdir(APKS_FOLDER, { withFileTypes: true });
  return entries
    .filter(
      (entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.apk')
    )
    .map((entry) => path.join(APKS_FOLDER, entry.name));
}

function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if (
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        response.resume();
        downloadFile(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Download failed with status ${response.statusCode}`));
        return;
      }

      const file = fs.createWriteStream(outputPath);
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', reject);
    });

    request.on('error', reject);
  });
}

async function checkDependencies() {
  console.log('Checking dependencies...');

  try {
    await execFilePromise('java', ['-version']);
    console.log('Java found');
  } catch {
    console.log('Java not found. Install Java JDK before extracting APKs.');
    return false;
  }

  await ensureDir(TOOLS_FOLDER);

  if (!(await pathExists(APKTOOL_PATH))) {
    console.log('Downloading apktool...');
    await downloadFile(APKTOOL_URL, APKTOOL_PATH);
  }

  return true;
}

async function extractAPK(apkPath) {
  const apkName = path.basename(apkPath);
  const outputDir = path.join(EXTRACTED_FOLDER, sanitizeOutputName(apkName));

  console.log(`\nExtracting: ${apkName}`);

  if (!(await pathExists(apkPath))) {
    console.log(`APK not found: ${apkPath}`);
    return null;
  }

  try {
    await ensureDir(outputDir);

    console.log('Decompiling APK...');
    await execFilePromise('java', [
      '-jar',
      APKTOOL_PATH,
      'd',
      apkPath,
      '-o',
      outputDir,
      '-f'
    ]);

    const resources = {
      name: apkName,
      package: await extractPackageName(outputDir),
      layouts: await listFiles(path.join(outputDir, 'res', 'layout')),
      strings: await extractStrings(outputDir),
      configs: await extractConfigs(outputDir),
      assets: await listFiles(path.join(outputDir, 'assets'))
    };

    await fsp.writeFile(
      path.join(outputDir, 'extracted_info.json'),
      JSON.stringify(resources, null, 2),
      'utf8'
    );

    console.log('Extracted successfully');
    console.log(`Package: ${resources.package}`);
    console.log(`Layouts found: ${resources.layouts.length}`);

    return resources;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to extract ${apkName}: ${message}`);
    return null;
  }
}

async function extractPackageName(outputDir) {
  try {
    const manifestPath = path.join(outputDir, 'AndroidManifest.xml');
    if (await pathExists(manifestPath)) {
      const content = await fsp.readFile(manifestPath, 'utf8');
      const match = content.match(/package="([^"]+)"/);
      return match ? match[1] : 'unknown';
    }
  } catch {
    // Keep extraction resilient when a single metadata file is malformed.
  }

  return 'unknown';
}

async function extractStrings(outputDir) {
  try {
    const stringsPath = path.join(outputDir, 'res', 'values', 'strings.xml');
    if (await pathExists(stringsPath)) {
      const content = await fsp.readFile(stringsPath, 'utf8');
      const strings = {};
      const regex = /<string name="([^"]+)">([^<]+)<\/string>/g;
      let match;

      while ((match = regex.exec(content)) !== null) {
        strings[match[1]] = match[2];
      }

      return strings;
    }
  } catch {
    // Keep extraction resilient when strings.xml cannot be parsed.
  }

  return {};
}

async function extractConfigs(outputDir) {
  const configs = {};
  const files = await findFiles(outputDir, ['.xml', '.json', '.properties']);

  for (const file of files) {
    try {
      const content = await fsp.readFile(file, 'utf8');
      const urls = content.match(/https?:\/\/[^\s"'<>]+/g) || [];

      if (urls.length > 0) {
        configs[path.relative(outputDir, file)] = { urls };
      }
    } catch {
      // Ignore unreadable generated files and continue with the APK.
    }
  }

  return configs;
}

async function listFiles(dir) {
  try {
    if (await pathExists(dir)) {
      return await fsp.readdir(dir);
    }
  } catch {
    // Ignore optional directories.
  }

  return [];
}

async function findFiles(dir, extensions) {
  const results = [];

  async function walk(currentDir) {
    let entries;

    try {
      entries = await fsp.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  }

  await walk(dir);
  return results;
}

async function main() {
  console.log('Starting APK extraction...\n');

  await ensureDir(APKS_FOLDER);
  await ensureDir(EXTRACTED_FOLDER);

  const apks = await discoverApks();
  const results = [];

  if (apks.length === 0) {
    console.log(`No APK files found in: ${APKS_FOLDER}`);
    console.log('Copy .apk files into that folder or pass paths directly:');
    console.log('node scripts/extract-apks.cjs "C:\\path\\app.apk"');
    return;
  }

  const depsOk = await checkDependencies();
  if (!depsOk) {
    process.exitCode = 1;
    return;
  }

  for (const apk of apks) {
    const result = await extractAPK(apk);
    if (result) {
      results.push(result);
    }
  }

  const summary = {
    total_apks: apks.length,
    extracted: results.length,
    failed: apks.length - results.length,
    apks: results,
    timestamp: new Date().toISOString()
  };

  await fsp.writeFile(
    path.join(EXTRACTED_FOLDER, 'summary.json'),
    JSON.stringify(summary, null, 2),
    'utf8'
  );

  console.log('\nSummary:');
  console.log(`Extracted: ${results.length}/${apks.length}`);
  console.log(`Output folder: ${EXTRACTED_FOLDER}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
