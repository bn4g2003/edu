'use client';

import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, where, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course } from '@/types/course';
import { Lesson } from '@/types/lesson';
import { LessonProgress } from '@/types/progress';
import { useAuth } from '@/contexts/AuthContext';
import { Play, Lock, CheckCircle, Clock, FileText, HelpCircle } from 'lucide-react';
import { QuizTaker } from './QuizTaker';

interface CourseViewerProps {
  course: Course;
  onBack: () => void;
}

export const CourseViewer: React.FC<CourseViewerProps> = ({ course, onBack }) => {
  const { userProfile } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [viewMode, setViewMode] = useState<'video' | 'document' | 'quiz'>('video');
  const [takingQuiz, setTakingQuiz] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const saveProgressTimer = useRef<NodeJS.Timeout | null>(null);
  const hlsRef = useRef<any>(null);

  const CDN_HOSTNAME = process.env.NEXT_PUBLIC_BUNNY_STREAM_CDN_HOSTNAME || 'vz-69258c0a-d89.b-cdn.net';

  useEffect(() => {
    loadLessons();
    loadProgress();
  }, [course.id]);

  useEffect(() => {
    if (selectedLesson && selectedLesson.videoId && progressLoaded) {
      setCurrentTime(0);
      initializeVideo();
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [selectedLesson?.id, progressLoaded]);

  const initializeVideo = async () => {
    if (!selectedLesson || !videoRef.current) return;

    const videoUrl = `https://${CDN_HOSTNAME}/${selectedLesson.videoId}/playlist.m3u8`;
    const savedProgress = progress[selectedLesson.id];

    console.log('🎬 Initializing video for lesson:', selectedLesson.title);
    console.log('📊 Saved progress:', savedProgress);

    // Check if HLS is supported
    if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      videoRef.current.src = videoUrl;
      
      // Set start time after video loads
      if (savedProgress && savedProgress.watchedSeconds > 5) {
        console.log('⏩ Will seek to:', savedProgress.watchedSeconds, 'seconds');
        videoRef.current.addEventListener('loadedmetadata', () => {
          if (videoRef.current) {
            console.log('✅ Seeking now to:', savedProgress.watchedSeconds);
            videoRef.current.currentTime = savedProgress.watchedSeconds;
          }
        }, { once: true });
      }
    } else {
      // Use HLS.js for other browsers
      const Hls = (await import('hls.js')).default;
      
      if (Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });

        hls.loadSource(videoUrl);
        hls.attachMedia(videoRef.current);
        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('📺 HLS manifest parsed');
          // Video is ready, seek to saved position if > 5 seconds
          if (savedProgress && savedProgress.watchedSeconds > 5 && videoRef.current) {
            console.log('⏩ Will seek to:', savedProgress.watchedSeconds, 'seconds');
            setTimeout(() => {
              if (videoRef.current) {
                console.log('✅ Seeking now to:', savedProgress.watchedSeconds);
                videoRef.current.currentTime = savedProgress.watchedSeconds;
              }
            }, 500);
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('❌ HLS error:', data);
        });
      }
    }
  };

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
      
      // Auto select first lesson
      if (lessonsData.length > 0) {
        setSelectedLesson(lessonsData[0]);
        // Set view mode based on what's available
        if (lessonsData[0].videoId) {
          setViewMode('video');
        } else if (lessonsData[0].documentUrl) {
          setViewMode('document');
        } else if (lessonsData[0].hasQuiz) {
          setViewMode('quiz');
        }
      }
    } catch (error) {
      console.error('Error loading lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    if (!userProfile) {
      setProgressLoaded(true);
      return;
    }
    
    try {
      const progressRef = collection(db, 'progress');
      const q = query(
        progressRef,
        where('userId', '==', userProfile.uid),
        where('courseId', '==', course.id)
      );
      const snapshot = await getDocs(q);
      const progressMap: Record<string, LessonProgress> = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        progressMap[data.lessonId] = {
          ...data,
          lastWatchedAt: data.lastWatchedAt?.toDate ? data.lastWatchedAt.toDate() : new Date()
        } as LessonProgress;
      });
      
      setProgress(progressMap);
      setProgressLoaded(true);
    } catch (error) {
      console.error('Error loading progress:', error);
      setProgressLoaded(true);
    }
  };



  const handleTimeUpdate = () => {
    if (!videoRef.current || !selectedLesson) return;

    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;

    setCurrentTime(currentTime);

    // Debounce save
    if (saveProgressTimer.current) {
      clearTimeout(saveProgressTimer.current);
    }

    saveProgressTimer.current = setTimeout(() => {
      saveProgress(currentTime, duration);
    }, 3000);
  };

  const saveProgress = async (watchedSeconds: number, totalSeconds: number) => {
    if (!selectedLesson || !userProfile) return;

    try {
      const progressId = `${userProfile.uid}_${selectedLesson.id}`;
      const existingProgress = progress[selectedLesson.id];
      
      // Calculate if should be completed
      const shouldBeCompleted = watchedSeconds / totalSeconds > 0.9;
      
      // Determine final values with rules:
      // 1. completed: once true, always true
      // 2. watchedSeconds: only update if new value is greater
      const finalCompleted = existingProgress?.completed || shouldBeCompleted;
      const finalWatchedSeconds = Math.max(
        Math.floor(watchedSeconds),
        existingProgress?.watchedSeconds || 0
      );
      
      // Only save if there's an actual change
      if (existingProgress && 
          existingProgress.completed === finalCompleted && 
          existingProgress.watchedSeconds >= finalWatchedSeconds) {
        console.log('⏭️ No progress update needed');
        return;
      }

      const progressData: LessonProgress = {
        id: progressId,
        userId: userProfile.uid,
        courseId: course.id,
        lessonId: selectedLesson.id,
        watchedSeconds: finalWatchedSeconds,
        totalSeconds: Math.floor(totalSeconds),
        completed: finalCompleted,
        lastWatchedAt: new Date()
      };

      console.log('💾 Saving progress:', {
        lesson: selectedLesson.title,
        watchedSeconds: finalWatchedSeconds,
        completed: finalCompleted,
        previous: existingProgress
      });

      await setDoc(doc(db, 'progress', progressId), progressData);
      
      setProgress(prev => ({
        ...prev,
        [selectedLesson.id]: progressData
      }));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button onClick={onBack} className="text-blue-600 hover:text-blue-700 mb-2">
            ← Quay lại khóa học
          </button>
          <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
          <p className="text-slate-600">{course.teacherName}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Content Area */}
          <div className="lg:col-span-2">
            {selectedLesson && (
              <div className="bg-white rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-4">
                  {selectedLesson.videoId && (
                    <button
                      onClick={() => setViewMode('video')}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                        viewMode === 'video' ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Play size={16} />
                      Video
                    </button>
                  )}
                  {selectedLesson.documentUrl && (
                    <button
                      onClick={() => setViewMode('document')}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                        viewMode === 'document' ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <FileText size={16} />
                      Tài liệu
                    </button>
                  )}
                  {selectedLesson.hasQuiz && (
                    <button
                      onClick={() => setViewMode('quiz')}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                        viewMode === 'quiz' ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <HelpCircle size={16} />
                      Bài kiểm tra
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Video View */}
            {viewMode === 'video' && selectedLesson && selectedLesson.videoId ? (
              <div>
                <div className="bg-black rounded-xl overflow-hidden relative" style={{ paddingTop: '56.25%' }}>
                  <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full"
                    controls
                    controlsList="nodownload"
                    onTimeUpdate={handleTimeUpdate}
                    playsInline
                  >
                    <source src={`https://${CDN_HOSTNAME}/${selectedLesson.videoId}/playlist.m3u8`} type="application/x-mpegURL" />
                    Trình duyệt của bạn không hỗ trợ video.
                  </video>
                </div>
              </div>
            ) : viewMode === 'video' ? (
              <div className="bg-slate-900 rounded-xl relative" style={{ paddingTop: '56.25%' }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Bài học này chưa có video</p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Document View */}
            {viewMode === 'document' && selectedLesson && selectedLesson.documentUrl ? (
              <div className="bg-white rounded-xl p-8">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Tài liệu bài học</h3>
                  <p className="text-slate-600 mb-4">{selectedLesson.documentName}</p>
                  <a
                    href={selectedLesson.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Tải xuống tài liệu
                  </a>
                </div>
              </div>
            ) : viewMode === 'document' ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">Bài học này chưa có tài liệu</p>
              </div>
            ) : null}

            {/* Quiz View */}
            {viewMode === 'quiz' && selectedLesson && selectedLesson.hasQuiz ? (
              takingQuiz ? (
                <QuizTaker
                  lessonId={selectedLesson.id}
                  courseId={course.id}
                  quizDuration={selectedLesson.quizDuration}
                  onComplete={() => setTakingQuiz(false)}
                />
              ) : (
                <div className="bg-white rounded-xl p-8">
                  <div className="text-center">
                    <HelpCircle className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Bài kiểm tra</h3>
                    <p className="text-slate-600 mb-4">Kiểm tra kiến thức của bạn về bài học này</p>
                    <button
                      onClick={() => setTakingQuiz(true)}
                      className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                    >
                      Bắt đầu làm bài
                    </button>
                  </div>
                </div>
              )
            ) : viewMode === 'quiz' ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <HelpCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">Bài học này chưa có bài kiểm tra</p>
              </div>
            ) : null}

            {selectedLesson && (
              <div className="bg-white rounded-xl p-6 mt-4">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedLesson.title}</h2>
                <p className="text-slate-600 mb-4">{selectedLesson.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  {selectedLesson.duration && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock size={16} />
                      <span>Thời lượng: {formatDuration(selectedLesson.duration)}</span>
                    </div>
                  )}
                  {progress[selectedLesson.id] && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-slate-600">
                            Đã xem: {formatDuration(progress[selectedLesson.id].watchedSeconds)}
                          </span>
                          {progress[selectedLesson.id].completed && (
                            <CheckCircle size={14} className="text-green-500" />
                          )}
                        </div>
                        <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-500 transition-all"
                            style={{ 
                              width: `${Math.min(100, (progress[selectedLesson.id].watchedSeconds / progress[selectedLesson.id].totalSeconds) * 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Lesson List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden sticky top-24">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-900">Nội dung khóa học</h3>
                <p className="text-sm text-slate-600">{lessons.length} bài học</p>
              </div>
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                {lessons.length === 0 ? (
                  <div className="p-6 text-center text-slate-500">
                    <p>Chưa có bài học nào</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {lessons.map((lesson) => {
                      const hasContent = lesson.videoId || lesson.documentUrl || lesson.hasQuiz;
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            if (hasContent) {
                              setSelectedLesson(lesson);
                              // Auto select view mode
                              if (lesson.videoId) setViewMode('video');
                              else if (lesson.documentUrl) setViewMode('document');
                              else if (lesson.hasQuiz) setViewMode('quiz');
                            }
                          }}
                          disabled={!hasContent}
                          className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                            selectedLesson?.id === lesson.id ? 'bg-brand-50 border-l-4 border-brand-500' : ''
                          } ${!hasContent ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold text-slate-600 relative">
                              {lesson.order}
                              {progress[lesson.id]?.completed && (
                                <CheckCircle size={12} className="absolute -top-1 -right-1 text-green-500 bg-white rounded-full" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-slate-900 mb-1 line-clamp-2">{lesson.title}</h4>
                              {progress[lesson.id] && (
                                <div className="mb-1">
                                  <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-brand-500"
                                      style={{ 
                                        width: `${Math.min(100, (progress[lesson.id].watchedSeconds / progress[lesson.id].totalSeconds) * 100)}%` 
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                                {lesson.videoId && (
                                  <span className="flex items-center gap-1">
                                    <Play size={12} />
                                    Video
                                  </span>
                                )}
                                {lesson.documentUrl && (
                                  <span className="flex items-center gap-1 text-blue-600">
                                    <FileText size={12} />
                                    Tài liệu
                                  </span>
                                )}
                                {lesson.hasQuiz && (
                                  <span className="flex items-center gap-1 text-purple-600">
                                    <HelpCircle size={12} />
                                    Bài kiểm tra
                                  </span>
                                )}
                                {!hasContent && (
                                  <span className="flex items-center gap-1">
                                    <Lock size={12} />
                                    Chưa có nội dung
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
