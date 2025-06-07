// Track unknown sets encountered during exports
// This helps identify sets that need to be added to mappings

interface UnknownSet {
  name: string;
  count: number;
  lastSeen: string;
  fallbackCode: string;
}

export class UnknownSetsTracker {
  private static unknownSets: Map<string, UnknownSet> = new Map();

  static addUnknownSet(expansionName: string, fallbackCode: string): void {
    const existing = this.unknownSets.get(expansionName);
    
    if (existing) {
      existing.count++;
      existing.lastSeen = new Date().toISOString();
    } else {
      this.unknownSets.set(expansionName, {
        name: expansionName,
        count: 1,
        lastSeen: new Date().toISOString(),
        fallbackCode
      });
    }

    // Log to console for immediate visibility
    console.warn(`🔍 Unknown set encountered: "${expansionName}" (used fallback: "${fallbackCode}")`);
    console.log(`📊 Total unknown sets: ${this.unknownSets.size}`);
  }

  static getUnknownSets(): UnknownSet[] {
    return Array.from(this.unknownSets.values()).sort((a, b) => b.count - a.count);
  }

  static clearUnknownSets(): void {
    this.unknownSets.clear();
    console.log("✅ Unknown sets list cleared");
  }

  static exportUnknownSets(): string {
    const sets = this.getUnknownSets();
    if (sets.length === 0) {
      return "No unknown sets found.";
    }

    let output = "Unknown Sets Report\\n";
    output += "===================\\n\\n";
    
    sets.forEach(set => {
      output += `"${set.name}": "${set.fallbackCode}", // Count: ${set.count}, Last seen: ${set.lastSeen}\\n`;
    });

    return output;
  }
}