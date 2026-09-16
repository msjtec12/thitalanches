import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const distDir = path.resolve('dist');
const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html não encontrado. Execute npm run build antes do budget.');
  process.exit(1);
}

const indexHtml = fs.readFileSync(indexPath, 'utf8');
const assetMatches = [...indexHtml.matchAll(/(?:src|href)=["']\/?(assets\/[^"']+\.js)["']/g)];
const initialAssets = [...new Set(assetMatches.map((match) => match[1]))];

if (initialAssets.length === 0) {
  console.error('Nenhum JavaScript inicial foi encontrado em dist/index.html.');
  process.exit(1);
}

const sizes = initialAssets.map((asset) => {
  const filePath = path.join(distDir, asset);
  const contents = fs.readFileSync(filePath);
  return {
    asset,
    raw: contents.byteLength,
    gzip: gzipSync(contents).byteLength,
  };
});

const initialRaw = sizes.reduce((sum, item) => sum + item.raw, 0);
const initialGzip = sizes.reduce((sum, item) => sum + item.gzip, 0);
const maxInitialRaw = 750 * 1024;
const maxInitialGzip = 220 * 1024;

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;
console.log('Performance budget — JavaScript inicial:');
for (const item of sizes) {
  console.log(`  ${item.asset}: ${kb(item.raw)} (${kb(item.gzip)} gzip)`);
}
console.log(`  TOTAL: ${kb(initialRaw)} (${kb(initialGzip)} gzip)`);

const failures = [];
if (initialRaw > maxInitialRaw) {
  failures.push(`JS inicial bruto ${kb(initialRaw)} > limite ${kb(maxInitialRaw)}`);
}
if (initialGzip > maxInitialGzip) {
  failures.push(`JS inicial gzip ${kb(initialGzip)} > limite ${kb(maxInitialGzip)}`);
}

if (failures.length > 0) {
  console.error('\nBudget de performance excedido:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Budget de performance aprovado.');
