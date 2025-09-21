// src/app/api/admin/courses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET() {
  try {
    // For admin, return all courses (published and unpublished)
    const courses = await db.courses.findAll();
    return NextResponse.json({ success: true, courses });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch admin courses' },
      { status: 500 }
    );
  }
}