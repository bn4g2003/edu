'use client';

import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, where, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course } from '@/types/course';
import { Lesson } from '@/types/lesson';
import { LessonProgress } from '@/types/progress';
import { useAuth } from '@/contexts/AuthContext';
import { Play, Pause, Lock, CheckCircle, Clock, FileText, HelpCircle, Maximize, RotateCcw, Rewind } from 'lucide-react';
import { QuizTaker } from './QuizTaker';

interface CourseViewerProps {
  course: Course;
  onBack: () => void;
}

export const CourseViewer: React.FC<CourseViewerProps> = ({ course, onBack }) => {
  const { userProfile } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [viewMode, setViewMode] = useState<'video' | 'document' | 'quiz'>('video');
  const [takingQuiz, setTakingQuiz] = useState(false);
  const [showAttentionCheck, setShowAttentionCheck] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(course.id);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [quizResults, setQuizResults] = useState<Record<string, any>>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const saveProgressTimer = useRef<NodeJS.Timeout | null>(null);
  const hlsRef = useRef<any>(null);
  const attentionCheckTimer = useRef<NodeJS.Timeout | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const CDN_HOSTNAME = process.env.NEXT_PUBLIC_BUNNY_STREAM_CDN_HOSTNAME || 'vz-69258c0a-d89.b-cdn.net';
  
  // Check if user is staff (needs anti-cheat features)
  const isStaff = userProfile?.role === 'staff';

  // Get all unique tags from lessons
  const allTags = Array.from(new Set(lessons.flatMap(lesson => lesson.tags || []))).sort();
  
  // Get current course info
  const currentCourse = allCourses.find(c => c.id === selectedCourseId) || course;

  useEffect(() => {
    loadUserCourses();
  }, [userProfile]);

  useEffect(() => {
    if (selectedCourseId) {
      loadLessons();
      loadProgress();
      loadQuizResults();
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedTag === 'all') {
      setFilteredLessons(lessons);
    } else {
      setFilteredLessons(lessons.filter(lesson => lesson.tags?.includes(selectedTag)));
    }
  }, [lessons, selectedTag]);

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
      if (attentionCheckTimer.current) {
        clearTimeout(attentionCheckTimer.current);
      }
    };
  }, [selectedLesson?.id, progressLoaded]);

  // Anti-cheat: Detect tab visibility change (staff only)
  useEffect(() => {
    if (!isStaff) return;

    const handleVisibilityChange = () => {
      if (document.hidden && videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
        console.log('⚠️ Video paused: Tab switched');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isStaff]);

  // Anti-cheat: Attention check every 30 seconds (staff only)
  useEffect(() => {
    if (!isStaff || !videoRef.current) return;

    const startAttentionCheck = () => {
      if (attentionCheckTimer.current) {
        clearTimeout(attentionCheckTimer.current);
      }

      attentionCheckTimer.current = setTimeout(() => {
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
          setShowAttentionCheck(true);
          console.log('⚠️ Attention check triggered');
        }
      }, 30000); // 30 seconds
    };

    const video = videoRef.current;
    
    const handlePlay = () => {
      setIsPlaying(true);
      startAttentionCheck();
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (attentionCheckTimer.current) {
        clearTimeout(attentionCheckTimer.current);
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      if (attentionCheckTimer.current) {
        clearTimeout(attentionCheckTimer.current);
      }
    };
  }, [isStaff, selectedLesson?.id]);

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

  const loadUserCourses = async () => {
    if (!userProfile) return;

    try {
      const coursesRef = collection(db, 'courses');
      const snapshot = await getDocs(coursesRef);
      const coursesData = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Course[];

      // Filter courses that user is enrolled in
      const userCourses = coursesData.filter(c => 
        c.students?.includes(userProfile.uid) || userProfile.role === 'admin'
      );

      setAllCourses(userCourses);
    } catch (error) {
      console.error('Error loading user courses:', error);
    }
  };

  const loadLessons = async () => {
    try {
      setLoading(true);
      const lessonsRef = collection(db, 'lessons');
      const q = query(lessonsRef, where('courseId', '==', selectedCourseId));
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

  const loadQuizResults = async () => {
    if (!userProfile) return;
    
    try {
      const resultsRef = collection(db, 'quizResults');
      const q = query(
        resultsRef,
        where('userId', '==', userProfile.uid),
        where('courseId', '==', course.id)
      );
      const snapshot = await getDocs(q);
      const resultsMap: Record<string, any> = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        resultsMap[data.lessonId] = data;
      });
      
      setQuizResults(resultsMap);
    } catch (error) {
      console.error('Error loading quiz results:', error);
    }
  };

  const isLessonLocked = (lesson: Lesson, index: number): boolean => {
    // First lesson is never locked
    if (index === 0) return false;
    
    // Get previous lesson
    const previousLesson = filteredLessons[index - 1];
    if (!previousLesson) return false;
    
    // If previous lesson has quiz, check if passed with 70%
    if (previousLesson.hasQuiz) {
      const quizResult = quizResults[previousLesson.id];
      if (!quizResult || quizResult.score < 70) {
        return true;
      }
    }
    
    return false;
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

  const handleAttentionCheckContinue = () => {
    setShowAttentionCheck(false);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleFullscreen = () => {
    if (!videoContainerRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoContainerRef.current.requestFullscreen();
    }
  };

  const handleRewind = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
  };

  const handleRestart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlaying(true);
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

  // Debug: Log banner URL
  console.log('🖼️ Course banner:', course.banner);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Banner Image - Full width, trên cùng */}
      {course.banner && (
        <div className="w-full bg-slate-900 relative">
          <img 
            src={course.banner} 
            alt={`Banner ${course.title}`}
            className="w-full h-32 md:h-40 lg:h-48 object-cover"
            onError={(e) => {
              console.error('❌ Banner load error:', course.banner);
              e.currentTarget.style.display = 'none';
            }}
            onLoad={() => console.log('✅ Banner loaded successfully')}
          />
          {/* Overlay gradient để text dễ đọc hơn */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60"></div>
        </div>
      )}

      {/* Header - Overlay trên banner hoặc standalone */}
      <div className={`w-full ${course.banner ? 'bg-gradient-to-r from-brand-600/95 to-brand-700/95 backdrop-blur-sm' : 'bg-gradient-to-r from-brand-600 to-brand-700'} text-white`}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <button onClick={onBack} className="text-white hover:text-slate-200 mb-4 flex items-center gap-2">
            ← Quay lại khóa học
          </button>
          <h1 className="text-4xl font-bold mb-2">{course.title}</h1>
          <p className="text-lg text-slate-100 mb-2">{course.description}</p>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Clock size={16} />
              {course.duration} giờ
            </span>
            <span>•</span>
            <span>Giảng viên: {course.teacherName}</span>
            <span>•</span>
            <span className="px-2 py-1 bg-white/20 rounded">
              {course.level === 'beginner' ? 'Cơ bản' : 
               course.level === 'intermediate' ? 'Trung cấp' : 'Nâng cao'}
            </span>
          </div>
        </div>
      </div>

      {/* Demo Video */}
      {course.demoVideoId && !selectedLesson && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Video giới thiệu khóa học</h2>
            <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
              <video
                src={`https://${CDN_HOSTNAME}/${course.demoVideoId}/playlist.m3u8`}
                controls
                className="w-full h-full"
                poster={`https://${CDN_HOSTNAME}/${course.demoVideoId}/thumbnail.jpg`}
              >
                <source src={`https://${CDN_HOSTNAME}/${course.demoVideoId}/playlist.m3u8`} type="application/x-mpegURL" />
                Trình duyệt của bạn không hỗ trợ video.
              </video>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                <div 
                  ref={videoContainerRef}
                  className="bg-black rounded-xl overflow-hidden relative" 
                  style={{ paddingTop: '56.25%' }}
                >
                  <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full"
                    controls={!isStaff}
                    controlsList="nodownload"
                    onTimeUpdate={handleTimeUpdate}
                    playsInline
                    onContextMenu={(e) => isStaff && e.preventDefault()}
                    style={isStaff ? { pointerEvents: 'none' } : {}}
                  >
                    <source src={`https://${CDN_HOSTNAME}/${selectedLesson.videoId}/playlist.m3u8`} type="application/x-mpegURL" />
                    Trình duyệt của bạn không hỗ trợ video.
                  </video>
                  
                  {/* Custom Controls for Staff */}
                  {isStaff && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4" style={{ pointerEvents: 'auto' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* Restart Button */}
                          <button
                            onClick={handleRestart}
                            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                            title="Xem lại từ đầu"
                          >
                            <RotateCcw size={18} />
                          </button>
                          
                          {/* Rewind 10s */}
                          <button
                            onClick={handleRewind}
                            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                            title="Tua lùi 10s"
                          >
                            <Rewind size={18} />
                          </button>
                          
                          {/* Play/Pause */}
                          <button
                            onClick={handlePlayPause}
                            className="w-12 h-12 bg-white/30 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors"
                          >
                            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                          </button>
                          
                          <span className="text-white text-sm ml-2">
                            {isPlaying ? 'Đang phát' : 'Đã dừng'}
                          </span>
                        </div>
                        
                        {/* Fullscreen */}
                        <button
                          onClick={handleFullscreen}
                          className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                          title="Toàn màn hình"
                        >
                          <Maximize size={20} />
                        </button>
                      </div>
                      <div className="mt-2 text-center">
                        <span className="text-white/70 text-xs">
                          Sử dụng các nút điều khiển để xem video
                        </span>
                      </div>
                    </div>
                  )}
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
                  quizDocumentUrl={selectedLesson.quizDocumentUrl}
                  quizDocumentName={selectedLesson.quizDocumentName}
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
                <p className="text-sm text-slate-600">{currentCourse.title}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedTag === 'all' ? `${lessons.length} bài học` : `${filteredLessons.length}/${lessons.length} bài học`}
                </p>
              </div>

              <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                {filteredLessons.length === 0 ? (
                  <div className="p-6 text-center text-slate-500">
                    <p className="text-sm">
                      {selectedTag === 'all' ? 'Chưa có bài học nào' : `Không có bài học nào với tag "${selectedTag}"`}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {filteredLessons.map((lesson, index) => {
                      const hasContent = lesson.videoId || lesson.documentUrl || lesson.hasQuiz;
                      const locked = isLessonLocked(lesson, index);
                      const previousLesson = index > 0 ? filteredLessons[index - 1] : null;
                      const previousQuizResult = previousLesson ? quizResults[previousLesson.id] : null;
                      
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            if (locked) {
                              alert(`Bạn cần hoàn thành bài kiểm tra của "${previousLesson?.title}" với điểm số tối thiểu 70 để mở khóa bài này.`);
                              return;
                            }
                            if (hasContent) {
                              setSelectedLesson(lesson);
                              // Auto select view mode
                              if (lesson.videoId) setViewMode('video');
                              else if (lesson.documentUrl) setViewMode('document');
                              else if (lesson.hasQuiz) setViewMode('quiz');
                            }
                          }}
                          disabled={!hasContent || locked}
                          className={`w-full p-4 text-left transition-colors ${
                            selectedLesson?.id === lesson.id ? 'bg-brand-50 border-l-4 border-brand-500' : ''
                          } ${locked ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'hover:bg-slate-50'} ${!hasContent && !locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold relative ${
                              locked ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {locked ? <Lock size={16} /> : lesson.order}
                              {!locked && progress[lesson.id]?.completed && (
                                <CheckCircle size={12} className="absolute -top-1 -right-1 text-green-500 bg-white rounded-full" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-medium mb-1 line-clamp-2 ${locked ? 'text-slate-500' : 'text-slate-900'}`}>
                                {lesson.title}
                                {locked && (
                                  <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                    Cần đạt 70% bài trước
                                  </span>
                                )}
                              </h4>
                              {!locked && progress[lesson.id] && (
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

          {/* Right Sidebar - Tag Filter & Course Switcher */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-24">
              <h3 className="font-bold text-slate-900 mb-3">Lọc theo chủ đề</h3>
              
              {allTags.length > 0 ? (
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedTag('all')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedTag === 'all'
                        ? 'bg-brand-500 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Tất cả ({lessons.length})
                  </button>
                  {allTags.map((tag) => {
                    const count = lessons.filter(l => l.tags?.includes(tag)).length;
                    return (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedTag === tag
                            ? 'bg-brand-500 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {tag} ({count})
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Chưa có tag nào</p>
              )}

              {/* Course Switcher */}
              {allCourses.length > 1 && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-3">Khóa học khác</h3>
                  <div className="space-y-1">
                    {allCourses.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCourseId(c.id);
                          setSelectedTag('all');
                          setSelectedLesson(null);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedCourseId === c.id
                            ? 'bg-purple-100 text-purple-700 font-medium'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="line-clamp-2">{c.title}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Attention Check Popup (Staff only) */}
      {showAttentionCheck && isStaff && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Bạn có đang xem video?</h3>
            <p className="text-slate-600 mb-6">
              Vui lòng xác nhận bạn đang theo dõi bài học để tiếp tục
            </p>
            <button
              onClick={handleAttentionCheckContinue}
              className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium text-lg transition-colors"
            >
              Tiếp tục xem
            </button>
            <p className="text-xs text-slate-500 mt-4">
              Video sẽ tự động dừng nếu không có phản hồi
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
