'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Stats {
  overview: {
    totalBookmarks: number
    todoCount: number
    reviewedCount: number
    archivedCount: number
    discardedCount: number
    totalTags: number
    processedCount: number
    productivityRate: number
  }
  recentBookmarks: Array<{
    id: string
    title: string
    url: string
    status: string
    createdAt: string
    faviconUrl?: string
  }>
  topTags: Array<{
    id: string
    name: string
    color?: string
    count: number
  }>
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session) {
      loadStats()
    } else {
      setIsLoading(false)
    }
  }, [session])

  const loadStats = async () => {
    try {
      const response = await fetch('/api/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // Show landing page for unauthenticated users
  if (!session) {
    return (
      <div className="space-y-12">
        {/* Hero Section */}
        <div className="text-center py-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Organize Your Digital Knowledge
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Transform your chaotic bookmark collection into an organized, actionable knowledge base 
            with our streamlined review workflow. Never lose track of valuable content again.
          </p>
          <div className="space-x-4">
            <Link href="/auth/signup">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Get Started Free
              </button>
            </Link>
            <Link href="/auth/signin">
              <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                Sign In
              </button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Organization</h3>
            <p className="text-gray-600">
              Automatically categorize bookmarks with tags, priorities, and smart search.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Review Workflow</h3>
            <p className="text-gray-600">
              Process your reading queue efficiently with our dedicated todo system.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Track Progress</h3>
            <p className="text-gray-600">
              Monitor your reading habits and productivity with detailed analytics.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-blue-50 py-12 rounded-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to get organized?
          </h2>
          <p className="text-gray-600 mb-6">
            Join thousands of users who have transformed their bookmark chaos into organized knowledge.
          </p>
          <Link href="/auth/signup">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Start Your Free Account
            </button>
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to Bookmark Manager
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Transform your chaotic bookmark collection into an organized, actionable knowledge base 
          with our streamlined review workflow.
        </p>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Bookmarks</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.overview.totalBookmarks || 0}
              </p>
            </div>
            <div className="text-blue-500 text-2xl">📚</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">To Review</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats?.overview.todoCount || 0}
              </p>
            </div>
            <div className="text-orange-500 text-2xl">📝</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Processed</p>
              <p className="text-2xl font-bold text-green-600">
                {stats?.overview.processedCount || 0}
              </p>
            </div>
            <div className="text-green-500 text-2xl">✅</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Tags</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats?.overview.totalTags || 0}
              </p>
            </div>
            <div className="text-purple-500 text-2xl">🏷️</div>
          </div>
        </div>
      </div>

      {/* Productivity Rate */}
      {stats && stats.overview.totalBookmarks > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Productivity Overview
          </h3>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{stats.overview.productivityRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.overview.productivityRate}%` }}
                ></div>
              </div>
            </div>
            <div className="text-right text-sm text-gray-600">
              {stats.overview.processedCount} of {stats.overview.totalBookmarks} processed
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href="/bookmarks"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <div className="text-2xl mr-3">➕</div>
            <div>
              <div className="font-medium text-gray-900">Manage Bookmarks</div>
              <div className="text-sm text-gray-600">View and organize all bookmarks</div>
            </div>
          </Link>

          <Link
            href="/todo"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors"
          >
            <div className="text-2xl mr-3">📝</div>
            <div>
              <div className="font-medium text-gray-900">Review Queue</div>
              <div className="text-sm text-gray-600">
                Process {stats?.overview.todoCount || 0} pending items
              </div>
            </div>
          </Link>

          <div className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg opacity-50">
            <div className="text-2xl mr-3">📊</div>
            <div>
              <div className="font-medium text-gray-900">Import Bookmarks</div>
              <div className="text-sm text-gray-600">Coming soon...</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {stats?.recentBookmarks && stats.recentBookmarks.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookmarks</h3>
            <div className="space-y-3">
              {stats.recentBookmarks.map(bookmark => (
                <div key={bookmark.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
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
                    <div className="font-medium text-gray-900 truncate">{bookmark.title}</div>
                    <div className="text-sm text-gray-500">{bookmark.status}</div>
                  </div>
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Visit
                  </a>
                </div>
              ))}
            </div>
          </div>

          {stats.topTags && stats.topTags.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Tags</h3>
              <div className="space-y-2">
                {stats.topTags.map(tag => (
                  <div key={tag.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <span
                      className="px-2 py-1 text-sm rounded-full"
                      style={{ 
                        backgroundColor: tag.color + '20', 
                        color: tag.color || '#6b7280',
                        border: `1px solid ${tag.color || '#d1d5db'}`
                      }}
                    >
                      #{tag.name}
                    </span>
                    <span className="text-sm text-gray-500">{tag.count} bookmarks</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {stats && stats.overview.totalBookmarks === 0 && (
        <div className="bg-blue-50 border border-blue-200 p-8 rounded-lg text-center">
          <div className="text-blue-500 mb-4 text-4xl">🚀</div>
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Ready to get started!</h4>
            <p className="text-blue-700 mb-4">
              Add your first bookmark to begin organizing your digital knowledge.
            </p>
            <Link href="/bookmarks">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                Add First Bookmark
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}