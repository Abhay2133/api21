-- Create clipboard table
CREATE TABLE IF NOT EXISTS clipboard (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on title for faster lookups
CREATE INDEX IF NOT EXISTS idx_clipboard_title ON clipboard(title);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_clipboard_updated_at ON clipboard;
CREATE TRIGGER update_clipboard_updated_at
    BEFORE UPDATE ON clipboard
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();