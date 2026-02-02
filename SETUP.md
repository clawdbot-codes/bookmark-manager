# 🚀 Bookmark Manager - Setup Guide

Your bookmark manager is **production-ready** with complete authentication! Follow this guide to get it running.

## ✅ What's Included

### 🔐 **Complete Authentication System**
- **Email/Password** signup and login
- **Google OAuth** (optional)
- **GitHub OAuth** (optional)
- **Session management** with NextAuth.js
- **Route protection** and user isolation

### 📚 **Full Bookmark Management**
- **CRUD operations** with real-time updates
- **Smart search** and filtering system
- **Todo workflow** with review modes
- **Tag management** with color coding
- **Bulk operations** for efficient processing
- **Statistics dashboard** with productivity tracking

## 🛠️ Setup Instructions

### 1. **Install Dependencies**
```bash
cd bookmark-manager
npm install
```

### 2. **Database Setup**

#### Option A: **Vercel Postgres** (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login and link project
vercel login
vercel link

# Create database
vercel storage create postgres

# Copy connection string to .env.local
```

#### Option B: **Local PostgreSQL**
```bash
# Create database
createdb bookmarks

# Update .env.local with your connection
DATABASE_URL="postgresql://username:password@localhost:5432/bookmarks"
```

### 3. **Environment Variables**
Create `.env.local` file:

```bash
# Database
DATABASE_URL="your-database-url"

# NextAuth.js (required)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-min-32-characters-long"

# Optional OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"
```

### 4. **OAuth Setup (Optional)**

#### Google OAuth:
1. Go to [Google Console](https://console.cloud.google.com)
2. Create project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID
4. Add `http://localhost:3000/api/auth/callback/google` to redirect URIs

#### GitHub OAuth:
1. Go to [GitHub Settings](https://github.com/settings/developers)
2. New OAuth App
3. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

### 5. **Database Migration**
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Optional: View database
npx prisma studio
```

### 6. **Start Development**
```bash
npm run dev
# Visit http://localhost:3000
```

## 🎯 Usage Guide

### **First Time Setup**
1. **Visit homepage** → See landing page
2. **Click "Sign Up"** → Create account with email/password or OAuth
3. **Add bookmarks** → Start with the "Add Bookmark" button
4. **Try todo workflow** → Use the "Todo" page to review bookmarks

### **Core Workflows**

#### **Adding Bookmarks**
- Manual entry with URL, title, description
- Auto-tag with priority levels
- Automatic favicon and domain extraction

#### **Review Process**
1. **Todo Page** → See all unreviewed bookmarks
2. **Review Mode** → Focus on one bookmark at a time
3. **Quick Actions** → Mark reviewed, archive, or discard
4. **Bulk Operations** → Process multiple bookmarks

#### **Organization**
- **Search** → Find by title, description, URL, tags
- **Filter** → By status, priority, tags
- **Tags** → Color-coded organization system

## 🚀 Production Deployment

### **Vercel Deployment** (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Update NEXTAUTH_URL to your domain
```

### **Environment Variables for Production**
```bash
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-production-secret"
DATABASE_URL="your-production-database-url"
```

## 📊 Features Overview

### **Authentication**
- ✅ Multi-provider login (email + OAuth)
- ✅ Secure password hashing
- ✅ Session management
- ✅ Route protection
- ✅ User isolation

### **Bookmark Management**
- ✅ CRUD operations with validation
- ✅ Tag system with auto-creation
- ✅ Priority levels (HIGH/MEDIUM/LOW)
- ✅ Status workflow (TODO → REVIEWED → ARCHIVED/DISCARDED)
- ✅ Smart search and filtering
- ✅ Bulk operations

### **User Experience**
- ✅ Responsive design (mobile + desktop)
- ✅ Real-time statistics
- ✅ Loading states and error handling
- ✅ Professional UI with Tailwind CSS
- ✅ Review workflow optimization

## 🔧 Troubleshooting

### **Common Issues**

#### Database Connection
- Ensure DATABASE_URL is correct
- Check database is running
- Run `npx prisma db push` to sync schema

#### Authentication
- Verify NEXTAUTH_SECRET is set (32+ characters)
- Check NEXTAUTH_URL matches your domain
- OAuth: Verify callback URLs in provider settings

#### Development
- Clear browser cache/cookies if auth issues
- Check console for error messages
- Restart dev server after environment changes

## 🎉 You're Ready!

Your bookmark manager is now **fully functional** with:
- 🔐 **Secure authentication**
- 📚 **Complete bookmark management**
- 📝 **Todo workflow system**
- 📊 **Real-time analytics**
- 🎨 **Professional interface**

**Start bookmarking!** 🚀