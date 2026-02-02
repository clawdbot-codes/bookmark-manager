'use client'

import { useState, useEffect } from 'react'

interface Tag {
  id: string
  name: string
  color?: string
  _count?: {
    bookmarks: number
  }
}

interface TagSelectorProps {
  selectedTags: string[]
  onChange: (tags: string[]) => void
  className?: string
}

export function TagSelector({ selectedTags, onChange, className = '' }: TagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/tags')
      if (response.ok) {
        const data = await response.json()
        setAvailableTags(data.tags || [])
      } else {
        setError('Failed to load tags')
      }
    } catch (err) {
      console.error('Error loading tags:', err)
      setError('Failed to load tags')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      // Remove tag
      onChange(selectedTags.filter(t => t !== tagName))
    } else {
      // Add tag
      onChange([...selectedTags, tagName])
    }
  }

  const handleRemoveTag = (tagName: string) => {
    onChange(selectedTags.filter(t => t !== tagName))
  }

  if (isLoading) {
    return (
      <div className={`p-4 border rounded-md bg-gray-50 ${className}`}>
        <div className="text-sm text-gray-500">Loading tags...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-4 border rounded-md bg-red-50 ${className}`}>
        <div className="text-sm text-red-600">{error}</div>
        <button
          onClick={loadTags}
          className="text-sm text-red-700 underline mt-2"
        >
          Try again
        </button>
      </div>
    )
  }

  if (availableTags.length === 0) {
    return (
      <div className={`p-4 border rounded-md bg-gray-50 ${className}`}>
        <div className="text-sm text-gray-500">
          No tags available. Create tags on the Tags page first.
        </div>
      </div>
    )
  }

  return (
    <div className={`border rounded-md ${className}`}>
      {/* Selected Tags Section */}
      {selectedTags.length > 0 && (
        <div className="p-3 bg-gray-50 border-b">
          <div className="text-xs font-medium text-gray-700 mb-2">Selected Tags:</div>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tagName => {
              const tag = availableTags.find(t => t.name === tagName)
              const color = tag?.color || '#6b7280'
              return (
                <span
                  key={tagName}
                  className="inline-flex items-center px-2 py-1 text-xs rounded-full border"
                  style={{
                    backgroundColor: color,
                    color: 'white',
                    borderColor: color
                  }}
                >
                  #{tagName}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tagName)}
                    className="ml-1 hover:opacity-75"
                    aria-label={`Remove ${tagName}`}
                  >
                    ×
                  </button>
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Available Tags Section */}
      <div className="p-3">
        <div className="text-xs font-medium text-gray-700 mb-2">
          {selectedTags.length === 0 ? 'Select tags:' : 'Available tags:'}
        </div>
        <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
          {availableTags.map(tag => {
            const isSelected = selectedTags.includes(tag.name)
            const color = tag.color || '#6b7280'

            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleToggleTag(tag.name)}
                className={`px-2 py-1 text-xs rounded-full border transition-all ${
                  isSelected
                    ? 'ring-2 ring-offset-1'
                    : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: isSelected ? color : color + '20',
                  color: isSelected ? 'white' : color,
                  borderColor: color,
                  boxShadow: `0 0 0 2px ${color}`
                }}
              >
                #{tag.name}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
