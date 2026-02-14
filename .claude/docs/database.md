# Database Reference

SQLite via `expo-sqlite`, fully offline. Singleton pattern with Promise locking in `initDB.ts`.

## Database Files

| File | Description |
|------|-------------|
| `initDB.ts` | DB initialization, singleton `getDB()`, schema migrations via `ALTER TABLE` try/catch |
| `products.ts` | Product CRUD with dual pricing (unit/package) |
| `customers.ts` | Customer CRUD |
| `sales.ts` | Sales transactions, auto-creates receivables when payment < total |
| `purchases.ts` | Purchase orders and purchase items |
| `payment_methods.ts` | Payment method management |
| `suppliers.ts` | Supplier/vendor CRUD |
| `expenses.ts` | Operational expense tracking with categories |
| `digital_products.ts` | Digital product master data and categories |
| `pulsa.ts` | Digital/pulsa transaction processing |
| `backup.ts` | Full JSON export/import with transaction safety |
| `settings.ts` | Shop profile and app configuration |

## Tables

### Core Retail
- `products` - Product inventory (name, barcode, stock, selling_price, purchase_price, package_price, package_qty, min_stock)
- `customers` - Customer data
- `payment_methods` - Payment options (cash, transfer, hutang, etc.)
- `sales` - Sale transactions (date, customer, payment_method, total, payment, change)
- `sales_items` - Line items per sale
- `purchases` - Stock purchase records
- `purchase_items` - Line items per purchase

### Digital Services
- `digital_categories` - Dynamic categories (PULSA, PLN, E-WALLET, BPJS, etc.)
- `digital_product_master` - Product templates per category & provider
- `phone_history` - Digital transaction log

### Financial
- `receivables` - Customer debts (auto-created from underpayment or "hutang" payment method)
- `payables` - Supplier debts with due dates
- `expenses` - Operational expenses (rent, utilities, salary)

### Settings
- `shop_profile` - Shop name, address, cashier name, printer config
