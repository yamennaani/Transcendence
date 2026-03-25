-- Create table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert test data
INSERT INTO users (name) VALUES 
    ('John Doe'),
    ('Jane Smith'),
    ('Bob Johnson'),
    ('Alice Williams'),
    ('Charlie Brown');

-- Verify data was inserted (optional - will show in logs)
SELECT COUNT(*) AS user_count FROM users;