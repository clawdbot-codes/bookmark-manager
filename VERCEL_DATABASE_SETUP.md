# 🗄️ Database Setup for Vercel Deployment

## Quick Database Options (Choose One):

### **Option A: Neon PostgreSQL (Recommended - Free Tier)**
1. Go to: https://neon.tech
2. Sign up with GitHub/Google
3. Create new project → "bookmark-manager"
4. Copy the connection string
5. Format: `postgresql://user:password@host/database?sslmode=require`

### **Option B: Supabase PostgreSQL (Free Tier)**
1. Go to: https://supabase.com
2. Sign up → Create new project
3. Go to Settings → Database → Connection string
4. Copy the postgres connection string

### **Option C: PlanetScale MySQL (Free Tier)**
1. Go to: https://planetscale.com
2. Create account → New database
3. Get connection string for Prisma

### **Option D: Railway PostgreSQL (Simple Setup)**
1. Go to: https://railway.app
2. Connect GitHub → Deploy PostgreSQL
3. Copy connection string from variables

## 🔄 After Getting Database URL:

```bash
# Set your new DATABASE_URL
export DATABASE_URL="your-cloud-database-url-here"

# Run migrations
npx prisma migrate deploy

# Generate client
npx prisma generate
```

## 🧪 Test Database Connection:
```bash
npx prisma db seed  # Optional: add test data
```