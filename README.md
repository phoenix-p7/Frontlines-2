# Real-Time Chat Room Application

A purposeful real-time group chat web application designed for accountability-based conversations. Features emoji-based identity, password-protected access, and instant messaging with WebSocket communication.

![Chat Application](./attached_assets/Screenshot%202025-06-29%20174046_1751199917776.png)

## Features

- 🚀 **Real-time messaging** with WebSocket communication
- 😀 **Emoji-based user identity** - no registration required
- 🔒 **Password-protected chat rooms** for focused conversations
- 💬 **WhatsApp-style message interface** with user differentiation
- ⌨️ **Live typing indicators** with animated dots
- 📱 **Mobile-responsive design** optimized for all devices
- 🔄 **Message reply functionality** for threaded conversations
- 😊 **Message reactions** (up to 2 per user per message)
- 🌙 **Dark/light theme** support with consistent styling
- 📊 **Message history** persisted in PostgreSQL database
- 👆 **Touch gestures** - swipe to reply, double-tap to react

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** + shadcn/ui components
- **Wouter** for lightweight routing
- **TanStack Query** for server state management
- **Vite** for fast development and builds

### Backend
- **Node.js** with Express.js
- **WebSocket** for real-time communication
- **Drizzle ORM** with PostgreSQL
- **Session-based authentication**

### Database
- **PostgreSQL** (supports both Neon serverless and local)
- **Automatic database type detection**
- **Connection pooling** for optimal performance

## Prompt to replace files on Replit

Step 1: 
```
A clean React + Vite project setup ready for existing website development integration
A clean React project setup using Vite as the build tool, configured and ready for development to allow uploading existing project files and continuing development on an already developed website.
No major work to setup, No user interface, simple "Hello, World!" message
Just ONE single empty blank page 
```

Step 2:
```
We are going to work on the actual project now

I have uploaded the project files in the Replit environment and deleted or replace all the previous initial files of this app
So there will be everything, only related to the main website chat project

Please Do not connect to local database 
We are going to connect it with neon datavase, you can check the connection string in the project files 
Please check all of the project files thoroughly first and tell me if there is any problem.

```

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher) - for local development
- npm or yarn

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd chat-app
   npm install
   ```

2. **Database Setup** - Choose one option:

   #### Option A: Local PostgreSQL
   ```bash
   # Install PostgreSQL
   # macOS: brew install postgresql && brew services start postgresql
   # Ubuntu: sudo apt install postgresql postgresql-contrib
   # Windows: Download from postgresql.org
   
   # Create database
   sudo -u postgres psql
   CREATE DATABASE chat_app;
   CREATE USER chat_user WITH ENCRYPTED PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE chat_app TO chat_user;
   \q
   
   # Set environment variable
   echo "DATABASE_URL=postgresql://chat_user:your_password@localhost:5432/chat_app" > .env
   ```

   #### Option B: Docker PostgreSQL
   ```bash
   # Run PostgreSQL in Docker
   docker run --name chat-postgres \
     -e POSTGRES_DB=chat_app \
     -e POSTGRES_USER=chat_user \
     -e POSTGRES_PASSWORD=your_password \
     -p 5432:5432 \
     -d postgres:15
   
   # Set environment variable
   echo "DATABASE_URL=postgresql://chat_user:your_password@localhost:5432/chat_app" > .env
   ```

3. **Initialize database schema**:
   ```bash
   npm run db:push
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to `http://localhost:5000`

## Environment Configuration

The application automatically detects your database type:

- **Neon Database** (Replit/Cloud): Uses serverless connection
- **Local PostgreSQL**: Uses node-postgres with connection pooling

### Environment Variables

Create a `.env` file (use `.env.example` as template):

```bash
# Database (required)
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Environment
NODE_ENV=development
```

## Scripts

```bash
# Development
npm run dev          # Start development server
npm run check        # TypeScript type checking

# Database
npm run db:push      # Push schema changes to database

# Production
npm run build        # Build for production
npm run start        # Start production server
```

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── ChatScreen.tsx
│   │   │   ├── JoinScreen.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── ui/        # shadcn/ui components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and configurations
│   │   ├── pages/         # Page components
│   │   └── main.tsx       # React entry point
│   └── index.html
├── server/                # Backend Express application
│   ├── db.ts             # Database configuration
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes and WebSocket
│   ├── storage.ts        # Data access layer
│   └── vite.ts           # Vite development integration
├── shared/
│   └── schema.ts         # Database schema and types
├── .env.example          # Environment template
├── LOCAL_SETUP.md        # Detailed setup guide
└── package.json
```

## Database Schema

### Tables

#### chat_messages
```sql
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  emoji VARCHAR(10) NOT NULL,
  displayName VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  userId VARCHAR(100) NOT NULL,
  replyToId INTEGER REFERENCES chat_messages(id),
  replyToMessage TEXT,
  replyToDisplayName VARCHAR(100),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### chat_room
