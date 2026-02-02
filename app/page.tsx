export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
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
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <div className="text-blue-500">
              📚
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">To Review</p>
              <p className="text-2xl font-bold text-orange-600">0</p>
            </div>
            <div className="text-orange-500">
              📝
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Reviewed</p>
              <p className="text-2xl font-bold text-green-600">0</p>
            </div>
            <div className="text-green-500">
              ✅
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Tags</p>
              <p className="text-2xl font-bold text-purple-600">0</p>
            </div>
            <div className="text-purple-500">
              🏷️
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <div className="text-2xl mr-3">➕</div>
            <div>
              <div className="font-medium text-gray-900">Add Bookmark</div>
              <div className="text-sm text-gray-600">Save a new link</div>
            </div>
          </button>

          <button className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors">
            <div className="text-2xl mr-3">📝</div>
            <div>
              <div className="font-medium text-gray-900">Review Queue</div>
              <div className="text-sm text-gray-600">Process saved bookmarks</div>
            </div>
          </button>

          <button className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors">
            <div className="text-2xl mr-3">📊</div>
            <div>
              <div className="font-medium text-gray-900">Import Bookmarks</div>
              <div className="text-sm text-gray-600">Upload browser bookmarks</div>
            </div>
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <div className="flex">
          <div className="text-blue-500 mr-3">🚧</div>
          <div>
            <h4 className="font-medium text-blue-900">Development in Progress</h4>
            <p className="text-sm text-blue-700 mt-1">
              This is the initial MVP version. Core features are being implemented.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}