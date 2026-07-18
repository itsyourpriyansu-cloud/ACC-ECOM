import * as migration_20260711_171557_initial_schema from './20260711_171557_initial_schema';
import * as migration_20260712_044726_add_catalogue_sku_and_stock_visuals from './20260712_044726_add_catalogue_sku_and_stock_visuals';
import * as migration_20260712_050000_ensure_catalogue_schema from './20260712_050000_ensure_catalogue_schema';
import * as migration_20260712_060000_add_phonepe_transactions from './20260712_060000_add_phonepe_transactions';
import * as migration_20260712_061000_add_phonepe_shipping_snapshot from './20260712_061000_add_phonepe_shipping_snapshot';
import * as migration_20260712_062000_add_shiprocket_fulfillment_fields from './20260712_062000_add_shiprocket_fulfillment_fields';
import * as migration_20260712_063000_add_customer_identity_and_wishlists from './20260712_063000_add_customer_identity_and_wishlists';
import * as migration_20260712_064000_add_wishlist_lock_relation from './20260712_064000_add_wishlist_lock_relation';

export const migrations = [
  {
    up: migration_20260711_171557_initial_schema.up,
    down: migration_20260711_171557_initial_schema.down,
    name: '20260711_171557_initial_schema',
  },
  {
    up: migration_20260712_044726_add_catalogue_sku_and_stock_visuals.up,
    down: migration_20260712_044726_add_catalogue_sku_and_stock_visuals.down,
    name: '20260712_044726_add_catalogue_sku_and_stock_visuals'
  },
  {
    up: migration_20260712_050000_ensure_catalogue_schema.up,
    down: migration_20260712_050000_ensure_catalogue_schema.down,
    name: '20260712_050000_ensure_catalogue_schema'
  },
  {
    up: migration_20260712_060000_add_phonepe_transactions.up,
    down: migration_20260712_060000_add_phonepe_transactions.down,
    name: '20260712_060000_add_phonepe_transactions'
  },
  {
    up: migration_20260712_061000_add_phonepe_shipping_snapshot.up,
    down: migration_20260712_061000_add_phonepe_shipping_snapshot.down,
    name: '20260712_061000_add_phonepe_shipping_snapshot'
  },
  {
    up: migration_20260712_062000_add_shiprocket_fulfillment_fields.up,
    down: migration_20260712_062000_add_shiprocket_fulfillment_fields.down,
    name: '20260712_062000_add_shiprocket_fulfillment_fields'
  },
  {
    up: migration_20260712_063000_add_customer_identity_and_wishlists.up,
    down: migration_20260712_063000_add_customer_identity_and_wishlists.down,
    name: '20260712_063000_add_customer_identity_and_wishlists'
  },
  {
    up: migration_20260712_064000_add_wishlist_lock_relation.up,
    down: migration_20260712_064000_add_wishlist_lock_relation.down,
    name: '20260712_064000_add_wishlist_lock_relation'
  },
];
