const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const previewDir = path.join(rootDir, 'preview');
const distDir = path.join(rootDir, 'dist');

console.log('📦 Building Apna Kirana Web Admin for Vercel deployment...');

// Ensure dist exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy preview files into dist
const filesToCopy = [
  { src: 'admin.html', dest: 'index.html' },        // Default web route is Shopkeeper Admin Dashboard
  { src: 'admin.html', dest: 'admin.html' },        // /admin.html
  { src: 'index.html', dest: 'customer.html' },     // /customer.html
  { src: 'live_demo.html', dest: 'live_demo.html' } // /live_demo.html
];

filesToCopy.forEach(({ src, dest }) => {
  const srcPath = path.join(previewDir, src);
  const destPath = path.join(distDir, dest);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`  ✓ Copied ${src} -> dist/${dest}`);
  } else {
    console.warn(`  ⚠️ Warning: Source file ${srcPath} not found.`);
  }
});

// Also copy assets directory if it exists
const assetsSrc = path.join(rootDir, 'assets');
const assetsDest = path.join(distDir, 'assets');
if (fs.existsSync(assetsSrc)) {
  if (!fs.existsSync(assetsDest)) fs.mkdirSync(assetsDest, { recursive: true });
  fs.cpSync(assetsSrc, assetsDest, { recursive: true });
  console.log('  ✓ Copied assets directory -> dist/assets');
}

console.log('✅ Web Admin build ready in dist/ directory.');
