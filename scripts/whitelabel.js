#!/usr/bin/env node
/**
 * Apna Kirana - White-Labeling & Rebranding Engine
 * Usage:
 *   node scripts/whitelabel.js --name "Sharma Daily Needs" --phone "+919876543210" --color "#0D9488" --slug "sharma-kirana"
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// Parse CLI args
const args = process.argv.slice(2);
const params = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].replace(/^--/, '');
    const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
    params[key] = val;
  }
}

const storeName = params.name || 'Apna Kirana';
const storePhone = params.phone || '+919876543210';
const primaryColor = params.color || '#15803D'; // default emerald green
const slug = params.slug || storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const bundleId = `com.store.${slug.replace(/-/g, '')}`;

console.log('================================================================');
console.log('🏷️  APNA KIRANA - WHITE-LABELING AUTOMATION TOOL');
console.log('================================================================');
console.log(`📌 Store Name   : ${storeName}`);
console.log(`📞 Contact Phone: ${storePhone}`);
console.log(`🎨 Primary Color: ${primaryColor}`);
console.log(`🔗 App Slug     : ${slug}`);
console.log(`📦 Package ID   : ${bundleId}`);
console.log('----------------------------------------------------------------');

// 1. Update app.json
const appJsonPath = path.join(rootDir, 'app.json');
if (fs.existsSync(appJsonPath)) {
  try {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    if (appJson.expo) {
      appJson.expo.name = storeName;
      appJson.expo.slug = slug;
      if (appJson.expo.splash) {
        appJson.expo.splash.backgroundColor = primaryColor;
      }
      if (appJson.expo.android) {
        appJson.expo.android.package = bundleId;
        if (appJson.expo.android.adaptiveIcon) {
          appJson.expo.android.adaptiveIcon.backgroundColor = primaryColor;
        }
      }
      if (appJson.expo.ios) {
        appJson.expo.ios.bundleIdentifier = bundleId;
      }
    }
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2), 'utf8');
    console.log('✓ Updated app.json (Mobile App configuration)');
  } catch (err) {
    console.error('⚠️ Failed to update app.json:', err.message);
  }
}

// 2. Update .env.production
const envPath = path.join(rootDir, '.env.production');
if (fs.existsSync(envPath)) {
  let envContent = fs.readFileSync(envPath, 'utf8');
  envContent = envContent.replace(/EXPO_PUBLIC_STORE_NAME=.*/g, `EXPO_PUBLIC_STORE_NAME="${storeName}"`);
  envContent = envContent.replace(/EXPO_PUBLIC_STORE_PHONE=.*/g, `EXPO_PUBLIC_STORE_PHONE="${storePhone}"`);
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('✓ Updated .env.production variables');
}

// 3. Helper to update HTML preview files
const htmlFiles = [
  path.join(rootDir, 'preview', 'index.html'),
  path.join(rootDir, 'preview', 'admin.html'),
  path.join(rootDir, 'preview', 'live_demo.html')
];

htmlFiles.forEach((filePath) => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace title
    content = content.replace(/<title>.*?<\/title>/gi, `<title>${storeName} - Fast Local Delivery</title>`);
    
    // Replace MOCK_STORE name and phone if present
    content = content.replace(/name:\s*"[^"]*"/g, `name: "${storeName}"`);
    content = content.replace(/phone:\s*"\+?[0-9]*"/g, `phone: "${storePhone}"`);
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated branding in ${path.basename(filePath)}`);
  }
});

console.log('----------------------------------------------------------------');
console.log('🖼️  ASSETS REPLACEMENT CHECKLIST:');
console.log('   To complete full white-labeling, replace these image files in ./assets/:');
console.log('   1. assets/icon.png          (1024 x 1024 px - Square app launcher icon)');
console.log('   2. assets/adaptive-icon.png (1024 x 1024 px - Android foreground icon)');
console.log('   3. assets/splash.png        (1242 x 2436 px - Splash launch screen)');
console.log('   4. assets/favicon.png       (48 x 48 px     - Browser tab favicon)');
console.log('----------------------------------------------------------------');
console.log('🚀 Next: Run `npm run build` to package the updated Web Admin!');
console.log('================================================================');
