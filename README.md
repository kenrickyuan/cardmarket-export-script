# MKM Helper

A TypeScript userscript for CardMarket Magic: The Gathering that adds useful UI modifications and export functionality.

## Features

- Hide/show restricted cards on product pages
- Export orders to Moxfield CSV format
- Search icons for quick order history checks
- Enhanced navigation for search results
- Wants list management with clipboard export

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm
- Tampermonkey browser extension

### Quick Start

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd mkmscript
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```
   This starts a server on `http://localhost:3000` with hot reload.

3. **Install development userscript**
   - Open Tampermonkey Dashboard
   - Create new script
   - Copy contents from `tampermonkey/mkm-helper-dev.user.js`
   - Save the script

4. **Test on CardMarket**
   - Navigate to any Magic page on cardmarket.com
   - Open browser console (F12)
   - Look for initialization messages starting with `🔧 MKM Helper DEV:`

### Development Workflow

- **Edit TypeScript files** in `src/` directory
- **Save changes** - Rollup automatically rebuilds
- **Refresh CardMarket page** - See changes instantly
- **Check console** for development logs and errors

> **Cache Busting**: If you don't see changes after refresh, the browser may be caching the script. Add a version parameter to force reload: `http://localhost:3000/?v=123` (increment the number for each test)

### Build Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build production userscript |
| `npm run build:dev` | Build development version once |
| `npm run type-check` | Run TypeScript type checking |

### Project Structure

```
src/
├── main.ts              # Entry point
├── constants.ts         # CardMarket selectors and mappings
├── types/
│   └── cardmarket.d.ts  # Type definitions
└── dev/
    └── helpers.ts       # Development utilities

tampermonkey/
├── mkm-helper-dev.user.js    # Development userscript
└── userscript-header.txt     # Production script header

build/
├── rollup.config.dev.js      # Development build config
└── rollup.config.prod.js     # Production build config
```

### Production Build

```bash
npm run build
```

The production userscript will be generated at `dist/mkm-helper.user.js` with all dependencies bundled.

## Contributing

1. Make changes in TypeScript files
2. Test using development workflow
3. Ensure `npm run type-check` passes
4. Build production version to verify
5. Commit changes with conventional commit messages