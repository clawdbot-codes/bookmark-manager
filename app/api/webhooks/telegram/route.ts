import { NextRequest, NextResponse } from 'next/server';
import { extractUrls } from '@/lib/clawdbot-integration';
import {
  extractTelegramMessage,
  handleTelegramCommand,
  sendTelegramMessage,
  generateBookmarkReply,
  validateWebhookSecret,
} from '@/lib/telegram-integration';
import { TelegramUpdate } from '@/lib/telegram-types';

/**
 * POST /api/webhooks/telegram
 * Main webhook handler that receives updates from Telegram
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Validate webhook secret token
    const secretToken = request.headers.get('x-telegram-bot-api-secret-token');

    if (!validateWebhookSecret(secretToken)) {
      console.error('Webhook secret validation failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 2: Parse the webhook update
    const update: TelegramUpdate = await request.json();
    console.log('Telegram webhook received:', {
      update_id: update.update_id,
      has_message: !!update.message,
      timestamp: new Date().toISOString(),
    });

    // Step 3: Extract message data
    const message = extractTelegramMessage(update);

    if (!message) {
      console.log('No processable message in update');
      return NextResponse.json({ status: 'no_message' }, { status: 200 });
    }

    // Step 4: Check if it's a private chat (reject group messages)
    if (message.chatType !== 'private') {
      console.log('Ignoring non-private chat message');
      await sendTelegramMessage(
        message.chatId,
        '👋 Hi! Please send me a direct message to create bookmarks.\n\nI only work in private chats for security reasons.'
      );
      return NextResponse.json({ status: 'group_message_ignored' }, { status: 200 });
    }

    // Step 5: Handle commands
    if (message.text.startsWith('/')) {
      const reply = await handleTelegramCommand(message);
      await sendTelegramMessage(message.chatId, reply);
      console.log('Command processed:', message.text.split(' ')[0]);
      return NextResponse.json({ status: 'command_processed' }, { status: 200 });
    }

    // Step 6: Extract URLs from message
    const urls = extractUrls(message.text);

    if (urls.length === 0) {
      // No URLs found - send help message
      await sendTelegramMessage(
        message.chatId,
        `👋 Hi! Send me any web links and I'll automatically convert them to organized bookmarks with AI-powered tagging.

📝 You can also add context for better tagging:
<i>Example: "Read later for work" + [link]</i>

<b>Commands:</b>
/help - Show detailed help
/stats - View your bookmark statistics
/bookmark &lt;url&gt; [description] - Save with description`
      );
      return NextResponse.json({ status: 'no_urls' }, { status: 200 });
    }

    console.log(`Processing ${urls.length} URL(s) from message`);

    // Step 7: Process each URL using the existing bookmark-direct API
    const results = [];
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    for (const url of urls) {
      try {
        // Extract context by removing all URLs from the message
        const userContext = message.text
          .replace(/(https?:\/\/[^\s]+)/gi, '')
          .trim();

        const response = await fetch(`${baseUrl}/api/clawdbot/bookmark-direct`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.TELEGRAM_BOT_TOKEN || '',
          },
          body: JSON.stringify({
            url,
            userMessage: userContext || undefined,
            userId: process.env.DEFAULT_USER_ID,
            source: 'telegram',
          }),
        });

        const result = await response.json();

        if (result.success) {
          console.log('Bookmark created successfully:', result.bookmark?.id);
          results.push(result);
        } else {
          console.error('Bookmark creation failed:', result.error);
          results.push({ success: false, url, error: result.error });
        }
      } catch (error) {
        console.error('Error processing URL:', url, error);
        results.push({
          success: false,
          url,
          error: 'Failed to process bookmark',
        });
      }
    }

    // Step 8: Generate and send reply
    const reply = generateBookmarkReply(results);
    await sendTelegramMessage(message.chatId, reply);

    console.log('Webhook processing complete:', {
      urls_processed: urls.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    });

    return NextResponse.json({
      status: 'processed',
      urls: urls.length,
      successful: results.filter(r => r.success).length,
    }, { status: 200 });

  } catch (error) {
    console.error('Telegram webhook error:', error);

    // Try to send error message to user if we have chat_id
    try {
      const body = await request.clone().json();
      const message = extractTelegramMessage(body);
      if (message) {
        await sendTelegramMessage(
          message.chatId,
          '❌ Sorry, something went wrong while processing your message. Please try again later.'
        );
      }
    } catch {
      // Ignore errors in error handler
    }

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/telegram
 * Health check endpoint (not used by Telegram, but useful for debugging)
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'active',
    message: 'Telegram webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
