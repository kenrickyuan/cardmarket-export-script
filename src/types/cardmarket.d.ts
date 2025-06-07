// CardMarket-specific type definitions for Magic: The Gathering

export interface CardData {
  name: string;
  expansionName: string;
  condition: number;
  language: number;
  amount: number;
  price: number;
  number?: string;
  foil?: boolean;
}

export interface CardMarketArticleElement extends HTMLElement {
  dataset: {
    name: string;
    'expansion-name': string;
    condition: string;
    language: string;
    amount: string;
    price: string;
    number?: string;
  };
}

export interface CardMarketPageType {
  isProductsOrCardsPage: boolean;
  isWantsPage: boolean;
  isCartPage: boolean;
  isOffersSinglesPage: boolean;
  isProductsSinglesPage: boolean;
  isOrdersPage: boolean;
  isSearchResultsPage: boolean;
  isLoggedIn: boolean;
}

export interface MoxfieldExportData {
  Count: number;
  Name: string;
  Edition: string;
  Condition: string;
  Language: string;
  Foil: string;
  'Collector Number': string;
  Alter: string;
  'Playtest Card': string;
  'Purchase Price': string;
}

export interface ExportConfig {
  headers: string[];
  filename: string;
  format: 'csv' | 'text';
}