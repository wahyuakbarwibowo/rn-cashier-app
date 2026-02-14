# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Aminmart Cashier** — A Point of Sale (POS) + PPOB app for small retail businesses built with React Native (Expo) and SQLite. Fully offline operation. UI in Indonesian.

### Key Features
- **Retail POS**: Barcode scanner, package/unit dual pricing, stock validation, receipt printing (58mm thermal)
- **Digital Services (PPOB)**: Pulsa, PLN, E-Wallet, BPJS, Transfer Bank, Game — with dynamic categories
- **Financial**: Profit & loss reports, expense tracking, receivables/payables with WhatsApp collection
- **Stock Management**: Low stock alerts, purchase entry, top products analytics
- **Customer & Supplier**: Master data, loyalty points, debt tracking with due dates
- **Reports**: Sales reports, digital reports, date range filters, interactive drill-down
- **Backup/Restore**: Full JSON export/import with transaction safety

## Development Commands

```bash
bun install          # Install dependencies
bun start            # Start dev server
bun android          # expo run:android
bun ios              # expo run:ios
bun web              # expo start --web
```

For EAS builds, use `eas build` with profiles in `eas.json` (development, preview, production).

## Architecture

### Code Structure

- `src/screens/` - 26 feature screens (see `.claude/docs/screens.md`)
- `src/database/` - 12 SQLite data layer files (see `.claude/docs/database.md`)
- `src/navigation/` - Drawer navigator config and route types
- `src/types/` - TypeScript interfaces (`database.ts`, `product.ts`, `purchase.ts`, `supplier.ts`)
- `App.tsx` - Root component with DB initialization
- `index.ts` - Entry point

### Database Layer

**Critical**: `initDB.ts` uses singleton pattern with Promise locking (prevents race conditions on Android). Always use `getDB()` to access the database instance. Schema migrations are inline via try/catch `ALTER TABLE`.

Full table reference in `.claude/docs/database.md`.

### State Management

No Redux/Context — all state is component-local `useState`. Database operations are direct async calls. Screens use `useFocusEffect` to reload data on focus.

### Navigation

Flat drawer navigation only (no nested stacks). All routes in `DrawerNavigator.tsx`. Hidden screens use `drawerItemStyle: { display: 'none' }`. Custom drawer content with memoized `MenuItem` and `SectionHeader` components.

### Key Business Logic

- **Package Pricing**: Dual unit/package pricing (`selling_price` vs `package_price`/`package_qty`). See `getPriceBreakdown()` in `SalesTransactionScreen.tsx`.
- **Auto-Receivables**: When payment < total, a receivable is auto-created (`sales.ts:addSale`).
- **Debt Payment Method**: Payment method containing "hutang" enables partial/zero payments creating receivables.
- **Stock Validation**: Prevents transactions when stock is insufficient, with visual warnings in cart.
- **Backdate Transactions**: Sales and digital transactions support custom date input.
- **Thermal Printing**: Optimized receipt layout for 58mm thermal bluetooth printers via `expo-print`.
- **Digital Categories**: Dynamic CRUD for digital service categories (PULSA, PLN, PDAM, VOUCHER, etc.).
- **Profit & Loss**: Integrated report combining sales revenue, COGS, expenses, and receivables/payables.

## Detailed Documentation

- `.claude/docs/screens.md` - All 26 screens organized by module with route names
- `.claude/docs/database.md` - All 12 database files and table schemas

## Skills

Custom skills available via slash commands:

- `/commit` - Create a git commit with Conventional Commits format
- `/pr` - Create a GitHub Pull Request from current branch to master

Skill definitions in `.claude/skills/`.

## Language

The app UI and user-facing text is in Indonesian. Code comments may also be in Indonesian.
