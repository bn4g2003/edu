import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDhc9bWAA8h1bqXEZcW0tq7j9t5lTQeoN4",
  authDomain: "classroom-257dc.firebaseapp.com",
  databaseURL: "https://classroom-257dc-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "classroom-257dc",
  storageBucket: "classroom-257dc.firebasestorage.app",
  messagingSenderId: "376090394045",
  appId: "1:376090394045:web:d99dedd72d3a02f96966d4",
  measurementId: "G-NS5J50BB0F"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedData() {
  try {
    console.log('🌱 Bắt đầu seed dữ liệu...\n');

    // Tạo giáo viên
    const teachers = [
      {
        uid: 'teacher_1',
        email: 'teacher1@edupro.com',
        password: 'teacher123',
        displayName: 'Nguyễn Văn A',
        role: 'teacher',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        uid: 'teacher_2',
        email: 'teacher2@edupro.com',
        password: 'teacher123',
        displayName: 'Trần Thị B',
        role: 'teacher',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    console.log('👨‍🏫 Tạo tài khoản giáo viên...');
    for (const teacher of teachers) {
      await setDoc(doc(db, 'users', teacher.uid), teacher);
      console.log(`   ✓ ${teacher.displayName} (${teacher.email})`);
    }

    // Tạo học sinh
    const students = [
      {
        uid: 'student_1',
        email: 'student1@edupro.com',
        password: 'student123',
        displayName: 'Lê Văn C',
        role: 'student',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        uid: 'student_2',
        email: 'student2@edupro.com',
        password: 'student123',
        displayName: 'Phạm Thị D',
        role: 'student',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        uid: 'student_3',
        email: 'student3@edupro.com',
        password: 'student123',
        displayName: 'Hoàng Văn E',
        role: 'student',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    console.log('\n👨‍🎓 Tạo tài khoản học sinh...');
    for (const student of students) {
      await setDoc(doc(db, 'users', student.uid), student);
      console.log(`   ✓ ${student.displayName} (${student.email})`);
    }

    // Tạo khóa học
    const courses = [
      {
        id: 'course_1',
        title: 'React từ cơ bản đến nâng cao',
        description: 'Học React từ những kiến thức cơ bản nhất đến các kỹ thuật nâng cao. Xây dựng ứng dụng thực tế.',
        teacherId: 'teacher_1',
        teacherName: 'Nguyễn Văn A',
        category: 'Lập trình Web',
        level: 'intermediate',
        duration: 40,
        price: 1500000,
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
        students: ['student_1', 'student_2'],
        pendingStudents: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'course_2',
        title: 'JavaScript cơ bản cho người mới',
        description: 'Khóa học JavaScript dành cho người mới bắt đầu. Học từ cú pháp cơ bản đến DOM manipulation.',
        teacherId: 'teacher_1',
        teacherName: 'Nguyễn Văn A',
        category: 'Lập trình Web',
        level: 'beginner',
        duration: 30,
        price: 1000000,
        thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800',
        students: ['student_1', 'student_3'],
        pendingStudents: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'course_3',
        title: 'UI/UX Design với Figma',
        description: 'Thiết kế giao diện người dùng chuyên nghiệp với Figma. Từ wireframe đến prototype.',
        teacherId: 'teacher_2',
        teacherName: 'Trần Thị B',
        category: 'Thiết kế',
        level: 'beginner',
        duration: 25,
        price: 1200000,
        thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800',
        students: ['student_2'],
        pendingStudents: ['student_3'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'course_4',
        title: 'Node.js & Express Backend',
        description: 'Xây dựng RESTful API với Node.js và Express. Kết nối database, authentication, và deployment.',
        teacherId: 'teacher_1',
        teacherName: 'Nguyễn Văn A',
        category: 'Lập trình Backend',
        level: 'advanced',
        duration: 50,
        price: 2000000,
        thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800',
        students: ['student_1'],
        pendingStudents: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'course_5',
        title: 'Python cho Data Science',
        description: 'Học Python và các thư viện phổ biến cho Data Science: Pandas, NumPy, Matplotlib.',
        teacherId: 'teacher_2',
        teacherName: 'Trần Thị B',
        category: 'Data Science',
        level: 'intermediate',
        duration: 45,
        price: 1800000,
        thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800',
        students: ['student_3'],
        pendingStudents: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    console.log('\n📚 Tạo khóa học...');
    for (const course of courses) {
      await setDoc(doc(db, 'courses', course.id), course);
      console.log(`   ✓ ${course.title}`);
    }

    console.log('\n✅ Seed dữ liệu thành công!');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Tổng kết:');
    console.log(`   • ${teachers.length} giáo viên`);
    console.log(`   • ${students.length} học sinh`);
    console.log(`   • ${courses.length} khóa học`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n🔑 Tài khoản test:');
    console.log('   Giáo viên: teacher1@edupro.com / teacher123');
    console.log('   Học sinh: student1@edupro.com / student123');
    console.log('   Admin: admin@edupro.com / admin123');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

seedData();
