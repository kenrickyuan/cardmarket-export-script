// MKM Helper Development Build
// Auto-reloaded from http://localhost:3000
// Build time: 2025-06-07T10:41:17.330Z
console.log('🔥 MKM Helper (DEV) loaded');
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
(function () {
    'use strict';

    // Development helpers and utilities
    const devLog = (message, data) => {
        {
            console.log(`🔧 MKM Helper DEV: ${message}`, data || '');
        }
    };
    const devError = (error, context) => {
        {
            const errorMessage = error instanceof Error ? error.message : error;
            const errorStack = error instanceof Error ? error.stack : '';
            console.error(`🚨 MKM Helper DEV Error${context ? ` (${context})` : ''}:`, {
                message: errorMessage,
                stack: errorStack
            });
        }
    };
    const devTiming = (label) => {
        {
            const start = performance.now();
            console.time(`⏱️ ${label}`);
            return () => {
                const end = performance.now();
                console.timeEnd(`⏱️ ${label}`);
                console.log(`📊 ${label} took ${(end - start).toFixed(2)}ms`);
            };
        }
    };

    // Application constants and configuration
    // CardMarket-specific DOM selectors
    const CARDMARKET_SELECTORS = {
        loginSignup: '#login-signup'};
    // CardMarket-specific CSS classes
    const CARDMARKET_CSS_CLASSES = {
        visible: 'visible'
    };

    // MKM Helper - Main Entry Point
    // CardMarket helper userscript for Magic: The Gathering
    // Initialize timing for development
    const initTimer = devTiming('MKM Helper Initialization');
    // Page detection
    const currentUrl = window.location.href;
    const pageType = {
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
    const initializeMKMHelper = () => {
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
                // TODO: Initialize export functionality
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
        }
        catch (error) {
            devError(error instanceof Error ? error : new Error(String(error)), 'initializeMKMHelper');
        }
        finally {
            initTimer();
        }
    };
    // Inject custom CSS styles
    const injectCustomStyles = () => {
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
        }
        else {
            devError(new Error('Document head not found'), 'injectCustomStyles');
        }
    };
    // Initialize restricted cards toggle for products/cards pages
    const initializeRestrictedCardsToggle = () => {
        if (!pageType.isProductsOrCardsPage)
            return;
        devLog('Setting up restricted cards toggle');
        // TODO: Implement restricted cards toggle functionality
        // This will replace the jQuery-based processProductsOrCardsPage function
        devLog('Restricted cards toggle setup completed');
    };
    // Clipboard utility function
    const writeToClipboard = (contents) => {
        return navigator.clipboard.writeText(contents);
    };
    // Make writeToClipboard available globally for compatibility
    window.writeToClipboard = (contents, callback) => {
        writeToClipboard(contents).then(callback).catch((error) => {
            devError(error, 'writeToClipboard');
        });
    };
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMKMHelper);
    }
    else {
        // DOM is already ready
        initializeMKMHelper();
    }
    devLog('MKM Helper script loaded');

})();
//# sourceMappingURL=script.js.map
