import fs from 'fs';
import path from 'path';
import { crawlAllRoutesForSitemap } from '../src/utils/sitemapGenerator';
import { DEFAULT_SEO_CONFIG, type SeoConfig } from '../src/utils/seoConfig';
import { SHOP_PRODUCTS } from '../src/data/shopProducts';

const ROOT_DIR = process.cwd();
const APP_TSX_PATH = path.join(ROOT_DIR, 'src', 'App.tsx');
const PUBLIC_SITEMAP_PATH = path.join(ROOT_DIR, 'public', 'sitemap.xml');
const DIST_SITEMAP_PATH = path.join(ROOT_DIR, 'dist', 'sitemap.xml');
const SEO_CONFIG_FILE = path.join(ROOT_DIR, 'data', 'seo-config.json');
const PRODUCTS_STORAGE_FILE = path.join(ROOT_DIR, 'data', 'shop-products-server.json');
const SITEMAP_REPORT_FILE = path.join(ROOT_DIR, 'data', 'sitemap-report.json');

function loadStoredSeoConfig(): SeoConfig {
  try {
    if (fs.existsSync(SEO_CONFIG_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(SEO_CONFIG_FILE, 'utf-8'));
      return {
        ...DEFAULT_SEO_CONFIG,
        ...parsed,
        routes: {
          ...DEFAULT_SEO_CONFIG.routes,
          ...(parsed.routes || {}),
        },
      };
    }
  } catch {
    // Use default config
  }
  return DEFAULT_SEO_CONFIG;
}

function loadStoredProducts() {
  try {
    if (fs.existsSync(PRODUCTS_STORAGE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(PRODUCTS_STORAGE_FILE, 'utf-8'));
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Use default products
  }
  return SHOP_PRODUCTS;
}

export function runSitemapGenerator(customOrigin?: string) {
  const origin =
    customOrigin ||
    process.env.APP_URL ||
    process.env.VITE_SITE_URL ||
    'https://blog.accounticca.com';

  const appTsxSource = fs.existsSync(APP_TSX_PATH)
    ? fs.readFileSync(APP_TSX_PATH, 'utf-8')
    : undefined;

  const seoConfig = loadStoredSeoConfig();
  const customProducts = loadStoredProducts();

  const report = crawlAllRoutesForSitemap({
    origin,
    appTsxSource,
    seoConfig,
    customProducts,
  });

  const publicDir = path.dirname(PUBLIC_SITEMAP_PATH);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.writeFileSync(PUBLIC_SITEMAP_PATH, report.xml, 'utf-8');

  if (fs.existsSync(path.dirname(DIST_SITEMAP_PATH))) {
    fs.writeFileSync(DIST_SITEMAP_PATH, report.xml, 'utf-8');
  }

  const dataDir = path.dirname(SITEMAP_REPORT_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(
    SITEMAP_REPORT_FILE,
    JSON.stringify(
      {
        generatedAt: report.generatedAt,
        origin: report.origin,
        publicFilePath: report.publicFilePath,
        totalUrls: report.totalUrls,
        countsBySource: report.countsBySource,
        routes: report.routes,
      },
      null,
      2
    ),
    'utf-8'
  );

  console.log(
    `[Sitemap Generator] Published ${report.totalUrls} URLs to public/sitemap.xml (${report.countsBySource.articles} legal & tax articles, ${report.countsBySource.categories} categories, ${report.countsBySource.tools} tools, ${report.countsBySource.products} products, ${report.countsBySource.courses} courses, ${report.countsBySource.staticRoutes} static routes).`
  );

  return report;
}

// Run immediately when invoked as a script
const isDirectExecution =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv.some((arg) => arg.includes('generateSitemap'));

if (isDirectExecution) {
  runSitemapGenerator();
}
