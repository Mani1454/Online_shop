-- =============================================================================
-- LOCALIZED GENERAL STORE DELIVERY PLATFORM
-- Database Schema for Supabase / PostgreSQL
-- =============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'shopkeeper', 'delivery_partner');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'RECEIVED',
        'PREPARING',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('COD', 'UPI');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- -----------------------------------------------------------------------------
-- 3. USERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role user_role NOT NULL DEFAULT 'customer',
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    fcm_token TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- -----------------------------------------------------------------------------
-- 4. ADDRESSES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(50) NOT NULL DEFAULT 'Home', -- 'Home', 'Shop', 'Work'
    street_address TEXT NOT NULL,
    landmark VARCHAR(150),
    pincode VARCHAR(10) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

-- -----------------------------------------------------------------------------
-- 5. CATEGORIES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'groceries', 'dairy', 'snacks'
    name VARCHAR(100) NOT NULL,
    name_localized VARCHAR(100), -- Hindi or regional language translation
    icon_name VARCHAR(50) NOT NULL,
    image_url TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_display ON categories(display_order) WHERE is_active = true;

-- -----------------------------------------------------------------------------
-- 6. PRODUCTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id VARCHAR(50) NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(200) NOT NULL,
    name_localized VARCHAR(200),
    description TEXT,
    unit VARCHAR(50) NOT NULL, -- e.g. '1 kg', '500 g', '1 L', 'Pack of 2'
    mrp NUMERIC(10, 2) NOT NULL, -- Maximum Retail Price
    selling_price NUMERIC(10, 2) NOT NULL, -- Actual selling price
    discount_percent INT GENERATED ALWAYS AS (
        CASE WHEN mrp > 0 THEN ROUND(((mrp - selling_price) / mrp) * 100) ELSE 0 END
    ) STORED,
    is_in_stock BOOLEAN NOT NULL DEFAULT true, -- 1-touch toggle for shopkeeper
    stock_quantity INT DEFAULT 100,
    image_url TEXT NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[], -- e.g. ['Daily Essential', 'Bestseller']
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(is_in_stock) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('english', name));

-- -----------------------------------------------------------------------------
-- 7. ORDERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(20) PRIMARY KEY, -- Friendly ID e.g. 'ORD-1001'
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    delivery_address JSONB NOT NULL, -- Snapshot of address at order time
    item_total NUMERIC(10, 2) NOT NULL,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    final_total NUMERIC(10, 2) NOT NULL,
    payment_method payment_method NOT NULL DEFAULT 'COD',
    payment_status payment_status NOT NULL DEFAULT 'PENDING',
    transaction_ref VARCHAR(100), -- UPI UTR / Transaction number
    status order_status NOT NULL DEFAULT 'RECEIVED',
    status_timeline JSONB NOT NULL DEFAULT '[]'::JSONB, -- [{status, timestamp, note}]
    shopkeeper_notes TEXT,
    delivery_partner JSONB, -- { name, phone }
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- -----------------------------------------------------------------------------
-- 8. ORDER_ITEMS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(20) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(200) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- -----------------------------------------------------------------------------
-- 9. STORE CONFIGURATION
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_config (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default_store',
    store_name VARCHAR(100) NOT NULL DEFAULT 'Apna Kirana & Daily Needs',
    is_store_open BOOLEAN NOT NULL DEFAULT true,
    min_order_free_delivery NUMERIC(10, 2) NOT NULL DEFAULT 150.00,
    standard_delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 20.00,
    delivery_radius_km NUMERIC(5, 2) NOT NULL DEFAULT 3.5,
    store_latitude DOUBLE PRECISION NOT NULL DEFAULT 28.6139,
    store_longitude DOUBLE PRECISION NOT NULL DEFAULT 77.2090,
    upi_vpa VARCHAR(100) NOT NULL DEFAULT 'shopkeeper@upi',
    contact_phone VARCHAR(20) NOT NULL DEFAULT '+919876543210',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SEED DATA: ESSENTIAL NEIGHBORHOOD CATEGORIES & PRODUCTS
-- =============================================================================

INSERT INTO store_config (id, store_name, is_store_open, min_order_free_delivery, standard_delivery_fee, upi_vpa, contact_phone)
VALUES ('default_store', 'Apna Kirana Store', true, 150.00, 20.00, 'apnakirana@okaxis', '+919876543210')
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, name_localized, icon_name, display_order) VALUES
('groceries', 'Atta, Rice & Dal', 'अनाज, आटा और दालें', 'wheat', 1),
('dairy', 'Milk, Curd & Bread', 'दूध, दही और ब्रेड', 'milk', 2),
('oils-masalas', 'Cooking Oil & Spices', 'तेल और मसाले', 'flame', 3),
('snacks', 'Snacks & Biscuits', 'नमकीन और बिस्कुट', 'cookie', 4),
('beverages', 'Tea, Coffee & Cold Drinks', 'चाय और कोल्ड ड्रिंक्स', 'coffee', 5),
('household', 'Cleaning & Detergents', 'सफाई और घरेलू सामान', 'spray-can', 6),
('personal-care', 'Soaps & Shampoos', 'साबुन और व्यक्तिगत देखभाल', 'heart-pulse', 7),
('instant-food', 'Maggi, Noodles & Sauces', 'मैगी और नूडल्स', 'utensils', 8)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, name_localized = EXCLUDED.name_localized;

