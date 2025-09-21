// src/app/courses/[id]/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/database';

interface CoursePageProps {
  params: Promise<{ id: string }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { id } = await params;
  const course = await db.courses.findById(id);

  if (!course || !course.isPublished) {
    notFound();
  }

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
              <Link href="/courses" className="text-gray-600 hover:text-gray-900">
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

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link href="/" className="text-gray-500 hover:text-gray-700">Home</Link>
              </li>
              <li className="text-gray-400">/</li>
              <li>
                <Link href="/courses" className="text-gray-500 hover:text-gray-700">Courses</Link>
              </li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-900">{course.title}</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Course Header */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
            <p className="text-xl text-indigo-100 mb-6">{course.description}</p>
            <div className="flex items-center space-x-6 text-indigo-200">
              <span>📚 {course.materials.length} Materials</span>
              <span>🆓 Free Course</span>
              <span>📅 Updated {course.updatedAt.toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Course Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">About This Course</h2>
              <p className="text-gray-700 mb-6">
                {course.description}
              </p>
              <p className="text-gray-600">
                This course provides comprehensive learning materials designed to help you master the subject. 
                All materials are available for free download and can be used for personal study and reference.
              </p>
            </div>

            {/* Course Materials */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Course Materials</h2>
              
              {course.materials.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-3">📄</div>
                  <p className="text-gray-600">No materials available yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {course.materials.filter(m => m.isPublished).map((material) => (
                    <div key={material.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${
                            material.type === 'pdf' ? 'bg-red-100 text-red-600' :
                            material.type === 'video' ? 'bg-blue-100 text-blue-600' :
                            material.type === 'document' ? 'bg-green-100 text-green-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {material.type === 'pdf' ? '📄' :
                             material.type === 'video' ? '🎥' :
                             material.type === 'document' ? '📖' :
                             '🔗'}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {material.title}
                            </h3>
                            <p className="text-gray-600 text-sm mb-2">
                              {material.description}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="capitalize bg-gray-100 px-2 py-1 rounded">
                                {material.type}
                              </span>
                              <span>{material.createdAt.toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {material.fileUrl && (
                            <Link
                              href={material.fileUrl}
                              className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                              target="_blank"
                            >
                              View
                            </Link>
                          )}
                          {material.downloadUrl && (
                            <a
                              href={material.downloadUrl}
                              className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                              download
                            >
                              Download
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Materials:</span>
                  <span className="font-medium">{course.materials.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium">{course.updatedAt.toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <button className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium mb-3">
                  Download All Materials
                </button>
                <button className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                  Add to Favorites
                </button>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Share This Course</h4>
                <div className="flex space-x-2">
                  <button className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors">
                    📘
                  </button>
                  <button className="bg-blue-400 text-white p-2 rounded hover:bg-blue-500 transition-colors">
                    🐦
                  </button>
                  <button className="bg-green-600 text-white p-2 rounded hover:bg-green-700 transition-colors">
                    📱
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}