// src/app/courses/page.tsx
import Link from 'next/link';
import { db } from '@/lib/database';

export default async function CoursesPage() {
  const courses = await db.courses.findPublished();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              StudIC
            </Link>
            <nav className="flex items-center space-x-8">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Home
              </Link>
              <Link href="/courses" className="text-indigo-600 font-medium">
                Courses
              </Link>
              <Link href="/materials" className="text-gray-600 hover:text-gray-900">
                Materials
              </Link>
              <Link href="/admin" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                Admin
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">All Courses</h1>
          <p className="mt-2 text-gray-600">
            Explore our comprehensive collection of courses and learning materials
          </p>
        </div>
      </div>

      {/* Courses Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {courses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses available</h3>
            <p className="text-gray-600">Check back soon for new educational content!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                {/* Course Image */}
                <div className="h-48 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
                  <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-white text-indigo-600 px-2 py-1 rounded text-sm font-medium">
                      {course.materials.length} Materials
                    </span>
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {course.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {course.description}
                  </p>
                  
                  {/* Course Meta */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>Updated {course.updatedAt.toLocaleDateString()}</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                      Free
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <Link 
                      href={`/courses/${course.id}`}
                      className="flex-1 bg-indigo-600 text-white text-center py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                      View Course
                    </Link>
                    <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                      ♡
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More (if needed) */}
        {courses.length > 6 && (
          <div className="text-center mt-12">
            <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
              Load More Courses
            </button>
          </div>
        )}
      </main>
    </div>
  );
}