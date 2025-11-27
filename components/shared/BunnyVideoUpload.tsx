'use client';

import React, { useState } from 'react';
import { Upload, X, Video, Play } from 'lucide-react';

interface BunnyVideoUploadProps {
  onUploadComplete: (videoId: string) => void;
  currentVideoId?: string;
  label?: string;
}

export const BunnyVideoUpload: React.FC<BunnyVideoUploadProps> = ({
  onUploadComplete,
  currentVideoId,
  label = 'Tải video lên'
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoId, setVideoId] = useState<string | null>(currentVideoId || null);

  const CDN_HOSTNAME = process.env.NEXT_PUBLIC_BUNNY_STREAM_CDN_HOSTNAME;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert('Vui lòng chọn file video');
      return;
    }

    // Validate file size (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 500MB');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const libraryId = process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID;
      const apiKey = process.env.NEXT_PUBLIC_BUNNY_STREAM_API_KEY;

      // Step 1: Create video
      const createResponse = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
        method: 'POST',
        headers: {
          'AccessKey': apiKey!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: file.name,
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create video');
      }

      const videoData = await createResponse.json();
      const newVideoId = videoData.guid;

      // Step 2: Upload video file
      const uploadResponse = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${newVideoId}`, {
        method: 'PUT',
        headers: {
          'AccessKey': apiKey!,
          'Content-Type': 'application/octet-stream',
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload video');
      }

      setVideoId(newVideoId);
      onUploadComplete(newVideoId);
      setUploadProgress(100);
      alert('Tải video lên thành công! Video đang được xử lý...');
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Lỗi khi tải video lên');
      setVideoId(currentVideoId || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setVideoId(null);
    onUploadComplete('');
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      
      {videoId ? (
        <div className="relative">
          <div className="w-full aspect-video bg-slate-900 rounded-lg overflow-hidden">
            <video
              src={`https://${CDN_HOSTNAME}/${videoId}/playlist.m3u8`}
              controls
              className="w-full h-full"
              poster={`https://${CDN_HOSTNAME}/${videoId}/thumbnail.jpg`}
            >
              <source src={`https://${CDN_HOSTNAME}/${videoId}/playlist.m3u8`} type="application/x-mpegURL" />
              Trình duyệt của bạn không hỗ trợ video.
            </video>
          </div>
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            type="button"
          >
            <X size={16} />
          </button>
          <p className="text-xs text-slate-500 mt-2">Video ID: {videoId}</p>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-brand-500 hover:bg-slate-50 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {uploading ? (
              <>
                <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm text-slate-600">Đang tải lên... {uploadProgress}%</p>
              </>
            ) : (
              <>
                <Video className="w-12 h-12 text-slate-400 mb-3" />
                <p className="mb-2 text-sm text-slate-600">
                  <span className="font-semibold">Click để tải video lên</span>
                </p>
                <p className="text-xs text-slate-500">MP4, MOV, AVI (MAX. 500MB)</p>
              </>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            accept="video/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
};
