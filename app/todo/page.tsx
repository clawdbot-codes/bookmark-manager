'use client'

import { useState, useEffect } from 'react'
import { BookmarkCard } from '@/components/BookmarkCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AuthGuard from '@/components/AuthGuard'

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

export default function TodoPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [viewMode, setViewMode] = useState<'list' | 'review'>('list')
  const [filters, setFilters] = useState({
    search: '',
    priority: ''
  })

  // Load TODO bookmarks on mount
  useEffect(() => {
    loadTodoBookmarks()
  }, [])

  // Apply filters when filters or bookmarks change
  useEffect(() => {
    let filtered = [...bookmarks]

    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(bookmark => 
        bookmark.title.toLowerCase().includes(search) ||
        bookmark.description?.toLowerCase().includes(search) ||
        bookmark.url.toLowerCase().includes(search) ||
        bookmark.tags.some(tag => tag.name.toLowerCase().includes(search))
      )
    }

    if (filters.priority) {
      filtered = filtered.filter(bookmark => bookmark.priority === filters.priority)
    }

    // Sort by priority: HIGH -> MEDIUM -> LOW, then by creation date
    filtered.sort((a, b) => {
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 }
      const aPriority = priorityOrder[a.priority]
      const bPriority = priorityOrder[b.priority]
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority
      }
      
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })

    setFilteredBookmarks(filtered)
    setCurrentIndex(0) // Reset to first item when filters change
  }, [bookmarks, filters])

  const loadTodoBookmarks = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/bookmarks?status=TODO')
      if (response.ok) {
        const data = await response.json()
        setBookmarks(data.bookmarks)
      } else {
        console.error('Failed to load bookmarks')
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateBookmark = async (id: string, data: Partial<Bookmark>) => {
    const response = await fetch(`/api/bookmarks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (response.ok) {
      // If status changed from TODO, remove from list
      if (data.status && data.status !== 'TODO') {
        setBookmarks(prev => prev.filter(bookmark => bookmark.id !== id))
        setSelectedBookmarks(prev => {
          const updated = new Set(prev)
          updated.delete(id)
          return updated
        })
        
        // In review mode, move to next item
        if (viewMode === 'review' && currentIndex >= filteredBookmarks.length - 1) {
          setCurrentIndex(Math.max(0, currentIndex - 1))
        }
      } else {
        // Update in place
        const updatedBookmark = await response.json()
        setBookmarks(prev => 
          prev.map(bookmark => 
            bookmark.id === id ? updatedBookmark : bookmark
          )
        )
      }
    } else {
      throw new Error('Failed to update bookmark')
    }
  }

  const handleDeleteBookmark = async (id: string) => {
    const response = await fetch(`/api/bookmarks/${id}`, {
      method: 'DELETE'
    })

    if (response.ok) {
      setBookmarks(prev => prev.filter(bookmark => bookmark.id !== id))
      setSelectedBookmarks(prev => {
        const updated = new Set(prev)
        updated.delete(id)
        return updated
      })
      
      // In review mode, move to next item
      if (viewMode === 'review' && currentIndex >= filteredBookmarks.length - 1) {
        setCurrentIndex(Math.max(0, currentIndex - 1))
      }
    } else {
      throw new Error('Failed to delete bookmark')
    }
  }

  const handleSelectBookmark = (id: string, selected: boolean) => {
    setSelectedBookmarks(prev => {
      const updated = new Set(prev)
      if (selected) {
        updated.add(id)
      } else {
        updated.delete(id)
      }
      return updated
    })
  }

  const handleBulkAction = async (action: string, value?: string) => {
    if (selectedBookmarks.size === 0) return

    const response = await fetch('/api/bookmarks/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookmarkIds: Array.from(selectedBookmarks),
        action,
        value
      })
    })

    if (response.ok) {
      // Remove processed bookmarks from the list
      setBookmarks(prev => 
        prev.filter(bookmark => !selectedBookmarks.has(bookmark.id))
      )
      setSelectedBookmarks(new Set())
    } else {
      console.error('Bulk action failed')
    }
  }

  const nextBookmark = () => {
    if (currentIndex < filteredBookmarks.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const previousBookmark = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const currentBookmark = filteredBookmarks[currentIndex]

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading todo items...</div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📝 Todo Review</h1>
          <p className="text-gray-600">
            {filteredBookmarks.length} bookmark(s) to review
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
          >
            📋 List View
          </Button>
          <Button
            variant={viewMode === 'review' ? 'default' : 'outline'}
            onClick={() => setViewMode('review')}
            disabled={filteredBookmarks.length === 0}
          >
            🔍 Review Mode
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <Input
              placeholder="Search todo items..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Priority</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {filteredBookmarks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <div className="text-xl font-semibold text-gray-900 mb-2">
            All caught up!
          </div>
          <div className="text-gray-500">
            No bookmarks in your todo list. Great job!
          </div>
        </div>
      ) : (
        <>
          {/* List View */}
          {viewMode === 'list' && (
            <>
              {/* Bulk Actions */}
              {selectedBookmarks.size > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-800 font-medium">
                      {selectedBookmarks.size} bookmark(s) selected
                    </span>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleBulkAction('mark_reviewed')}
                      >
                        ✅ Mark Reviewed
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleBulkAction('archive')}
                      >
                        📂 Archive
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleBulkAction('discard')}
                      >
                        🗑️ Discard
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedBookmarks(new Set())}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredBookmarks.map(bookmark => (
                  <BookmarkCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    onUpdate={handleUpdateBookmark}
                    onDelete={handleDeleteBookmark}
                    isSelected={selectedBookmarks.has(bookmark.id)}
                    onSelect={handleSelectBookmark}
                  />
                ))}
              </div>
            </>
          )}

          {/* Review Mode */}
          {viewMode === 'review' && currentBookmark && (
            <div className="space-y-4">
              {/* Review Navigation */}
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={previousBookmark}
                      disabled={currentIndex === 0}
                    >
                      ← Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      {currentIndex + 1} of {filteredBookmarks.length}
                    </span>
                    <Button
                      variant="outline"
                      onClick={nextBookmark}
                      disabled={currentIndex === filteredBookmarks.length - 1}
                    >
                      Next →
                    </Button>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateBookmark(currentBookmark.id, { status: 'REVIEWED' })}
                    >
                      ✅ Mark Reviewed
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateBookmark(currentBookmark.id, { status: 'ARCHIVED' })}
                    >
                      📂 Archive
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateBookmark(currentBookmark.id, { status: 'DISCARDED' })}
                    >
                      🗑️ Discard
                    </Button>
                  </div>
                </div>
              </div>

              {/* Current Bookmark */}
              <div className="max-w-4xl mx-auto">
                <BookmarkCard
                  bookmark={currentBookmark}
                  onUpdate={handleUpdateBookmark}
                  onDelete={handleDeleteBookmark}
                  showActions={true}
                />
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </AuthGuard>
  )
}