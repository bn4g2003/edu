'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Lesson, QuizResult, Question } from '@/types/lesson';
import { ArrowLeft, Users, Award, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/Button';

interface QuizResultsProps {
  lesson: Lesson;
  onBack: () => void;
}

export const QuizResults: React.FC<QuizResultsProps> = ({ lesson, onBack }) => {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    loadData();
  }, [lesson.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load quiz results - without orderBy to avoid index requirement
      const resultsRef = collection(db, 'quizResults');
      const resultsQuery = query(
        resultsRef, 
        where('lessonId', '==', lesson.id)
      );
      const resultsSnapshot = await getDocs(resultsQuery);
      const resultsData = resultsSnapshot.docs.map(doc => ({
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate()
      })) as QuizResult[];
      
      // Sort in memory instead
      resultsData.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
      
      // Load questions
      const questionsRef = collection(db, 'questions');
      const questionsQuery = query(
        questionsRef,
        where('lessonId', '==', lesson.id)
      );
      const questionsSnapshot = await getDocs(questionsQuery);
      const questionsData = questionsSnapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as Question[];
      
      // Sort questions by order
      questionsData.sort((a, b) => a.order - b.order);
      
      setResults(resultsData);
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error loading quiz results:', error);
      alert('Lỗi khi tải kết quả: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (results.length === 0) return null;
    
    const totalStudents = results.length;
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / totalStudents;
    const avgTime = results
      .filter(r => r.timeSpent)
      .reduce((sum, r) => sum + (r.timeSpent || 0), 0) / totalStudents;
    const passCount = results.filter(r => r.score >= 50).length;
    const passRate = (passCount / totalStudents) * 100;
    
    return { totalStudents, avgScore, avgTime, passRate };
  };

  const stats = calculateStats();

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <button onClick={onBack} className="text-brand-600 hover:text-brand-700 mb-3 flex items-center gap-2">
            <ArrowLeft size={18} />
            Quay lại quản lý bài kiểm tra
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">Kết quả bài kiểm tra</h3>
              <p className="text-slate-600">Bài học: <span className="font-medium">{lesson.title}</span></p>
            </div>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa có giáo viên làm bài</h3>
              <p className="text-slate-600">Kết quả sẽ hiển thị khi có giáo viên hoàn thành bài kiểm tra</p>
            </div>
          </div>
        ) : (
          <>
            {/* Statistics */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-600">Giáo viên</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{stats.totalStudents}</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-600">Điểm TB</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{stats.avgScore.toFixed(1)}</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-600">Tỷ lệ đạt</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{stats.passRate.toFixed(0)}%</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-600">Thời gian TB</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">
                    {Math.floor(stats.avgTime / 60)}'
                  </p>
                </div>
              </div>
            )}

            {/* Results Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">Giáo viên</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-slate-700">Điểm</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-slate-700">Đúng/Tổng</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-slate-700">Thời gian</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-slate-700">Hoàn thành</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-slate-700">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {results.map((result) => (
                      <tr key={result.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-slate-900">{result.userName || 'Giáo viên'}</p>
                            <p className="text-sm text-slate-500">{result.userEmail}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl font-bold text-xl ${
                            result.score >= 80 ? 'bg-green-100 text-green-700' :
                            result.score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {result.score}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-medium text-slate-900">
                            {result.correctCount}/{result.totalQuestions}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-slate-600">
                            {result.timeSpent ? `${Math.floor(result.timeSpent / 60)}:${(result.timeSpent % 60).toString().padStart(2, '0')}` : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-slate-600">
                            {result.completedAt.toLocaleDateString('vi-VN')}
                            <br />
                            {result.completedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Button
                            onClick={() => setSelectedResult(result)}
                            className="bg-purple-600 hover:bg-purple-700 text-sm py-2 px-4"
                          >
                            Xem chi tiết
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Detail Modal */}
        {selectedResult && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Chi tiết bài làm</h3>
                  <p className="text-slate-600 mt-1">{selectedResult.userName || 'Giáo viên'}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-slate-600">
                      Điểm: <span className="font-bold text-purple-600">{selectedResult.score}</span>
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-600">
                      Đúng: <span className="font-bold text-green-600">{selectedResult.correctCount}/{selectedResult.totalQuestions}</span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedResult(null)}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {questions.map((question, index) => {
                  const studentAnswer = selectedResult.answers[index];
                  const isCorrect = studentAnswer === question.correctAnswer;
                  const isEmpty = !question.question && question.options.every(opt => !opt);

                  return (
                    <div
                      key={question.id}
                      className={`border-2 rounded-xl p-5 ${
                        isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold flex-shrink-0 ${
                          isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          {isEmpty ? (
                            <p className="text-slate-600 font-medium mb-3">Câu hỏi trống (chỉ có đáp án)</p>
                          ) : (
                            <p className="text-slate-900 font-medium mb-3">{question.question}</p>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {question.options.map((option, optIndex) => {
                              const isStudentChoice = studentAnswer === optIndex;
                              const isCorrectAnswer = question.correctAnswer === optIndex;
                              
                              return (
                                <div
                                  key={optIndex}
                                  className={`px-4 py-3 rounded-lg border-2 text-sm ${
                                    isCorrectAnswer
                                      ? 'bg-green-100 border-green-500 font-medium'
                                      : isStudentChoice
                                      ? 'bg-red-100 border-red-500'
                                      : 'bg-white border-slate-200'
                                  }`}
                                >
                                  <span className="font-bold mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                                  {isEmpty ? `Đáp án ${String.fromCharCode(65 + optIndex)}` : option}
                                  {isCorrectAnswer && (
                                    <CheckCircle className="inline-block ml-2 w-4 h-4 text-green-600" />
                                  )}
                                  {isStudentChoice && !isCorrectAnswer && (
                                    <XCircle className="inline-block ml-2 w-4 h-4 text-red-600" />
                                  )}
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

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setSelectedResult(null)}
                  className="bg-slate-600 hover:bg-slate-700"
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
