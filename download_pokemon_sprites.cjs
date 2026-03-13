const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated';

// Ensure directories exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Download file from URL (follows redirects)
async function downloadFile(url, filepath, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      // Follow redirects (301/302/307/308)
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        if (redirectsLeft <= 0) {
          reject(new Error(`Too many redirects for ${url}`));
          return;
        }

        const nextUrl = response.headers.location.startsWith('http')
          ? response.headers.location
          : new URL(response.headers.location, url).toString();

        resolve(downloadFile(nextUrl, filepath, redirectsLeft - 1));
        return;
      }

      if (response.statusCode === 404) {
        console.log(`  ⚠️  Not found: ${url}`);
        resolve(false);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Status ${response.statusCode} for ${url}`));
        return;
      }

      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve(true);
      });

      fileStream.on('error', reject);
    }).on('error', reject);
  });
}

async function downloadAllSprites() {
  console.log('🎮 Downloading Pokémon sprites from PokéAPI...\n');

  const animatedBaseDir = path.join(__dirname, 'assets', 'sprites', 'pokemon', 'versions', 'generation-v', 'black-white', 'animated');
  const staticBaseDir = path.join(__dirname, 'assets', 'sprites', 'pokemon');

  // Ensure directories exist for all sprite variants
  ensureDir(animatedBaseDir);
  ensureDir(path.join(animatedBaseDir, 'back'));
  ensureDir(path.join(animatedBaseDir, 'shiny'));
  ensureDir(path.join(animatedBaseDir, 'back', 'shiny'));
  ensureDir(staticBaseDir);

  // Helper: skip files that already exist
  function alreadyDownloaded(filepath) {
    return fs.existsSync(filepath);
  }

  const animatedVariants = [
    { urlPath: '', dir: animatedBaseDir },
    { urlPath: 'back', dir: path.join(animatedBaseDir, 'back') },
    { urlPath: 'shiny', dir: path.join(animatedBaseDir, 'shiny') },
    { urlPath: 'back/shiny', dir: path.join(animatedBaseDir, 'back', 'shiny') },
  ];

  const STATIC_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;

  // Download for Pokémon IDs 1..649 (Gen 1-5)
  for (let id = 1; id <= 649; id++) {
    process.stdout.write(`\rDownloading Pokémon #${id.toString().padStart(3, '0')}...`);

    // Static PNG (normal)
    const staticUrl = `${STATIC_BASE_URL}/${id}.png`;
    const staticPath = path.join(staticBaseDir, `${id}.png`);
    if (!alreadyDownloaded(staticPath)) {
      try {
        const success = await downloadFile(staticUrl, staticPath);
        if (success) successCount++;
        else failCount++;
      } catch (error) {
        console.error(`\n❌ Error downloading static ID ${id}: ${error.message}`);
        failCount++;
      }
    } else {
      skippedCount++;
    }

    // Animated GIFs (front/back normal + shiny)
    for (const variant of animatedVariants) {
      const url = variant.urlPath
        ? `${BASE_URL}/${variant.urlPath}/${id}.gif`
        : `${BASE_URL}/${id}.gif`;
      const filepath = path.join(variant.dir, `${id}.gif`);

      if (alreadyDownloaded(filepath)) {
        skippedCount++;
        continue;
      }

      try {
        const success = await downloadFile(url, filepath);
        if (success) successCount++;
        else failCount++;
      } catch (error) {
        console.error(`\n❌ Error downloading ID ${id} (${variant.urlPath}): ${error.message}`);
        failCount++;
      }
    }
  }

  console.log(`\n\n✅ Download complete!`);
  console.log(`📊 Summary:`);
  console.log(`   ✓ Successful downloads: ${successCount}`);
  console.log(`   ✗ Failed downloads: ${failCount}`);
  console.log(`   ↪ Skipped (already existed): ${skippedCount}`);
  console.log(`   📁 Animated location: ${animatedBaseDir}`);
  console.log(`   📁 Static location: ${staticBaseDir}`);
}

downloadAllSprites().catch(console.error);
