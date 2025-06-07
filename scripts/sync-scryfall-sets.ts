#!/usr/bin/env npx tsx

/**
 * Scryfall Sets Sync Script
 * 
 * This script fetches the latest set data from Scryfall and updates the set mappings.
 * Run this weekly to keep set mappings current with new releases.
 * 
 * Usage:
 *   npm run sync-sets
 *   npx tsx scripts/sync-scryfall-sets.ts
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCRYFALL_SETS_API = 'https://api.scryfall.com/sets';
const SET_MAPPINGS_FILE = path.join(__dirname, '../src/data/set-mappings.ts');

interface ScryfallSet {
  id: string;
  code: string;
  name: string;
  released_at: string;
  set_type: string;
  digital: boolean;
}

interface ScryfallResponse {
  data: ScryfallSet[];
  has_more: boolean;
}

// Fetch data from Scryfall API
function fetchScryfallSets(): Promise<ScryfallSet[]> {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'MKM-Helper-Sync/1.0',
        'Accept': 'application/json'
      }
    };
    
    https.get(SCRYFALL_SETS_API, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed: ScryfallResponse = JSON.parse(data);
          
          if (!parsed.data) {
            throw new Error('No data array in response');
          }
          
          resolve(parsed.data);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });
  });
}

// Read current set mappings
function readCurrentMappings(): Record<string, string> {
  try {
    const content = fs.readFileSync(SET_MAPPINGS_FILE, 'utf8');
    const match = content.match(/export const SET_NAME_TO_CODE_MAPPING: Record<string, string> = \{([\s\S]*?)\} as const;/);
    
    if (!match) {
      throw new Error('Could not parse current mappings');
    }
    
    const mappingsText = match[1];
    const mappings: Record<string, string> = {};
    
    // Parse the mappings (simple regex-based parser)
    const lines = mappingsText.split('\n');
    
    for (const line of lines) {
      const lineMatch = line.match(/^\s*"([^"]+)":\s*"([^"]+)",?\s*(?:\/\/.*)?$/);
      if (lineMatch) {
        mappings[lineMatch[1]] = lineMatch[2];
      }
    }
    return mappings;
  } catch (error) {
    console.error('Error reading current mappings:', (error as Error).message);
    return {};
  }
}

// Generate new mappings from Scryfall data
function generateMappingsFromScryfall(
  scryfallSets: ScryfallSet[], 
  currentMappings: Record<string, string>
): Record<string, string> {
  const newMappings = { ...currentMappings };
  let addedCount = 0;
  
  // Sort sets by release date (newest first) for better organization
  const sortedSets = scryfallSets.sort((a, b) => 
    new Date(b.released_at).getTime() - new Date(a.released_at).getTime()
  );
  
  for (const set of sortedSets) {
    const setName = set.name;
    const setCode = set.code;
    
    // Skip if we already have this mapping
    if (newMappings[setName]) {
      continue;
    }
    
    // Add the mapping
    newMappings[setName] = setCode;
    addedCount++;
    console.log(`Added: "${setName}" -> "${setCode}"`);
  }
  
  console.log(`\nTotal new mappings added: ${addedCount}`);
  return newMappings;
}

// Write updated mappings back to file
function writeMappingsToFile(mappings: Record<string, string>, scryfallSets: ScryfallSet[]): void {
  // Create ordered entries following Scryfall's natural order (newest to oldest)
  const scryfallSetNames = new Set(scryfallSets.map(set => set.name));
  const orderedEntries: [string, string][] = [];
  
  // First, add all sets that exist in Scryfall data (in their natural order)
  for (const set of scryfallSets) {
    if (mappings[set.name]) {
      orderedEntries.push([set.name, mappings[set.name]]);
    }
  }
  
  // Then add any remaining mappings that aren't in Scryfall data (alphabetically)
  const remainingEntries = Object.entries(mappings)
    .filter(([name]) => !scryfallSetNames.has(name))
    .sort(([a], [b]) => a.localeCompare(b));
  
  orderedEntries.push(...remainingEntries);
  
  let mappingsText = '';
  for (const [setName, setCode] of orderedEntries) {
    // Escape quotes in set names
    const escapedName = setName.replace(/"/g, '\\"');
    mappingsText += `      "${escapedName}": "${setCode}",\n`;
  }
  
  const fileContent = `// MTG Set Name to Code Mappings for Moxfield Export
// Complete mapping of CardMarket set names to Moxfield-compatible set codes
// Source: Original MKM Helper script + https://scryfall.com/sets
// Last updated: ${new Date().toISOString()}

export const SET_NAME_TO_CODE_MAPPING: Record<string, string> = {
${mappingsText}    } as const;
`;

  fs.writeFileSync(SET_MAPPINGS_FILE, fileContent, 'utf8');
  console.log(`\nMappings written to ${SET_MAPPINGS_FILE}`);
}

// Main function
async function main(): Promise<void> {
  try {
    console.log('🔄 Fetching latest sets from Scryfall...');
    const scryfallSets = await fetchScryfallSets();
    console.log(`✅ Found ${scryfallSets.length} sets from Scryfall`);
    
    console.log('\n📖 Reading current mappings...');
    const currentMappings = readCurrentMappings();
    console.log(`✅ Found ${Object.keys(currentMappings).length} existing mappings`);
    
    console.log('\n🔄 Generating updated mappings...');
    const updatedMappings = generateMappingsFromScryfall(scryfallSets, currentMappings);
    
    console.log('\n💾 Writing updated mappings to file...');
    writeMappingsToFile(updatedMappings, scryfallSets);
    
    console.log(`\n✅ Sync complete! Total mappings: ${Object.keys(updatedMappings).length}`);
    
  } catch (error) {
    console.error('❌ Error during sync:', (error as Error).message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, fetchScryfallSets, generateMappingsFromScryfall };