INSERT INTO products (id, category_id, name, name_localized, description, unit, mrp, selling_price, is_in_stock, image_url, tags) VALUES
('11111111-1111-1111-1111-111111111001', 'groceries', 'Aashirvaad Shudh Chakki Atta', 'आशीर्वाद चक्की आटा', '100% whole wheat flour for soft rotis', '5 kg', 270.00, 245.00, true, 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80', ARRAY['Daily Essential', 'Bestseller']),
('11111111-1111-1111-1111-111111111002', 'groceries', 'India Gate Basmati Rice Feast Rozzana', 'इंडिया गेट बासमती चावल', 'Aromatic long grain basmati rice for daily meals', '1 kg', 125.00, 99.00, true, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80', ARRAY['Daily Essential']),
('11111111-1111-1111-1111-111111111003', 'groceries', 'Tata Sampann Unpolished Toor Dal', 'टाटा तूर दाल', 'Rich in protein, unpolished arhar dal', '1 kg', 190.00, 168.00, true, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', ARRAY['Daily Essential']),
('11111111-1111-1111-1111-111111111004', 'dairy', 'Amul Taaza Homogenised Toned Milk', 'अमुल ताज़ा दूध', 'Fresh toned pasteurized milk pouch', '500 ml', 27.00, 27.00, true, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80', ARRAY['Daily Essential', 'Bestseller']),
('11111111-1111-1111-1111-111111111005', 'dairy', 'Amul Salted Butter', 'अमुल मक्खन', 'Pure and delicious dairy butter', '100 g', 60.00, 56.00, true, 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80', ARRAY['Breakfast']),
('11111111-1111-1111-1111-111111111006', 'dairy', 'Harvest Gold White Sandwich Bread', 'ब्रेड', 'Soft and fresh morning bread', '400 g', 45.00, 42.00, true, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80', ARRAY['Breakfast']),
('11111111-1111-1111-1111-111111111007', 'oils-masalas', 'Fortune Sunlite Refined Sunflower Oil', 'रिफाइंड सूरजमुखी तेल', 'Healthy cooking oil enriched with vitamins', '1 L Pouch', 160.00, 138.00, true, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80', ARRAY['Cooking Essential']),
('11111111-1111-1111-1111-111111111008', 'instant-food', 'Maggi 2-Minute Masala Instant Noodles', 'मैगी मसाला नूडल्स', 'Classic family favorite masala instant noodles pack of 4', '280 g', 60.00, 54.00, true, 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&q=80', ARRAY['Bestseller', 'Snack']),
('11111111-1111-1111-1111-111111111009', 'beverages', 'Tata Tea Gold Leaf Tea', 'टाटा टी गोल्ड पत्ती चाय', 'Rich aroma and taste blend tea', '500 g', 320.00, 275.00, true, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80', ARRAY['Daily Essential']),
('11111111-1111-1111-1111-111111111010', 'household', 'Surf Excel Easy Wash Detergent Powder', 'सर्फ एक्सेल पाउडर', 'Removes tough stains easily in bucket wash', '1 kg', 145.00, 128.00, true, 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=400&q=80', ARRAY['Household Cleaners'])
ON CONFLICT (id) DO NOTHING;
