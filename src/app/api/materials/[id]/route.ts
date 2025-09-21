// src/app/api/materials/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const material = await db.materials.findById(id);
    
    if (!material) {
      return NextResponse.json(
        { success: false, message: 'Material not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, material });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch material' },
      { status: 500 }
    );
  }
}


export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const data = await request.json();
    const material = await db.materials.update(id, data);
    
    if (!material) {
      return NextResponse.json(
        { success: false, message: 'Material not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, material });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to update material' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const deleted = await db.materials.delete(id);
    
    if (deleted) {
      return NextResponse.json(
        { success: false, message: 'Material not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'Material deleted' });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to delete material' },
      { status: 500 }
    );
  }
}