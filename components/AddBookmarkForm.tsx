'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TagSelector } from '@/components/TagSelector'

interface AddBookmarkFormProps {
  onAdd: (bookmark: {
    url: string
    title: string
    description?: string
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
    tags: string[]
  }) => Promise<void>
  onCancel?: () => void
}

export function AddBookmarkForm({ onAdd, onCancel }: AddBookmarkFormProps) {
  const [formData, setFormData] = useState({
    url: '',
    title: '',
    description: '',
    priority: 'MEDIUM' as 'HIGH' | 'MEDIUM' | 'LOW',
    tags: [] as string[]
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    const newErrors: { [key: string]: string } = {}
    
    if (!formData.url.trim()) {
      newErrors.url = 'URL is required'
    } else {
      try {
        new URL(formData.url)
      } catch {
        newErrors.url = 'Please enter a valid URL'
      }
    }
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }
    
    setErrors(newErrors)
    
    if (Object.keys(newErrors).length > 0) {
      return
    }

    setIsLoading(true)
    
    try {
      await onAdd({
        url: formData.url.trim(),
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        tags: formData.tags
      })

      // Reset form on success
      setFormData({
        url: '',
        title: '',
        description: '',
        priority: 'MEDIUM',
        tags: []
      })
    } catch (error) {
      console.error('Failed to add bookmark:', error)
      setErrors({ submit: 'Failed to add bookmark. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUrlBlur = async () => {
    if (formData.url && !formData.title) {
      // Try to fetch page title
      try {
        const response = await fetch(`/api/bookmarks/meta?url=${encodeURIComponent(formData.url)}`)
        if (response.ok) {
          const data = await response.json()
          if (data.title) {
            setFormData(prev => ({ ...prev, title: data.title }))
          }
        }
      } catch (error) {
        // Ignore meta fetch errors
        console.log('Could not fetch page metadata')
      }
    }
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Bookmark</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* URL */}
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            URL *
          </label>
          <Input
            id="url"
            type="url"
            value={formData.url}
            onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
            onBlur={handleUrlBlur}
            placeholder="https://example.com/article"
            className={errors.url ? 'border-red-500' : ''}
          />
          {errors.url && <p className="text-red-500 text-xs mt-1">{errors.url}</p>}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Article title or description"
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Optional notes about this bookmark"
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Priority */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            id="priority"
            value={formData.priority}
            onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <TagSelector
            selectedTags={formData.tags}
            onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
          />
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <p className="text-red-500 text-sm">{errors.submit}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Adding...' : 'Add Bookmark'}
          </Button>
        </div>
      </form>
    </div>
  )
}