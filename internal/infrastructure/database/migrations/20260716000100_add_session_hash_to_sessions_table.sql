-- +goose Up
ALTER TABLE sessions ADD COLUMN session_hash VARCHAR(255) NOT NULL DEFAULT '';

-- +goose Down
ALTER TABLE sessions DROP COLUMN session_hash;
