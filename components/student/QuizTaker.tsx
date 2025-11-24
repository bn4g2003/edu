'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Question, QuizResult } from '@/types/lesson';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, XCircle, Award, Save, Clock } from 'lucide-react';
import { Button } from '@/components/Button';

interface QuizTakerProps {
  lessonId: string;
  courseId: string;
  quizDuration?: number; // minutes
  onComplete: () => void;
}

export const QuizTaker: React.FC<QuizTakerProps> = ({ lessonId, courseId, quizDuration, onComplete }) => {
  const { userProfile } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0); // seconds
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  useEffect(() => {
    loadQuestions();
  }, [lessonId]);

  useEffect(() => {
    if (quizDuration && timeLeft > 0 && !showResult) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsTimeUp(true);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, showResult]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const questionsRef = collection(db, 'questions');
      const q = query(questionsRef, where('lessonId', '==', lessonId));
      const snapshot = await getDocs(q);
      const questionsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as Question[];
      
      questionsData.sort((a, b) => a.order - b.order);
      setQuestions(questionsData);
      setAnswers(new Array(questionsData.length).fill(-1));
      
      // Set timer if duration is provided
      if (quizDuration) {
        setTimeLeft(quizDuration * 60); // Convert minutes to seconds
      }
      
      // Record start time
      setStartTime(Date.now());
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!userProfile) {
      alert('Bạn cần đăng nhập để nộp bài');
      return;
    }

    // Check if all questions are answered
    if (answers.some(a => a === -1)) {
      if (!confirm('Bạn chưa trả lời hết các câu hỏi. Bạn có muốn nộp bài không?')) {
        return;
      }
    }

    try {
      // Calculate score
      let correctCount = 0;
      questions.forEach((question, index) => {
        if (answers[index] === question.correctAnswer) {
          correctCount++;
        }
      });

      const score = Math.round((correctCount / questions.length) * 100);
      
      // Calculate time spent
      const timeSpent = Math.floor((Date.now() - startTime) / 1000); // in seconds

      const quizResult: QuizResult = {
        id: `${userProfile.uid}_${lessonId}_${Date.now()}`,
        userId: userProfile.uid,
        userName: userProfile.displayName || userProfile.email || 'Học sinh',
        userEmail: userProfile.email || '',
        lessonId: lessonId,
        courseId: courseId,
        answers: answers,
        correctCount: correctCount,
        totalQuestions: questions.length,
        score: score,
        timeSpent: timeSpent,
        completedAt: new Date()
      };

      console.log('Saving quiz result:', quizResult);
      
      await setDoc(doc(db, 'quizResults', quizResult.id), quizResult);
      
      console.log('Quiz result saved successfully!');
      
      setResult(quizResult);
      setShowResult(true);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Lỗi khi nộp bài: ' + (error as Error).message);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải câu hỏi...</div>;
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <p className="text-slate-600 mb-4">Bài kiểm tra này chưa có câu hỏi</p>
        <Button onClick={onComplete}>Quay lại</Button>
      </div>
    );
  }

  if (showResult && result) {
    return (
      <div className="bg-white rounded-xl p-8">
        <div className="text-center mb-8">
          <Award className={`w-20 h-20 mx-auto mb-4 ${
            result.score >= 80 ? 'text-green-500' : result.score >= 50 ? 'text-yellow-500' : 'text-red-500'
          }`} />
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Kết quả bài kiểm tra</h2>
          <div className="text-5xl font-bold mb-2" style={{
            color: result.score >= 80 ? '#10b981' : result.score >= 50 ? '#f59e0b' : '#ef4444'
          }}>
            {result.score} điểm
          </div>
          <p className="text-slate-600">
            Bạn trả lời đúng {result.correctCount}/{result.totalQuestions} câu
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {questions.map((question, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === question.correctAnswer;

            return (
              <div key={question.id} className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {isCorrect ? <CheckCircle size={20} /> : <XCircle size={20} />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 mb-2">
                      Câu {index + 1}: {question.question}
                    </h3>
                    <div className="space-y-2">
                      {question.options.map((option, optIndex) => {
                        const isUserAnswer = userAnswer === optIndex;
                        const isCorrectAnswer = question.correctAnswer === optIndex;
                        const displayText = option || `Đáp án ${String.fromCharCode(65 + optIndex)}`;

                        return (
                          <div
                            key={optIndex}
                            className={`px-4 py-2 rounded-lg text-sm ${
                              isCorrectAnswer
                                ? 'bg-green-50 border-2 border-green-500 text-green-700 font-medium'
                                : isUserAnswer
                                ? 'bg-red-50 border-2 border-red-500 text-red-700'
                                : 'bg-slate-50 text-slate-600'
                            }`}
                          >
                            {String.fromCharCode(65 + optIndex)}. {displayText}
                            {isCorrectAnswer && ' ✓ (Đáp án đúng)'}
                            {isUserAnswer && !isCorrectAnswer && ' ✗ (Bạn chọn)'}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button onClick={onComplete} className="flex-1">
            Quay lại bài học
          </Button>
          <Button
            onClick={() => {
              setShowResult(false);
              setAnswers(new Array(questions.length).fill(-1));
              if (quizDuration) {
                setTimeLeft(quizDuration * 60);
              }
              setIsTimeUp(false);
              setStartTime(Date.now());
            }}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            Làm lại
          </Button>
        </div>
      </div>
    );
  }

  const hasContent = questions.some(q => q.question || q.options.some(opt => opt));

  return (
    <div className="bg-white rounded-xl p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-900">Bài kiểm tra</h2>
          <div className="flex items-center gap-4">
            {quizDuration && timeLeft > 0 && (
              <div className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${
                timeLeft < 60 ? 'bg-red-100 text-red-700' : 
                timeLeft < 300 ? 'bg-orange-100 text-orange-700' : 
                'bg-blue-100 text-blue-700'
              }`}>
                <Clock size={18} />
                {formatTime(timeLeft)}
              </div>
            )}
            <span className="text-sm font-medium text-slate-600">
              {answers.filter(a => a !== -1).length} / {questions.length} câu
            </span>
          </div>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 transition-all duration-300"
            style={{ width: `${(answers.filter(a => a !== -1).length / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4 mb-8">
        {hasContent ? (
          // Full content display
          questions.map((question, index) => (
            <div 
              key={question.id} 
              className="border-2 border-slate-200 rounded-xl p-6 hover:border-purple-300 transition-all bg-slate-50"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg">
                  {index + 1}
                </div>
                <h3 className="text-lg font-bold text-slate-900 flex-1">
                  {question.question || `Câu hỏi ${index + 1}`}
                </h3>
                {answers[index] !== -1 && (
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-14">
                {question.options.map((option, optIndex) => (
                  <button
                    key={optIndex}
                    onClick={() => {
                      const newAnswers = [...answers];
                      newAnswers[index] = optIndex;
                      setAnswers(newAnswers);
                    }}
                    className={`px-4 py-3 rounded-lg text-left transition-all border-2 ${
                      answers[index] === optIndex
                        ? 'bg-purple-500 text-white border-purple-600 shadow-lg'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                  >
                    <span className="font-bold mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                    {option || `Đáp án ${String.fromCharCode(65 + optIndex)}`}
                  </button>
                ))}
              </div>
            </div>
          ))
        ) : (
          // Compact table display for empty questions
          questions.map((question, index) => (
            <div 
              key={question.id} 
              className="border-2 border-slate-200 rounded-xl p-4 hover:border-purple-300 transition-all bg-slate-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg">
                  {index + 1}
                </div>

                <div className="flex-1 flex items-center gap-3">
                  {[0, 1, 2, 3].map((optIndex) => (
                    <button
                      key={optIndex}
                      onClick={() => {
                        const newAnswers = [...answers];
                        newAnswers[index] = optIndex;
                        setAnswers(newAnswers);
                      }}
                      className={`flex-1 h-12 rounded-lg font-bold text-lg transition-all ${
                        answers[index] === optIndex
                          ? 'bg-purple-500 text-white shadow-lg scale-105'
                          : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      {String.fromCharCode(65 + optIndex)}
                    </button>
                  ))}
                </div>

                <div className="w-8 flex-shrink-0">
                  {answers[index] !== -1 && (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Submit Button */}
      <div className="flex gap-3">
        <button
          onClick={onComplete}
          className="px-6 py-3 border-2 border-slate-200 rounded-lg hover:bg-slate-50 font-medium transition-colors"
        >
          Hủy
        </button>
        <div className="flex-1" />
        <button
          onClick={handleSubmit}
          disabled={isTimeUp}
          className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-bold shadow-lg flex items-center gap-2 disabled:opacity-50"
        >
          <Save size={18} />
          Nộp bài ({answers.filter(a => a !== -1).length}/{questions.length})
        </button>
      </div>
    </div>
  );
};
