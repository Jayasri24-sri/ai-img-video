'use client';

import { useState } from 'react';

interface UploadResult {
  id: string;
  analysis: string;
  type: string;
  filename: string;
}

export default function FileUpload({ onUploadSuccess }: { onUploadSuccess: (result: UploadResult) => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'text' | 'image' | 'video'>('text');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);

      // Auto-detect file type
      if (file.type.startsWith('image/')) {
        setFileType('image');
      } else if (file.type.startsWith('video/')) {
        setFileType('video');
      } else if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
        setFileType('text');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', fileType);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      onUploadSuccess(data);
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#40414f] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-md">
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          File Type
        </label>
        <div className="flex gap-2">
          {['text', 'image', 'video'].map((type) => (
            <button
              key={type}
              onClick={() => setFileType(type as 'text' | 'image' | 'video')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                fileType === type
                  ? 'bg-[#10a37f] text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-[#343541] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2a2b32]'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Choose File
        </label>
        <div className="relative">
          <input
            id="file-input"
            type="file"
            onChange={handleFileChange}
            accept={
              fileType === 'text'
                ? '.txt,text/*'
                : fileType === 'image'
                ? 'image/*'
                : 'video/*'
            }
            className="block w-full text-sm text-gray-900 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-[#343541] focus:outline-none focus:ring-2 focus:ring-[#10a37f] focus:border-transparent transition-all duration-200 file:mr-4 file:py-2.5 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 dark:file:bg-[#2a2b32] file:text-gray-700 dark:file:text-gray-300 hover:file:bg-gray-200 dark:hover:file:bg-[#1f2023]"
          />
        </div>
      </div>

      {selectedFile && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {(selectedFile.size / 1024).toFixed(2)} KB • {fileType}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 animate-fade-in">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        className="w-full bg-[#10a37f] hover:bg-[#0d8a6a] disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-500 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none flex items-center justify-center gap-2"
      >
        {uploading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Analyzing...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Upload and Analyze</span>
          </>
        )}
      </button>
    </div>
  );
}