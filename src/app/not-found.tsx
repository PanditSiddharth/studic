// src/app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">📚</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404 - Page Not Found</h1>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="space-x-4">
          <Link 
            href="/"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors inline-block"
          >
            Go Home
          </Link>
          <Link 
            href="/courses"
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors inline-block"
          >
            Browse Courses
          </Link>
        </div>
      </div>
    </div>
  );
}