-- ================================================
-- Real-Time Chat Room Database Initialization
-- ================================================

-- Create database (run this manually if needed)
-- CREATE DATABASE chat_room_db;

-- ================================================
-- Users Table
-- ================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- Chat Room Configuration
-- ================================================

CREATE TABLE IF NOT EXISTS chat_room (
    id SERIAL PRIMARY KEY,
    password VARCHAR(255) NOT NULL DEFAULT 'unite-sovereign100lx',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- Chat Messages
-- ================================================

CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    emoji VARCHAR(10) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    reply_to_id INTEGER REFERENCES chat_messages(id),
    reply_to_message TEXT,
    reply_to_display_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- Message Reactions
-- ================================================

CREATE TABLE IF NOT EXISTS message_reactions (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id VARCHAR(100) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id, emoji)
);

-- ================================================
-- Indexes for Performance
-- ================================================

CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to_id ON chat_messages(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);

-- ================================================
-- Initial Data
-- ================================================

-- Insert default chat room if it doesn't exist
INSERT INTO chat_room (password, is_active) 
SELECT 'unite-sovereign100lx', true 
WHERE NOT EXISTS (SELECT 1 FROM chat_room WHERE id = 1);

-- ================================================
-- Sample Data (Optional - uncomment if needed)
-- ================================================

-- Insert sample users
-- INSERT INTO users (username) VALUES 
-- ('user1'),
-- ('user2'),
-- ('user3')
-- ON CONFLICT (username) DO NOTHING;

-- Insert sample messages
-- INSERT INTO chat_messages (emoji, display_name, user_id, message) VALUES
-- ('👋', 'Alice', 'user1', 'Hello everyone! Welcome to the chat room.'),
-- ('😊', 'Bob', 'user2', 'Hi Alice! Great to be here.'),
-- ('🚀', 'Charlie', 'user3', 'This chat system looks awesome!'),
-- ('❤️', 'Alice', 'user1', 'Thanks! Feel free to react to messages and try the reply feature.')
-- ON CONFLICT DO NOTHING;

-- Insert sample reactions
-- INSERT INTO message_reactions (message_id, user_id, emoji, display_name) VALUES
-- (1, 'user2', '👍', 'Bob'),
-- (1, 'user3', '❤️', 'Charlie'),
-- (2, 'user1', '😊', 'Alice'),
-- (3, 'user1', '🔥', 'Alice')
-- ON CONFLICT (message_id, user_id, emoji) DO NOTHING;

-- ================================================
-- Verification Queries
-- ================================================

-- Check if tables were created successfully
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'chat_room', 'chat_messages', 'message_reactions');

-- Check chat room configuration
SELECT * FROM chat_room;

-- Count records in each table
SELECT 
    'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 
    'chat_room' as table_name, COUNT(*) as record_count FROM chat_room
UNION ALL
SELECT 
    'chat_messages' as table_name, COUNT(*) as record_count FROM chat_messages
UNION ALL
SELECT 
    'message_reactions' as table_name, COUNT(*) as record_count FROM message_reactions;

-- ================================================
-- Clean Up (run only if needed)
-- ================================================

-- DROP TABLE IF EXISTS message_reactions;
-- DROP TABLE IF EXISTS chat_messages;
-- DROP TABLE IF EXISTS chat_room;
-- DROP TABLE IF EXISTS users;