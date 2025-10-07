'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import ResultsDisplay from '@/components/ResultsDisplay';

interface UploadResult {
  id: string;
  analysis: string;
  type: string;
  filename: string;
}

export default function Home() {
  const [latestResult, setLatestResult] = useState<UploadResult | null>(null);

  const handleUploadSuccess = (result: UploadResult) => {
    setLatestResult(result);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#343541]">
      <div className="flex flex-col h-screen">
        {/* Header */}
        <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#343541]">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center">
              <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
                Multi-Modal AI Analysis
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Powered by Cloudflare Workers AI • Llama 4 Scout
              </p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#343541]">
          <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="space-y-6">
              <FileUpload onUploadSuccess={handleUploadSuccess} />
              <ResultsDisplay latestResult={latestResult} />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#343541] py-4">
          <div className="container mx-auto px-4">
            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              Built with Next.js, Cloudflare Workers AI, and R2 Storage
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}