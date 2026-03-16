'use client';

import { useState } from 'react';

interface ASOResponse {
  keyword: string;
  country: string;
  language: string;
  difficulty: {
    overall: number;
    titleMatches: {
      exact: number;
      broad: number;
      partial: number;
      none: number;
    };
    competitors: {
      count: number;
      strength: number;
    };
  };
  traffic: {
    overall: number;
    suggestions: number;
    ranking: {
      count: number;
      avgRank: number;
      score: number;
    };
  };
  apps: Array<{
    rank: number;
    title: string;
    appId: string;
    icon: string;
    score: number;
    reviews: number;
    summary: string;
    installs: string;
  }>;
  suggestions: string[];
}

export default function GooglePlayASOAnalyzer() {
  const [keyword, setKeyword] = useState('');
  const [country, setCountry] = useState('us');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ASOResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const countries = [
    { code: 'us', name: 'United States' },
    { code: 'gb', name: 'United Kingdom' },
    { code: 'ca', name: 'Canada' },
    { code: 'au', name: 'Australia' },
    { code: 'in', name: 'India' },
    { code: 'de', name: 'Germany' },
    { code: 'fr', name: 'France' },
    { code: 'jp', name: 'Japan' },
    { code: 'br', name: 'Brazil' },
    { code: 'mx', name: 'Mexico' },
  ];

  const analyzeKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const params = new URLSearchParams({
        keyword: keyword.trim(),
        country,
        language: 'en' // You could add language selection too
      });

      const response = await fetch(`/api/aso/analyze?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get color based on score
  const getScoreColor = (score: number) => {
    if (score < 30) return 'text-green-600';
    if (score < 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">
            Google Play ASO Analyzer
          </h1>
          <p className="text-gray-400 text-lg">
            Analyze keyword difficulty, search volume, and competitor apps
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-700">
          <form onSubmit={analyzeKeyword} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Enter a keyword (e.g., fitness app)"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div className="w-full md:w-48">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                {countries.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !keyword.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </span>
              ) : 'Analyze Keyword'}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-6 py-4 rounded-lg mb-8">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Results */}
        {data && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Difficulty Card */}
              <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
                <h3 className="text-gray-400 text-sm font-semibold uppercase mb-2">
                  Keyword Difficulty
                </h3>
                <div className="flex items-end gap-3">
                  <span className={`text-4xl font-bold ${getScoreColor(data.difficulty.overall)}`}>
                    {data.difficulty.overall}
                  </span>
                  <span className="text-gray-400 mb-1">/100</span>
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  {data.difficulty.competitors.count} apps competing
                </p>
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>Title Matches:</span>
                    <span className="text-white">{data.difficulty.titleMatches.exact} exact, {data.difficulty.titleMatches.broad} broad</span>
                  </div>
                </div>
              </div>

              {/* Traffic Card */}
              <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
                <h3 className="text-gray-400 text-sm font-semibold uppercase mb-2">
                  Search Volume
                </h3>
                <div className="flex items-end gap-3">
                  <span className={`text-4xl font-bold ${getScoreColor(data.traffic.overall)}`}>
                    {data.traffic.overall}
                  </span>
                  <span className="text-gray-400 mb-1">/100</span>
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  {data.suggestions.length} keyword suggestions
                </p>
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>Ranking apps:</span>
                    <span className="text-white">{data.traffic.ranking.count}</span>
                  </div>
                </div>
              </div>

              {/* Suggestions Card */}
              <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
                <h3 className="text-gray-400 text-sm font-semibold uppercase mb-2">
                  Related Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {data.suggestions.slice(0, 6).map((suggestion, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-700 text-gray-300 text-sm rounded">
                      {suggestion}
                    </span>
                  ))}
                  {data.suggestions.length > 6 && (
                    <span className="px-2 py-1 bg-gray-700 text-gray-300 text-sm rounded">
                      +{data.suggestions.length - 6} more
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setKeyword(data.suggestions[0])}
                  className="mt-4 text-blue-400 hover:text-blue-300 text-sm"
                >
                  Try one →
                </button>
              </div>
            </div>

            {/* Ranking Apps Table */}
            <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">
                Top Apps Ranking for "{data.keyword}"
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Rank</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">App</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Rating</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Reviews</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Installs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.apps.slice(0, 15).map((app) => (
                      <tr key={app.appId} className="border-b border-gray-700 hover:bg-gray-750">
                        <td className="py-3 px-4 text-white font-mono">{app.rank}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {app.icon && (
                              <img src={app.icon} alt={app.title} className="w-8 h-8 rounded" />
                            )}
                            <div>
                              <div className="text-white font-medium">{app.title}</div>
                              <div className="text-gray-400 text-sm">{app.appId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-yellow-400 font-semibold">{app.score.toFixed(1)}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-300">{app.reviews.toLocaleString()}</td>
                        <td className="py-3 px-4 text-gray-300">{app.installs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}