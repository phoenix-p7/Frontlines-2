# Local Development Setup Guide

This comprehensive guide provides step-by-step instructions for setting up the Real-Time Chat Room application in your local development environment.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** (v12 or higher)
3. **npm** or **yarn**

## Database Setup

### Option 1: Using Local PostgreSQL

1. **Install PostgreSQL** (if not already installed):
   ```bash
   # macOS (using Homebrew)
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   
   # Windows - Download from https://www.postgresql.org/download/windows/
   ```

2. **Create a database**:
   ```bash
   # Connect to PostgreSQL as superuser
   sudo -u postgres psql
   
   # Or on macOS/Windows:
   psql -U postgres
   
   # Create database and user
   CREATE DATABASE chat_app;
   CREATE USER chat_user WITH ENCRYPTED PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE chat_app TO chat_user;
   \q
   ```

3. **Set up environment variables**:
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env and set your DATABASE_URL
   DATABASE_URL=postgresql://chat_user:your_password@localhost:5432/chat_app
   ```

### Option 2: Using Docker (Alternative)

1. **Run PostgreSQL in Docker**:
   ```bash
   docker run --name chat-postgres \
     -e POSTGRES_DB=chat_app \
     -e POSTGRES_USER=chat_user \
     -e POSTGRES_PASSWORD=your_password \
     -p 5432:5432 \
     -d postgres:15
   ```

2. **Set up environment variables**:
   ```bash
   DATABASE_URL=postgresql://chat_user:your_password@localhost:5432/chat_app
   ```

## Running the Application

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Push database schema**:
   ```bash
   npm run db:push
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:5000`

## Database Configuration Details

The application automatically detects whether you're using:

- **Neon Database** (Replit environment): Uses serverless connection with WebSocket support
- **Local PostgreSQL**: Uses traditional node-postgres driver with connection pooling

### Connection Detection

The app detects Neon databases by checking if the `DATABASE_URL` contains:
- `neon.tech`
- `neon.db` 
- `@ep-` (Neon endpoint pattern)

### Local Database Features

When using local PostgreSQL, the app configures:
- **Connection pooling**: Max 20 connections
- **SSL**: Disabled (typical for local development)
- **Timeouts**: 30s idle timeout, 2s connection timeout
- **Health checks**: Automatic connection monitoring

## Troubleshooting

### Common Issues

1. **Connection refused**:
   - Ensure PostgreSQL is running: `sudo systemctl status postgresql`
   - Check if port 5432 is available: `netstat -an | grep 5432`

2. **Authentication failed**:
   - Verify username and password in DATABASE_URL
   - Check PostgreSQL user permissions

3. **Database does not exist**:
   - Create the database: `createdb chat_app`
   - Or use the SQL commands above

4. **Permission denied**:
   - Grant proper permissions: `GRANT ALL PRIVILEGES ON DATABASE chat_app TO chat_user;`

### Testing Connection

You can test your database connection:

```bash
# Using psql
psql "postgresql://chat_user:your_password@localhost:5432/chat_app"

# Using node (create test.js)
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://chat_user:your_password@localhost:5432/chat_app'
});
pool.query('SELECT NOW()', (err, res) => {
  console.log(err ? err : 'Connected successfully!');
  pool.end();
});
"
```

## Production Deployment

For production deployment on other platforms:

1. **Set up PostgreSQL** on your hosting provider
2. **Update DATABASE_URL** with production credentials
3. **Run migrations**: `npm run db:push`
4. **Build and start**: `npm run build && npm start`

The application will automatically detect the database type and configure appropriately.