```sql
CREATE TABLE chat_room (
  id SERIAL PRIMARY KEY,
  password VARCHAR(255) NOT NULL DEFAULT 'unite-sovereign100lx',
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  displayName VARCHAR(100) NOT NULL,
  emoji VARCHAR(10) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### message_reactions
```sql
CREATE TABLE message_reactions (
  id SERIAL PRIMARY KEY,
  messageId INTEGER NOT NULL REFERENCES chat_messages(id),
  userId VARCHAR(100) NOT NULL,
  emoji VARCHAR(10) NOT NULL,
  displayName VARCHAR(100) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(messageId, userId, emoji)
);
```

### Key Features

- **Message replies**: Thread-like conversations with reply tracking
- **Message reactions**: Users can react to messages with emojis (max 2 per user per message)
- **Typing indicators**: Real-time user activity broadcasting
- **User sessions**: No registration required, session-based identification
- **Password protection**: Secure room access with configurable passwords
- **Theme support**: Dark/light mode with consistent styling
- **Mobile gestures**: Swipe-to-reply and double-tap-to-react functionality

## API Endpoints

### REST API
- `POST /api/join` - Join chat room with credentials
- `GET /api/messages` - Fetch message history

### WebSocket Events
- `messages_history` - Initial message load
- `new_message` - Real-time message broadcast
- `user_typing` - Typing indicator updates
- `reaction_added` - Message reaction updates
- `reaction_removed` - Message reaction removal

## Deployment

### Development (Replit)
The app runs automatically on Replit with Neon database integration.

### Production
1. Set up PostgreSQL database
2. Configure `DATABASE_URL` environment variable
3. Build and deploy:
   ```bash
   npm run build
   npm run start
   ```

## Default Configuration

- **Room Password**: `unite-sovereign100lx`
- **Server Port**: `5000`
- **WebSocket**: Integrated with HTTP server
- **Database**: Auto-detected based on connection string
- **Max Reactions**: 2 per user per message

## Troubleshooting

### Common Issues

1. **Database connection failed**:
   - Verify PostgreSQL is running
   - Check DATABASE_URL format
   - Ensure database exists

2. **Port 5000 in use**:
   - Kill existing processes: `lsof -ti:5000 | xargs kill -9`

3. **WebSocket connection issues**:
   - Check firewall settings
   - Verify server is running on correct port

### Testing Database Connection

```bash
# Test PostgreSQL connection
psql "postgresql://chat_user:your_password@localhost:5432/chat_app"

# Test with Node.js
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://chat_user:your_password@localhost:5432/chat_app'
});
pool.query('SELECT NOW()', (err, res) => {
  console.log(err ? err : 'Database connected successfully!');
  pool.end();
});
"
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For detailed setup instructions, see [LOCAL_SETUP.md](./LOCAL_SETUP.md)

---

**Live Demo**: Experience the chat application with real-time messaging, emoji identities, and purposeful conversations.

---

## 🔧 Admin Panel Configuration

### Changing the Admin URL

**Current Admin URL:** `/command-panel-44xa`

To change the admin panel URL for security:

1. **Open:** `client/src/App.tsx`
2. **Find this line:**
   ```tsx
   <Route path="/command-panel-44xa" component={AdminPage} />
   ```
3. **Change the path** to your preferred URL:
   ```tsx
   <Route path="/your-new-admin-url" component={AdminPage} />
   ```
4. **Redeploy** your application

### Security Recommendation
- Use a random, hard-to-guess URL for better security
- Avoid common names like `/admin`, `/dashboard`, `/control`
- Use combinations like `/panel-xyz123`, `/control-abc456`

### Access Information
- **Chat Room URL:** `/` (homepage)
- **Admin Panel URL:** `/command-panel-44xa`
- **Passwords:** Set via environment variables (`CHAT_PASSWORD` and `ADMIN_PASSWORD`)