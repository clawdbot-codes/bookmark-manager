# 🤖 Telegram Bot Integration - Setup Guide

## 📋 Overview

This document contains the complete setup guide for the direct Telegram bot integration. The bot allows you to save bookmarks directly from Telegram without needing Clawdbot as an intermediary.

### Features Implemented

- ✅ **Auto-detect URLs** - Automatically creates bookmarks from any message containing URLs
- ✅ **`/bookmark` command** - Explicitly save bookmarks with optional descriptions
- ✅ **`/help` command** - Display usage instructions
- ✅ **`/stats` command** - Show bookmark statistics
- ✅ **AI-powered tagging** - Smart tags based on content and user context
- ✅ **Priority detection** - Automatic HIGH/MEDIUM/LOW priority assignment
- ✅ **Webhook-based** - Production-ready with proper error handling

### Architecture

- **Technology**: Raw Telegram Bot API (zero external dependencies)
- **Integration**: Webhooks (HTTPS required)
- **User Mapping**: All Telegram users → `DEFAULT_USER_ID` (single user)
- **Chat Support**: Private messages only (groups are rejected)

---

## 📦 What Was Implemented

### New Files Created

1. **[lib/telegram-types.ts](lib/telegram-types.ts)**
   - TypeScript type definitions for Telegram Bot API
   - Includes: `TelegramUpdate`, `TelegramMessage`, `TelegramUser`, etc.

2. **[lib/telegram-integration.ts](lib/telegram-integration.ts)**
   - Core utilities for Telegram integration
   - Functions:
     - `extractTelegramMessage()` - Parse webhook updates
     - `sendTelegramMessage()` - Send replies with retry logic
     - `handleTelegramCommand()` - Route commands
     - `generateBookmarkReply()` - Format bookmark confirmations
     - `validateWebhookSecret()` - Security validation

3. **[app/api/webhooks/telegram/route.ts](app/api/webhooks/telegram/route.ts)**
   - Main webhook handler
   - Receives messages from Telegram
   - Processes URLs and commands
   - Sends replies

4. **[app/api/telegram/set-webhook/route.ts](app/api/telegram/set-webhook/route.ts)**
   - Webhook management endpoint
   - **POST**: Register webhook with Telegram
   - **GET**: Check webhook status
   - **DELETE**: Remove webhook

### Files Modified

1. **[lib/api-auth.ts](lib/api-auth.ts)**
   - Added `TELEGRAM_BOT_TOKEN` constant
   - Updated `validateAuthentication()` to accept Telegram bot token
   - Updated `validateApiKey()` to accept Telegram bot token
   - Added `getTelegramBotToken()` helper function

2. **[.env](.env)**
   - Added `TELEGRAM_BOT_TOKEN` variable
   - Added `TELEGRAM_WEBHOOK_SECRET` variable

---

## 🚀 Setup Instructions

### Step 1: Create Your Telegram Bot

1. **Open Telegram** and search for **@BotFather**
2. **Send** `/newbot` command
3. **Follow the prompts**:
   - **Bot name**: e.g., "My Bookmark Manager" (display name)
   - **Bot username**: e.g., "mybookmark_bot" (must end in 'bot')
4. **Copy the API token** (format: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)
5. **Save this token** - you'll need it in the next step

Example conversation:
```
You: /newbot
BotFather: Alright, a new bot. How are we going to call it?
You: My Bookmark Manager
BotFather: Good. Now let's choose a username for your bot.
You: mybookmark_bot
BotFather: Done! Here's your token: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

---

### Step 2: Generate Webhook Secret

Generate a cryptographically secure secret for webhook validation:

```bash
openssl rand -hex 32
```

This will output something like:
```
a7f3e9c2b1d4f6a8e5c9d2f7b3a6e1c4d8f2a5b9c3e7d1f4a8b2c6e9d3f7a1b5
```

**Save this secret** - you'll need it in the next step.

---

### Step 3: Update Environment Variables

Edit your **[.env](.env)** file and replace the placeholder values:

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"  # From @BotFather
TELEGRAM_WEBHOOK_SECRET="a7f3e9c2b1d4f6a8e5c9d2f7b3a6e1c4d8f2a5b9c3e7d1f4a8b2c6e9d3f7a1b5"  # From Step 2

# Existing (should already be configured)
DEFAULT_USER_ID="anurg@yahoo.com"  # Or your actual user ID
NEXTAUTH_URL="https://bookmark-manager-beryl.vercel.app"  # Your production URL
```

