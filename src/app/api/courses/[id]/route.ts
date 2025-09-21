// src/app/api/courses/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const course = await db.courses.findById(id);
    
    if (!course) {
      return NextResponse.json(
        { success: false, message: 'Course not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, course });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const data = await request.json();
    const course = await db.courses.update(id, data);
    
    if (!course) {
      return NextResponse.json(
        { success: false, message: 'Course not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, course });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to update course' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const deleted = await db.courses.delete(id);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Course not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'Course deleted' });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to delete course' },
      { status: 500 }
    );
  }
}