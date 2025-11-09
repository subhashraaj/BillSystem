-- Stock Craft Billing Database Schema
-- Create database
CREATE DATABASE IF NOT EXISTS stock_craft_billing;
USE stock_craft_billing;

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile_number VARCHAR(15),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    gst_number VARCHAR(20),
    balance DECIMAL(10, 2) DEFAULT 0.00,
    opening_balance DECIMAL(10, 2) DEFAULT 0.00,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Raw Materials table
CREATE TABLE IF NOT EXISTS raw_materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    current_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL,
    min_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
    price_per_unit DECIMAL(10, 2) NOT NULL,
    supplier VARCHAR(255),
    status ENUM('Adequate', 'Low', 'Critical') DEFAULT 'Adequate',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Items/Products table
CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    gram DECIMAL(10, 2) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(100),
    current_stock INT NOT NULL DEFAULT 0,
    price DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(10, 2),
    status ENUM('In Stock', 'Low Stock', 'Critical', 'Out of Stock') DEFAULT 'In Stock',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Manufacturing table
CREATE TABLE IF NOT EXISTS manufacturing (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    quantity_manufactured INT NOT NULL,
    batch_number VARCHAR(100),
    staff_name VARCHAR(255),
    manufacturing_date DATE NOT NULL,
    manufacturing_time TIME NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Bill of Materials (BOM): items to raw materials mapping
CREATE TABLE IF NOT EXISTS item_bom (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    raw_material_id INT NOT NULL,
    quantity_per_unit DECIMAL(12,4) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE CASCADE,
    UNIQUE KEY unique_bom (item_id, raw_material_id)
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id INT NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    status ENUM('Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled') DEFAULT 'Draft',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Invoice Items table (for line items in invoices)
CREATE TABLE IF NOT EXISTS invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_number VARCHAR(100) UNIQUE NOT NULL,
    invoice_id INT NOT NULL,
    customer_id INT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('Cash', 'Bank Transfer', 'Credit Card', 'Check', 'Other') NOT NULL,
    status ENUM('Pending', 'Completed', 'Failed', 'Refunded') DEFAULT 'Pending',
    reference_number VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Migration: Add gram_required column to existing items table (run this if table already exists)
-- ALTER TABLE items ADD COLUMN IF NOT EXISTS gram_required DECIMAL(10, 2) DEFAULT 0 AFTER name;

-- Update existing customers table to add new fields (run this if table already exists)
ALTER TABLE customers 
MODIFY COLUMN email VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(15) AFTER phone,
ADD COLUMN IF NOT EXISTS city VARCHAR(100) AFTER address,
ADD COLUMN IF NOT EXISTS state VARCHAR(100) AFTER city,
ADD COLUMN IF NOT EXISTS country VARCHAR(100) AFTER state,
ADD COLUMN IF NOT EXISTS gst_number VARCHAR(20) AFTER country,
ADD COLUMN IF NOT EXISTS opening_balance DECIMAL(10, 2) DEFAULT 0.00 AFTER balance;

-- Attempt to drop unique index on email if it exists (name assumed as 'email')
-- Note: If this fails because the index name differs, manually drop the unique index.
DROP INDEX email ON customers;

-- Insert sample data
-- INSERT INTO customers (name, email, phone, mobile_number, city, state, country, gst_number, balance, opening_balance, status) VALUES
-- ('ABC Corporation', 'contact@abc.com', '+1234567890', '+91-9876543210', 'Mumbai', 'Maharashtra', 'India', '27AABCU9603R1ZX', 2450.00, 2000.00, 'Active'),
-- ('XYZ Limited', 'info@xyz.com', '+1234567891', '+91-9876543211', 'Delhi', 'Delhi', 'India', '07AABCU9603R1ZY', 890.00, 1000.00, 'Active'),
-- ('Tech Solutions Inc', 'hello@tech.com', '+1234567892', '+91-9876543212', 'Bangalore', 'Karnataka', 'India', '29AABCU9603R1ZZ', 0.00, 500.00, 'Active'),
-- ('Global Traders', 'sales@global.com', '+1234567893', '+91-9876543213', 'Chennai', 'Tamil Nadu', 'India', '33AABCU9603R1ZA', 1200.00, 1500.00, 'Inactive');

-- INSERT INTO raw_materials (name, current_stock, unit, min_stock, price_per_unit, supplier, status) VALUES
-- ('Steel Sheets', 150.00, 'kg', 50.00, 5.00, 'Metal Corp', 'Adequate'),
-- ('Aluminum Rods', 80.00, 'pcs', 30.00, 12.00, 'Aluminum Co', 'Adequate'),
-- ('Copper Wire', 220.00, 'm', 40.00, 8.00, 'Wire Industries', 'Adequate'),
-- ('Plastic Pellets', 15.00, 'kg', 50.00, 3.00, 'Poly Supplies', 'Critical');

-- INSERT INTO items (name, sku, category, current_stock, price, cost, status) VALUES
-- ('Steel Frame A1', 'SF-A1-001', 'Frames', 45, 120.00, 80.00, 'In Stock'),
-- ('Aluminum Door D2', 'AD-D2-002', 'Doors', 12, 89.00, 60.00, 'Low Stock'),
-- ('Copper Fitting CF3', 'CF-CF3-003', 'Fittings', 5, 45.00, 30.00, 'Critical'),
-- ('Steel Bracket SB4', 'SB-SB4-004', 'Brackets', 78, 25.00, 15.00, 'In Stock');

-- INSERT INTO manufacturing (item_id, quantity_manufactured, batch_number, staff_name, manufacturing_date, manufacturing_time) VALUES
-- (1, 10, 'BT-001', 'John Doe', '2025-01-15', '10:30:00'),
-- (2, 5, 'BT-002', 'Jane Smith', '2025-01-15', '14:15:00'),
-- (3, 15, 'BT-003', 'Mike Johnson', '2025-01-15', '16:45:00');

-- INSERT INTO invoices (invoice_number, customer_id, invoice_date, due_date, subtotal, tax_amount, total_amount, status) VALUES
-- ('INV-001', 1, '2024-01-15', '2024-02-15', 2450.00, 245.00, 2695.00, 'Paid'),
-- ('INV-002', 2, '2024-01-14', '2024-02-14', 1890.00, 189.00, 2079.00, 'Pending'),
-- ('INV-003', 3, '2024-01-13', '2024-02-13', 3200.00, 320.00, 3520.00, 'Paid'),
-- ('INV-004', 4, '2024-01-12', '2024-02-12', 950.00, 95.00, 1045.00, 'Overdue');

-- INSERT INTO invoice_items (invoice_id, item_id, quantity, unit_price, total_price) VALUES
-- (1, 1, 5, 120.00, 600.00),
-- (1, 2, 3, 89.00, 267.00),
-- (2, 1, 2, 120.00, 240.00),
-- (2, 3, 1, 45.00, 45.00),
-- (3, 1, 8, 120.00, 960.00),
-- (3, 2, 4, 89.00, 356.00),
-- (4, 3, 2, 45.00, 90.00);

-- INSERT INTO payments (payment_number, invoice_id, customer_id, payment_date, amount, payment_method, status, reference_number) VALUES
-- ('PAY-001', 1, 1, '2024-01-15', 2695.00, 'Bank Transfer', 'Completed', 'TXN123456'),
-- ('PAY-002', 2, 2, '2024-01-14', 2079.00, 'Cash', 'Pending', 'CASH001'),
-- ('PAY-003', 3, 3, '2024-01-13', 3520.00, 'Credit Card', 'Completed', 'CC789012');

