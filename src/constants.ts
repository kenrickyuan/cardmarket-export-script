// Application constants and configuration

export const SEARCH_PERIOD = 59; // "2 months" in days

// CardMarket-specific DOM selectors
export const CARDMARKET_SELECTORS = {
  // Buttons and controls
  toggleHideShowRestricted: '#toggleHideShowRestricted',
  loginSignup: '#login-signup',
  loadMoreButton: '#loadMoreButton',
  
  // Tables and lists
  articleTable: 'table[id^=ArticleTable]',
  articleTableRows: 'table[id^=ArticleTable]>tbody tr',
  wantsListTable: '#WantsListTable',
  wantsListTableRows: '#WantsListTable tbody tr[role="row"]',
  
  // Articles and products
  articleRows: 'div.article-row',
  restrictedArticles: 'div.article-row:has(a.btn-grey)',
  
  // Export and pagination
  collapsibleExport: '#collapsibleExport',
  collapsibleMemo: '#collapsibleMemo',
  searchPaginationControls: 'section .pagination',
  
  // Navigation
  contentSection: 'section',
  pageTitle: '.page-title-container h1'
} as const;

// CardMarket-specific CSS classes
export const CARDMARKET_CSS_CLASSES = {
  fontIconSearch: 'fonticon-search',
  fontIconCalendar: 'fonticon-calendar',
  fontIconChevronLeft: 'fonticon-chevron-left',
  fontIconChevronRight: 'fonticon-chevron-right',
  btnGrey: 'btn-grey',
  btnOutlinePrimary: 'btn-outline-primary',
  customTooltip: 'custom-tooltip',
  visible: 'visible'
} as const;

export const REGEX_PATTERNS = {
  cardNameClean: /^([^(]*).*/
} as const;

export const MOXFIELD_CONDITIONS = {
  1: 'M',   // Mint
  2: 'NM',  // Near Mint
  3: 'NM',  // Near Mint (treating both 2 and 3 as NM)
  4: 'LP',  // Good (Lightly Played) -> Lightly Played
  5: 'MP',  // Played -> Moderately Played
  6: 'HP',  // Heavily Played
  7: 'D'    // Poor -> Damaged
} as const;

export const MOXFIELD_LANGUAGES = {
  1: 'en',   // English
  2: 'fr',   // French
  3: 'de',   // German
  4: 'es',   // Spanish
  5: 'it',   // Italian
  6: 'zhs',  // Simplified Chinese
  7: 'ja',   // Japanese
  8: 'pt',   // Portuguese
  9: 'ru',   // Russian
  10: 'ko',  // Korean
  11: 'zht'  // Traditional Chinese
} as const;

export const SHIPMENT_STATUS = {
  PAST: 200 // Status that doesn't include in-cart items
} as const;