**Important**: Make sure `DEFAULT_USER_ID` matches an actual user in your database. All Telegram bookmarks will be saved to this user account.

---

### Step 4: Deploy to Production

#### Option A: Deploy with Vercel (Recommended)

```bash
# 1. Commit your changes
git add .
git commit -m "✨ Add direct Telegram bot integration"
git push

# 2. Deploy to Vercel
vercel deploy --prod
```

#### Option B: Deploy with another provider

Ensure your deployment:
- Supports HTTPS (required by Telegram)
- Has environment variables configured
- Is publicly accessible

---

### Step 5: Configure Production Environment Variables

#### In Vercel Dashboard:

1. Go to your project → **Settings** → **Environment Variables**
2. Add the following variables:

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `TELEGRAM_BOT_TOKEN` | Your bot token from @BotFather | From Step 1 |
| `TELEGRAM_WEBHOOK_SECRET` | Your generated secret | From Step 2 |
| `DEFAULT_USER_ID` | Your user ID or email | Should already exist |
| `NEXTAUTH_URL` | Your production URL | Should already exist |

3. **Redeploy** after adding environment variables:
   ```bash
   vercel deploy --prod
   ```

#### For other hosting providers:

Set the same environment variables in your provider's dashboard or configuration file.

---

### Step 6: Register the Webhook

After deployment, register your webhook with Telegram:

```bash
curl -X POST https://bookmark-manager-beryl.vercel.app/api/telegram/set-webhook
```

**Expected response:**
```json
{
  "success": true,
  "message": "Webhook registered successfully",
  "webhook_url": "https://bookmark-manager-beryl.vercel.app/api/webhooks/telegram",
  "telegram_response": {
    "url": "https://bookmark-manager-beryl.vercel.app/api/webhooks/telegram",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "max_connections": 40
  }
}
```

**If you get an error:**
- Check that `TELEGRAM_BOT_TOKEN` is correctly set in environment variables
- Verify `NEXTAUTH_URL` points to your production domain
- Ensure your deployment is using HTTPS
- Check Vercel logs for any errors

---

### Step 7: Verify Webhook Status

Check that your webhook is properly configured:

```bash
curl https://bookmark-manager-beryl.vercel.app/api/telegram/set-webhook
```

**Expected response:**
```json
{
  "success": true,
  "webhook_info": {
    "url": "https://bookmark-manager-beryl.vercel.app/api/webhooks/telegram",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "last_error_date": null,
    "last_error_message": null,
    "max_connections": 40,
    "allowed_updates": ["message", "edited_message"]
  },
  "status": "configured",
  "is_active": true
}
```

**Status indicators:**
- `status: "configured"` - Webhook URL is set
- `is_active: true` - No pending updates (working properly)
- `pending_update_count: 0` - No backlog of messages

**If `is_active: false` or `pending_update_count > 0`:**
- There might be an error in your webhook handler
- Check Vercel logs: `vercel logs --follow`
- Check `last_error_message` for details

---

### Step 8: Test Your Bot!

#### 8.1 Start the Bot

1. Open Telegram
2. Search for your bot: `@your_bot_username`
3. Click **START** or send `/start`

You should receive:
```
🤖 Bookmark Manager Bot

Usage:
• Send any URL → Auto-create smart bookmark
• Add context for better AI tagging
• Multiple URLs = multiple bookmarks

Commands:
/help - Show this message
/stats - View your bookmark statistics
/bookmark <url> [description] - Save with description
...
```

#### 8.2 Test Auto-Detection

Send a URL:
```
https://github.com/facebook/react
```

Expected response:
```
✅ Created 1 bookmark!

📚 facebook/react: Declarative, efficient, and flexible JavaScript library
🏷️ #github #code #react #javascript
🔗 https://github.com/facebook/react

📱 Quick Links:
📚 View All Bookmarks
📋 Todo List

💡 Tip: Add context for better AI tagging!
```

#### 8.3 Test with Context

Send:
```
Important tutorial for work project https://react.dev/learn
```

Expected response:
```
✅ Created 1 bookmark!

📚 Learn React
🏷️ #react #tutorial #work #important #frontend
🔥 High Priority
📝 Important tutorial for work project
🔗 https://react.dev/learn
...
```

#### 8.4 Test Multiple URLs

