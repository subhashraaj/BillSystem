USE stock_craft_billing;

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE payments;
TRUNCATE TABLE invoice_items;
TRUNCATE TABLE invoices;
TRUNCATE TABLE manufacturing;
TRUNCATE TABLE items;
TRUNCATE TABLE raw_materials;
TRUNCATE TABLE customers;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
