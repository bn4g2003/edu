'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Course } from '@/types/course';
import { BookOpen, Clock, Play } from 'lucide-react';
import { Button } from '@/components/Button';

interface CourseCardProps {
  course: Course;
  onView?: (courseId: string) => void;
  departmentName?: string;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onView,
  departmentName
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const CDN_HOSTNAME = process.env.NEXT_PUBLIC_BUNNY_STREAM_CDN_HOSTNAME;

  useEffect(() => {
    if (isHovered && course.demoVideoId && videoRef.current) {
      // Delay video play slightly for smooth transition
      hoverTimeoutRef.current = setTimeout(() => {
        videoRef.current?.play().catch(err => {
          console.log('Video autoplay prevented:', err);
        });
      }, 300);
    } else if (!isHovered && videoRef.current) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }

    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [isHovered, course.demoVideoId]);

  const getLevelBadge = (level: string) => {
    const styles = {
      beginner: 'bg-green-100 text-green-700',
      intermediate: 'bg-yellow-100 text-yellow-700',
      advanced: 'bg-red-100 text-red-700'
    };
    const labels = {
      beginner: 'Cơ bản',
      intermediate: 'Trung cấp',
      advanced: 'Nâng cao'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[level as keyof typeof styles]}`}>
        {labels[level as keyof typeof labels]}
      </span>
    );
  };

  const getBorderColor = () => {
    return 'border-slate-200';
  };

  return (
    <div
      className={`bg-white rounded-xl border-2 ${getBorderColor()} overflow-hidden transition-all duration-300 ${
        isHovered ? 'shadow-2xl scale-105 z-10' : 'shadow-sm hover:shadow-lg'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail/Video Area */}
      <div className="aspect-video bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center relative overflow-hidden">
        {/* Video Demo (shows on hover) */}
        {course.demoVideoId && (
          <video
            ref={videoRef}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
            muted
            loop
            playsInline

          >
            <source
              src={`https://${CDN_HOSTNAME}/${course.demoVideoId}/playlist.m3u8`}
              type="application/x-mpegURL"
            />
          </video>
        )}

        {/* Thumbnail (shows when not hovering) */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            isHovered && course.demoVideoId ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {course.thumbnail ? (
            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-white" />
            </div>
          )}
        </div>

        {/* Play Icon Overlay */}
        {course.demoVideoId && !isHovered && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="bg-white/90 rounded-full p-4">
              <Play className="w-8 h-8 text-brand-600" fill="currentColor" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-slate-900 line-clamp-2 flex-1">{course.title}</h3>
          {getLevelBadge(course.level)}
        </div>
        <p className="text-sm text-slate-600 mb-2 line-clamp-2">{course.description}</p>
        <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
          <span>👨‍🏫 {course.teacherName}</span>
          <span className="text-slate-400">{course.category}</span>
        </div>
        
        <div className="mb-3 flex items-center gap-2">
          {course.departmentId === 'all' ? (
            <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              🌐 Chung
            </span>
          ) : departmentName ? (
            <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
              🏢 {departmentName}
            </span>
          ) : null}
          {course.students && course.students.length > 0 && (
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              👥 {course.students.length} học viên
            </span>
          )}
        </div>
        
        <div className="flex items-center text-sm mb-3">
          <span className="text-slate-600 flex items-center gap-1">
            <Clock size={14} />
            {course.duration}h
          </span>
        </div>

        {/* Action Button */}
        <Button
          onClick={() => onView?.(course.id)}
          className="w-full bg-brand-500 hover:bg-brand-600"
        >
          Học ngay
        </Button>
      </div>
    </div>
  );
};
