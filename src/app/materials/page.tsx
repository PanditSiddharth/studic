// src/app/materials/page.tsx
import Link from 'next/link';
import { db } from '@/lib/database';

export default async function MaterialsPage() {
  const materials = await db.materials.findPublished();
  const courses = await db.courses.findPublished();

  // Group materials by type
  const materialsByType = materials.reduce((acc, material) => {
    if (!acc[material.type]) {
      acc[material.type] = [];
    }
    acc[material.type].push(material);
    return acc;
  }, {} as Record<string, typeof materials>);

  const typeIcons = {
    pdf: '📄',
    video: '🎥',
    document: '📖',
    link: '🔗',
    image: '🖼️'
  };

  const typeColors = {
    pdf: 'from-red-500 to-red-600',
    video: 'from-blue-500 to-blue-600',
    document: 'from-green-500 to-green-600',
    link: 'from-purple-500 to-purple-600',
    image: 'from-yellow-500 to-yellow-600'
  };

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
              <Link href="/materials" className="text-indigo-600 font-medium">
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
          <h1 className="text-3xl font-bold text-gray-900">Study Materials</h1>
          <p className="mt-2 text-gray-600">
            Browse and download free educational resources organized by type
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-indigo-600">{materials.length}</div>
            <div className="text-sm text-gray-600">Total Materials</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{courses.length}</div>
            <div className="text-sm text-gray-600">Active Courses</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">{Object.keys(materialsByType).length}</div>
            <div className="text-sm text-gray-600">Content Types</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">100%</div>
            <div className="text-sm text-gray-600">Free Access</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-wrap gap-2">
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium">
              All Materials
            </button>
            {Object.keys(materialsByType).map((type) => (
              <button 
                key={type}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors capitalize"
              >
                {typeIcons[type as keyof typeof typeIcons]} {type}s ({materialsByType[type].length})
              </button>
            ))}
          </div>
        </div>

        {materials.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No materials available</h3>
            <p className="text-gray-600">Check back soon for new study resources!</p>
          </div>
        ) : (
          <>
            {/* Materials by Type */}
            {Object.entries(materialsByType).map(([type, typeMaterials]) => (
              <div key={type} className="mb-12">
                <div className="flex items-center mb-6">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${typeColors[type as keyof typeof typeColors]} flex items-center justify-center text-white text-2xl mr-4`}>
                    {typeIcons[type as keyof typeof typeIcons]}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 capitalize">{type} Materials</h2>
                    <p className="text-gray-600">{typeMaterials.length} items available</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {typeMaterials.map((material) => {
                    const course = courses.find(c => c.id === material.courseId);
                    return (
                      <div key={material.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                        <div className={`h-32 bg-gradient-to-r ${typeColors[material.type as keyof typeof typeColors]} flex items-center justify-center`}>
                          <div className="text-white text-4xl">
                            {typeIcons[material.type as keyof typeof typeIcons]}
                          </div>
                        </div>
                        
                        <div className="p-6">
                          <div className="flex items-center mb-2">
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs capitalize">
                              {material.type}
                            </span>
                            {course && (
                              <Link 
                                href={`/courses/${course.id}`}
                                className="ml-2 text-indigo-600 hover:text-indigo-800 text-xs"
                              >
                                {course.title}
                              </Link>
                            )}
                          </div>
                          
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {material.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {material.description}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                            <span>{material.createdAt.toLocaleDateString()}</span>
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Free</span>
                          </div>

                          <div className="flex space-x-2">
                            {material.fileUrl && (
                              <Link
                                href={material.fileUrl}
                                className="flex-1 bg-blue-600 text-white text-center py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                                target="_blank"
                              >
                                View
                              </Link>
                            )}
                            {material.downloadUrl && (
                              <a
                                href={material.downloadUrl}
                                className="flex-1 bg-green-600 text-white text-center py-2 px-3 rounded text-sm hover:bg-green-700 transition-colors"
                                download
                              >
                                Download
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Load More */}
            <div className="text-center mt-12">
              <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                Load More Materials
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}