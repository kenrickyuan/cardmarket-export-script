// CSV Error Analyzer for Moxfield Import Issues
// Parses error messages and extracts problematic rows from original CSV

interface MoxfieldError {
  cardName: string;
  edition: string;
  lineNumber: number;
  originalLine: string;
}

interface ErrorAnalysisResult {
  errors: MoxfieldError[];
  errorRows: string[];
  csvHeader: string;
  summary: string;
}

export class CSVErrorAnalyzer {
  // Parse Moxfield error message text
  static parseErrorMessage(errorText: string): MoxfieldError[] {
    const errors: MoxfieldError[] = [];
    
    // Regex to match: Could not find card named "CardName" in edition "setcode". on line N
    const errorRegex = /Could not find card named "([^"]+)" in edition "([^"]+)"\. on line (\d+)/g;
    
    let match;
    while ((match = errorRegex.exec(errorText)) !== null) {
      if (match[1] && match[2] && match[3]) {
        errors.push({
          cardName: match[1],
          edition: match[2],
          lineNumber: parseInt(match[3]),
          originalLine: ""
        });
      }
    }
    
    return errors;
  }

  // Parse CSV content into lines
  static parseCSV(csvContent: string): string[] {
    return csvContent.split('\n').filter(line => line.trim().length > 0);
  }

  // Extract error rows from CSV based on line numbers
  static extractErrorRows(csvContent: string, errors: MoxfieldError[]): ErrorAnalysisResult {
    const csvLines = this.parseCSV(csvContent);
    const header = csvLines[0] || "";
    const errorRows: string[] = [header]; // Include header in result
    const enhancedErrors: MoxfieldError[] = [];

    for (const error of errors) {
      // Line numbers in error messages are 1-based, array is 0-based
      const lineIndex = error.lineNumber - 1;
      
      if (lineIndex < csvLines.length && lineIndex > 0) { // Skip header (index 0)
        const csvLine = csvLines[lineIndex];
        if (csvLine) {
          errorRows.push(csvLine);
          
          enhancedErrors.push({
            ...error,
            originalLine: csvLine
          });
        }
      }
    }

    const summary = this.generateSummary(enhancedErrors);

    return {
      errors: enhancedErrors,
      errorRows,
      csvHeader: header,
      summary
    };
  }

  // Generate summary of errors for analysis
  static generateSummary(errors: MoxfieldError[]): string {
    const editionCounts: Record<string, number> = {};
    const cardNames: string[] = [];

    for (const error of errors) {
      editionCounts[error.edition] = (editionCounts[error.edition] || 0) + 1;
      cardNames.push(error.cardName);
    }

    let summary = `Error Analysis Summary\n`;
    summary += `======================\n\n`;
    summary += `Total errors: ${errors.length}\n\n`;
    
    summary += `Problematic editions:\n`;
    Object.entries(editionCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([edition, count]) => {
        summary += `  ${edition}: ${count} errors\n`;
      });

    summary += `\nProblematic cards:\n`;
    cardNames.forEach(name => {
      summary += `  ${name}\n`;
    });

    return summary;
  }

  // Create corrected CSV content with suggested fixes
  static createCorrectedCSV(result: ErrorAnalysisResult, corrections: Record<string, string>): string {
    const correctedRows = [result.csvHeader];

    for (const error of result.errors) {
      if (corrections[error.edition]) {
        // Replace the edition code in the CSV line
        const correctedLine = error.originalLine.replace(
          `"${error.edition}"`,
          `"${corrections[error.edition]}"`
        );
        correctedRows.push(correctedLine);
      } else {
        // Keep original if no correction provided
        correctedRows.push(error.originalLine);
      }
    }

    return correctedRows.join('\n');
  }

  // Suggest common corrections based on card names and editions
  static suggestCorrections(errors: MoxfieldError[]): Record<string, string> {
    const suggestions: Record<string, string> = {};

    // Common mappings that often cause issues
    const commonFixes: Record<string, string> = {
      'mb2': 'cmm',  // Mystery Booster 2 -> Commander Masters
      'afr': 'afc',  // Adventures in Forgotten Realms -> AFC Commander
      'mom': 'moc',  // March of the Machine -> MOC Commander
      'woe': 'woc',  // Wilds of Eldraine -> WOC Commander
      'otj': 'otc',  // Outlaws Thunder Junction -> OTC Commander
      'mh3': 'm3c',  // Modern Horizons 3 -> M3C Commander
      'tdm': 'tdc',  // Tarkir Dragonstorm -> TDC Commander
    };

    for (const error of errors) {
      if (error.edition && commonFixes[error.edition]) {
        suggestions[error.edition] = commonFixes[error.edition]!;
      }
    }

    return suggestions;
  }
}