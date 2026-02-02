'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { extractDomain, formatDate, cn } from '@/lib/utils'

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

interface BookmarkCardProps {
  bookmark: Bookmark
  onUpdate: (id: string, data: Partial<Bookmark>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  isSelected?: boolean
  onSelect?: (id: string, selected: boolean) => void
  showActions?: boolean
}

export function BookmarkCard({ 
  bookmark, 
  onUpdate, 
  onDelete, 
  isSelected = false,
  onSelect,
  showActions = true
}: BookmarkCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const statusColors = {
    TODO: 'bg-orange-100 text-orange-800 border-orange-300',
    REVIEWED: 'bg-green-100 text-green-800 border-green-300',
    ARCHIVED: 'bg-blue-100 text-blue-800 border-blue-300',
    DISCARDED: 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const priorityColors = {
    HIGH: 'bg-red-100 text-red-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    LOW: 'bg-gray-100 text-gray-800'
  }

  const handleStatusChange = async (newStatus: typeof bookmark.status) => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      await onUpdate(bookmark.id, { status: newStatus })
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePriorityChange = async (newPriority: typeof bookmark.priority) => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      await onUpdate(bookmark.id, { priority: newPriority })
    } catch (error) {
      console.error('Failed to update priority:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (isLoading || !confirm('Are you sure you want to delete this bookmark?')) return
    
    setIsLoading(true)
    try {
      await onDelete(bookmark.id)
    } catch (error) {
      console.error('Failed to delete bookmark:', error)
      setIsLoading(false)
    }
  }

  const domain = extractDomain(bookmark.url)

  return (
    <div className={cn(
      "bg-white rounded-lg border shadow-sm p-4 transition-all hover:shadow-md",
      isSelected && "ring-2 ring-blue-500 bg-blue-50",
      isLoading && "opacity-50 pointer-events-none"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(bookmark.id, e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          )}
          
          {bookmark.faviconUrl && (
            <img
              src={bookmark.faviconUrl}
              alt=""
              className="w-4 h-4 flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          )}
          
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-gray-900 truncate">{bookmark.title}</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{domain}</span>
              <span>•</span>
              <span>{formatDate(new Date(bookmark.createdAt))}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className={cn(
            "px-2 py-1 text-xs font-medium rounded-full border",
            priorityColors[bookmark.priority]
          )}>
            {bookmark.priority}
          </span>
          <span className={cn(
            "px-2 py-1 text-xs font-medium rounded-full border",
            statusColors[bookmark.status]
          )}>
            {bookmark.status}
          </span>
        </div>
      </div>

      {/* Description */}
      {bookmark.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {bookmark.description}
        </p>
      )}

      {/* Tags */}
      {bookmark.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {bookmark.tags.map(tag => (
            <span
              key={tag.id}
              className="px-2 py-1 text-xs rounded-full"
              style={{ 
                backgroundColor: tag.color + '20', 
                color: tag.color || '#6b7280',
                border: `1px solid ${tag.color || '#d1d5db'}`
              }}
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      {/* URL */}
      <div className="mb-3">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 truncate block"
        >
          {bookmark.url}
        </a>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          {bookmark.status === 'TODO' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('REVIEWED')}
                disabled={isLoading}
              >
                ✅ Mark Reviewed
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('ARCHIVED')}
                disabled={isLoading}
              >
                📂 Archive
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('DISCARDED')}
                disabled={isLoading}
              >
                🗑️ Discard
              </Button>
            </>
          )}

          {bookmark.priority !== 'HIGH' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePriorityChange('HIGH')}
              disabled={isLoading}
            >
              🔥 High Priority
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isLoading}
            className="text-red-600 hover:text-red-800"
          >
            🗑️ Delete
          </Button>
        </div>
      )}
    </div>
  )
}