import GooglePlayASOAnalyzer from '@/components/GooglePlayASOAnalyzer';
import { Suspense } from 'react';

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-700 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
          </div>
        </div>
      </div>
    }>
      <GooglePlayASOAnalyzer />
    </Suspense>
  );
}