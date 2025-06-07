// Export Module
// Handles exporting CardMarket orders to Moxfield CSV format

import { devLog, devError } from "../dev/helpers";
import {
  MOXFIELD_CONDITIONS,
  MOXFIELD_LANGUAGES,
  REGEX_PATTERNS,
  CARDMARKET_SELECTORS,
} from "../constants";
import { SET_NAME_TO_CODE_MAPPING } from "../data/set-mappings";
import type {
  MoxfieldExportData,
  CardMarketPageType,
} from "../types/cardmarket";

// Extract article data from a table row element
const extractArticleData = (row: Element): MoxfieldExportData | null => {
  try {
    const articleElement = row as HTMLElement;
    const dataset = articleElement.dataset;

    if (!dataset.name || !dataset.amount) {
      devLog("Missing required data attributes", dataset);
      return null;
    }

    // Clean card name
    const match = REGEX_PATTERNS.cardNameClean.exec(dataset.name);
    const cleanName = match && match[1] ? match[1].trim() : dataset.name.trim();
    const cardName = cleanName.replace("Æ", "Ae").replace("æ", "ae");

    // Get set code from expansion name
    const expansionName =
      dataset["expansion-name"] || dataset.expansionName || "";
    const setCode = getSetCode(expansionName);

    // Map condition and language
    const conditionId = parseInt(dataset.condition || "2");
    const languageId = parseInt(dataset.language || "1");

    const condition =
      MOXFIELD_CONDITIONS[conditionId as keyof typeof MOXFIELD_CONDITIONS] ||
      "NM";
    const language =
      MOXFIELD_LANGUAGES[languageId as keyof typeof MOXFIELD_LANGUAGES] || "en";

    // Check for foil
    const foilElement = row.querySelector(
      'div.col-extras span[aria-label="Foil"]'
    );
    const foil = foilElement ? "foil" : "";

    // Get price
    const price = dataset.price ? parseFloat(dataset.price).toFixed(2) : "";

    return {
      Count: parseInt(dataset.amount),
      Name: cardName,
      Edition: setCode,
      Condition: condition,
      Language: language,
      Foil: foil,
      "Collector Number": dataset.number || "",
      Alter: "FALSE",
      "Playtest Card": "FALSE",
      "Purchase Price": price,
    };
  } catch (error) {
    devError(
      error instanceof Error ? error : new Error(String(error)),
      "extractArticleData"
    );
    return null;
  }
};

// Convert set name to set code for Moxfield
const getSetCode = (expansionName: string): string => {
  if (!expansionName) return "";

  // First, try exact match
  if (SET_NAME_TO_CODE_MAPPING[expansionName]) {
    return SET_NAME_TO_CODE_MAPPING[expansionName];
  }

  // Try partial matches for sets with different naming conventions
  for (const [setName, setCode] of Object.entries(SET_NAME_TO_CODE_MAPPING)) {
    if (expansionName.includes(setName) || setName.includes(expansionName)) {
      return setCode;
    }
  }

  // If no match found, return lowercase version of original name
  return expansionName.toLowerCase().replace(/[^a-z0-9]/g, "");
};

// Generate CSV content from article data
const generateMoxfieldCSV = (articles: MoxfieldExportData[]): string => {
  if (articles.length === 0) {
    throw new Error("No articles to export");
  }

  const firstArticle = articles[0];
  if (!firstArticle) {
    throw new Error("Invalid article data");
  }

  const headers = Object.keys(firstArticle);
  let csvContent = "";

  // Add headers with proper quoting
  csvContent += headers.map((header) => `"${header}"`).join(",") + "\r\n";

  // Add data rows
  articles.forEach((article) => {
    const row = headers
      .map((header) => {
        const value = article[header as keyof MoxfieldExportData] || "";
        return `"${value}"`;
      })
      .join(",");
    csvContent += row + "\r\n";
  });

  return csvContent;
};

