'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AuthGuard from '@/components/AuthGuard'

export default function IntegrationsPage() {
  const [webhookUrl, setWebhookUrl] = useState('')

  const generateWebhookUrl = () => {
    const baseUrl = window.location.origin
    setWebhookUrl(`${baseUrl}/api/webhooks/whatsapp`)
  }

  return (
    <AuthGuard>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🔗 WhatsApp Integration</h1>
          <p className="text-gray-600">
            Set up AI-powered bookmark creation from WhatsApp messages
          </p>
        </div>

        {/* How it Works */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🤖 How AI WhatsApp Integration Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl mb-2">📱</div>
              <h3 className="font-medium mb-2">1. Send Link</h3>
              <p className="text-sm text-gray-600">Send any web link via WhatsApp with optional context message</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🤖</div>
              <h3 className="font-medium mb-2">2. AI Processing</h3>
              <p className="text-sm text-gray-600">AI extracts metadata, generates tags, and sets priority automatically</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">📚</div>
              <h3 className="font-medium mb-2">3. Auto-Bookmark</h3>
              <p className="text-sm text-gray-600">Bookmark appears in your todo list, ready for review</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-green-300">
            <h4 className="font-medium text-green-900 mb-2">Example WhatsApp Message:</h4>
            <div className="bg-gray-50 p-3 rounded text-sm">
              <div className="text-blue-600">"Important tutorial for work project"</div>
              <div className="text-blue-800 font-mono">https://react.dev/learn/hooks</div>
            </div>
            <div className="mt-2 text-sm text-green-700">
              → AI creates bookmark with HIGH priority, tags: "react", "tutorial", "work", "frontend"
            </div>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Setup Instructions</h2>
          
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-medium text-gray-900 mb-2">Step 1: Generate Webhook URL</h3>
              <p className="text-sm text-gray-600 mb-3">
                This URL will receive WhatsApp messages and process them with AI
              </p>
              <div className="flex space-x-2">
                <Input
                  value={webhookUrl}
                  readOnly
                  placeholder="Click generate to create webhook URL"
                  className="font-mono text-xs"
                />
                <Button onClick={generateWebhookUrl}>Generate URL</Button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-medium text-gray-900 mb-2">Step 2: WhatsApp Business API Setup</h3>
              <p className="text-sm text-gray-600 mb-3">
                Configure your WhatsApp Business API to send messages to the webhook
              </p>
              <div className="bg-gray-50 p-4 rounded text-sm space-y-2">
                <div><strong>Webhook URL:</strong> <code className="text-xs">{webhookUrl || '[Generate URL first]'}</code></div>
                <div><strong>Verify Token:</strong> <code className="text-xs">bookmark_ai_webhook</code></div>
                <div><strong>Subscribe to:</strong> messages</div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-medium text-gray-900 mb-2">Step 3: Environment Variables</h3>
              <p className="text-sm text-gray-600 mb-3">
                Add these to your environment configuration
              </p>
              <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs">
                <div>WHATSAPP_VERIFY_TOKEN=bookmark_ai_webhook</div>
                <div>NEXTAUTH_URL=your-app-domain.com</div>
              </div>
            </div>
          </div>
        </div>

        {/* Integration Options */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📱 Integration Options</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* WhatsApp Business API */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">WhatsApp Business API</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <div>✅ Official API</div>
                <div>✅ Reliable webhooks</div>
                <div>✅ Multi-user support</div>
                <div>❌ Requires approval</div>
                <div>💰 Paid service</div>
              </div>
              <Button variant="outline" className="mt-3 w-full" disabled>
                <a href="https://developers.facebook.com/docs/whatsapp" target="_blank" rel="noopener noreferrer">
                  Setup Guide
                </a>
              </Button>
            </div>

            {/* Clawdbot Integration */}
            <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
              <h3 className="font-medium text-gray-900 mb-2">Clawdbot Direct Integration</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <div>✅ Already available!</div>
                <div>✅ No setup required</div>
                <div>✅ Works immediately</div>
                <div>✅ Free to use</div>
                <div>📱 Uses your existing Clawdbot</div>
              </div>
              <div className="mt-3 p-3 bg-blue-100 rounded text-sm text-blue-800">
                Since you're using Clawdbot, you can send links directly through Telegram and they'll be processed with AI!
              </div>
            </div>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">💡 Usage Examples</h2>
          
          <div className="space-y-4">
            {/* Example 1 */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium text-gray-900">Work Research</h4>
              <div className="text-sm text-gray-600 mt-1">
                <div className="bg-gray-50 p-2 rounded font-mono text-xs mb-1">
                  "Important API docs for client project"<br/>
                  https://stripe.com/docs/api
                </div>
                <div>→ Creates HIGH priority bookmark with tags: "api", "documentation", "work", "stripe"</div>
              </div>
            </div>

            {/* Example 2 */}
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-medium text-gray-900">Learning Content</h4>
              <div className="text-sm text-gray-600 mt-1">
                <div className="bg-gray-50 p-2 rounded font-mono text-xs mb-1">
                  "Read later - react tutorial"<br/>
                  https://react.dev/learn
                </div>
                <div>→ Creates MEDIUM priority bookmark with tags: "react", "tutorial", "learning", "read-later"</div>
              </div>
            </div>

            {/* Example 3 */}
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-medium text-gray-900">Quick Save</h4>
              <div className="text-sm text-gray-600 mt-1">
                <div className="bg-gray-50 p-2 rounded font-mono text-xs mb-1">
                  https://github.com/awesome/project
                </div>
                <div>→ Creates bookmark with automatic tags: "github", "code", "opensource"</div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex">
            <div className="text-yellow-500 mr-3">⚠️</div>
            <div>
              <h4 className="font-medium text-yellow-900">Current Status</h4>
              <p className="text-sm text-yellow-700 mt-1">
                WhatsApp integration requires additional setup and WhatsApp Business API access. 
                The AI bookmark extraction feature is ready and working through the web interface.
                For immediate use, try the AI Assistant on the Bookmarks page!
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}