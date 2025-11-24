'use client';

import React, { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Upload, File, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { Button } from '@/components/Button';

interface DocumentUploaderProps {
  lessonId: string;
  currentDocumentUrl?: string;
  currentDocumentName?: string;
  onUploadComplete: (url: string, name: string) => void;
  onRemove?: () => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  lessonId,
  currentDocumentUrl,
  currentDocumentName,
  onUploadComplete,
  onRemove
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const handleFileSelect = async (file: File) => {
    setError(null);

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Chỉ hỗ trợ file PDF, Word, PowerPoint, Excel, hoặc Text');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File không được vượt quá 50MB');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Create storage reference
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `documents/${lessonId}/${fileName}`);

      // Upload file
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          console.error('Upload error:', error);
          
          // Provide helpful error messages
          let errorMessage = 'Lỗi khi upload file: ';
          if (error.code === 'storage/unauthorized') {
            errorMessage = '❌ Lỗi quyền truy cập. Vui lòng kiểm tra Firebase Storage Rules.';
          } else if (error.code === 'storage/canceled') {
            errorMessage = 'Upload đã bị hủy.';
          } else if (error.code === 'storage/unknown') {
            errorMessage = '❌ Lỗi CORS hoặc Storage chưa được kích hoạt. Xem file FIX_STORAGE_CORS.md để biết cách fix.';
          } else {
            errorMessage += error.message;
          }
          
          setError(errorMessage);
          setUploading(false);
        },
        async () => {
          // Upload completed successfully
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('File uploaded successfully:', downloadURL);
          
          onUploadComplete(downloadURL, file.name);
          setUploading(false);
          setUploadProgress(0);
        }
      );
    } catch (error: any) {
      console.error('Error uploading file:', error);
      
      let errorMessage = 'Lỗi khi upload file';
      if (error.code === 'storage/unauthorized') {
        errorMessage = '❌ Firebase Storage chưa được kích hoạt hoặc chưa có quyền. Xem FIX_STORAGE_CORS.md';
      } else if (error.message) {
        errorMessage += ': ' + error.message;
      }
      
      setError(errorMessage);
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = async () => {
    if (!currentDocumentUrl || !onRemove) return;

    if (!confirm('Bạn có chắc muốn xóa tài liệu này?')) {
      return;
    }

    try {
      // Extract file path from URL
      const url = new URL(currentDocumentUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);
      if (pathMatch) {
        const filePath = decodeURIComponent(pathMatch[1]);
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
      }
      
      onRemove();
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Lỗi khi xóa file');
    }
  };

  return (
    <div className="space-y-4">
      {currentDocumentUrl ? (
        <div className="border-2 border-green-200 bg-green-50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <File className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Đã có tài liệu</span>
              </div>
              <p className="text-sm text-green-700 truncate">{currentDocumentName}</p>
              <div className="flex gap-2 mt-2">
                <a
                  href={currentDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-600 hover:text-green-700 underline"
                >
                  Xem tài liệu
                </a>
                {onRemove && (
                  <button
                    onClick={handleRemove}
                    className="text-xs text-red-600 hover:text-red-700 underline"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-300 hover:border-slate-400'
          }`}
        >
          {uploading ? (
            <div className="space-y-4">
              <Loader className="w-12 h-12 text-blue-500 mx-auto animate-spin" />
              <div>
                <p className="text-sm font-medium text-slate-900 mb-2">
                  Đang upload... {uploadProgress}%
                </p>
                <div className="w-full max-w-xs mx-auto h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-900 font-medium mb-2">
                Kéo thả file vào đây hoặc nhấn để chọn
              </p>
              <p className="text-sm text-slate-500 mb-4">
                Hỗ trợ: PDF, Word, PowerPoint, Excel, Text (tối đa 50MB)
              </p>
              <label className="inline-block">
                <input
                  type="file"
                  onChange={handleFileInput}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                  className="hidden"
                  disabled={uploading}
                />
                <span className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium cursor-pointer transition-colors">
                  Chọn file
                </span>
              </label>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};
