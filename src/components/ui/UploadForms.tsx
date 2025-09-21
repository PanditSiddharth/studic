// src/components/UploadForms.tsx
'use client';

import { useState } from 'react';
import { Course, StudyMaterial } from '@/types';

interface CourseFormProps {
  onSubmit: (data: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'materials'>) => void;
  onCancel: () => void;
}

export function CourseForm({ onSubmit, onCancel }: CourseFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail: '',
    isPublished: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Course</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter course title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Course description"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thumbnail URL (Optional)
            </label>
            <input
              type="url"
              value={formData.thumbnail}
              onChange={(e) => setFormData(prev => ({ ...prev, thumbnail: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="publishCourse"
              checked={formData.isPublished}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
              className="mr-2"
            />
            <label htmlFor="publishCourse" className="text-sm text-gray-700">
              Publish immediately
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Course
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface MaterialFormProps {
  courses: Course[];
  onSubmit: (data: Omit<StudyMaterial, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function MaterialForm({ courses, onSubmit, onCancel }: MaterialFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'pdf' as StudyMaterial['type'],
    fileUrl: '',
    downloadUrl: '',
    isPublished: false,
    courseId: ''
  });
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    // Simulate file upload (replace with actual upload logic)
    setTimeout(() => {
      const mockUrl = `/uploads/${file.name}`;
      setFormData(prev => ({
        ...prev,
        fileUrl: mockUrl,
        downloadUrl: mockUrl,
        title: prev.title || file.name.replace(/\.[^/.]+$/, "")
      }));
      setUploading(false);
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Study Material</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Material Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as StudyMaterial['type'] }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="pdf">PDF Document</option>
              <option value="video">Video</option>
              <option value="document">Document</option>
              <option value="link">External Link</option>
              <option value="image">Image</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Material title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Brief description of the material"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Assignment
            </label>
            <select
              value={formData.courseId}
              onChange={(e) => setFormData(prev => ({ ...prev, courseId: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select a course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          {formData.type !== 'link' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {uploading ? (
                  <div>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Uploading...</p>
                  </div>
                ) : formData.fileUrl ? (
                  <div>
                    <div className="text-green-600 text-2xl mb-2">✓</div>
                    <p className="text-sm text-gray-600">File uploaded successfully</p>
                    <p className="text-xs text-gray-500 mt-1">{formData.fileUrl}</p>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="fileUpload"
                      accept={
                        formData.type === 'pdf' ? '.pdf' :
                        formData.type === 'video' ? '.mp4,.avi,.mov' :
                        formData.type === 'image' ? '.jpg,.jpeg,.png,.gif' :
                        '*'
                      }
                    />
                    <label htmlFor="fileUpload" className="cursor-pointer">
                      <div className="text-gray-400 text-4xl mb-2">📁</div>
                      <p className="text-sm text-gray-600">Click to upload file</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.type === 'pdf' && 'PDF files only'}
                        {formData.type === 'video' && 'MP4, AVI, MOV files'}
                        {formData.type === 'image' && 'JPG, PNG, GIF files'}
                        {formData.type === 'document' && 'DOC, DOCX, TXT files'}
                      </p>
                    </label>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                External URL
              </label>
              <input
                type="url"
                value={formData.fileUrl}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  fileUrl: e.target.value, 
                  downloadUrl: e.target.value 
                }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://example.com/resource"
                required
              />
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="publishMaterial"
              checked={formData.isPublished}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
              className="mr-2"
            />
            <label htmlFor="publishMaterial" className="text-sm text-gray-700">
              Publish immediately
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={uploading || (!formData.fileUrl && formData.type !== 'link')}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Upload Material
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}