// src/app/api/courses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET() {
  try {
    const courses = await db.courses.findPublished();
    return NextResponse.json({ success: true, courses });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const course = await db.courses.create(data);
    return NextResponse.json({ success: true, course }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to create course' },
      { status: 500 }
    );
  }
}