// Download CSV file
const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const exportedFilename = filename.endsWith(".csv")
    ? filename
    : `${filename}.csv`;

  // Modern browsers
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", exportedFilename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Fallback for older browsers
    devError(
      new Error("CSV download not supported in this browser"),
      "downloadCSV"
    );
  }
};

// Export articles to clipboard as text
const exportToClipboard = (articles: MoxfieldExportData[]): Promise<void> => {
  const textContent = articles
    .map((article) => `${article.Count} ${article.Name}`)
    .join("\r\n");

  return navigator.clipboard.writeText(textContent);
};

// Get order ID from page title
const getOrderId = (): string => {
  const titleElement = document.querySelector(CARDMARKET_SELECTORS.pageTitle);
  if (titleElement) {
    const titleText = titleElement.textContent || "";
    const match = titleText.match(/[0-9]+/);
    return match ? match[0] : "Unknown";
  }
  return "Unknown";
};

// Collect all article data from the page
const collectArticleData = (): MoxfieldExportData[] => {
  const rows = document.querySelectorAll(CARDMARKET_SELECTORS.articleTableRows);
  const articles: MoxfieldExportData[] = [];

  rows.forEach((row) => {
    const articleData = extractArticleData(row);
    if (articleData) {
      articles.push(articleData);
    }
  });

  devLog(`Collected ${articles.length} articles for export`);
  return articles;
};

// Export to Moxfield CSV
const exportMoxfieldCSV = (): void => {
  try {
    const articles = collectArticleData();
    if (articles.length === 0) {
      devError(new Error("No articles found to export"), "exportMoxfieldCSV");
      return;
    }

    const csvContent = generateMoxfieldCSV(articles);
    const orderId = getOrderId();
    const filename = `MKM Order ${orderId} - Moxfield`;

    downloadCSV(csvContent, filename);
    devLog(`Exported ${articles.length} articles to Moxfield CSV: ${filename}`);
  } catch (error) {
    devError(
      error instanceof Error ? error : new Error(String(error)),
      "exportMoxfieldCSV"
    );
  }
};

// Export to clipboard as text
const exportToText = (): void => {
  try {
    const articles = collectArticleData();
    if (articles.length === 0) {
      devError(new Error("No articles found to export"), "exportToText");
      return;
    }

    exportToClipboard(articles)
      .then(() => {
        devLog(`Exported ${articles.length} articles to clipboard`);

        // Show tooltip if available
        const tooltip = document.getElementById("custom-tooltip");
        if (tooltip) {
          tooltip.classList.add("visible");
          setTimeout(() => {
            tooltip.classList.remove("visible");
          }, 2000);
        }
      })
      .catch((error) => {
        devError(error, "exportToClipboard");
      });
  } catch (error) {
    devError(
      error instanceof Error ? error : new Error(String(error)),
      "exportToText"
    );
  }
};

