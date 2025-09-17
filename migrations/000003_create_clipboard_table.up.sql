-- Create clipboard table
CREATE TABLE IF NOT EXISTS clipboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on title for faster lookups
CREATE INDEX IF NOT EXISTS idx_clipboard_title ON clipboard(title);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_clipboard_updated_at 
    AFTER UPDATE ON clipboard
    FOR EACH ROW
BEGIN
    UPDATE clipboard SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;