Send:
```
Check these out:
https://tailwindcss.com
https://vercel.com
```

Expected response:
```
✅ Created 2 bookmarks!

1. 📚 Tailwind CSS
🏷️ #tailwindcss #css #frontend
...

2. 📚 Vercel
🏷️ #vercel #deployment #hosting
...
```

#### 8.5 Test Commands

**Help Command:**
```
/help
```

**Stats Command:**
```
/stats
```

Expected response:
```
📊 Your Bookmark Statistics

📚 Total Bookmarks: 25
✅ Reviewed: 15
📋 Todo: 10
🔥 High Priority: 3
🏷️ Total Tags: 12

View Full Dashboard →
```

**Bookmark Command:**
```
/bookmark https://example.com This is my description
```

---

## 🔍 Verification Checklist

After completing all setup steps, verify:

- [ ] Bot responds to `/start` command
- [ ] Bot auto-detects URLs and creates bookmarks
- [ ] Bookmarks appear in your webapp at `/bookmarks`
- [ ] Bookmarks are assigned to `DEFAULT_USER_ID` user
- [ ] Tags are generated based on URL and context
- [ ] Priority is set (HIGH for "important", etc.)
- [ ] `/help` command shows instructions
- [ ] `/stats` command shows correct statistics
- [ ] Multiple URLs in one message create multiple bookmarks
- [ ] Webhook status shows `is_active: true`

---

## 🔧 Local Testing (Optional)

For local development and testing:

### Step 1: Install ngrok or localtunnel

```bash
# Option A: ngrok (requires account)
brew install ngrok  # or download from ngrok.com
ngrok http 3000

# Option B: localtunnel (no account needed)
npx localtunnel --port 3000
```

### Step 2: Update .env.local

