# 🚀 Setup Guide - Bookmark Manager

This guide will help you set up and run the Bookmark Manager project on your local machine.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Package manager (comes with Node.js)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download](https://git-scm.com/)

## 🔧 Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd bookmark-manager
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and update the following variables:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bookmarks"

# NextAuth.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here-min-32-chars"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"
```

**Note**: Generate a secure `NEXTAUTH_SECRET` using:
```bash
openssl rand -base64 32
```

### 4. Set Up PostgreSQL Database with Docker

#### Start PostgreSQL Container

The project includes a `docker-compose.yml` file for easy database setup.

**Option 1: Using Docker Compose (if available)**
```bash
docker compose up -d
```

**Option 2: Using Docker directly**
```bash
docker run -d \
  --name bookmark-manager-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=bookmarks \
  -p 5432:5432 \
  -v bookmark-manager-pgdata:/var/lib/postgresql/data \
  postgres:16-alpine
```

#### Verify Database is Running

```bash
docker ps
```

You should see the `bookmark-manager-db` container running.

### 5. Run Database Migrations

Apply the database schema:

```bash
npx prisma migrate dev
```

This will:
- Create all necessary tables
- Generate the Prisma Client
- Seed the database (if seed script exists)

### 6. Start the Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

## 🐳 Docker Commands Reference

### Database Management

| Command | Description |
|---------|-------------|
| `docker ps` | Check if database is running |
| `docker start bookmark-manager-db` | Start the database container |
| `docker stop bookmark-manager-db` | Stop the database container |
| `docker restart bookmark-manager-db` | Restart the database container |
| `docker logs bookmark-manager-db` | View database logs |
| `docker logs -f bookmark-manager-db` | Follow database logs (real-time) |
| `docker rm bookmark-manager-db` | Remove the container (stop first) |

### Database Connection

To connect to PostgreSQL directly:

```bash
docker exec -it bookmark-manager-db psql -U postgres -d bookmarks
```

Common PostgreSQL commands:
- `\l` - List all databases
- `\dt` - List all tables
- `\d table_name` - Describe table structure
- `\q` - Exit

## 🔄 Prisma Commands

### Database Schema Management

```bash
# Apply migrations
npx prisma migrate dev

# Deploy migrations (production)
npx prisma migrate deploy

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio (database GUI)
npx prisma studio
```

## 🛠️ Development Workflow

### Daily Development

1. **Start the database** (if not running):
   ```bash
   docker start bookmark-manager-db
   ```

2. **Start the dev server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** to http://localhost:3000

### After Pulling Changes

If there are new database migrations:

```bash
npx prisma migrate dev
```

### Before Pushing Changes

If you modified the Prisma schema:

```bash
npx prisma migrate dev --name describe_your_changes
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run tests with coverage
npm test:coverage
```

## 🏗️ Building for Production

```bash
# Create production build
npm run build

# Start production server
npm start
```

## 🐛 Troubleshooting

### Database Connection Issues

**Problem**: `Can't reach database server at localhost:5432`

**Solutions**:
1. Check if Docker is running:
   ```bash
   docker ps
   ```

2. Start the database container:
   ```bash
   docker start bookmark-manager-db
   ```

3. Check database logs for errors:
   ```bash
   docker logs bookmark-manager-db
   ```

### Port Already in Use

**Problem**: Port 3000 or 5432 is already in use

**Solutions**:
- For port 3000: Stop other Next.js apps or change the port
  ```bash
  npm run dev -- -p 3001
  ```

- For port 5432: Stop other PostgreSQL instances or change the port in `.env` and docker command

### Prisma Client Issues

**Problem**: Prisma Client is out of sync

**Solution**:
```bash
npx prisma generate
```

### Migration Issues

**Problem**: Migrations are out of sync

**Solution** (⚠️ Development only - deletes data):
```bash
npx prisma migrate reset
npx prisma migrate dev
```

## 📦 Project Structure

```
bookmark-manager/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── components/        # React components
│   └── ...
├── prisma/                # Database schema and migrations
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Migration files
├── public/                # Static files
├── docker-compose.yml     # Docker configuration
├── .env                   # Environment variables (create from .env.example)
├── next.config.js         # Next.js configuration
└── package.json           # Dependencies and scripts
```

## 🔐 Security Notes

- Never commit `.env` file to version control
- Use strong, unique passwords for production databases
- Rotate `NEXTAUTH_SECRET` regularly in production
- Use environment-specific `.env` files (.env.local, .env.production)

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 💡 Tips

1. **Use Prisma Studio** for visual database management:
   ```bash
   npx prisma studio
   ```

2. **Keep Docker Desktop running** for automatic container restart

3. **Use VS Code extensions**:
   - Prisma (syntax highlighting)
   - ESLint (code quality)
   - Prettier (code formatting)

4. **Database backups** (before major migrations):
   ```bash
   docker exec bookmark-manager-db pg_dump -U postgres bookmarks > backup.sql
   ```

5. **Restore from backup**:
   ```bash
   cat backup.sql | docker exec -i bookmark-manager-db psql -U postgres -d bookmarks
   ```

## 🆘 Getting Help

If you encounter issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review error messages carefully
3. Check Docker and database logs
4. Search existing issues in the repository
5. Create a new issue with detailed error information

---

**Happy coding! 🎉**
