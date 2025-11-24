import { NextRequest, NextResponse } from 'next/server';

const BUNNY_API_KEY = process.env.BUNNY_STREAM_API_KEY;
const LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID;

export async function POST(request: NextRequest) {
  try {
    const { title } = await request.json();

    // Create video in Bunny.net
    const response = await fetch(
      `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos`,
      {
        method: 'POST',
        headers: {
          'AccessKey': BUNNY_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to create video');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
