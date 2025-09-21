// src/lib/database.ts
import { Course, StudyMaterial, User } from '@/types';

// Mock data storage (replace with actual database)
let courses: Course[] = [
  {
    id: '1',
    title: 'Introduction to Programming',
    description: 'Learn the fundamentals of programming with practical examples.',
    thumbnail: '/placeholder-course.jpg',
    isPublished: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    materials: []
  },
  {
    id: '2',
    title: 'Advanced Web Development',
    description: 'Master modern web development techniques and frameworks.',
    thumbnail: '/placeholder-course.jpg',
    isPublished: false,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    materials: []
  }
];

let materials: StudyMaterial[] = [
  {
    id: '1',
    title: 'Programming Basics PDF',
    description: 'Comprehensive guide to programming fundamentals',
    type: 'pdf',
    fileUrl: '/materials/programming-basics.pdf',
    downloadUrl: '/api/download/programming-basics.pdf',
    isPublished: true,
    courseId: '1',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16')
  },
  {
    id: '2',
    title: 'HTML & CSS Tutorial Video',
    description: 'Step-by-step video tutorial for web basics',
    type: 'video',
    fileUrl: '/materials/html-css-tutorial.mp4',
    isPublished: true,
    courseId: '2',
    createdAt: new Date('2024-02-02'),
    updatedAt: new Date('2024-02-02')
  }
];

// Database operations
export const db = {
  courses: {
    async findAll(): Promise<Course[]> {
      return courses.map(course => ({
        ...course,
        materials: materials.filter(m => m.courseId === course.id)
      }));
    },

    async findById(id: string): Promise<Course | null> {
      const course = courses.find(c => c.id === id);
      if (!course) return null;
      return {
        ...course,
        materials: materials.filter(m => m.courseId === id)
      };
    },

    async findPublished(): Promise<Course[]> {
      return courses
        .filter(c => c.isPublished)
        .map(course => ({
          ...course,
          materials: materials.filter(m => m.courseId === course.id && m.isPublished)
        }));
    },

    async create(data: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'materials'>): Promise<Course> {
      const newCourse: Course = {
        ...data,
        id: (courses.length + 1).toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
        materials: []
      };
      courses.push(newCourse);
      return newCourse;
    },

    async update(id: string, data: Partial<Course>): Promise<Course | null> {
      const index = courses.findIndex(c => c.id === id);
      if (index === -1) return null;
      
      courses[index] = {
        ...courses[index],
        ...data,
        updatedAt: new Date()
      };
      return this.findById(id);
    },

    async delete(id: string): Promise<boolean> {
      const index = courses.findIndex(c => c.id === id);
      if (index === -1) return false;
      courses.splice(index, 1);
      // Also delete associated materials
      materials = materials.filter(m => m.courseId !== id);
      return true;
    }
  },

  materials: {
    async findAll(): Promise<StudyMaterial[]> {
      return materials;
    },

    async findById(id: string): Promise<StudyMaterial | null> {
      return materials.find(m => m.id === id) || null;
    },

    async findByCourse(courseId: string): Promise<StudyMaterial[]> {
      return materials.filter(m => m.courseId === courseId);
    },

    async findPublished(): Promise<StudyMaterial[]> {
      return materials.filter(m => m.isPublished);
    },

    async create(data: Omit<StudyMaterial, 'id' | 'createdAt' | 'updatedAt'>): Promise<StudyMaterial> {
      const newMaterial: StudyMaterial = {
        ...data,
        id: (materials.length + 1).toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      materials.push(newMaterial);
      return newMaterial;
    },

    async update(id: string, data: Partial<StudyMaterial>): Promise<StudyMaterial | null> {
      const index = materials.findIndex(m => m.id === id);
      if (index === -1) return null;
      
      materials[index] = {
        ...materials[index],
        ...data,
        updatedAt: new Date()
      };
      return materials[index];
    },

    async delete(id: string): Promise<boolean> {
      const index = materials.findIndex(m => m.id === id);
      if (index === -1) return false;
      materials.splice(index, 1);
      return true;
    }
  }
};