'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AuthGuard from '@/components/AuthGuard'

interface Tag {
  id: string
  name: string
  color?: string
  _count?: {
    bookmarks: number
  }
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', color: '' })
  const [newTagForm, setNewTagForm] = useState({ name: '', color: '#3b82f6' })
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Load tags on mount
  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/tags')
      if (response.ok) {
        const data = await response.json()
        setTags(data.tags || [])
      } else {
        console.error('Failed to load tags')
      }
    } catch (error) {
      console.error('Error loading tags:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newTagForm.name.trim()) return

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTagForm.name.trim().toLowerCase(),
          color: newTagForm.color
        })
      })

      if (response.ok) {
        const newTag = await response.json()
        setTags(prev => [newTag, ...prev])
        setNewTagForm({ name: '', color: '#3b82f6' })
        setShowAddForm(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create tag')
      }
    } catch (error) {
      console.error('Error creating tag:', error)
      alert('Failed to create tag')
    }
  }

  const handleUpdateTag = async (tagId: string) => {
    if (!editForm.name.trim()) return

    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name.trim().toLowerCase(),
          color: editForm.color
        })
      })

      if (response.ok) {
        const updatedTag = await response.json()
        setTags(prev => prev.map(tag => tag.id === tagId ? updatedTag : tag))
        setEditingTag(null)
        setEditForm({ name: '', color: '' })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update tag')
      }
    } catch (error) {
      console.error('Error updating tag:', error)
      alert('Failed to update tag')
    }
  }

  const handleDeleteTag = async (tagId: string, tagName: string) => {
    if (!confirm(`Are you sure you want to delete the tag "${tagName}"? This will remove it from all bookmarks.`)) {
      return
    }

    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTags(prev => prev.filter(tag => tag.id !== tagId))
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete tag')
      }
    } catch (error) {
      console.error('Error deleting tag:', error)
      alert('Failed to delete tag')
    }
  }

  const startEditing = (tag: Tag) => {
    setEditingTag(tag.id)
    setEditForm({ name: tag.name, color: tag.color || '#3b82f6' })
    setShowAddForm(false)
  }

  const cancelEditing = () => {
    setEditingTag(null)
    setEditForm({ name: '', color: '' })
  }

  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading tags...</div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🏷️ Tags Management</h1>
            <p className="text-gray-600">
              {filteredTags.length} tag{filteredTags.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)} disabled={editingTag !== null}>
            ➕ Add Tag
          </Button>
        </div>

        {/* Search */}
        <div className="max-w-md">
          <Input
            placeholder="Search tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Add Tag Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Tag</h3>
            <form onSubmit={handleCreateTag} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tag Name *
                  </label>
                  <Input
                    value={newTagForm.name}
                    onChange={(e) => setNewTagForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="javascript"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={newTagForm.color}
                    onChange={(e) => setNewTagForm(prev => ({ ...prev, color: e.target.value }))}
                    className="h-9 w-full rounded-md border border-gray-300"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Tag</Button>
              </div>
            </form>
          </div>
        )}

        {/* Tags List */}
        {filteredTags.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {tags.length === 0 ? 'No tags yet' : 'No tags match your search'}
            </div>
            {tags.length === 0 && (
              <Button onClick={() => setShowAddForm(true)}>
                Create your first tag
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTags.map(tag => (
              <div key={tag.id} className="bg-white rounded-lg border shadow-sm p-4">
                {editingTag === tag.id ? (
                  /* Edit Form */
                  <div className="space-y-3">
                    <div>
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Tag name"
                      />
                    </div>
                    <div>
                      <input
                        type="color"
                        value={editForm.color}
                        onChange={(e) => setEditForm(prev => ({ ...prev, color: e.target.value }))}
                        className="h-8 w-full rounded border border-gray-300"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateTag(tag.id)}
                        disabled={!editForm.name.trim()}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Display Mode */
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: tag.color || '#6b7280' }}
                        />
                        <span className="font-medium text-gray-900">#{tag.name}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {tag._count?.bookmarks || 0} bookmark{(tag._count?.bookmarks || 0) !== 1 ? 's' : ''}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditing(tag)}
                        disabled={editingTag !== null}
                      >
                        ✏️ Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteTag(tag.id, tag.name)}
                        disabled={editingTag !== null}
                        className="text-red-600 hover:text-red-800"
                      >
                        🗑️ Delete
                      </Button>
                    </div>

                    {/* Preview */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div
                        className="inline-block px-2 py-1 text-xs rounded-full border"
                        style={{ 
                          backgroundColor: (tag.color || '#6b7280') + '20', 
                          color: tag.color || '#6b7280',
                          borderColor: tag.color || '#d1d5db'
                        }}
                      >
                        #{tag.name}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="flex">
            <div className="text-blue-500 mr-3">💡</div>
            <div>
              <h4 className="font-medium text-blue-900">Tag Management Tips</h4>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• Tags are automatically created when adding bookmarks</li>
                <li>• Use consistent naming for better organization</li>
                <li>• Colors help visually distinguish different categories</li>
                <li>• Deleting a tag removes it from all associated bookmarks</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}