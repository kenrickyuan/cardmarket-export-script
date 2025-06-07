// Edge case mappings for set names that don't match Scryfall data
// This file handles CardMarket-specific naming that differs from standard set names

export const EDGE_CASE_MAPPINGS: Record<string, string> = {
  // Add manual mappings here as you discover them
  // Format: "CardMarket Name": "moxfield_code"
  "Core 2021": "m21",
  "Commander: Modern Horizons 3: Extras": "m3c",
  "Commander: Adventures in the Forgotten Realms": "afc",
  "Commander: Wilds of Eldraine": "woc",
  "Commander: Outlaws of Thunder Junction": "otc",
  "Commander: Tarkir: Dragonstorm": "tdc",
  "Commander: Kamigawa: Neon Dynasty": "nec",
  "Gateway Promos": "dci",
  Commander: "cmd",
  // Example edge cases (replace with actual ones you find):
  // "Promotional Cards": "prm",
  // "Judge Rewards": "jgp",
  // "Special Events": "evt",
};

// Function to add new edge case mapping (for development/testing)
export const addEdgeCase = (cardMarketName: string, setCode: string): void => {
  EDGE_CASE_MAPPINGS[cardMarketName] = setCode;
  console.log(`Added edge case: "${cardMarketName}" -> "${setCode}"`);
  console.log(
    "Add this to edge-cases.ts:",
    `"${cardMarketName}": "${setCode}",`
  );
};

// Function to check if a mapping exists in edge cases
export const getEdgeCaseMapping = (expansionName: string): string | null => {
  return EDGE_CASE_MAPPINGS[expansionName] || null;
};
