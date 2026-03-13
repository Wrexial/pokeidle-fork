#!/usr/bin/env node
const fs = require('fs');

console.log('🔍 Extracting game data from bundled code...\n');

const content = fs.readFileSync('assets/index.js', 'utf8');

// Helper function to extract object by delimiters
function extractObjectBetween(pattern, endMarker) {
  const startMatch = content.match(pattern);
  if (!startMatch) return null;
  
  const startIndex = startMatch.index + startMatch[0].length;
  let braceCount = 1;
  let currentIndex = startIndex;
  
  while (braceCount > 0 && currentIndex < content.length) {
    const char = content[currentIndex];
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    currentIndex++;
  }
  
  return content.substring(startIndex, currentIndex);
}

// 1. Extract Pokemon Species (already working well)
console.log('📦 Extracting pokemon-species...');
const pokemonSpecies = {};
const pokemonPattern = /(\w+):\s*\{\s*id:\s*(\d+),\s*name:\s*"([^"]+)",\s*types:\s*\[([^\]]+)\],\s*baseStats:\s*\{([^}]+)\},\s*baseExpYield:\s*(\d+),\s*growthRate:\s*"([^"]+)"\s*\}/g;

let match;
while ((match = pokemonPattern.exec(content)) !== null) {
  const id = parseInt(match[2]);
  if (id >= 1 && id <= 151) {
    pokemonSpecies[match[1]] = {
      id: id,
      name: match[3],
      types: match[4].split(',').map(t => t.trim().replace(/"/g, '')),
      baseStats: Object.fromEntries(
        Array.from(match[5].matchAll(/(\w+):\s*(\d+)/g), m => [m[1], parseInt(m[2])])
      ),
      baseExpYield: parseInt(match[6]),
      growthRate: match[7]
    };
  }
}
console.log(`  ✅ Extracted ${Object.keys(pokemonSpecies).length} species\n`);
fs.writeFileSync('data/pokemon-species.json', JSON.stringify(pokemonSpecies, null, 2));

// 2. Extract Evolution Data
console.log('📦 Extracting evolution-data...');
const evoBracketContent = extractObjectBetween(/, evolutionData = \{/, 'preEvolutionMap');
const evolutionData = {};

if (evoBracketContent) {
  // Split by species entries: speciesName: [...]
  const speciesEvolutions = evoBracketContent.match(/(\w+):\s*\[\s*(\{[^}]*\}(?:,\s*\{[^}]*\})*)\s*\]/g);
  
  if (speciesEvolutions) {
    for (const entry of speciesEvolutions) {
      const speciesMatch = entry.match(/^(\w+):/);
      const species = speciesMatch[1];
      
      const evolutions = [];
      const evoObjects = entry.match(/\{([^}]*)\}/g);
      
      if (evoObjects) {
        for (const evoObj of evoObjects) {
          const evo = {};
          const intoMatch = evoObj.match(/into:\s*"(\w+)"/);
          const levelMatch = evoObj.match(/level:\s*(\d+)/);
          const itemMatch = evoObj.match(/item:\s*"(\w+)"/);
          
          if (intoMatch) evo.into = intoMatch[1];
          if (levelMatch) evo.level = parseInt(levelMatch[1]);
          if (itemMatch) evo.item = itemMatch[1];
          
          if (Object.keys(evo).length > 0) {
            evolutions.push(evo);
          }
        }
      }
      
      if (evolutions.length > 0) {
        evolutionData[species] = evolutions;
      }
    }
  }
}

console.log(`  ✅ Extracted ${Object.keys(evolutionData).length} species with evolutions\n`);
fs.writeFileSync('data/evolution-data.json', JSON.stringify(evolutionData, null, 2));

// 3. Extract Move Learnsets
console.log('📦 Extracting move-learnsets...');
const moveLearnsets = {};

// Move learnsets are on single lines: species: [[level, "move"], ...]
const movesPattern = /(\w+):\s*\[\[(\d+),\s*"([^"]+)"[^\]]*\][\s\S]*?\],/g;

// Simpler approach: match species and their move arrays
const moveSpeciesPattern = /(\w+):\s*(\[\[[\d,"\s\[\]_\w]+\]\])\s*[,}]/g;

while ((match = moveSpeciesPattern.exec(content)) !== null) {
  const species = match[1];
  const movesStr = match[2];
  
  const moves = [];
  // Extract all [level, "move"] pairs from this species
  const moveEntries = movesStr.match(/\[(\d+),\s*"([^"]+)"\]/g) || [];
  
  for (const entry of moveEntries) {
    const moveMatch = entry.match(/\[(\d+),\s*"([^"]+)"\]/);
    if (moveMatch) {
      moves.push([parseInt(moveMatch[1]), moveMatch[2]]);
    }
  }
  
  if (moves.length > 0) {
    moveLearnsets[species] = moves;
  }
}

console.log(`  ✅ Extracted movesets for ${Object.keys(moveLearnsets).length} species\n`);
fs.writeFileSync('data/move-learnsets.json', JSON.stringify(moveLearnsets, null, 2));

// 4. Extract Trainer Classes  
console.log('📦 Extracting trainer-classes...');
const trainerBracketContent = extractObjectBetween(/const trainerClassMap = \{/, null);
const trainerClassMap = {};

if (trainerBracketContent) {
  const pairs = trainerBracketContent.match(/(\w+):\s*"(\w+)"/g);
  
  if (pairs) {
    for (const pair of pairs) {
      const match = pair.match(/(\w+):\s*"(\w+)"/);
      trainerClassMap[match[1]] = match[2];
    }
  }
}

console.log(`  ✅ Extracted ${Object.keys(trainerClassMap).length} trainer classes\n`);
fs.writeFileSync('data/trainer-classes.json', JSON.stringify(trainerClassMap, null, 2));

// Summary
console.log('═══════════════════════════════════════');
console.log('✅ Data Extraction Complete!\n');
console.log('Files created in data/ directory:');
console.log(`  • pokemon-species.json (${Object.keys(pokemonSpecies).length} species)`);
console.log(`  • evolution-data.json (${Object.keys(evolutionData).length} with evolutions)`);
console.log(`  • move-learnsets.json (${Object.keys(moveLearnsets).length} species)`);
console.log(`  • trainer-classes.json (${Object.keys(trainerClassMap).length} classes)`);
console.log('\n💡 These JSON files can now be:');
console.log('   - Edited independently from the bundle');
console.log('   - Imported back into the app as needed');
console.log('   - Used for documentation or tools');
console.log('═══════════════════════════════════════\n');
