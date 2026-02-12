# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Point of Sale (POS) cashier app for small businesses built with React Native (Expo) and SQLite. The app is designed for fully offline operation.

## Development Commands

```bash
# Install dependencies (uses bun)
bun install

# Start development server
bun start

# Run on platforms
bun android        # expo run:android
bun ios            # expo run:ios
bun web            # expo start --web
```

For EAS builds, use the standard `eas build` commands with profiles defined in `eas.json` (development, preview, production).

## Architecture

### Code Structure

- `src/database/` - SQLite data layer with CRUD operations
- `src/screens/` - Feature screens (14 total)
- `src/navigation/` - Drawer navigator config and types
- `src/types/` - TypeScript interfaces
- `App.tsx` - Root component with DB initialization
- `index.ts` - Entry point

### Database Layer (`src/database/`)

**Critical**: `initDB.ts` implements singleton pattern with Promise locking to prevent race conditions on Android. Always use `getDB()` to access the database instance.

Tables: products, customers, payment_methods, sales, sales_items, purchases, purchase_items, receivables, payables, phone_history, shop_profile

Schema migrations are handled inline via try/catch `ALTER TABLE` calls in `initDB.ts`.

### State Management

No Redux/Context - all state is component-local with `useState`. Database operations are direct async calls:

```typescript
const [products, setProducts] = useState<Product[]>([]);
useEffect(() => { loadProducts(); }, []);
const loadProducts = async () => setProducts(await getProducts());
```

Screens use `useFocusEffect` to reload data when navigating back.

### Navigation

Flat drawer navigation only (no nested stacks). All routes defined in `DrawerNavigator.tsx`. Hidden screens (SaleDetail, ProductDetail) are drawer items with `drawerItemStyle: { display: 'none' }`.

### Key Business Logic

- **Package Pricing**: Products support dual unit/package pricing (`selling_price` vs `package_price`/`package_qty`). See `getPriceBreakdown()` in `SalesTransactionScreen.tsx`.
- **Auto-Receivables**: When payment < total, a receivable is automatically created (`sales.ts:addSale`).
- **Debt Payment Method**: Payment method containing "hutang" enables partial/zero payments creating receivables.
- **Backup/Restore**: Full JSON export/import with transaction safety (`backup.ts`).

### Type Definitions

Core types in `src/types/database.ts`: Product, Customer, PaymentMethod, ShopProfile, Sale, SaleItem.

Extended types in `src/types/product.ts` and `src/types/purchase.ts`.

## Language

The app UI and user-facing text is in Indonesian. Code comments may also be in Indonesian.
