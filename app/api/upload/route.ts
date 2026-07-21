import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (token.role !== 'organizer' && token.role !== 'admin') {
      return NextResponse.json({ message: 'Only organizers can upload posters' }, { status: 403 });
    }
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'nexevent_posters' }, // Keeps your Cloudinary dashboard organized
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      uploadStream.end(buffer);
    });

    return NextResponse.json(
      { url: (uploadResult as any).secure_url }, 
      { status: 200 }
    );

  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json(
      { message: 'An error occurred during upload' }, 
      { status: 500 }
    );
  }
}