// Create MKMHelper section matching CardMarket's style
const createMKMHelperSection = (): HTMLElement => {
  // Create the wrapper div
  const wrapperDiv = document.createElement("div");
  wrapperDiv.className = "align-items-center";

  // Create the custom-collapse-wrapper
  const collapseWrapper = document.createElement("div");
  collapseWrapper.className = "custom-collapse-wrapper w-100";

  // Create the label/header button
  const labelDiv = document.createElement("div");
  labelDiv.className = "label custom-collapse-label";
  labelDiv.id = "labelKenricksTools";
  labelDiv.setAttribute(
    "data-open-label",
    '<span><span class="fonticon-code fonticon-color-primary me-2"></span><span>Kenrick\'s Tools</span></span><span class="fonticon-chevron-down small ms-1"></span>'
  );
  labelDiv.setAttribute(
    "data-close-label",
    '<span><span class="fonticon-code fonticon-color-primary me-2"></span><span>Kenrick\'s Tools</span></span><span class="fonticon-chevron-up small ms-1"></span>'
  );

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "d-grid";

  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.className =
    "d-flex align-items-center px-0 btn btn-sm btn-link btn-slim";
  toggleButton.setAttribute("aria-expanded", "false");
  toggleButton.setAttribute("aria-controls", "collapsibleKenricksTools");
  toggleButton.setAttribute("data-bs-toggle", "collapse");
  toggleButton.setAttribute("data-bs-target", "#collapsibleKenricksTools");
  toggleButton.innerHTML =
    '<span><span class="fonticon-code fonticon-color-primary me-2"></span><span>Kenrick\'s Tools</span></span><span class="fonticon-chevron-down small ms-1"></span>';

  buttonContainer.appendChild(toggleButton);
  labelDiv.appendChild(buttonContainer);

  // Create the collapsible content
  const collapseDiv = document.createElement("div");
  collapseDiv.id = "collapsibleKenricksTools";
  collapseDiv.className = "collapse custom-collapse";
  collapseDiv.setAttribute("data-collapse-label", "#labelKenricksTools");

  const description = document.createElement("p");
  description.className = "fst-italic small";
  description.textContent =
    "Enhanced CardMarket functionality provided by Kenrick's Tools.";

  collapseDiv.appendChild(description);
  collapseWrapper.appendChild(labelDiv);
  collapseWrapper.appendChild(collapseDiv);
  wrapperDiv.appendChild(collapseWrapper);

  return collapseDiv;
};

// Create export buttons and add to page
const createExportButtons = (): void => {
  // Find the action-bar container
  const actionBar = document.querySelector(".action-bar");
  if (!actionBar) {
    devLog("Action bar container not found");
    return;
  }

  // Create Kenrick's Tools section
  const kenricksToolsContent = createMKMHelperSection();
  const kenricksToolsWrapper = kenricksToolsContent.closest(".align-items-center")!;

  // Fallback: add at the end of action-bar with proper separator
  const separatorHr = document.createElement("hr");
  separatorHr.className = "my-3";
  actionBar.appendChild(separatorHr);
  actionBar.appendChild(kenricksToolsWrapper);

  // Add clipboard export button
  const clipboardButton = document.createElement("input");
  clipboardButton.type = "submit";
  clipboardButton.id = "exportToText";
  clipboardButton.value = "Copy to Clipboard";
  clipboardButton.title = "Copy order contents as plain text to clipboard";
  clipboardButton.className = "btn my-2 btn-sm btn-outline-primary";
  clipboardButton.addEventListener("click", exportToText);

  const clipboardContainer = document.createElement("div");
  clipboardContainer.className = "d-grid";
  clipboardContainer.appendChild(clipboardButton);
  kenricksToolsContent.appendChild(clipboardContainer);

  // Add custom tooltip span
  const tooltip = document.createElement("span");
  tooltip.id = "custom-tooltip";
  tooltip.textContent = "Copied!";
  kenricksToolsContent.appendChild(tooltip);

  // Add Moxfield CSV export button
  const moxfieldButton = document.createElement("input");
  moxfieldButton.type = "submit";
  moxfieldButton.id = "exportToMoxfield";
  moxfieldButton.value = "Export (Moxfield CSV)";
  moxfieldButton.title = "Export to Moxfield CSV format";
  moxfieldButton.className = "btn my-2 btn-sm btn-outline-primary";
  moxfieldButton.addEventListener("click", exportMoxfieldCSV);

  const moxfieldContainer = document.createElement("div");
  moxfieldContainer.className = "d-grid";
  moxfieldContainer.appendChild(moxfieldButton);
  kenricksToolsContent.appendChild(moxfieldContainer);

  devLog("Kenrick's Tools section created with export buttons");
};

// Initialize export functionality
export const initializeExport = (pageType: CardMarketPageType): void => {
  try {
    devLog("Initializing export functionality 1");
    createExportButtons();
    devLog("Export functionality initialization completed");
  } catch (error) {
    devError(
      error instanceof Error ? error : new Error(String(error)),
      "initializeExport"
    );
  }
};
