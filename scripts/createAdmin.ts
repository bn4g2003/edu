import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

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

async function createAdminAccount() {
  const adminEmail = 'admin@edupro.com';
  const adminPassword = 'admin123';
  const adminName = 'Quản trị viên';

  try {
    console.log('Đang kiểm tra tài khoản admin...');
    
    // Kiểm tra email đã tồn tại chưa
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', adminEmail));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      console.log('⚠️  Tài khoản admin đã tồn tại!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:', adminEmail);
      console.log('🔑 Mật khẩu:', adminPassword);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      process.exit(0);
    }

    console.log('Đang tạo tài khoản admin...');

    const uid = `admin_${Date.now()}`;
    const userProfile = {
      uid: uid,
      email: adminEmail,
      password: adminPassword,
      displayName: adminName,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'users', uid), userProfile);
    console.log('✅ Tài khoản admin đã được tạo thành công!');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Mật khẩu:', adminPassword);
    console.log('👤 Vai trò: Admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  Lưu ý: Mật khẩu chưa được mã hóa!');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Lỗi khi tạo tài khoản admin:', error.message);
    process.exit(1);
  }
}

createAdminAccount();
