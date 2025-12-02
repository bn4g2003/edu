"use client";

import { initSSOListener } from "./sso-listener";
import { db } from "./firebase";
import { collection, query, where, getDocs, doc, setDoc, updateDoc } from "firebase/firestore";

// Hàm đăng nhập - tích hợp với logic hiện tại của LMS
async function handleLogin(email: string, password: string) {
  console.log("🔐 SSO Login attempt:", email);

  // Bước 1: Thử đăng nhập qua API hệ thống nhân sự
  let hrEmployee: any = null;
  try {
    const hrRes = await fetch("https://checkin-ten-gamma.vercel.app/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: email, password }),
    });

    if (hrRes.ok) {
      const hrData = await hrRes.json();
      if (hrData.success && hrData.employee) {
        hrEmployee = hrData.employee;
        console.log("✅ HR API login success");
      }
    } else if (hrRes.status === 403) {
      throw new Error("Tài khoản đã bị vô hiệu hóa");
    }
  } catch (err: any) {
    if (err.message && err.message.includes("vô hiệu")) {
      throw err;
    }
    console.log("⚠️ HR API không khả dụng, thử local auth");
  }

  // Bước 2: Tìm user trong Firestore
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("email", "==", email));
  const querySnapshot = await getDocs(q);

  // Nếu có HR data và chưa có user trong Firestore -> tạo mới
  if (querySnapshot.empty && hrEmployee) {
    const newUserId = `staff_${hrEmployee.id || Date.now()}`;
    const newUser = {
      uid: newUserId,
      email: hrEmployee.email,
      password: password,
      displayName: hrEmployee.fullName || hrEmployee.email,
      role: "staff",
      approved: true,
      totalLearningHours: 0,
      phoneNumber: hrEmployee.phone,
      address: hrEmployee.address,
      country: hrEmployee.country,
      photoURL: hrEmployee.avatarURL,
      dateOfBirth: hrEmployee.birthday,
      monthlySalary: hrEmployee.baseSalary,
      employmentStatus: hrEmployee.employmentStatus,
      employmentStartDate: hrEmployee.startDate,
      employmentMaritalStatus: hrEmployee.maritalStatus,
      employmentBranch: hrEmployee.branch,
      employmentTeam: hrEmployee.team,
      employmentSalaryPercentage: hrEmployee.salaryPercentage,
      employmentActive: hrEmployee.active,
      employment: hrEmployee,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, "users", newUserId), newUser);
    localStorage.setItem("currentUser", JSON.stringify(newUser));
    window.location.reload();
    return;
  }

  // Nếu không có user và không có HR data
  if (querySnapshot.empty) {
    throw new Error("Email hoặc mật khẩu không đúng");
  }

  const userDoc = querySnapshot.docs[0];
  let userData = userDoc.data();

  // Nếu không có HR data, kiểm tra password local
  if (!hrEmployee && userData.password !== password) {
    throw new Error("Email hoặc mật khẩu không đúng");
  }

  // Kiểm tra tài khoản đã được duyệt chưa
  if (userData.role !== "admin" && userData.approved === false) {
    throw new Error("Tài khoản của bạn chưa được duyệt");
  }

  // Nếu có HR data, cập nhật thông tin
  if (hrEmployee) {
    const updateData: Record<string, unknown> = {
      employment: hrEmployee,
      password: password,
      updatedAt: new Date(),
    };

    if (hrEmployee.phone) updateData.phoneNumber = hrEmployee.phone;
    if (hrEmployee.address) updateData.address = hrEmployee.address;
    if (hrEmployee.country) updateData.country = hrEmployee.country;
    if (hrEmployee.avatarURL) updateData.photoURL = hrEmployee.avatarURL;
    if (hrEmployee.birthday) updateData.dateOfBirth = hrEmployee.birthday;
    if (typeof hrEmployee.baseSalary === "number") updateData.monthlySalary = hrEmployee.baseSalary;

    await updateDoc(userDoc.ref, updateData);
    userData = { ...userData, ...updateData };
  }

  // Lưu vào localStorage
  localStorage.setItem("currentUser", JSON.stringify(userData));
  
  // Reload để cập nhật UI
  window.location.reload();
}

// Hàm đăng xuất
async function handleLogout() {
  console.log("🚪 SSO Logout");
  localStorage.removeItem("currentUser");
  window.location.href = "/";
}

// Khởi tạo listener
if (typeof window !== "undefined") {
  initSSOListener({
    onLogin: handleLogin,
    onLogout: handleLogout,
  });
  console.log("🔗 SSO Listener initialized for UP Care");
}
