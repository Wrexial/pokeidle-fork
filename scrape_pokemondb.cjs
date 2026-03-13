#!/usr/bin/env node

/**
 * Scrape Pokémon data from pokemondb.net and transform to pokemon-species.json format
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Fetch HTML from URL
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        resolve(data);
      });
    }).on('error', reject);
  });
}

// Parse stat value from text
function parseStat(text) {
  const num = parseInt(text.trim());
  return isNaN(num) ? 0 : num;
}

// Extract Pokémon data from HTML table
function parsePokedex(html) {
  const pokemon = {};
  const processed = new Set();
  
  // Extract all table rows
  const rowMatches = html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g);
  
  for (const match of rowMatches) {
    const rowHtml = match[1];
    
    // Extract all cells from the row
    const cellMatches = rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g);
    const cells = [];
    
    for (const cellMatch of cellMatches) {
      let cellContent = cellMatch[1];
      
      // Remove HTML tags
      cellContent = cellContent
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .trim();
      
      cells.push(cellContent);
    }
    
    // Expected format: img/ID | Name | Type | BST | HP | ATK | DEF | SpA | SpD | SPE
    if (cells.length < 10) continue;
    
    // Parse ID from second cell
    const idStr = cells[0].trim();
    const id = parseInt(idStr);
    
    if (id < 1 || id > 1025 || isNaN(id)) continue;
    
    // Get name from third cell  
    let name = cells[1].trim();
    
    // Skip form variants
    if (name.includes('Mega ') || name.includes('(') || name.match(/\sForm|\sForme|\sBreed|\sStyle/)) {
      continue;
    }
    
    // Get types from fourth cell
    const typeStr = cells[2].trim();
    const types = typeStr
      .split(/\s+/)
      .filter(t => t.length > 0)
      .map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
    
    if (types.length === 0) continue;
    
    // Parse stats - indices may vary so search for numeric values
    const statVals = [];
    for (let i = 3; i < cells.length; i++) {
      const val = parseStat(cells[i]);
      if (val > 0) statVals.push(val);
    }
    
    // We need at least 6 stat values (BST, HP, ATK, DEF, SpA, SpD, SPE) - 7 values
    if (statVals.length < 6) continue;
    
    // Extract individual stats (skip BST which is first)
    const hp = statVals[1];
    const attack = statVals[2];
    const defense = statVals[3];
    const spAttack = statVals[4];
    const spDefense = statVals[5];
    const speed = statVals[6] || 0;
    
    // Create key
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Only add base form once per ID
    if (!processed.has(id) && !pokemon[key]) {
      pokemon[key] = {
        id: id,
        name: name,
        types: types,
        baseStats: {
          hp: hp,
          attack: attack,
          defense: defense,
          spAttack: spAttack,
          spDefense: spDefense,
          speed: speed
        }
      };
      processed.add(id);
    }
  }
  
  return pokemon;
}

// Load existing pokemon-species.json for baseExpYield and growthRate
function loadExistingData() {
  try {
    const filePath = path.join(__dirname, 'data', 'pokemon-species.json');
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.warn('⚠️  Could not load existing data');
    return {};
  }
}

// Format final output with exp and growth rate from existing data
function formatFinalData(scrapedData, existingData) {
  const result = {};
  
  for (const [key, pokemon] of Object.entries(scrapedData)) {
    const existingEntry = existingData[key];
    
    result[key] = {
      id: pokemon.id,
      name: pokemon.name,
      types: pokemon.types,
      baseStats: pokemon.baseStats,
      baseExpYield: existingEntry?.baseExpYield || 64,
      growthRate: existingEntry?.growthRate || 'mediumSlow'
    };
  }
  
  return result;
}

async function main() {
  try {
    console.log('📥 Fetching Pokédex data from pokemondb.net...');
    const html = await fetchUrl('https://pokemondb.net/pokedex/all');
    
    console.log('📊 Parsing Pokémon data...');
    const scrapedData = parsePokedex(html);
    console.log(`   Found ${Object.keys(scrapedData).length} Pokémon`);
    
    console.log('📖 Loading existing data for base exp and growth rates...');
    const existingData = loadExistingData();
    
    console.log('🔄 Formatting final data...');
    const finalData = formatFinalData(scrapedData, existingData);
    
    // Show samples
    const sampleKeys = Object.keys(finalData).slice(0, 3);
    if (sampleKeys.length > 0) {
      console.log('\n📋 Sample entries:');
      for (const key of sampleKeys) {
        const pokemon = finalData[key];
        console.log(`   ${key}: #${pokemon.id} ${pokemon.name} - ${pokemon.types.join('/')}`);
      }
    }
    
    console.log('\n💾 Saving to pokedex.json...');
    fs.writeFileSync('pokedex.json', JSON.stringify(finalData, null, 2) + '\n', 'utf8');
    
    console.log('✅ Done! pokedex.json has been updated');
    console.log(`   Total Pokémon: ${Object.keys(finalData).length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
