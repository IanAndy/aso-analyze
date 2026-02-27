'use client';

import { useState, useEffect } from 'react';

interface AnalysisResult {
  difficulty?: {
    titleMatches?: { exact: number; broad: number; partial: number; none: number; score: number };
    competitors?: { count: number; score: number };
    installs?: { avg: number; score: number };
    rating?: { avg: number; score: number };
    age?: { avgDaysSinceUpdated: number; score: number };
    score?: number;
  };
  traffic?: {
    suggest?: { score: number };
    ranked?: { count: number; avgRank: number; score: number };
    installs?: { avg: number; score: number };
    length?: { length: number; score: number };
    score?: number;
  };
  suggestions?: string[];
  [key: string]: any;
}

export default function GooglePlayASOAnalyzer() {
  const [keyword, setKeyword] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // Fix hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load history from localStorage only on client (separate useEffect)
  useEffect(() => {
    if (mounted) {
      const savedHistory = localStorage.getItem('aso-search-history');
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Failed to parse history', e);
        }
      }
    }
  }, [mounted]);

  // Save history to localStorage when it changes
  useEffect(() => {
    if (mounted && history.length > 0) {
      localStorage.setItem('aso-search-history', JSON.stringify(history));
    }
  }, [history, mounted]);

  const analyzeKeyword = async (searchTerm: string = keyword) => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/aso/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword: searchTerm }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `HTTP error ${response.status}`
        }));
        throw new Error(errorData.error || 'Failed to analyze keyword');
      }

      const result = await response.json();
      setAnalysis(result);

      // Update history
      setHistory(prev => {
        const newHistory = [searchTerm, ...prev.filter(k => k !== searchTerm)].slice(0, 5);
        return newHistory;
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    analyzeKeyword();
  };

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined) return 'N/A';
    if (num > 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num > 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Return a consistent loading skeleton for server and first client render
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-800 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header Skeleton */}
          <div className="text-center mb-8">
            <div className="h-8 bg-gray-700 rounded w-64 mx-auto mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-700 rounded w-96 mx-auto animate-pulse"></div>
          </div>

          {/* Search Form Skeleton */}
          <div className="mb-8">
            <div className="flex gap-3 max-w-2xl mx-auto">
              <div className="flex-1 h-12 bg-gray-700 rounded-lg animate-pulse"></div>
              <div className="w-[120px] h-12 bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Google Play ASO Analyzer
          </h1>
          <p className="text-gray-300">
            Powered by Next.js API Routes + aso-v2
          </p>
        </div>

        {/* Search History */}
        {history.length > 0 && (
          <div className="mb-4 flex justify-center gap-2 flex-wrap">
            {history.map((term, idx) => (
              <button
                key={`${term}-${idx}`}
                onClick={() => {
                  setKeyword(term);
                  analyzeKeyword(term);
                }}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-full shadow-sm transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        )}

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-3 max-w-2xl mx-auto">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter a keyword (e.g., fitness app, meditation)"
              className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm placeholder-gray-400"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !keyword.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 transition-colors min-w-[120px] font-medium shadow-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Loading
                </span>
              ) : 'Analyze'}
            </button>
          </div>
        </form>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg max-w-2xl mx-auto">
            <p className="text-red-200 font-medium">Error: {error}</p>
            <p className="text-red-300 text-sm mt-1">Please try again with a different keyword</p>
          </div>
        )}

        {/* Results */}
        {analysis && (
          <div className="bg-gray-900 rounded-xl shadow-lg p-6 animate-fadeIn border border-gray-700">
            {/* Difficulty Section */}
            {analysis.difficulty && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-3">Difficulty Analysis</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {analysis.difficulty.titleMatches && (
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <p className="text-sm text-gray-400">Title Matches</p>
                      <p className="text-lg font-semibold text-white">
                        {analysis.difficulty.titleMatches.score?.toFixed(1) ?? 'N/A'}/10
                      </p>
                    </div>
                  )}
                  {analysis.difficulty.competitors && (
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <p className="text-sm text-gray-400">Competitors</p>
                      <p className="text-lg font-semibold text-white">
                        {analysis.difficulty.competitors.count ?? 'N/A'}
                      </p>
                    </div>
                  )}
                  {analysis.difficulty.installs && (
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <p className="text-sm text-gray-400">Avg Installs</p>
                      <p className="text-lg font-semibold text-white">
                        {formatNumber(analysis.difficulty.installs.avg)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Traffic Section */}
            {analysis.traffic && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-3">Traffic Analysis</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {analysis.traffic.ranked && (
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <p className="text-sm text-gray-400">Ranked Keywords</p>
                      <p className="text-lg font-semibold text-white">
                        {analysis.traffic.ranked.count ?? 'N/A'}
                      </p>
                    </div>
                  )}
                  {analysis.traffic.installs && (
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <p className="text-sm text-gray-400">Traffic Installs</p>
                      <p className="text-lg font-semibold text-white">
                        {formatNumber(analysis.traffic.installs.avg)}
                      </p>
                    </div>
                  )}
                  {analysis.traffic.length && (
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <p className="text-sm text-gray-400">Keyword Length</p>
                      <p className="text-lg font-semibold text-white">
                        {analysis.traffic.length.length ?? 'N/A'} chars
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Overall Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {analysis.difficulty?.score !== undefined && (
                <div className="bg-gradient-to-br from-purple-900 to-purple-800 p-4 rounded-lg">
                  <h3 className="text-sm text-purple-200 mb-1">Overall Difficulty</h3>
                  <p className="text-2xl font-bold text-white">
                    {analysis.difficulty.score.toFixed(1)}/10
                  </p>
                </div>
              )}
              {analysis.traffic?.score !== undefined && (
                <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-4 rounded-lg">
                  <h3 className="text-sm text-blue-200 mb-1">Overall Traffic</h3>
                  <p className="text-2xl font-bold text-white">
                    {analysis.traffic.score.toFixed(1)}/10
                  </p>
                </div>
              )}
            </div>

            {/* Keyword Suggestions */}
            {analysis.suggestions && analysis.suggestions.length > 0 && (
              <div className="border-t border-gray-700 pt-4">
                <h3 className="font-semibold text-white mb-3">Related Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.suggestions.slice(0, 15).map((suggestion, idx) => (
                    <button
                      key={`${suggestion}-${idx}`}
                      onClick={() => {
                        setKeyword(suggestion);
                        analyzeKeyword(suggestion);
                      }}
                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-full text-sm transition-all border border-gray-700"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Raw Data (optional) */}
            <details className="mt-4 text-sm">
              <summary className="cursor-pointer text-gray-400 hover:text-white">
                View Raw JSON Data
              </summary>
              <div className="mt-2 overflow-x-auto">
                <pre className="bg-gray-950 text-gray-300 p-4 rounded-lg text-xs border border-gray-700">
                  {JSON.stringify(analysis, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}