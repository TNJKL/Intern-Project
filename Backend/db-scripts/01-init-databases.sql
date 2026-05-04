-- ============================================================
-- STEP 1: Create All Databases
-- This script runs first to create all required databases
-- ============================================================

-- Create databases for each service
CREATE DATABASE auth_db;
CREATE DATABASE product_db;
CREATE DATABASE order_db;
CREATE DATABASE payment_db;
CREATE DATABASE inventory_db;
CREATE DATABASE notification_db;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE auth_db TO CURRENT_USER;
GRANT ALL PRIVILEGES ON DATABASE product_db TO CURRENT USER;
GRANT ALL PRIVILEGES ON DATABASE order_db TO CURRENT USER;
GRANT ALL PRIVILEGES ON DATABASE payment_db TO CURRENT USER;
GRANT ALL PRIVILEGES ON DATABASE inventory_db TO CURRENT USER;
GRANT ALL PRIVILEGES ON DATABASE notification_db TO CURRENT USER;