Create a **`.env.local`** file (don't commit this):

```bash
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_WEBHOOK_SECRET="your-webhook-secret"
NEXTAUTH_URL="https://your-tunnel-url.loca.lt"  # From ngrok/localtunnel
DEFAULT_USER_ID="your-user-id"
```

### Step 3: Start Development Server

```bash
npm run dev
```

### Step 4: Set Webhook to Local URL

```bash
curl -X POST http://localhost:3000/api/telegram/set-webhook
```

### Step 5: Test

Send messages to your bot and check the terminal for logs.

### Step 6: Reset Webhook for Production

When done testing locally:

```bash
# Delete local webhook
curl -X DELETE http://localhost:3000/api/telegram/set-webhook

# Set production webhook
curl -X POST https://bookmark-manager-beryl.vercel.app/api/telegram/set-webhook
```

---

## 🐛 Troubleshooting

### Issue 1: Webhook Not Receiving Messages

**Symptoms:**
- Bot doesn't respond to messages
- `pending_update_count > 0` in webhook info

**Solutions:**

1. **Check webhook URL:**
   ```bash
   curl https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo
   ```

   Verify `url` matches your production URL.

2. **Check webhook secret:**
   - Ensure `TELEGRAM_WEBHOOK_SECRET` is the same in:
     - Webhook registration (set-webhook endpoint)
     - Environment variables
     - Webhook handler validation

3. **Check HTTPS:**
   - Telegram requires HTTPS
   - Verify SSL certificate is valid
   - Test: `curl -I https://your-domain.com/api/webhooks/telegram`

4. **Reset webhook:**
   ```bash
   curl -X POST https://api.telegram.org/bot<YOUR_TOKEN>/deleteWebhook
   curl -X POST https://bookmark-manager-beryl.vercel.app/api/telegram/set-webhook
   ```

---

### Issue 2: 401 Unauthorized Errors

**Symptoms:**
- Webhook returns 401
- Logs show "Webhook secret validation failed"

**Solutions:**

1. **Regenerate webhook secret:**
   ```bash
   openssl rand -hex 32
   ```

2. **Update environment variable:**
   - In Vercel dashboard, update `TELEGRAM_WEBHOOK_SECRET`
   - Redeploy: `vercel deploy --prod`

3. **Reset webhook with new secret:**
   ```bash
   curl -X POST https://bookmark-manager-beryl.vercel.app/api/telegram/set-webhook
   ```

---

### Issue 3: Bookmarks Not Created

**Symptoms:**
- Bot responds but bookmarks don't appear in webapp
- Error message: "Failed to create bookmark"

**Solutions:**

1. **Verify DEFAULT_USER_ID exists:**
   ```bash
   # Open Prisma Studio
   npx prisma studio

   # Check Users table for matching ID or email
   ```

2. **Check Vercel logs:**
   ```bash
   vercel logs --follow
   ```

   Look for errors in `/api/clawdbot/bookmark-direct` endpoint.

3. **Test bookmark API directly:**
   ```bash
   curl -X POST https://bookmark-manager-beryl.vercel.app/api/clawdbot/bookmark-direct \
     -H "Content-Type: application/json" \
     -H "Authorization: your-telegram-bot-token" \
     -d '{
       "url": "https://example.com",
       "userId": "your-user-id",
       "source": "telegram"
     }'
   ```

4. **Check database connection:**
   - Verify `DATABASE_URL` in environment variables
   - Check Prisma connection in Vercel logs

---

### Issue 4: Bot Blocked or 403 Errors

**Symptoms:**
- Error: "Forbidden: bot was blocked by the user"
- Bot can't send messages

**Solutions:**

1. **User blocked the bot:**
   - User must unblock the bot in Telegram
   - User should send `/start` again

2. **Bot username changed:**
   - If you changed the bot username in @BotFather
   - Users need to find the bot with the new username

---

### Issue 5: Rate Limit Errors (429)

**Symptoms:**
- Error: "Too Many Requests: retry after X"
- Bot stops responding temporarily

**Solutions:**

1. **Wait for retry_after period:**
   - Telegram enforces rate limits (30 msg/sec per bot)
   - The bot automatically retries after the specified delay

2. **Reduce message frequency:**
   - Don't send too many URLs at once
   - Space out bookmark creation

3. **Check for loops:**
   - Ensure webhook isn't causing infinite loops
   - Check Vercel logs for repeated requests

---

### Issue 6: HTML Parsing Errors

**Symptoms:**
- Error: "Bad Request: can't parse entities"
- Message formatting broken

**Solutions:**

1. **Check for special characters:**
   - The bot escapes HTML characters automatically
   - If still failing, it falls back to plain text

2. **Update telegram-integration.ts:**
   - The `sendTelegramMessage()` function already handles this
   - It retries without parse_mode if HTML parsing fails

---

### Issue 7: Group Messages Not Working

**Symptoms:**
- Bot doesn't respond in groups
- Message: "Please send me a direct message"

**Solutions:**

This is **expected behavior**. The bot only works in private chats for security.

If you want to enable group support:
1. Edit `app/api/webhooks/telegram/route.ts`
2. Remove the chat type check:
   ```typescript
   // Remove or comment out:
   if (message.chatType !== 'private') {
     // ...
   }
   ```

**Warning:** Enabling group support may expose bookmarks to other group members.

---

## 📊 Monitoring & Logs

### View Logs in Vercel

```bash
# Real-time logs
vercel logs --follow

# Recent logs
vercel logs

# Filter by function
vercel logs --filter=/api/webhooks/telegram
```

### Check Webhook Health

```bash
# Get webhook info
curl https://bookmark-manager-beryl.vercel.app/api/telegram/set-webhook

# Check webhook endpoint
curl https://bookmark-manager-beryl.vercel.app/api/webhooks/telegram
```

### Monitor Database

```bash
# Open Prisma Studio
npx prisma studio

# Check recent bookmarks
# Look for: source = 'telegram'
```

---

## 🔐 Security Best Practices

1. **Never commit tokens to Git:**
   - `.env` should be in `.gitignore`
   - Use `.env.local` for local development
   - Use platform-specific env vars for production

2. **Rotate secrets periodically:**
   ```bash
   # Generate new webhook secret
   openssl rand -hex 32

   # Update in Vercel dashboard
   # Reset webhook
   ```

3. **Use allowlist for private bot:**
   - Add to `.env`:
     ```bash
     TELEGRAM_ALLOWED_CHAT_IDS="123456789,987654321"
     ```
   - Update webhook handler to check allowlist

4. **Monitor for unusual activity:**
   - Check Vercel logs regularly
   - Watch for failed authentication attempts
   - Monitor bookmark creation rate

5. **Keep dependencies updated:**
   ```bash
   npm audit
   npm update
   ```

---

## 📈 Usage Examples

### Example 1: Quick Save

```
User: https://stripe.com/docs/api
Bot: ✅ Created 1 bookmark!
     📚 Stripe API Reference
     🏷️ #stripe #api #documentation
```

### Example 2: Work Project

```
User: Important client docs for tomorrow https://docs.example.com
Bot: ✅ Created 1 bookmark!
     📚 Documentation
     🏷️ #documentation #work #important #client
     🔥 High Priority
```

### Example 3: Learning Resources

```
User: Read later https://react.dev/learn https://tailwindcss.com/docs
Bot: ✅ Created 2 bookmarks!

     1. 📚 Learn React
        🏷️ #react #learning #tutorial

     2. 📚 Tailwind CSS Documentation
        🏷️ #tailwindcss #css #documentation
```

### Example 4: Using Commands

```
User: /bookmark https://github.com/vercel/next.js Great framework to study
Bot: ✅ Created 1 bookmark!
     📚 vercel/next.js: The React Framework
     🏷️ #github #code #nextjs #react #framework
     📝 Great framework to study
```

---

## 🎯 What's Next?

### Optional Enhancements

1. **Add inline keyboards:**
   - Quick action buttons (View, Archive, Delete)
   - Requires modifying `sendTelegramMessage()` to support `reply_markup`

2. **Support inline queries:**
   - Search bookmarks from any chat: `@yourbot search term`
   - Requires handling `inline_query` updates

3. **Multi-user support:**
   - Map Telegram chat_id → user_id
   - Store mapping in database
   - Update webhook handler to use mapping

4. **Bulk operations:**
   - `/archive <bookmark-id>`
   - `/delete <bookmark-id>`
   - `/tag <bookmark-id> <tag>`

5. **Rich previews:**
   - Send bookmark cards with images
   - Use Telegram's native link preview

6. **Analytics:**
   - Track usage (messages/day, bookmarks created)
   - Popular domains
   - Tag frequency

---

## 📞 Support

If you encounter issues:

1. **Check this guide** - Most common issues are covered
2. **Check Vercel logs** - `vercel logs --follow`
3. **Verify webhook status** - `curl .../api/telegram/set-webhook`
4. **Test bookmark API** - Verify the underlying API works
5. **Check database** - Ensure user exists and bookmarks are created

---

## 📝 Technical Details

### Message Flow

```
Telegram User sends message
    ↓
Telegram servers send POST to /api/webhooks/telegram
    ↓
Validate x-telegram-bot-api-secret-token header
    ↓
Extract message data (chat_id, user_id, text)
    ↓
If message.chatType !== 'private' → Reject
    ↓
If text starts with '/' → handleTelegramCommand()
    ↓
Extract URLs with extractUrls()
    ↓
For each URL:
    POST /api/clawdbot/bookmark-direct
    (source: 'telegram', userId: DEFAULT_USER_ID)
    ↓
Generate reply with generateBookmarkReply()
    ↓
sendTelegramMessage(chatId, reply)
    ↓
Return 200 OK to Telegram
```

### Error Handling

- **Webhook secret invalid** → 401 Unauthorized
- **No message in update** → 200 OK (ignore)
- **Group message** → Send DM-only message
- **No URLs found** → Send help message
- **Bookmark API fails** → Collect errors, include in reply
- **Telegram API fails** → Retry with exponential backoff (429)
- **Bot blocked** → Log error, don't retry (403)
- **HTML parse error** → Retry without parse_mode

### Rate Limits

- **Telegram limit**: 30 messages/second per bot
- **Your usage**: ~1 message/10 seconds (typical)
- **Handling**: Automatic retry with `retry_after` from Telegram

### Security Layers

1. **Webhook secret** - Validates requests are from Telegram
2. **Bot token** - Used for internal API authentication
3. **HTTPS** - Required by Telegram for webhooks
4. **Chat type check** - Rejects group messages (optional)
5. **User allowlist** - Restrict to specific Telegram users (optional)

---

## ✅ Summary

You now have a fully functional Telegram bot that:

- ✅ Receives messages via webhooks (production-ready)
- ✅ Auto-detects URLs and creates bookmarks
- ✅ Supports commands (/help, /stats, /bookmark)
- ✅ Uses AI for smart tagging and priority detection
- ✅ Integrates with existing bookmark system
- ✅ Handles errors gracefully
- ✅ Works only in private chats for security
- ✅ Maps all users to DEFAULT_USER_ID

**Total implementation:**
- 4 new files (~800 lines)
- 2 modified files
- Zero new npm dependencies
- Production-ready with proper error handling

Enjoy your new Telegram bookmark bot! 🎉
