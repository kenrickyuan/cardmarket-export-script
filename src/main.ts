// MKM Helper - Main Entry Point
// CardMarket helper userscript for Magic: The Gathering

import { devLog, devError, devTiming } from './dev/helpers';
import { CARDMARKET_SELECTORS, CARDMARKET_CSS_CLASSES } from './constants';
import { initializeExport } from './modules/export';
import type { CardMarketPageType } from './types/cardmarket';

// Initialize timing for development
const initTimer = devTiming('MKM Helper Initialization');

// Page detection
const currentUrl = window.location.href;
const pageType: CardMarketPageType = {
  isProductsOrCardsPage: currentUrl.includes('/Products') || currentUrl.includes('/Cards'),
  isWantsPage: currentUrl.includes('/Wants'),
  isCartPage: currentUrl.includes('/ShoppingCart'),
  isOffersSinglesPage: currentUrl.includes('Offers/Singles'),
  isProductsSinglesPage: currentUrl.includes('Products/Singles') || currentUrl.includes('/Cards'),
  isOrdersPage: currentUrl.includes('/Orders'),
  isSearchResultsPage: currentUrl.includes('/Search/Results'),
  isLoggedIn: !document.querySelector(CARDMARKET_SELECTORS.loginSignup)
};

devLog('Page detected', pageType);
devLog('Current URL', currentUrl);

// Main initialization function
const initializeMKMHelper = (): void => {
  try {
    devLog('Starting MKM Helper initialization...');
    
    // Add custom styles
    injectCustomStyles();
    
    // Initialize features based on page type
    if (pageType.isProductsOrCardsPage) {
      devLog('Initializing products/cards page features');
      initializeRestrictedCardsToggle();
    }
    
    if (pageType.isWantsPage) {
      devLog('Initializing wants page features');
      // TODO: Initialize wants page features
    }
    
    if (pageType.isOrdersPage) {
      devLog('Initializing orders page features');
      initializeExport(pageType);
    }
    
    if (pageType.isSearchResultsPage) {
      devLog('Initializing search results page features');
      // TODO: Initialize search navigation
    }
    
    // Initialize search icons for applicable pages
    if (pageType.isWantsPage || pageType.isCartPage || pageType.isOffersSinglesPage) {
      devLog('Initializing search icons');
      // TODO: Initialize search icons
    }
    
    devLog('MKM Helper initialization completed successfully');
    
  } catch (error) {
    devError(error instanceof Error ? error : new Error(String(error)), 'initializeMKMHelper');
  } finally {
    initTimer();
  }
};

// Inject custom CSS styles
const injectCustomStyles = (): void => {
  const style = document.createElement('style');
  style.innerHTML = `
    span#custom-tooltip {
      position: absolute;
      display: block;
      margin-left: 40px;
      padding: 5px 12px;
      background-color: #000000df;
      border-radius: 4px;
      color: #fff;
      visibility: hidden;
      opacity: 0;
      transition: visibility 0s 2s, opacity 2s ease-out;
      z-index: 10000;
    }

    span#custom-tooltip.${CARDMARKET_CSS_CLASSES.visible} {
      visibility: visible;
      opacity: 1;
      transition: visibility 0s, opacity 0s;
    }
  `;
  
  const head = document.head;
  if (head) {
    head.appendChild(style);
    devLog('Custom styles injected');
  } else {
    devError(new Error('Document head not found'), 'injectCustomStyles');
  }
};

// Initialize restricted cards toggle for products/cards pages
const initializeRestrictedCardsToggle = (): void => {
  if (!pageType.isProductsOrCardsPage) return;
  
  devLog('Setting up restricted cards toggle');
  
  // TODO: Implement restricted cards toggle functionality
  // This will replace the jQuery-based processProductsOrCardsPage function
  
  devLog('Restricted cards toggle setup completed');
};

// Clipboard utility function
const writeToClipboard = (contents: string): Promise<void> => {
  return navigator.clipboard.writeText(contents);
};

// Make writeToClipboard available globally for compatibility
(window as any).writeToClipboard = (contents: string, callback?: () => void): void => {
  writeToClipboard(contents).then(callback).catch((error) => {
    devError(error, 'writeToClipboard');
  });
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMKMHelper);
} else {
  // DOM is already ready
  initializeMKMHelper();
}

devLog('MKM Helper script loaded');