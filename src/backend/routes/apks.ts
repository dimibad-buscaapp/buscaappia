import { Router, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types/auth';
import { APK_CATALOG, ApkCatalogItem } from '../config/apkCatalog';

const router = Router();

router.use(authMiddleware);

const rootDir = process.cwd();
const apksDir = path.join(rootDir, 'apks');
const extractedDir = path.join(rootDir, 'extracted');

interface ExtractedInfo {
  package?: string;
  layouts?: string[];
  assets?: string[];
  configs?: Record<string, unknown>;
}

function readExtractedInfo(item: ApkCatalogItem): ExtractedInfo | null {
  const infoPath = path.join(
    extractedDir,
    item.extractedFolder,
    'extracted_info.json'
  );

  if (!fs.existsSync(infoPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(infoPath, 'utf8')) as ExtractedInfo;
  } catch {
    return null;
  }
}

router.get('/', (_req: AuthRequest, res: Response) => {
  const apks = APK_CATALOG.map((item) => {
    const extractedPath = path.join(extractedDir, item.extractedFolder);
    const sourcePath = path.join(apksDir, item.sourceApk);
    const extractedInfo = readExtractedInfo(item);

    return {
      ...item,
      sourceExists: fs.existsSync(sourcePath),
      extractedExists: fs.existsSync(extractedPath),
      packageName: extractedInfo?.package ?? item.packageName ?? null,
      layoutsCount: extractedInfo?.layouts?.length ?? 0,
      assetsCount: extractedInfo?.assets?.length ?? 0,
      configsCount: extractedInfo?.configs
        ? Object.keys(extractedInfo.configs).length
        : 0,
      paths: {
        source: sourcePath,
        extracted: extractedPath
      }
    };
  });

  res.json({
    preserveModifiedState: true,
    apksDir,
    extractedDir,
    total: apks.length,
    apks
  });
});

export default router;
