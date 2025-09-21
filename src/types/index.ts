// src/types/index.ts
export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  materials: StudyMaterial[];
}

export interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  type: 'pdf' | 'video' | 'document' | 'link' | 'image';
  fileUrl?: string;
  downloadUrl?: string;
  isPublished: boolean;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

export interface UploadResponse {
  success: boolean;
  fileUrl?: string;
  message?: string;
}