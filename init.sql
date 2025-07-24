-- Database initialization script for Scentra Vending Machine
-- This script will be executed when the PostgreSQL container starts

\c scentra_vending;

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create initial admin user (you can customize this)
-- Note: The actual tables will be created by Drizzle migrations

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE scentra_vending TO scentra;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO scentra;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO scentra;