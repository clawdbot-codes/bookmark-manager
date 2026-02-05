import { NextRequest, NextResponse } from 'next/server';
import { TelegramApiResponse, TelegramWebhookInfo } from '@/lib/telegram-types';

/**
 * POST /api/telegram/set-webhook
 * One-time setup endpoint to register the webhook with Telegram
 */
export async function POST(request: NextRequest) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
  const BASE_URL = process.env.NEXTAUTH_URL;

  // Validate configuration
  if (!BOT_TOKEN) {
    return NextResponse.json(
      { error: 'TELEGRAM_BOT_TOKEN not configured in environment variables' },
      { status: 500 }
    );
  }

  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'TELEGRAM_WEBHOOK_SECRET not configured in environment variables' },
      { status: 500 }
    );
  }

  if (!BASE_URL) {
    return NextResponse.json(
      { error: 'NEXTAUTH_URL not configured in environment variables' },
      { status: 500 }
    );
  }

  const webhookUrl = `${BASE_URL}/api/webhooks/telegram`;

  try {
    console.log('Setting up Telegram webhook:', webhookUrl);

    // Call Telegram setWebhook API
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message', 'edited_message'],
          secret_token: WEBHOOK_SECRET,
          drop_pending_updates: true,
          max_connections: 40,
        }),
      }
    );

    const result: TelegramApiResponse = await response.json();

    if (result.ok) {
      console.log('Webhook registered successfully');

      return NextResponse.json({
        success: true,
        message: 'Webhook registered successfully',
        webhook_url: webhookUrl,
        telegram_response: result.result,
      });
    } else {
      console.error('Failed to register webhook:', result.description);

      return NextResponse.json(
        {
          success: false,
          error: result.description || 'Failed to register webhook',
          telegram_response: result,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error setting webhook:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to connect to Telegram API',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/telegram/set-webhook
 * Check current webhook status
 */
export async function GET(request: NextRequest) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  if (!BOT_TOKEN) {
    return NextResponse.json(
      { error: 'TELEGRAM_BOT_TOKEN not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
    );

    const result: TelegramApiResponse<TelegramWebhookInfo> = await response.json();

    if (result.ok && result.result) {
      const info = result.result;

      return NextResponse.json({
        success: true,
        webhook_info: {
          url: info.url,
          has_custom_certificate: info.has_custom_certificate,
          pending_update_count: info.pending_update_count,
          last_error_date: info.last_error_date,
          last_error_message: info.last_error_message,
          max_connections: info.max_connections,
          allowed_updates: info.allowed_updates,
        },
        status: info.url ? 'configured' : 'not_configured',
        is_active: !!info.url && info.pending_update_count === 0,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.description || 'Failed to get webhook info',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error getting webhook info:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to connect to Telegram API',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/telegram/set-webhook
 * Remove the webhook (useful for debugging or switching to polling)
 */
export async function DELETE(request: NextRequest) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  if (!BOT_TOKEN) {
    return NextResponse.json(
      { error: 'TELEGRAM_BOT_TOKEN not configured' },
      { status: 500 }
    );
  }

  try {
    console.log('Deleting Telegram webhook...');

    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drop_pending_updates: true,
        }),
      }
    );

    const result: TelegramApiResponse = await response.json();

    if (result.ok) {
      console.log('Webhook deleted successfully');

      return NextResponse.json({
        success: true,
        message: 'Webhook deleted successfully',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.description || 'Failed to delete webhook',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting webhook:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to connect to Telegram API',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
