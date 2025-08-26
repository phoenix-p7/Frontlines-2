import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function initializeDatabase() {
  try {
    console.log('Initializing database tables...');
    
    // Create chat_room table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS chat_room (
        id SERIAL PRIMARY KEY,
        password VARCHAR(255) NOT NULL DEFAULT 'unite-sovereign100lx',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create chat_messages table
    await db.execute(sql`
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
    `);
    
    // Create message_reactions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS message_reactions (
        id SERIAL PRIMARY KEY,
        message_id INTEGER NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
        user_id VARCHAR(100) NOT NULL,
        emoji VARCHAR(10) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(message_id, user_id, emoji)
      );
    `);
    
    // Create users table (for completeness)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Insert default chat room if it doesn't exist
    await db.execute(sql`
      INSERT INTO chat_room (password, is_active) 
      SELECT 'unite-sovereign100lx', true 
      WHERE NOT EXISTS (SELECT 1 FROM chat_room WHERE id = 1);
    `);
    
    console.log('✅ Database tables initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();