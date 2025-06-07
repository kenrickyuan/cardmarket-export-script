# Refactoring Plan: jQuery to Native DOM APIs

## Overview
This document outlines the comprehensive plan to refactor the MKM Helper userscript from jQuery dependency to native DOM APIs with modern JavaScript patterns.

## Current State Analysis
- **jQuery Usage**: 45 instances of `_j$()` throughout the script
- **Main Patterns**: Element selection, event handling, DOM manipulation, data attributes, iteration
- **Dependencies**: Currently requires `window.jQuery` to be available on CardMarket pages

## Refactoring Strategy

### 1. Element Selection Strategy
- **From**: `_j$()` selectors
- **To**: Native DOM API methods
  - `_j$("#id")` → `document.getElementById("id")`
  - `_j$(".class")` → `document.querySelector(".class")`
  - `_j$("selector")` → `document.querySelectorAll("selector")`
- **Complex Selectors**: Replace `:has()` pseudo-selectors with explicit descendant queries or manual checks

### 2. Event Handling Modernization
- **From**: `.on("event", callback)`
- **To**: `addEventListener("event", callback)`
- **Improvements**:
  - Use event delegation for dynamically added elements
  - Replace inline event handlers in HTML strings with proper event listeners
  - Better memory management with proper event cleanup

### 3. DOM Manipulation Refactor
| jQuery Method | Native DOM API |
|---------------|----------------|
| `.prepend(html)` | `insertAdjacentHTML('afterbegin', html)` |
| `.append(html)` | `insertAdjacentHTML('beforeend', html)` |
| `.css(styles)` | `Object.assign(element.style, styles)` |
| `.html()` | `innerHTML` property |
| `.text()` | `textContent` property |
| `.hide()` | `element.style.display = 'none'` |
| `.show()` | `element.style.display = ''` |

### 4. Data Attributes Handling
- **From**: `.data()` methods
- **To**: Native `dataset` API
  - `.data(key, value)` → `element.dataset[key] = value`
  - `.data(key)` → `element.dataset[key]`
  - Custom data checking with `key in element.dataset`

### 5. Element Iteration & Collection Handling
- **From**: `.each(callback)`
- **To**: Modern iteration patterns
  - `NodeList.forEach(callback)`
  - `Array.from(nodeList).map/filter/reduce()`
  - Spread operator for NodeList conversion: `[...nodeList]`

### 6. CSS Class & Style Management
- **From**: jQuery style methods
- **To**: Native APIs
  - `classList.add()`, `classList.remove()`, `classList.toggle()`
  - Direct `style` property manipulation
  - CSS custom properties for dynamic styling

### 7. Complex Selector Replacements
- **`:has()` selectors**: Replace with descendant selectors or `contains()` checks
- **Attribute selectors**: Use `getAttribute()` or `dataset` API
- **Multiple selections**: Proper `querySelectorAll()` iteration

### 8. Structure Reorganization
- Remove jQuery dependency check (`window.jQuery`)
- Organize code into logical modules/functions
- Use modern ES6+ features consistently
- Implement proper error handling without jQuery fallbacks

### 9. Performance Optimizations
- **DOM Query Caching**: Store frequently accessed elements
- **Batch Operations**: Use `DocumentFragment` for multiple insertions
- **Efficient Selectors**: More specific and performant queries
- **Reduced Queries**: Store element references instead of re-querying

### 10. Specific Function Refactoring Areas

#### High Priority Functions:
1. **`processShowHideRestrictedClick()`**
   - Element selection and style manipulation
   - Button state management

2. **`processAddSearchIcon()`**
   - Element iteration and DOM insertion
   - Data attribute handling

3. **Export Functions**
   - Form data collection
   - CSV generation and download

4. **Button Creation Functions**
   - Dynamic element creation
   - Event listener attachment

#### Medium Priority Functions:
- `processNewNodes()` (already uses MutationObserver)
- Navigation and search functions
- Utility functions

### 11. Modern JavaScript Patterns

#### Code Style Improvements:
- Use `const`/`let` instead of `var`
- Template literals for HTML string construction
- Arrow functions where appropriate
- Destructuring for cleaner code
- Modern array methods (`map`, `filter`, `reduce`)

#### Example Transformations:
```javascript
// Before (jQuery)
_j$("#toggleHideShowRestricted").on("click", () => {
  processShowHideRestrictedClick();
});

// After (Native)
document.getElementById("toggleHideShowRestricted")
  .addEventListener("click", () => {
    processShowHideRestrictedClick();
  });
```

```javascript
// Before (jQuery)
_j$("div.article-row:has(a.btn-grey)").hide();

// After (Native)
document.querySelectorAll("div.article-row")
  .forEach(row => {
    if (row.querySelector("a.btn-grey")) {
      row.style.display = "none";
    }
  });
```

## Expected Benefits

### Performance Improvements
- **Faster Execution**: Direct DOM API calls without jQuery overhead
- **Smaller Memory Footprint**: No jQuery library dependency
- **Better Browser Optimization**: Native APIs are optimized by browser engines

### Code Quality
- **Modern Standards**: ES6+ features and web standards
- **Better Maintainability**: More explicit and readable code
- **Improved Debugging**: Direct API usage is easier to debug
- **Future-proof**: Uses web standards rather than library abstractions

### Compatibility
- **Reduced Dependencies**: No reliance on external libraries
- **Better Compatibility**: Native APIs have broader browser support
- **Easier Updates**: No concerns about jQuery version compatibility

## Implementation Plan

### Phase 1: Foundation
1. Remove jQuery dependency check
2. Implement basic DOM helper patterns
3. Refactor simple selectors and basic DOM manipulation

### Phase 2: Core Functionality
1. Refactor event handling system
2. Update complex DOM manipulation functions
3. Modernize data attribute handling

### Phase 3: Advanced Features
1. Refactor export functionality
2. Update dynamic content generation
3. Optimize performance-critical sections

### Phase 4: Polish & Testing
1. Code cleanup and optimization
2. Error handling improvements
3. Comprehensive testing across CardMarket pages
4. Documentation updates

## Testing Strategy
- Test on various CardMarket pages (Products, Orders, Wants, etc.)
- Verify all interactive features work correctly
- Performance testing compared to jQuery version
- Cross-browser compatibility testing
- Memory leak testing for event listeners

## Risk Mitigation
- Incremental refactoring to maintain functionality
- Comprehensive testing at each phase
- Fallback strategies for edge cases
- Documentation of breaking changes