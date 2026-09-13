-- =============================================================================
-- SUPABASE POSTGRESQL ROW LEVEL SECURITY (RLS) POLICIES
-- Localized General Store Delivery Platform ("Apna Kirana")
-- =============================================================================

-- Enable Row Level Security on all core tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 1. HELPER FUNCTIONS FOR ROLE-BASED ACCESS CONTROL
-- -----------------------------------------------------------------------------

-- Helper to check if current authenticated user has 'admin' or 'shopkeeper' role
-- Checks both Supabase auth JWT claims (app_metadata or user_metadata) AND the users table
CREATE OR REPLACE FUNCTION is_admin_or_shopkeeper()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check JWT claim
    IF (auth.jwt() ->> 'role' IN ('admin', 'shopkeeper') OR
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'shopkeeper') OR
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'shopkeeper')) THEN
        RETURN TRUE;
    END IF;

    -- Check users table fallback
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role IN ('shopkeeper')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 2. USERS TABLE POLICIES
-- -----------------------------------------------------------------------------
-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read their own profile" ON users;
DROP POLICY IF EXISTS "Admin can read all user profiles" ON users;
DROP POLICY IF EXISTS "Users can insert/update their own profile" ON users;

-- Customer can read their own user profile
CREATE POLICY "Users can read their own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- Admin/Shopkeeper can read all customer profiles
CREATE POLICY "Admin can read all user profiles"
    ON users FOR SELECT
    USING (is_admin_or_shopkeeper());

-- Users can insert their own profile upon signup
CREATE POLICY "Users can insert their own profile"
    ON users FOR INSERT
    WITH CHECK (
        auth.uid() = id AND
        (role = 'customer' OR is_admin_or_shopkeeper())
    );

-- Users can update their own phone, name, or saved addresses (cannot self-escalate role)
CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        (role = (SELECT role FROM users WHERE id = auth.uid()) OR is_admin_or_shopkeeper())
    );

-- -----------------------------------------------------------------------------
-- 3. PRODUCTS TABLE POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public/Customer can read active products" ON products;
DROP POLICY IF EXISTS "Admin can perform full CRUD on products" ON products;

-- Public / Authenticated Customer Read: Anyone logged in can browse products
CREATE POLICY "Public/Customer can read active products"
    ON products FOR SELECT
    USING (auth.role() = 'authenticated');

-- Admin / Shopkeeper Full CRUD: Quick stock toggles, price updates, new products
CREATE POLICY "Admin can perform full CRUD on products"
    ON products FOR ALL
    USING (is_admin_or_shopkeeper())
    WITH CHECK (is_admin_or_shopkeeper());

-- -----------------------------------------------------------------------------
-- 4. STORE_CONFIG TABLE POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can read store configuration" ON store_config;
DROP POLICY IF EXISTS "Admin can update store configuration" ON store_config;

-- Any authenticated customer can check if store is open and delivery thresholds
CREATE POLICY "Authenticated users can read store configuration"
    ON store_config FOR SELECT
    USING (auth.role() = 'authenticated');

-- Only Shopkeeper / Admin can toggle is_store_open or change delivery fees
CREATE POLICY "Admin can update store configuration"
    ON store_config FOR ALL
    USING (is_admin_or_shopkeeper())
    WITH CHECK (is_admin_or_shopkeeper());

-- -----------------------------------------------------------------------------
-- 5. ORDERS TABLE POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Customers can view their own orders" ON orders;
DROP POLICY IF EXISTS "Admin can view all orders" ON orders;
DROP POLICY IF EXISTS "Customers can insert orders" ON orders;
DROP POLICY IF EXISTS "Admin can update order status and fulfillment" ON orders;

-- Customer Read: Customers can view only orders where customer_id matches their auth.uid
CREATE POLICY "Customers can view their own orders"
    ON orders FOR SELECT
    USING (auth.uid() = customer_id);

-- Admin Read: Shopkeepers can view all orders across all statuses for live board & history
CREATE POLICY "Admin can view all orders"
    ON orders FOR SELECT
    USING (is_admin_or_shopkeeper());

-- Customer Insert: Customer can place an order matching their own auth.uid
-- Enforces that initial status must be 'RECEIVED'
CREATE POLICY "Customers can insert orders"
    ON orders FOR INSERT
    WITH CHECK (
        auth.uid() = customer_id AND
        status = 'RECEIVED' AND
        final_total > 0
    );

-- Customer CANNOT update or delete orders after placement!
-- Only Admin / Shopkeeper can update order status (e.g. RECEIVED -> PREPARING -> OUT_FOR_DELIVERY -> DELIVERED)
CREATE POLICY "Admin can update order status and fulfillment"
    ON orders FOR UPDATE
    USING (is_admin_or_shopkeeper())
    WITH CHECK (is_admin_or_shopkeeper());

-- Admin only delete/archive
CREATE POLICY "Admin can delete orders"
    ON orders FOR DELETE
    USING (is_admin_or_shopkeeper());

-- -----------------------------------------------------------------------------
-- 6. REALTIME SUBSCRIPTION CONFIGURATION
-- -----------------------------------------------------------------------------
-- Enable PostgreSQL Replication for Supabase Realtime WebSocket feed
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE store_config;
