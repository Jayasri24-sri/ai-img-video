'use client';

import { useState, useEffect } from 'react';

interface Result {
  id: string;
  analysis: string;
  type: string;
  filename: string;
}

interface StoredItem {
  id: string;
  document: string;
  metadata: {
    type: string;
    filename: string;
    content: string;
    timestamp: string;
  };
}

export default function ResultsDisplay({ latestResult }: { latestResult: Result | null }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchAnswer, setSearchAnswer] = useState<string>('');
  const [filesAnalyzed, setFilesAnalyzed] = useState<number>(0);
  const [allResults, setAllResults] = useState<StoredItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch all results on component mount
  useEffect(() => {
    fetchAllResults();
  }, []);

  // Add latest result to the list when it changes
  useEffect(() => {
    if (latestResult) {
      fetchAllResults();
    }
  }, [latestResult]);

  const fetchAllResults = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/results');
      const data = await response.json();
      if (data.success) {
        setAllResults(data.items);
      }
    } catch (error) {
      console.error('Failed to fetch results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchAnswer(''); // Clear previous answer
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      const data = await response.json();
      if (data.success) {
        setSearchAnswer(data.answer);
        setFilesAnalyzed(data.filesAnalyzed);
      } else {
        setSearchAnswer('Failed to get answer. Please try again.');
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchAnswer('An error occurred while searching. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/delete?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        // Refresh the file list
        await fetchAllResults();
      } else {
        alert('Failed to delete file. Please try again.');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('An error occurred while deleting. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'image':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'video':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'text':
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';
      case 'image':
        return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300';
      case 'video':
        return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Latest Upload Confirmation */}
      {latestResult && (
        <div className="bg-gradient-to-r from-[#10a37f]/10 to-[#10a37f]/5 dark:from-[#10a37f]/20 dark:to-[#10a37f]/10 rounded-xl border border-[#10a37f]/20 dark:border-[#10a37f]/30 p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-[#10a37f] rounded-full animate-pulse"></div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              File Uploaded Successfully!
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getTypeColor(latestResult.type)}`}>
              {getTypeIcon(latestResult.type)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {latestResult.filename}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Ready to search! Ask any question about your uploaded files below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="bg-white dark:bg-[#40414f] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Ask Questions About Your Files
        </h3>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Ask any question about your uploaded files..."
              className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#343541] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10a37f] focus:border-transparent transition-all duration-200"
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            className="bg-[#10a37f] hover:bg-[#0d8a6a] disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-500 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none"
          >
            {searching ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Search'
            )}
          </button>
        </div>

        {/* Answer Display */}
        {searchAnswer && (
          <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-[#10a37f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h4 className="font-semibold text-gray-900 dark:text-white">Answer</h4>
              <span className="text-xs px-2 py-1 bg-[#10a37f]/10 text-[#10a37f] dark:bg-[#10a37f]/20 dark:text-[#10a37f] rounded-full font-medium ml-auto">
                {filesAnalyzed} file{filesAnalyzed !== 1 ? 's' : ''} analyzed
              </span>
            </div>
            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
              {searchAnswer}
            </p>
          </div>
        )}
      </div>

      {/* All Uploaded Files */}
      <div className="bg-white dark:bg-[#40414f] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Uploaded Files {allResults.length > 0 && `(${allResults.length})`}
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-[#10a37f]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : allResults.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              No files uploaded yet. Upload files to start asking questions!
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
            {allResults.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-gray-50 dark:bg-[#343541] rounded-lg border border-gray-200 dark:border-gray-600 hover:border-[#10a37f] dark:hover:border-[#10a37f] transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`p-1.5 rounded flex-shrink-0 ${getTypeColor(item.metadata.type)}`}>
                      {getTypeIcon(item.metadata.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.metadata.filename}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(item.metadata.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeColor(item.metadata.type)}`}>
                      {item.metadata.type}
                    </span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete file"
                    >
                      {deletingId === item.id ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                  {item.document}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}