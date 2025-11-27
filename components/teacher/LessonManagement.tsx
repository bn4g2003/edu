'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where, deleteField } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course } from '@/types/course';
import { Lesson } from '@/types/lesson';
import { Plus, Edit2, Trash2, X, Save, Upload, Play, Clock, FileText, HelpCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/Button';
import { QuizManagement } from './QuizManagement';
import { DocumentUploader } from './DocumentUploader';

interface LessonManagementProps {
  course: Course;
  onBack: () => void;
}

export const LessonManagement: React.FC<LessonManagementProps> = ({ course, onBack }) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [uploading, setUploading] = useState(false);
  const [managingQuiz, setManagingQuiz] = useState<Lesson | null>(null);
  const [previewingLesson, setPreviewingLesson] = useState<Lesson | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 1
  });

  const CDN_HOSTNAME = process.env.NEXT_PUBLIC_BUNNY_STREAM_CDN_HOSTNAME || 'vz-69258c0a-d89.b-cdn.net';

  useEffect(() => {
    loadLessons();
  }, [course.id]);

  const loadLessons = async () => {
    try {
      setLoading(true);
      const lessonsRef = collection(db, 'lessons');
      const q = query(lessonsRef, where('courseId', '==', course.id));
      const snapshot = await getDocs(q);
      const lessonsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Lesson[];
      
      // Sort in memory instead of using orderBy
      lessonsData.sort((a, b) => a.order - b.order);
      setLessons(lessonsData);
    } catch (error) {
      console.error('Error loading lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingLesson(null);
    setFormData({
      title: '',
      description: '',
      order: lessons.length + 1
    });
    setShowModal(true);
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      description: lesson.description,
      order: lesson.order
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.title) {
        alert('Vui lòng nhập tên bài học');
        return;
      }

      if (editingLesson) {
        const lessonRef = doc(db, 'lessons', editingLesson.id);
        await setDoc(lessonRef, {
          ...editingLesson,
          ...formData,
          updatedAt: new Date()
        });
        alert('Cập nhật bài học thành công!');
      } else {
        const newLesson: Lesson = {
          id: `lesson_${Date.now()}`,
          courseId: course.id,
          ...formData,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await setDoc(doc(db, 'lessons', newLesson.id), newLesson);
        alert('Thêm bài học thành công!');
      }

      setShowModal(false);
      loadLessons();
    } catch (error) {
      console.error('Error saving lesson:', error);
      alert('Lỗi khi lưu bài học');
    }
  };

  const handleDelete = async (lesson: Lesson) => {
    if (!confirm(`Bạn có chắc muốn xóa bài học "${lesson.title}"?`)) {
      return;
    }

    try {
      // Delete video from Bunny.net if exists
      if (lesson.videoId) {
        await fetch(`/api/bunny/video/${lesson.videoId}`, {
          method: 'DELETE'
        });
      }

      // Delete lesson from Firestore
      await deleteDoc(doc(db, 'lessons', lesson.id));
      alert('Xóa bài học thành công!');
      loadLessons();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Lỗi khi xóa bài học');
    }
  };

  const handleVideoUpload = async (lesson: Lesson, file: File) => {
    try {
      setUploading(true);

      // Create video in Bunny.net
      const createResponse = await fetch('/api/bunny/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: lesson.title })
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create video');
      }

      const videoData = await createResponse.json();
      const videoId = videoData.guid;

      // Upload video file
      const uploadResponse = await fetch(
        `https://video.bunnycdn.com/library/${process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID}/videos/${videoId}`,
        {
          method: 'PUT',
          headers: {
            'AccessKey': process.env.NEXT_PUBLIC_BUNNY_STREAM_API_KEY!,
          },
          body: file
        }
      );

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload video');
      }

      // Update lesson with video info
      const lessonRef = doc(db, 'lessons', lesson.id);
      await setDoc(lessonRef, {
        ...lesson,
        videoId: videoId,
        videoUrl: `https://${CDN_HOSTNAME}/${videoId}/playlist.m3u8`,
        updatedAt: new Date()
      });

      alert('Upload video thành công!');
      loadLessons();
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Lỗi khi upload video');
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentUploadComplete = async (lesson: Lesson, url: string, name: string) => {
    try {
      const lessonRef = doc(db, 'lessons', lesson.id);
      await setDoc(lessonRef, {
        ...lesson,
        documentUrl: url,
        documentName: name,
        updatedAt: new Date()
      });

      alert('Upload tài liệu thành công!');
      loadLessons();
    } catch (error) {
      console.error('Error saving document info:', error);
      alert('Lỗi khi lưu thông tin tài liệu');
    }
  };

  const handleDocumentRemove = async (lesson: Lesson) => {
    try {
      const lessonRef = doc(db, 'lessons', lesson.id);
      await updateDoc(lessonRef, {
        documentUrl: deleteField(),
        documentName: deleteField(),
        updatedAt: new Date()
      });

      alert('Xóa tài liệu thành công!');
      loadLessons();
    } catch (error) {
      console.error('Error removing document:', error);
      alert('Lỗi khi xóa tài liệu');
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (managingQuiz) {
    return <QuizManagement lesson={managingQuiz} onBack={() => setManagingQuiz(null)} />;
  }

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">Quản lý bài học</h3>
              <p className="text-slate-600">Khóa học: <span className="font-medium">{course.title}</span></p>
              <p className="text-sm text-slate-500 mt-1">Tổng số bài học: <span className="font-bold text-blue-600">{lessons.length}</span></p>
            </div>
            <Button onClick={handleAdd} className="flex items-center gap-2 shadow-lg">
              <Plus size={18} />
              Thêm bài học
            </Button>
          </div>
        </div>

        {/* Content */}
        {lessons.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa có bài học nào</h3>
              <p className="text-slate-600 mb-6">Thêm bài học đầu tiên cho khóa học này</p>
              <Button onClick={handleAdd} className="shadow-lg">
                <Plus size={18} className="mr-2" />
                Thêm bài học
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all">
                {/* Lesson Header */}
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-lg">
                      {lesson.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-slate-900 mb-1">{lesson.title}</h3>
                      <p className="text-sm text-slate-600 mb-3">{lesson.description}</p>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleEdit(lesson)}
                          className="px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
                        >
                          <Edit2 size={16} />
                          Sửa thông tin
                        </button>
                        <button
                          onClick={() => handleDelete(lesson)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
                        >
                          <Trash2 size={16} />
                          Xóa bài học
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Sections */}
                <div className="border-t border-slate-200 bg-slate-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                    
                    {/* Video Section */}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Play className="w-4 h-4 text-green-600" />
                        </div>
                        <h4 className="font-bold text-slate-900">Video</h4>
                      </div>
                      
                      {lesson.videoId ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                            <CheckCircle size={16} />
                            Đã upload
                          </div>
                          {lesson.duration && (
                            <p className="text-sm text-slate-600 flex items-center gap-1">
                              <Clock size={14} />
                              {formatDuration(lesson.duration)}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => setPreviewingLesson(lesson)}
                              className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium flex items-center justify-center gap-1"
                            >
                              <Play size={14} />
                              Xem video
                            </button>
                            <button
                              onClick={() => handleDelete(lesson)}
                              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="cursor-pointer block">
                          <input
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleVideoUpload(lesson, file);
                            }}
                            disabled={uploading}
                          />
                          <div className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-2 text-sm font-medium transition-colors shadow-sm">
                            <Upload size={16} />
                            Upload video
                          </div>
                        </label>
                      )}
                    </div>

                    {/* Document Section */}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <h4 className="font-bold text-slate-900">Tài liệu</h4>
                      </div>
                      
                      <DocumentUploader
                        lessonId={lesson.id}
                        currentDocumentUrl={lesson.documentUrl}
                        currentDocumentName={lesson.documentName}
                        onUploadComplete={(url, name) => handleDocumentUploadComplete(lesson, url, name)}
                        onRemove={() => handleDocumentRemove(lesson)}
                      />
                    </div>

                    {/* Quiz Section */}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <HelpCircle className="w-4 h-4 text-purple-600" />
                        </div>
                        <h4 className="font-bold text-slate-900">Bài kiểm tra</h4>
                      </div>
                      
                      <div className="space-y-2">
                        {lesson.hasQuiz && (
                          <div className="flex items-center gap-2 text-sm text-purple-600 font-medium mb-2">
                            <CheckCircle size={16} />
                            Có câu hỏi
                          </div>
                        )}
                        <button
                          onClick={() => setManagingQuiz(lesson)}
                          className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center justify-center gap-2 text-sm font-medium transition-colors shadow-sm"
                        >
                          <HelpCircle size={16} />
                          Quản lý câu hỏi
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {editingLesson ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">Điền thông tin cơ bản của bài học</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tên bài học *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Ví dụ: Giới thiệu về React"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Mô tả</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                    placeholder="Mô tả nội dung bài học..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    min={1}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-center text-lg font-bold"
                  />
                  <p className="text-xs text-slate-500 mt-2">Bài học sẽ được sắp xếp theo thứ tự này</p>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <Button onClick={handleSave} className="flex-1 flex items-center justify-center gap-2 py-3 shadow-lg">
                  <Save size={18} />
                  {editingLesson ? 'Cập nhật' : 'Thêm bài học'}
                </Button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {uploading && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
              <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-xl text-slate-900 font-bold mb-2">Đang upload...</p>
              <p className="text-sm text-slate-600">Vui lòng đợi, đừng đóng trang này</p>
            </div>
          </div>
        )}

        {/* Video Preview Modal */}
        {previewingLesson && previewingLesson.videoId && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{previewingLesson.title}</h3>
                  <p className="text-sm text-slate-600">{previewingLesson.description}</p>
                </div>
                <button
                  onClick={() => setPreviewingLesson(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6">
                <div className="bg-black rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <video
                    className="w-full h-full"
                    controls
                    autoPlay
                    controlsList="nodownload"
                    src={`https://${CDN_HOSTNAME}/${previewingLesson.videoId}/play_720p.mp4`}
                  >
                    Trình duyệt của bạn không hỗ trợ video.
                  </video>
                </div>
                {previewingLesson.duration && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                    <Clock size={16} />
                    <span>Thời lượng: {formatDuration(previewingLesson.duration)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
