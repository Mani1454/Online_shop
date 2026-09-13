const fs = require('fs');
const babel = require('@babel/core');

const files = ['preview/live_demo.html', 'preview/admin.html', 'preview/index.html'];

let hasError = false;

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const match = html.match(/<script type="text\/babel">([\s\S]*?)<\/script>/);
  if (!match) {
    console.log(`[${file}] No <script type="text/babel"> found.`);
    continue;
  }
  try {
    babel.transformSync(match[1], { presets: ['@babel/preset-react'] });
    console.log(`[${file}] ✅ Babel compilation SUCCESS!`);
  } catch (err) {
    hasError = true;
    console.error(`[${file}] ❌ Babel compilation ERROR:`, err.message);
    if (err.loc) {
      console.error('Line:', err.loc.line, 'Column:', err.loc.column);
    }
  }
}

if (hasError) process.exit(1);
