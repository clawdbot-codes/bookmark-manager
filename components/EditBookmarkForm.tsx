'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TagSelector } from '@/components/TagSelector'

interface Tag {
  id: string
  name: string
  color?: string
}

interface Bookmark {
  id: string
  url: string
  title: string
  description?: string
  faviconUrl?: string
  status: 'TODO' | 'REVIEWED' | 'ARCHIVED' | 'DISCARDED'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  createdAt: string
  reviewedAt?: string
  tags: Tag[]
}

interface EditBookmarkFormProps {
  bookmark: Bookmark
  onUpdate: (id: string, data: Partial<Bookmark>) => Promise<void>
  onCancel: () => void
}

export function EditBookmarkForm({ bookmark, onUpdate, onCancel }: EditBookmarkFormProps) {
  const [formData, setFormData] = useState({
    url: bookmark.url,
    title: bookmark.title,
    description: bookmark.description || '',
    priority: bookmark.priority,
    status: bookmark.status,
    tags: bookmark.tags.map(tag => tag.name)
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
      await onUpdate(bookmark.id, {
        url: formData.url.trim(),
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority as 'HIGH' | 'MEDIUM' | 'LOW',
        status: formData.status as 'TODO' | 'REVIEWED' | 'ARCHIVED' | 'DISCARDED',
        tags: formData.tags
      })

      onCancel() // Close the edit form
    } catch (error) {
      console.error('Failed to update bookmark:', error)
      setErrors({ submit: 'Failed to update bookmark. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Bookmark</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* URL */}
        <div>
          <label htmlFor="edit-url" className="block text-sm font-medium text-gray-700 mb-1">
            URL *
          </label>
          <Input
            id="edit-url"
            type="url"
            value={formData.url}
            onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
            placeholder="https://example.com/article"
            className={errors.url ? 'border-red-500' : ''}
          />
          {errors.url && <p className="text-red-500 text-xs mt-1">{errors.url}</p>}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <Input
            id="edit-title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Article title or description"
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="edit-description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Optional notes about this bookmark"
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Priority and Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="edit-priority"
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div>
            <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="edit-status"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="TODO">Todo</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="ARCHIVED">Archived</option>
              <option value="DISCARDED">Discarded</option>
            </select>
          </div>
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
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}