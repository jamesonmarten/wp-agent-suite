#!/usr/bin/env node
/**
 * build-plugins.js
 * Zips each WordPress plugin into its own .zip file,
 * ready to install via WP Dashboard > Plugins > Add New > Upload Plugin.
 *
 * Usage:  node scripts/build-plugins.js
 * Output: wordpress-plugins/zips/*.zip
 */

const path    = require("path");
const fs      = require("fs");
const { execSync } = require("child_process");

const ROOT      = path.resolve(__dirname, "..");
const PLUGINS_DIR = path.join(ROOT, "wordpress-plugins");
const ZIPS_DIR    = path.join(PLUGINS_DIR, "zips");

const plugins = [
  "dc-vulnerability-scanner",
  "dc-plugin-recommender",
  "dc-speed-optimizer",
  "dc-maintenance-report",
  "dc-child-theme-builder",
  "dc-link-checker",
];

// Ensure output dir exists
if (!fs.existsSync(ZIPS_DIR)) {
  fs.mkdirSync(ZIPS_DIR, { recursive: true });
}

console.log("\n🔧  Building WordPress plugin zips…\n");

let allPassed = true;

for (const plugin of plugins) {
  const pluginDir = path.join(PLUGINS_DIR, plugin);
  const zipFile   = path.join(ZIPS_DIR, `${plugin}.zip`);

  if (!fs.existsSync(pluginDir)) {
    console.error(`  ❌  Missing plugin directory: ${pluginDir}`);
    allPassed = false;
    continue;
  }

  // Verify main PHP file exists
  const mainPhp = path.join(pluginDir, `${plugin}.php`);
  if (!fs.existsSync(mainPhp)) {
    console.error(`  ❌  Missing main PHP file: ${mainPhp}`);
    allPassed = false;
    continue;
  }

  // Verify assets
  const cssFile = path.join(pluginDir, "assets", "admin.css");
  const jsFile  = path.join(pluginDir, "assets", "admin.js");
  if (!fs.existsSync(cssFile) || !fs.existsSync(jsFile)) {
    console.error(`  ❌  Missing assets in: ${plugin}/assets/`);
    allPassed = false;
    continue;
  }

  // Remove old zip if exists
  if (fs.existsSync(zipFile)) fs.unlinkSync(zipFile);

  try {
    // zip from within PLUGINS_DIR so archive contains the folder name at root
    execSync(`cd "${PLUGINS_DIR}" && zip -r "zips/${plugin}.zip" "${plugin}" -x "*.DS_Store"`, {
      stdio: "pipe",
    });

    const stats   = fs.statSync(zipFile);
    const sizeKb  = (stats.size / 1024).toFixed(1);
    console.log(`  ✅  ${plugin}.zip  (${sizeKb} KB)`);
  } catch (err) {
    console.error(`  ❌  Failed to zip ${plugin}:`, err.message);
    allPassed = false;
  }
}

console.log("\n" + (allPassed ? "✅  All plugins built successfully!" : "⚠️   Some plugins failed — see errors above."));
console.log(`📦  Zips saved to: ${ZIPS_DIR}\n`);

if (!allPassed) process.exit(1);
