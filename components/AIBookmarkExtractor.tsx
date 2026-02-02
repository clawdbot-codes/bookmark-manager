'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AIBookmarkExtractorProps {
  onBookmarkCreated?: () => void
}

export function AIBookmarkExtractor({ onBookmarkCreated }: AIBookmarkExtractorProps) {
  const [url, setUrl] = useState('')
  const [userMessage, setUserMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url.trim()) return

    setIsProcessing(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/ai/extract-bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          source: 'manual',
          userMessage: userMessage.trim() || undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process bookmark')
      }

      const data = await response.json()
      setResult(data)
      
      // Clear form on success
      setUrl('')
      setUserMessage('')
      
      // Notify parent component
      if (onBookmarkCreated) {
        onBookmarkCreated()
      }
      
    } catch (error) {
      console.error('AI extraction error:', error)
      setError(error instanceof Error ? error.message : 'Failed to process bookmark')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-2xl">🤖</span>
        <h3 className="text-lg font-semibold text-gray-900">AI Bookmark Assistant</h3>
      </div>
      
      <p className="text-gray-600 mb-4">
        Send any web link and AI will automatically extract metadata, generate smart tags, and organize it for you!
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            🔗 Website URL
          </label>
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://react.dev/learn/hooks"
            required
            disabled={isProcessing}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            💬 Context (Optional)
          </label>
          <Input
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            placeholder="Important tutorial for work project"
            disabled={isProcessing}
          />
          <p className="text-xs text-gray-500 mt-1">
            Add context to help AI categorize and prioritize better
          </p>
        </div>

        <Button 
          type="submit" 
          disabled={isProcessing || !url.trim()}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <span className="animate-spin mr-2">🔄</span>
              Processing with AI...
            </>
          ) : (
            <>
              🚀 Create Smart Bookmark
            </>
          )}
        </Button>
      </form>

      {/* Result Display */}
      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h4 className="font-medium text-green-900 mb-2">✅ Bookmark Created Successfully!</h4>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Title:</strong> {result.bookmark.title}
            </div>
            {result.bookmark.description && (
              <div>
                <strong>Description:</strong> {result.bookmark.description}
              </div>
            )}
            <div>
              <strong>Priority:</strong> <span className={`inline-block px-2 py-1 text-xs rounded ${
                result.bookmark.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                result.bookmark.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {result.bookmark.priority}
              </span>
            </div>
            {result.bookmark.tags && result.bookmark.tags.length > 0 && (
              <div>
                <strong>Tags:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {result.bookmark.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {result.aiInsights && (
            <div className="mt-3 pt-3 border-t border-green-300">
              <details>
                <summary className="cursor-pointer text-sm font-medium text-green-800">
                  🧠 AI Analysis Details
                </summary>
                <div className="mt-2 text-xs text-green-700 space-y-1">
                  <div><strong>Domain Category:</strong> {result.aiInsights.aiEnhancements?.aiReasoning?.domainAnalysis}</div>
                  <div><strong>Content Type:</strong> {result.aiInsights.aiEnhancements?.aiReasoning?.contentType}</div>
                  {result.aiInsights.extractedMetadata && (
                    <div><strong>Source Domain:</strong> {result.aiInsights.extractedMetadata.domain}</div>
                  )}
                </div>
              </details>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">❌ {error}</p>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-6 pt-6 border-t border-blue-200">
        <h4 className="font-medium text-gray-900 mb-2">💡 How AI Smart Bookmarking Works:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 🔍 <strong>Extracts metadata:</strong> Title, description, images from any web page</li>
          <li>• 🏷️ <strong>Smart tagging:</strong> Automatically generates relevant tags based on content</li>
          <li>• 📊 <strong>Priority detection:</strong> Sets importance level based on content type</li>
          <li>• 🧠 <strong>Context awareness:</strong> Uses your optional message for better categorization</li>
          <li>• 📝 <strong>Auto-organizing:</strong> Adds to your todo list for review workflow</li>
        </ul>
      </div>
    </div>
  )
}