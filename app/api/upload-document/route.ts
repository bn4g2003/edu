import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    if (!file || !path) {
      return NextResponse.json(
        { error: 'File và path là bắt buộc' },
        { status: 400 }
      );
    }

    const storageZone = process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE;
    const storagePassword = process.env.NEXT_PUBLIC_BUNNY_STORAGE_PASSWORD;
    const storageHostname = process.env.NEXT_PUBLIC_BUNNY_STORAGE_HOSTNAME;
    const cdnUrl = process.env.NEXT_PUBLIC_BUNNY_STORAGE_CDN_URL;

    if (!storageZone || !storagePassword || !storageHostname) {
      return NextResponse.json(
        { error: 'Thiếu cấu hình Bunny Storage' },
        { status: 500 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Bunny Storage
    const uploadUrl = `https://${storageHostname}/${storageZone}/${path}`;
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'AccessKey': storagePassword,
        'Content-Type': file.type,
      },
      body: buffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Bunny upload error:', errorText);
      return NextResponse.json(
        { error: 'Lỗi khi upload lên Bunny Storage' },
        { status: uploadResponse.status }
      );
    }

    // Return CDN URL
    const fileUrl = `https://${cdnUrl}/${path}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      path: path,
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi server' },
      { status: 500 }
    );
  }
}
