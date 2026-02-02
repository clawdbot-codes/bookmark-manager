'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ParsedBookmark {
  url: string
  title: string
  description?: string
  tags: string[]
  folder?: string
}

interface BulkUploadProps {
  onUpload: (bookmarks: ParsedBookmark[]) => Promise<void>
  onCancel: () => void
}

export function BulkUploadBookmarks({ onUpload, onCancel }: BulkUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedBookmarks, setParsedBookmarks] = useState<ParsedBookmark[]>([])
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<number>>(new Set())
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadSource, setUploadSource] = useState<'file' | 'csv'>('file')
  const [csvData, setCsvData] = useState('')

  const parseBookmarkFile = async (file: File): Promise<ParsedBookmark[]> => {
    const text = await file.text()
    const bookmarks: ParsedBookmark[] = []

    if (file.name.endsWith('.html') || file.type === 'text/html') {
      // Parse HTML bookmark file (Chrome, Firefox, Safari export format)
      const parser = new DOMParser()
      const doc = parser.parseFromString(text, 'text/html')
      const links = doc.querySelectorAll('a[href]')
      
      links.forEach((link) => {
        const url = link.getAttribute('href')
        const title = link.textContent?.trim()
        
        if (url && title && (url.startsWith('http') || url.startsWith('https'))) {
          // Extract folder structure from DT/DL elements
          let folder = ''
          let parent = link.parentElement
          while (parent) {
            const prevH3 = parent.querySelector('h3')
            if (prevH3 && prevH3.textContent) {
              folder = prevH3.textContent.trim()
              break
            }
            parent = parent.parentElement
          }

          bookmarks.push({
            url,
            title,
            tags: folder ? [folder.toLowerCase()] : [],
            folder
          })
        }
      })
    } else if (file.name.endsWith('.json') || file.type === 'application/json') {
      // Parse JSON bookmark file
      try {
        const data = JSON.parse(text)
        
        // Handle different JSON formats (Chrome, Firefox, etc.)
        const extractBookmarksFromJSON = (obj: any, folder = ''): void => {
          if (obj.type === 'url' && obj.url) {
            bookmarks.push({
              url: obj.url,
              title: obj.name || obj.title || obj.url,
              tags: folder ? [folder.toLowerCase()] : [],
              folder
            })
          } else if (obj.children || obj.roots) {
            const children = obj.children || Object.values(obj.roots || {})
            const currentFolder = obj.name || folder
            
            children.forEach((child: any) => {
              extractBookmarksFromJSON(child, currentFolder)
            })
          }
        }

        extractBookmarksFromJSON(data)
      } catch (e) {
        throw new Error('Invalid JSON format')
      }
    } else {
      throw new Error('Unsupported file format. Please upload HTML or JSON bookmark files.')
    }

    return bookmarks
  }

  const parseCsvData = (csvText: string): ParsedBookmark[] => {
    const lines = csvText.trim().split('\n')
    const bookmarks: ParsedBookmark[] = []
    
    // Skip header row if it exists
    const startIndex = lines[0].includes('url') || lines[0].includes('URL') ? 1 : 0
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      // Simple CSV parser (handles quoted fields)
      const fields = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || []
      const cleanFields = fields.map(field => field.replace(/^"|"$/g, '').trim())
      
      if (cleanFields.length >= 2) {
        const [url, title, description, tags] = cleanFields
        
        if (url && title && (url.startsWith('http') || url.startsWith('https'))) {
          bookmarks.push({
            url,
            title,
            description: description || undefined,
            tags: tags ? tags.split(';').map(tag => tag.trim()).filter(Boolean) : []
          })
        }
      }
    }
    
    return bookmarks
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setError(null)
    setIsProcessing(true)

    try {
      const bookmarks = await parseBookmarkFile(selectedFile)
      setParsedBookmarks(bookmarks)
      setSelectedBookmarks(new Set(bookmarks.map((_, index) => index)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file')
      setParsedBookmarks([])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCsvProcess = () => {
    if (!csvData.trim()) return

    setError(null)
    setIsProcessing(true)

    try {
      const bookmarks = parseCsvData(csvData)
      setParsedBookmarks(bookmarks)
      setSelectedBookmarks(new Set(bookmarks.map((_, index) => index)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV data')
      setParsedBookmarks([])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBookmarkToggle = (index: number) => {
    setSelectedBookmarks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    setSelectedBookmarks(new Set(parsedBookmarks.map((_, index) => index)))
  }

  const handleDeselectAll = () => {
    setSelectedBookmarks(new Set())
  }

  const handleUpload = async () => {
    const selectedBookmarksList = parsedBookmarks.filter((_, index) => 
      selectedBookmarks.has(index)
    )

    if (selectedBookmarksList.length === 0) {
      setError('Please select at least one bookmark to import')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      await onUpload(selectedBookmarksList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload bookmarks')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6 max-w-4xl mx-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Import Bookmarks</h3>
      
      {/* Upload Method Selection */}
      <div className="mb-6">
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setUploadSource('file')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              uploadSource === 'file'
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📁 Upload File
          </button>
          <button
            onClick={() => setUploadSource('csv')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              uploadSource === 'csv'
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📊 Paste CSV
          </button>
        </div>

        {uploadSource === 'file' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select bookmark file (HTML, JSON)
            </label>
            <Input
              type="file"
              accept=".html,.json,.csv"
              onChange={handleFileChange}
              className="mb-2"
            />
            <p className="text-xs text-gray-500">
              Supports browser bookmark exports (Chrome, Firefox, Safari, Edge)
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste CSV data (URL, Title, Description, Tags)
            </label>
            <textarea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder="url,title,description,tags&#10;https://example.com,Example Site,A great example,web;tutorial&#10;https://react.dev,React Docs,Official React documentation,react;docs"
              rows={6}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                Format: URL, Title, Description, Tags (separated by semicolons)
              </p>
              <Button onClick={handleCsvProcess} disabled={!csvData.trim() || isProcessing}>
                Process CSV
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="text-center py-4">
          <div className="text-gray-500">Processing file...</div>
        </div>
      )}

      {/* Parsed Bookmarks Preview */}
      {parsedBookmarks.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-gray-900">
              Found {parsedBookmarks.length} bookmark(s)
            </h4>
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                Deselect All
              </Button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
            <div className="space-y-2 p-3">
              {parsedBookmarks.map((bookmark, index) => (
                <div 
                  key={index}
                  className={`flex items-center space-x-3 p-2 rounded ${
                    selectedBookmarks.has(index) ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedBookmarks.has(index)}
                    onChange={() => handleBookmarkToggle(index)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {bookmark.title}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {bookmark.url}
                    </div>
                    {bookmark.folder && (
                      <div className="text-xs text-blue-600">
                        📁 {bookmark.folder}
                      </div>
                    )}
                    {bookmark.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {bookmark.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Selected: {selectedBookmarks.size} of {parsedBookmarks.length} bookmarks
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isUploading}
        >
          Cancel
        </Button>
        {parsedBookmarks.length > 0 && (
          <Button
            onClick={handleUpload}
            disabled={isUploading || selectedBookmarks.size === 0}
          >
            {isUploading 
              ? 'Importing...' 
              : `Import ${selectedBookmarks.size} Bookmark${selectedBookmarks.size !== 1 ? 's' : ''}`
            }
          </Button>
        )}
      </div>
    </div>
  )
}