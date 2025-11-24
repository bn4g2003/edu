'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Lesson, Question } from '@/types/lesson';
import { Plus, Trash2, X, Save, FileText, Wand2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/Button';
import { QuizResults } from './QuizResults';

interface QuizManagementProps {
  lesson: Lesson;
  onBack: () => void;
}

interface BulkForm {
  question: string;
  options: string[];
  correctAnswer: number;
}

export const QuizManagement: React.FC<QuizManagementProps> = ({ lesson, onBack }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showBulkFormModal, setShowBulkFormModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showResults, setShowResults] = useState(false);

  const [bulkData, setBulkData] = useState({
    count: 10,
    duration: 30, // minutes
    correctAnswer: 0 // default answer A
  });

  const [correctAnswers, setCorrectAnswers] = useState<number[]>([]);
  const [bulkForms, setBulkForms] = useState<BulkForm[]>([]);

  useEffect(() => {
    loadQuestions();
  }, [lesson.id]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const questionsRef = collection(db, 'questions');
      const q = query(questionsRef, where('lessonId', '==', lesson.id));
      const snapshot = await getDocs(q);
      const questionsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as Question[];
      
      questionsData.sort((a, b) => a.order - b.order);
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = () => {
    // Open modal to set quiz parameters
    setCorrectAnswers([]);
    setShowBulkModal(true);
  };

  const handleBulkCreate = async () => {
    if (bulkData.count < 1 || bulkData.count > 100) {
      alert('Số câu hỏi phải từ 1 đến 100');
      return;
    }

    if (bulkData.duration < 1 || bulkData.duration > 180) {
      alert('Thời gian làm bài phải từ 1 đến 180 phút');
      return;
    }

    // Initialize correct answers array
    const initialAnswers = new Array(bulkData.count).fill(0);
    setCorrectAnswers(initialAnswers);
    setShowBulkModal(false);
  };

  const handleSaveQuiz = async () => {
    try {
      // Delete existing questions
      for (const q of questions) {
        await deleteDoc(doc(db, 'questions', q.id));
      }

      // Create new questions with correct answers
      for (let i = 0; i < correctAnswers.length; i++) {
        const newQuestion: Question = {
          id: `question_${Date.now()}_${i}`,
          lessonId: lesson.id,
          question: '', // Empty question
          options: ['', '', '', ''], // Empty options
          correctAnswer: correctAnswers[i],
          order: i + 1,
          createdAt: new Date()
        };
        await setDoc(doc(db, 'questions', newQuestion.id), newQuestion);
      }

      // Mark lesson as having quiz and set duration
      const lessonRef = doc(db, 'lessons', lesson.id);
      await setDoc(lessonRef, {
        ...lesson,
        hasQuiz: true,
        quizDuration: bulkData.duration,
        updatedAt: new Date()
      });

      alert(`Đã lưu bài kiểm tra với ${correctAnswers.length} câu hỏi!`);
      setCorrectAnswers([]);
      loadQuestions();
    } catch (error) {
      console.error('Error saving quiz:', error);
      alert('Lỗi khi lưu bài kiểm tra');
    }
  };

  const handleRemoveFromModal = (index: number) => {
    const newForms = bulkForms.filter((_, i) => i !== index);
    setBulkForms(newForms);
  };

  const handleAddMoreInModal = () => {
    setBulkForms([
      ...bulkForms,
      {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0
      }
    ]);
  };

  const handleSaveBulkForms = async () => {
    // Validate all forms
    for (let i = 0; i < bulkForms.length; i++) {
      const form = bulkForms[i];
      if (!form.question.trim()) {
        alert(`Câu hỏi ${i + 1}: Vui lòng nhập nội dung câu hỏi`);
        return;
      }
      for (let j = 0; j < form.options.length; j++) {
        if (!form.options[j].trim()) {
          alert(`Câu hỏi ${i + 1}: Vui lòng nhập đáp án ${String.fromCharCode(65 + j)}`);
          return;
        }
      }
    }

    try {
      // Delete existing questions if editing
      if (editingQuestion) {
        await deleteDoc(doc(db, 'questions', editingQuestion.id));
      } else {
        for (const q of questions) {
          await deleteDoc(doc(db, 'questions', q.id));
        }
      }

      // Create new questions
      for (let i = 0; i < bulkForms.length; i++) {
        const form = bulkForms[i];
        const newQuestion: Question = {
          id: editingQuestion ? editingQuestion.id : `question_${Date.now()}_${i}`,
          lessonId: lesson.id,
          question: form.question,
          options: form.options,
          correctAnswer: form.correctAnswer,
          order: editingQuestion ? editingQuestion.order : i + 1,
          createdAt: new Date()
        };
        await setDoc(doc(db, 'questions', newQuestion.id), newQuestion);
      }

      // Mark lesson as having quiz
      const lessonRef = doc(db, 'lessons', lesson.id);
      await setDoc(lessonRef, {
        ...lesson,
        hasQuiz: true,
        quizDuration: bulkData.duration,
        updatedAt: new Date()
      });

      alert(editingQuestion ? 'Cập nhật câu hỏi thành công!' : `Đã lưu ${bulkForms.length} câu hỏi!`);
      setShowBulkFormModal(false);
      setBulkForms([]);
      setEditingQuestion(null);
      loadQuestions();
    } catch (error) {
      console.error('Error saving questions:', error);
      alert('Lỗi khi lưu câu hỏi');
    }
  };

  const handleDeleteQuiz = async () => {
    if (!confirm(`Bạn có chắc muốn xóa toàn bộ bài kiểm tra này?`)) {
      return;
    }

    try {
      // Delete all questions
      for (const q of questions) {
        await deleteDoc(doc(db, 'questions', q.id));
      }

      // Update lesson
      const lessonRef = doc(db, 'lessons', lesson.id);
      await setDoc(lessonRef, {
        ...lesson,
        hasQuiz: false,
        quizDuration: undefined,
        updatedAt: new Date()
      });

      alert('Xóa bài kiểm tra thành công!');
      loadQuestions();
    } catch (error) {
      console.error('Error deleting quiz:', error);
      alert('Lỗi khi xóa bài kiểm tra');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  // Show results view
  if (showResults) {
    return <QuizResults lesson={lesson} onBack={() => setShowResults(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <button onClick={onBack} className="text-brand-600 hover:text-brand-700 mb-3 flex items-center gap-2">
            ← Quay lại danh sách bài học
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">Quản lý bài kiểm tra</h3>
              <p className="text-slate-600">Bài học: <span className="font-medium">{lesson.title}</span></p>
              {questions.length > 0 && (
                <p className="text-sm text-slate-500 mt-1">
                  Tổng số câu: <span className="font-bold text-purple-600">{questions.length}</span>
                  {lesson.quizDuration && <span> | Thời gian: <span className="font-bold text-purple-600">{lesson.quizDuration} phút</span></span>}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              {questions.length > 0 && (
                <>
                  <Button
                    onClick={() => setShowResults(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg"
                  >
                    <BarChart3 size={18} />
                    Xem kết quả
                  </Button>
                  <button
                    onClick={handleDeleteQuiz}
                    className="px-4 py-2 border-2 border-red-500 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={18} />
                    Xóa bài kiểm tra
                  </button>
                </>
              )}
              <Button onClick={handleCreateQuiz} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 shadow-lg">
                <Plus size={18} />
                {questions.length > 0 ? 'Tạo lại' : 'Tạo bài kiểm tra'}
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {correctAnswers.length === 0 && questions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa có bài kiểm tra</h3>
              <p className="text-slate-600 mb-6">Tạo bài kiểm tra với số câu hỏi và đáp án đúng</p>
              <Button onClick={handleCreateQuiz} className="bg-purple-600 hover:bg-purple-700 shadow-lg">
                <Plus size={18} className="mr-2" />
                Tạo bài kiểm tra
              </Button>
            </div>
          </div>
        ) : correctAnswers.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Thiết lập đáp án đúng</h3>
                  <p className="text-slate-600">Chọn đáp án đúng cho từng câu hỏi (A, B, C, hoặc D)</p>
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <span className="text-slate-600">Thời gian:</span>
                    <span className="font-bold text-purple-600">{bulkData.duration} phút</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-600">Tổng số câu:</span>
                    <span className="font-bold text-purple-600">{correctAnswers.length} câu</span>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-slate-700 mb-3">⚡ Chọn nhanh tất cả:</p>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3].map((optIndex) => (
                      <button
                        key={optIndex}
                        onClick={() => {
                          const newAnswers = correctAnswers.map(() => optIndex);
                          setCorrectAnswers(newAnswers);
                        }}
                        className="w-10 h-10 rounded-lg font-bold text-sm bg-white border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm"
                        title={`Đặt tất cả là ${String.fromCharCode(65 + optIndex)}`}
                      >
                        {String.fromCharCode(65 + optIndex)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Hoặc dùng phím 1, 2, 3, 4</p>
                </div>
              </div>
            </div>

            {/* Compact Grid Layout */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
              {correctAnswers.map((answer, index) => (
                <div 
                  key={index} 
                  className="border-2 border-slate-200 rounded-lg p-3 bg-slate-50 hover:border-purple-300 transition-all"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    const key = e.key.toUpperCase();
                    if (['1', '2', '3', '4'].includes(key)) {
                      const newAnswers = [...correctAnswers];
                      newAnswers[index] = parseInt(key) - 1;
                      setCorrectAnswers(newAnswers);
                    } else if (['A', 'B', 'C', 'D'].includes(key)) {
                      const newAnswers = [...correctAnswers];
                      newAnswers[index] = key.charCodeAt(0) - 65;
                      setCorrectAnswers(newAnswers);
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-600">Câu {index + 1}</span>
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                      answer !== undefined 
                        ? 'bg-green-500 text-white' 
                        : 'bg-slate-200 text-slate-400'
                    }`}>
                      {answer !== undefined ? String.fromCharCode(65 + answer) : '?'}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[0, 1, 2, 3].map((optIndex) => (
                      <button
                        key={optIndex}
                        onClick={() => {
                          const newAnswers = [...correctAnswers];
                          newAnswers[index] = optIndex;
                          setCorrectAnswers(newAnswers);
                        }}
                        className={`h-8 rounded font-bold text-xs transition-all ${
                          answer === optIndex
                            ? 'bg-green-500 text-white shadow-md scale-110'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-green-400 hover:bg-green-50'
                        }`}
                      >
                        {String.fromCharCode(65 + optIndex)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Progress Indicator */}
            <div className="mb-6 bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Tiến độ hoàn thành</span>
                <span className="text-sm font-bold text-purple-600">
                  {correctAnswers.filter(a => a !== undefined).length}/{correctAnswers.length}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(correctAnswers.filter(a => a !== undefined).length / correctAnswers.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (confirm('Hủy bỏ bài kiểm tra đang tạo?')) {
                    setCorrectAnswers([]);
                  }
                }}
                className="px-6 py-3 border-2 border-slate-200 rounded-lg hover:bg-slate-50 font-medium transition-colors"
              >
                Hủy
              </button>
              <div className="flex-1" />
              <Button 
                onClick={handleSaveQuiz} 
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 shadow-lg px-8"
              >
                <Save size={18} />
                Lưu bài kiểm tra ({correctAnswers.length} câu)
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => {
              const isEmpty = !question.question && question.options.every(opt => !opt);
              
              return (
                <div key={question.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      {isEmpty ? (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-slate-900">Câu hỏi trống</h3>
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                              Chỉ có đáp án
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-3">
                            Giáo viên sẽ chỉ thấy số câu và 4 nút A/B/C/D
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">Đáp án đúng:</span>
                            <div className="px-4 py-2 bg-green-50 border-2 border-green-500 rounded-lg font-bold text-green-700">
                              {String.fromCharCode(65 + question.correctAnswer)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-slate-900">{question.question}</h3>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              Có nội dung
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {question.options.map((option, optIndex) => (
                              <div
                                key={optIndex}
                                className={`text-sm px-4 py-3 rounded-lg border-2 transition-all ${
                                  optIndex === question.correctAnswer
                                    ? 'bg-green-50 border-green-500 text-green-700 font-medium shadow-sm'
                                    : 'bg-slate-50 border-slate-200 text-slate-600'
                                }`}
                              >
                                <span className="font-bold mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                                {option}
                                {optIndex === question.correctAnswer && (
                                  <span className="ml-2 text-green-600">✓ Đúng</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bulk Create Modal */}
        {showBulkModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Tạo hàng loạt câu hỏi</h3>
                  <p className="text-sm text-slate-600 mt-1">Tạo câu hỏi trống, chỉ có đáp án đúng</p>
                </div>
                <button 
                  onClick={() => setShowBulkModal(false)} 
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Số lượng câu hỏi *</label>
                  <input
                    type="number"
                    value={bulkData.count}
                    onChange={(e) => setBulkData({ ...bulkData, count: Number(e.target.value) })}
                    min={1}
                    max={100}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg font-bold text-center"
                  />
                  <p className="text-xs text-slate-500 mt-2 text-center">Từ 1 đến 100 câu hỏi</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Đáp án đúng mặc định *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['A', 'B', 'C', 'D'].map((letter, index) => (
                      <label 
                        key={index} 
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          bulkData.correctAnswer === index
                            ? 'bg-green-50 border-green-500 shadow-md'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="bulkCorrectAnswer"
                          checked={bulkData.correctAnswer === index}
                          onChange={() => setBulkData({ ...bulkData, correctAnswer: index })}
                          className="w-5 h-5 text-green-600"
                        />
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-bold text-slate-700 border-2 border-slate-300">
                            {letter}
                          </div>
                          <span className="font-medium text-slate-700">Đáp án {letter}</span>
                        </div>
                        {bulkData.correctAnswer === index && (
                          <span className="ml-auto text-green-600">✓</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Thời gian làm bài (phút) *</label>
                  <input
                    type="number"
                    value={bulkData.duration}
                    onChange={(e) => setBulkData({ ...bulkData, duration: Number(e.target.value) })}
                    min={1}
                    max={180}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg font-bold text-center"
                  />
                  <p className="text-xs text-slate-500 mt-2 text-center">Từ 1 đến 180 phút</p>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Wand2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-purple-900 mb-1">Lưu ý</p>
                      <p className="text-xs text-purple-800">
                        Hệ thống sẽ tạo <span className="font-bold">{bulkData.count} câu hỏi trống</span> với đáp án đúng là <span className="font-bold">{String.fromCharCode(65 + bulkData.correctAnswer)}</span>. 
                        Giáo viên sẽ chỉ thấy số câu và 4 nút A/B/C/D.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <Button 
                  onClick={handleBulkCreate} 
                  className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 py-3 shadow-lg"
                >
                  <Wand2 size={18} />
                  Tạo {bulkData.count} câu hỏi
                </Button>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Form Modal - Step 2: Fill all questions */}
        {showBulkFormModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {editingQuestion ? 'Chỉnh sửa câu hỏi' : `Điền nội dung ${bulkForms.length} câu hỏi`}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">Điền đầy đủ câu hỏi và đáp án, tích chọn đáp án đúng</p>
                </div>
                <button 
                  onClick={() => {
                    if (confirm('Hủy bỏ tất cả câu hỏi đang nhập?')) {
                      setShowBulkFormModal(false);
                      setBulkForms([]);
                      setEditingQuestion(null);
                    }
                  }} 
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {bulkForms.map((form, formIndex) => (
                  <div key={formIndex} className="border-2 border-slate-200 rounded-xl p-6 bg-slate-50 relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                          {formIndex + 1}
                        </div>
                        <h4 className="text-lg font-bold text-slate-900">Câu hỏi {formIndex + 1}</h4>
                      </div>
                      {!editingQuestion && bulkForms.length > 1 && (
                        <button
                          onClick={() => handleRemoveFromModal(formIndex)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa câu hỏi này"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Nội dung câu hỏi *</label>
                        <textarea
                          value={form.question}
                          onChange={(e) => {
                            const newForms = [...bulkForms];
                            newForms[formIndex].question = e.target.value;
                            setBulkForms(newForms);
                          }}
                          rows={2}
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                          placeholder="Nhập câu hỏi..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Các đáp án *</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {form.options.map((option, optIndex) => (
                            <div 
                              key={optIndex}
                              className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all bg-white ${
                                form.correctAnswer === optIndex 
                                  ? 'border-green-500 bg-green-50' 
                                  : 'border-slate-200'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`correct_${formIndex}`}
                                checked={form.correctAnswer === optIndex}
                                onChange={() => {
                                  const newForms = [...bulkForms];
                                  newForms[formIndex].correctAnswer = optIndex;
                                  setBulkForms(newForms);
                                }}
                                className="w-4 h-4 text-green-600"
                              />
                              <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold text-xs text-slate-700">
                                {String.fromCharCode(65 + optIndex)}
                              </div>
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const newForms = [...bulkForms];
                                  newForms[formIndex].options[optIndex] = e.target.value;
                                  setBulkForms(newForms);
                                }}
                                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                placeholder={`Đáp án ${String.fromCharCode(65 + optIndex)}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-8 sticky bottom-0 bg-white pt-4 border-t border-slate-200">
                {!editingQuestion && (
                  <button
                    onClick={handleAddMoreInModal}
                    className="px-6 py-3 border-2 border-purple-500 text-purple-600 rounded-lg hover:bg-purple-50 font-medium transition-colors flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Thêm câu hỏi
                  </button>
                )}
                <div className="flex-1" />
                <button
                  onClick={() => {
                    if (confirm('Hủy bỏ tất cả câu hỏi đang nhập?')) {
                      setShowBulkFormModal(false);
                      setBulkForms([]);
                      setEditingQuestion(null);
                    }
                  }}
                  className="px-6 py-3 border-2 border-slate-200 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Hủy
                </button>
                <Button 
                  onClick={handleSaveBulkForms} 
                  className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 py-3 shadow-lg"
                >
                  <Save size={18} />
                  {editingQuestion ? 'Cập nhật' : `Lưu ${bulkForms.length} câu hỏi`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
