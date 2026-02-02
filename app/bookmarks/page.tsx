'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { BookmarkCard } from '@/components/BookmarkCard'
import { AddBookmarkForm } from '@/components/AddBookmarkForm'
import { EditBookmarkForm } from '@/components/EditBookmarkForm'
import { BulkUploadBookmarks } from '@/components/BulkUploadBookmarks'
import { AIBookmarkExtractor } from '@/components/AIBookmarkExtractor'
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

export default function BookmarksPage() {
  const searchParams = useSearchParams()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [showAIExtractor, setShowAIExtractor] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    tag: ''
  })

  // Load bookmarks on mount
  useEffect(() => {
    loadBookmarks()
  }, [])

  // Read URL params and set initial filters
  useEffect(() => {
    const tagParam = searchParams.get('tag')
    if (tagParam) {
      setFilters(prev => ({ ...prev, tag: tagParam }))
    }
  }, [searchParams])

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

    if (filters.status) {
      filtered = filtered.filter(bookmark => bookmark.status === filters.status)
    }

    if (filters.priority) {
      filtered = filtered.filter(bookmark => bookmark.priority === filters.priority)
    }

    if (filters.tag) {
      filtered = filtered.filter(bookmark => 
        bookmark.tags.some(tag => tag.name.toLowerCase() === filters.tag.toLowerCase())
      )
    }

    setFilteredBookmarks(filtered)
  }, [bookmarks, filters])

  const loadBookmarks = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/bookmarks')
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

  const handleAddBookmark = async (bookmarkData: any) => {
    const response = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookmarkData)
    })

    if (response.ok) {
      const newBookmark = await response.json()
      setBookmarks(prev => [newBookmark, ...prev])
      setShowAddForm(false)
    } else {
      throw new Error('Failed to add bookmark')
    }
  }

  const handleEditBookmark = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark)
    setShowAddForm(false)
    setShowBulkUpload(false)
    setShowAIExtractor(false)
  }

  const handleUpdateBookmark = async (id: string, data: Partial<Bookmark>) => {
    const response = await fetch(`/api/bookmarks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (response.ok) {
      const updatedBookmark = await response.json()
      setBookmarks(prev => 
        prev.map(bookmark => 
          bookmark.id === id ? updatedBookmark : bookmark
        )
      )
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

  const handleSelectAll = () => {
    setSelectedBookmarks(new Set(filteredBookmarks.map(b => b.id)))
  }

  const handleDeselectAll = () => {
    setSelectedBookmarks(new Set())
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
      await loadBookmarks()
      setSelectedBookmarks(new Set())
    } else {
      console.error('Bulk action failed')
    }
  }

  const handleBulkImport = async (bookmarks: any[]) => {
    const response = await fetch('/api/bookmarks/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookmarks })
    })

    if (response.ok) {
      const result = await response.json()
      console.log('Import result:', result)
      await loadBookmarks()
      setShowBulkUpload(false)
      
      // Show success message (you might want to add a toast notification here)
      alert(`Import complete! ${result.summary}`)
    } else {
      const error = await response.json()
      throw new Error(error.error || 'Failed to import bookmarks')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading bookmarks...</div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Bookmarks</h1>
          <p className="text-gray-600">
            {filteredBookmarks.length} of {bookmarks.length} bookmarks
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowAIExtractor(true)}
            disabled={showAddForm || showBulkUpload || editingBookmark}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 hover:from-blue-600 hover:to-purple-600"
          >
            🤖 AI Assistant
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowBulkUpload(true)}
            disabled={showAddForm || showAIExtractor || editingBookmark}
          >
            📤 Bulk Import
          </Button>
          <Button 
            onClick={() => setShowAddForm(true)}
            disabled={showBulkUpload || showAIExtractor || editingBookmark}
          >
            ➕ Add Bookmark
          </Button>
        </div>
      </div>

      {/* AI Bookmark Extractor */}
      {showAIExtractor && (
        <div className="relative">
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAIExtractor(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </Button>
          </div>
          <AIBookmarkExtractor
            onBookmarkCreated={() => {
              loadBookmarks()
              setShowAIExtractor(false)
            }}
          />
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <AddBookmarkForm
          onAdd={handleAddBookmark}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Edit Form */}
      {editingBookmark && (
        <EditBookmarkForm
          bookmark={editingBookmark}
          onUpdate={handleUpdateBookmark}
          onCancel={() => setEditingBookmark(null)}
        />
      )}

      {/* Bulk Upload */}
      {showBulkUpload && (
        <BulkUploadBookmarks
          onUpload={handleBulkImport}
          onCancel={() => setShowBulkUpload(false)}
        />
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <Input
              placeholder="Search bookmarks..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="TODO">Todo</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="ARCHIVED">Archived</option>
              <option value="DISCARDED">Discarded</option>
            </select>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tag
            </label>
            <Input
              placeholder="Filter by tag..."
              value={filters.tag}
              onChange={(e) => setFilters(prev => ({ ...prev, tag: e.target.value }))}
            />
          </div>
        </div>
      </div>

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
                Mark Reviewed
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkAction('archive')}
              >
                Archive
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkAction('discard')}
              >
                Discard
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkAction('delete')}
                className="text-red-600"
              >
                Delete
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleDeselectAll}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Selection Controls */}
      {filteredBookmarks.length > 0 && (
        <div className="flex items-center space-x-4 text-sm">
          <button
            onClick={handleSelectAll}
            className="text-blue-600 hover:text-blue-800"
          >
            Select All ({filteredBookmarks.length})
          </button>
          {selectedBookmarks.size > 0 && (
            <button
              onClick={handleDeselectAll}
              className="text-gray-600 hover:text-gray-800"
            >
              Deselect All
            </button>
          )}
        </div>
      )}

      {/* Bookmarks Grid */}
      {filteredBookmarks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {bookmarks.length === 0 ? 'No bookmarks yet' : 'No bookmarks match your filters'}
          </div>
          {bookmarks.length === 0 && (
            <Button onClick={() => setShowAddForm(true)}>
              Add your first bookmark
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBookmarks.map(bookmark => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onUpdate={handleUpdateBookmark}
              onDelete={handleDeleteBookmark}
              onEdit={handleEditBookmark}
              isSelected={selectedBookmarks.has(bookmark.id)}
              onSelect={handleSelectBookmark}
            />
          ))}
        </div>
      )}
      </div>
    </AuthGuard>
  )
}