'use client';

import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface BunnyImageUploadProps {
  onUploadComplete: (url: string) => void;
  currentImage?: string;
  label?: string;
  folder?: string;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
}

export const BunnyImageUpload: React.FC<BunnyImageUploadProps> = ({
  onUploadComplete,
  currentImage,
  label = 'Tải ảnh lên',
  folder = 'courses',
  onUploadStart,
  onUploadEnd
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 5MB');
      return;
    }

    try {
      setUploading(true);
      onUploadStart?.();

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Bunny Storage
      const fileName = `${folder}/${Date.now()}_${file.name}`;
      const storageZone = process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE;
      const storagePassword = process.env.NEXT_PUBLIC_BUNNY_STORAGE_PASSWORD;
      const storageHostname = process.env.NEXT_PUBLIC_BUNNY_STORAGE_HOSTNAME;
      const cdnUrl = process.env.NEXT_PUBLIC_BUNNY_STORAGE_CDN_URL;

      const uploadUrl = `https://${storageHostname}/${storageZone}/${fileName}`;

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'AccessKey': storagePassword!,
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const imageUrl = `https://${cdnUrl}/${fileName}`;
      onUploadComplete(imageUrl);
      alert('Tải ảnh lên thành công!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Lỗi khi tải ảnh lên');
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
      onUploadEnd?.();
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUploadComplete('');
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border border-slate-200"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            type="button"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-brand-500 hover:bg-slate-50 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {uploading ? (
              <>
                <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm text-slate-600">Đang tải lên...</p>
              </>
            ) : (
              <>
                <ImageIcon className="w-12 h-12 text-slate-400 mb-3" />
                <p className="mb-2 text-sm text-slate-600">
                  <span className="font-semibold">Click để tải ảnh lên</span>
                </p>
                <p className="text-xs text-slate-500">PNG, JPG, GIF (MAX. 5MB)</p>
              </>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
};
