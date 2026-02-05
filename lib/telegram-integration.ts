// Telegram Bot Integration Utilities

import {
  TelegramUpdate,
  TelegramMessage,
  ParsedTelegramMessage,
  TelegramApiResponse,
} from './telegram-types';

/**
 * Extract and parse message data from Telegram update
 */
export function extractTelegramMessage(update: TelegramUpdate): ParsedTelegramMessage | null {
  const message = update.message || update.edited_message;

  if (!message?.text || !message.from) {
    return null;
  }

  return {
    updateId: update.update_id,
    messageId: message.message_id,
    chatId: message.chat.id,
    userId: message.from.id,
    username: message.from.username,
    firstName: message.from.first_name,
    text: message.text,
    timestamp: message.date,
    chatType: message.chat.type,
    entities: message.entities,
  };
}

/**
 * Send a message to a Telegram chat with retry logic and error handling
 */
export async function sendTelegramMessage(
  chatId: number,
  text: string,
  parseMode: 'HTML' | 'Markdown' | null = 'HTML',
  retries = 3
): Promise<void> {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  if (!BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN not configured');
    throw new Error('Bot token not configured');
  }

  // Truncate if too long (Telegram limit: 4096 characters)
  let messageText = text;
  if (messageText.length > 4096) {
    messageText = messageText.substring(0, 4090) + '...';
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: messageText,
            parse_mode: parseMode,
            disable_web_page_preview: false,
          }),
        }
      );

      const result: TelegramApiResponse = await response.json();

      if (result.ok) {
        return; // Success!
      }

      // Handle specific error codes
      if (result.error_code === 429) {
        // Rate limit - wait and retry
        const retryAfter = result.parameters?.retry_after || 5;
        console.log(`Rate limited. Retrying after ${retryAfter} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }

      if (result.error_code === 403) {
        // Bot was blocked by user
        console.error(`Bot blocked by user ${chatId}`);
        return; // Don't retry
      }

      if (result.error_code === 400 && result.description?.includes('Bad Request: can\'t parse entities')) {
        // HTML parsing failed, retry without parse mode
        if (parseMode !== null) {
          console.warn('HTML parsing failed, retrying without parse mode');
          return await sendTelegramMessage(chatId, text, null, 1);
        }
      }

      // Other errors
      throw new Error(result.description || 'Unknown Telegram API error');

    } catch (error) {
      console.error(`Telegram send error (attempt ${attempt + 1}/${retries}):`, error);

      if (attempt === retries - 1) {
        // Final retry failed
        throw error;
      }

      // Exponential backoff
      const backoffMs = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
}

/**
 * Handle bot commands (/help, /stats, /bookmark, etc.)
 */
export async function handleTelegramCommand(message: ParsedTelegramMessage): Promise<string> {
  const parts = message.text.trim().split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  switch (command) {
    case '/start':
    case '/help':
      return getHelpMessage();

    case '/stats':
      return await getStatsMessage(message.userId);

    case '/bookmark':
      return handleBookmarkCommand(args);

    default:
      return '❓ Unknown command. Send /help for available commands.';
  }
}

/**
 * Generate help message
 */
function getHelpMessage(): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://bookmark-manager-beryl.vercel.app';

  return `🤖 <b>Bookmark Manager Bot</b>

<b>Usage:</b>
• Send any URL → Auto-create smart bookmark
• Add context for better AI tagging
• Multiple URLs = multiple bookmarks

<b>Commands:</b>
/help - Show this message
/stats - View your bookmark statistics
/bookmark &lt;url&gt; [description] - Save with description

<b>Examples:</b>
<code>https://react.dev/learn</code>
<code>Important tutorial https://react.dev/learn</code>
<code>/bookmark https://github.com/user/repo Check this out</code>

<b>Features:</b>
🧠 AI extracts metadata automatically
🏷️ Smart tagging based on content
📊 Auto-priority detection
💬 Context-aware from your message

<b>Quick Links:</b>
📚 <a href="${baseUrl}/bookmarks">View All Bookmarks</a>
📋 <a href="${baseUrl}/todo">Todo List</a>

💡 <i>Tip: Add context for better AI tagging!</i>
Example: "Read later for work" + [link] = better tags`;
}

/**
 * Handle /bookmark command
 */
function handleBookmarkCommand(args: string[]): string {
  if (args.length === 0) {
    return `📚 <b>Bookmark Command Usage</b>

<code>/bookmark &lt;url&gt; [description]</code>

<b>Examples:</b>
<code>/bookmark https://github.com/user/repo</code>
<code>/bookmark https://react.dev/learn Important tutorial</code>

💡 <i>Or just send me any URL directly!</i>`;
  }

  const url = args[0];
  const description = args.slice(1).join(' ');

  // Validate URL format
  try {
    new URL(url);
  } catch {
    return '❌ Invalid URL format. Please provide a valid URL starting with http:// or https://';
  }

  return `✅ Processing bookmark: ${url}${description ? `\n📝 Description: ${description}` : ''}`;
}

/**
 * Get user statistics
 */
async function getStatsMessage(userId: number): Promise<string> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${baseUrl}/api/stats`, {
      headers: {
        'Authorization': process.env.TELEGRAM_BOT_TOKEN || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Stats API returned ${response.status}`);
    }

    const stats = await response.json();

    return `📊 <b>Your Bookmark Statistics</b>

📚 Total Bookmarks: ${stats.total || 0}
✅ Reviewed: ${stats.reviewed || 0}
📋 Todo: ${stats.todo || 0}
🔥 High Priority: ${stats.highPriority || 0}
🏷️ Total Tags: ${stats.totalTags || 0}

<a href="${baseUrl}/bookmarks">View Full Dashboard →</a>`;
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return `❌ Failed to fetch statistics. Please try again later.

<i>Error: ${error instanceof Error ? error.message : 'Unknown error'}</i>`;
  }
}

/**
 * Generate formatted reply for bookmark creation results
 */
export function generateBookmarkReply(results: any[]): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://bookmark-manager-beryl.vercel.app';
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  let reply = '';

  if (successful.length > 0) {
    reply += `✅ <b>Created ${successful.length} bookmark${successful.length > 1 ? 's' : ''}!</b>\n\n`;

    successful.forEach((result, index) => {
      const bookmark = result.bookmark;

      if (successful.length > 1) {
        reply += `<b>${index + 1}.</b> `;
      }

      reply += `📚 <b>${escapeHtml(bookmark.title || 'Untitled')}</b>\n`;

      if (bookmark.tags && Array.isArray(bookmark.tags) && bookmark.tags.length > 0) {
        reply += `🏷️ ${bookmark.tags.map((tag: string) => `#${tag}`).join(' ')}\n`;
      }

      if (bookmark.priority === 'HIGH') {
        reply += `🔥 High Priority\n`;
      } else if (bookmark.priority === 'LOW') {
        reply += `📅 Low Priority\n`;
      }

      if (bookmark.description && bookmark.description !== bookmark.title) {
        const desc = bookmark.description.length > 100
          ? bookmark.description.substring(0, 100) + '...'
          : bookmark.description;
        reply += `📝 ${escapeHtml(desc)}\n`;
      }

      reply += `🔗 ${bookmark.url}\n\n`;
    });

    reply += `📱 <b>Quick Links:</b>\n`;
    reply += `📚 <a href="${baseUrl}/bookmarks">View All Bookmarks</a>\n`;
    reply += `📋 <a href="${baseUrl}/todo">Todo List</a>\n\n`;
  }

  if (failed.length > 0) {
    reply += `❌ Failed to process ${failed.length} link${failed.length > 1 ? 's' : ''}\n\n`;
  }

  if (successful.length > 0) {
    reply += `💡 <i>Tip: Add context for better AI tagging!</i>\n`;
    reply += `Example: "Important work docs" + [link]`;
  }

  return reply || '❌ No bookmarks were created. Please try again.';
}

/**
 * Escape HTML special characters for Telegram HTML parsing
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validate webhook secret token
 */
export function validateWebhookSecret(secretToken: string | null): boolean {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!expectedSecret) {
    console.error('TELEGRAM_WEBHOOK_SECRET not configured');
    return false;
  }

  return secretToken === expectedSecret;
}
