// src/app/api/materials/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET() {
  try {
    const materials = await db.materials.findPublished();
    return NextResponse.json({ success: true, materials });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch materials' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const material = await db.materials.create(data);
    return NextResponse.json({ success: true, material }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to create material' },
      { status: 500 }
    );
  }
}