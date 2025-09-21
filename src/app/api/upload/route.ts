// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    const filename = `${Date.now()}-${file.name}`;
    const filepath = join(uploadsDir, filename);

    await writeFile(filepath, buffer);

    const fileUrl = `/uploads/${filename}`;
    
    return NextResponse.json({
      success: true,
      fileUrl,
      downloadUrl: fileUrl,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
