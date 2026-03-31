/* ═══════════════════════════════════════════════════════════════
   QURAN PLATFORM — script.js
   Firebase Auth + Firestore + Cloudinary + i18n + SPA Router
   ═══════════════════════════════════════════════════════════════ */

// ── Firebase Config ─────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAbx87KhKLTFY9l1YeXoU0kJYlBxeuh5cQ",
  authDomain: "platform-350d0.firebaseapp.com",
  projectId: "platform-350d0",
  storageBucket: "platform-350d0.firebasestorage.app",
  messagingSenderId: "587279160820",
  appId: "1:587279160820:web:43000316acae2355ac15a1"
};

// ── Cloudinary Config ───────────────────────────────────────────
const CLOUD_NAME    = "dupijhuaz";
const UPLOAD_PRESET = "quran_upload";

// ── Firebase SDK (loaded via CDN in index.html) ─────────────────
import { initializeApp }                                from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword,
         signInWithEmailAndPassword, signOut,
         onAuthStateChanged }                           from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, getDocs,
         updateDoc, collection, addDoc, query,
         where, orderBy, serverTimestamp,
         onSnapshot, deleteDoc }                        from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

/* ═══════════════════════════════════════════════════════════════
   i18n — TRANSLATIONS
   ═══════════════════════════════════════════════════════════════ */
const T = {
  en: {
    // Nav
    home: "Home", login: "Sign In", register: "Get Started",
    dashboard: "Dashboard", signout: "Sign Out",
    browsesessions: "Browse Sessions",
    // Auth
    signin_title: "Welcome Back", register_title: "Create Account",
    email: "Email Address", password: "Password", confirmpass: "Confirm Password",
    fullname: "Full Name", role: "Register as",
    student: "Student", teacher: "Teacher", admin: "Admin",
    signin_btn: "Sign In", register_btn: "Create Account",
    have_account: "Already have an account?", no_account: "Don't have an account?",
    teacher_note: "Teacher accounts require admin approval before activation.",
    admin_note: "Admin accounts cannot be self-registered.",
    // Dashboard
    overview: "Overview", my_sessions: "My Sessions", my_bookings: "My Bookings",
    notifications: "Notifications", sessions_mgmt: "Sessions",
    students: "Enrolled Students", payments: "Payments Review",
    teacher_approvals: "Teacher Approvals", users_mgmt: "Users",
    all_sessions: "All Sessions", all_bookings: "All Bookings",
    reports: "Reports", audit_log: "Audit Log",
    // Stats
    total_students: "Students", total_teachers: "Teachers",
    total_sessions: "Sessions", pending_payments: "Pending Payments",
    total_bookings: "Bookings", revenue: "Revenue (SAR)",
    my_bookings_count: "My Bookings", approved: "Approved",
    pending: "Pending", available: "Available Sessions",
    // Sessions
    book_now: "Book Session", join_session: "🎥 Join Session",
    upload_payment: "💳 Upload Payment", awaiting_approval: "⏳ Awaiting Approval",
    approved_badge: "✅ Approved", rejected_badge: "❌ Rejected",
    session_full: "Session Full", session_completed: "Completed",
    // Booking modal
    book_title: "Book This Session",
    bank_details: "Bank Transfer Details",
    bank_name: "Bank", account_name: "Account Name",
    account_no: "IBAN", amount: "Amount",
    confirm_book: "Confirm Booking", cancel: "Cancel",
    // Upload modal
    upload_title: "Upload Payment Receipt",
    amount_paid: "Amount Transferred (SAR)",
    receipt_file: "Receipt (Image or PDF)",
    drag_drop: "Drag & drop or click to select file",
    file_types: "JPG, PNG or PDF · Max 5MB",
    notes: "Notes (optional)",
    submit_payment: "Submit Receipt", uploading: "Uploading…",
    // Admin
    approve: "Approve", reject: "Reject",
    view_receipt: "View Receipt",
    student_name: "Student", session_name: "Session",
    uploaded_at: "Uploaded", status: "Status",
    actions: "Actions", name: "Name", email_col: "Email",
    role_col: "Role", joined: "Joined", zoom_link: "Zoom Link",
    date: "Date", time: "Time", duration: "Duration (min)",
    capacity: "Capacity", category: "Category", level: "Level",
    price: "Price (SAR)", description: "Description",
    create_session: "+ New Session", edit_session: "Edit",
    save: "Save", update: "Update",
    // Messages
    booked_success: "Session booked! Please upload your payment receipt.",
    upload_success: "Receipt submitted. Waiting for admin review.",
    approved_msg: "✅ Payment approved. You can now join the session.",
    rejected_msg: "❌ Payment rejected. Please contact admin.",
    teacher_approved: "Teacher account approved.",
    teacher_rejected: "Teacher account rejected.",
    join_denied: "Access denied. Your payment must be approved first.",
    session_created: "Session created successfully!",
    session_updated: "Session updated.",
    error_generic: "Something went wrong. Please try again.",
    loading: "Loading…",
    // Misc
    no_data: "No data yet.", bank_iban: "SA03 8000 0000 6080 1016 7519",
    bank_name_val: "Al Rajhi Bank", account_holder: "Quran Learning Institute",
    price_label: "SAR",
    enrolled_of: "enrolled of",
  },
  ar: {
    home: "الرئيسية", login: "تسجيل الدخول", register: "ابدأ الآن",
    dashboard: "لوحة التحكم", signout: "تسجيل الخروج",
    browseseessions: "تصفح الجلسات",
    signin_title: "مرحباً بعودتك", register_title: "إنشاء حساب",
    email: "البريد الإلكتروني", password: "كلمة المرور", confirmpass: "تأكيد كلمة المرور",
    fullname: "الاسم الكامل", role: "التسجيل بصفة",
    student: "طالب", teacher: "معلم", admin: "مدير",
    signin_btn: "دخول", register_btn: "إنشاء الحساب",
    have_account: "لديك حساب بالفعل؟", no_account: "ليس لديك حساب؟",
    teacher_note: "حسابات المعلمين تحتاج إلى موافقة المدير قبل التفعيل.",
    admin_note: "لا يمكن التسجيل كمدير ذاتياً.",
    overview: "نظرة عامة", my_sessions: "جلساتي", my_bookings: "حجوزاتي",
    notifications: "الإشعارات", sessions_mgmt: "الجلسات",
    students: "الطلاب المسجلون", payments: "مراجعة المدفوعات",
    teacher_approvals: "موافقات المعلمين", users_mgmt: "المستخدمون",
    all_sessions: "جميع الجلسات", all_bookings: "جميع الحجوزات",
    reports: "التقارير", audit_log: "سجل المراقبة",
    total_students: "الطلاب", total_teachers: "المعلمون",
    total_sessions: "الجلسات", pending_payments: "مدفوعات معلقة",
    total_bookings: "الحجوزات", revenue: "الإيرادات (ر.س)",
    my_bookings_count: "حجوزاتي", approved: "مفعّل",
    pending: "قيد الانتظار", available: "جلسات متاحة",
    book_now: "احجز الجلسة", join_session: "🎥 دخول الحلقة",
    upload_payment: "💳 رفع الإيصال", awaiting_approval: "⏳ قيد المراجعة",
    approved_badge: "✅ مفعّل", rejected_badge: "❌ مرفوض",
    session_full: "الجلسة ممتلئة", session_completed: "منتهية",
    book_title: "حجز الجلسة",
    bank_details: "بيانات التحويل البنكي",
    bank_name: "البنك", account_name: "اسم الحساب",
    account_no: "رقم الآيبان", amount: "المبلغ",
    confirm_book: "تأكيد الحجز", cancel: "إلغاء",
    upload_title: "رفع إيصال الدفع",
    amount_paid: "المبلغ المحوّل (ر.س)",
    receipt_file: "الإيصال (صورة أو PDF)",
    drag_drop: "اسحب وأفلت أو انقر لاختيار الملف",
    file_types: "JPG أو PNG أو PDF · الحد الأقصى 5MB",
    notes: "ملاحظات (اختياري)",
    submit_payment: "إرسال الإيصال", uploading: "جارٍ الرفع…",
    approve: "موافقة", reject: "رفض",
    view_receipt: "عرض الإيصال",
    student_name: "الطالب", session_name: "الجلسة",
    uploaded_at: "تاريخ الرفع", status: "الحالة",
    actions: "الإجراءات", name: "الاسم", email_col: "البريد الإلكتروني",
    role_col: "الدور", joined: "تاريخ الانضمام", zoom_link: "رابط زووم",
    date: "التاريخ", time: "الوقت", duration: "المدة (دقيقة)",
    capacity: "السعة", category: "الفئة", level: "المستوى",
    price: "السعر (ر.س)", description: "الوصف",
    create_session: "+ جلسة جديدة", edit_session: "تعديل",
    save: "حفظ", update: "تحديث",
    booked_success: "تم الحجز! يرجى رفع إيصال الدفع.",
    upload_success: "تم إرسال الإيصال. في انتظار مراجعة المدير.",
    approved_msg: "✅ تمت الموافقة على الدفع. يمكنك الآن دخول الحلقة.",
    rejected_msg: "❌ تم رفض الدفع. يرجى التواصل مع المدير.",
    teacher_approved: "تمت الموافقة على حساب المعلم.",
    teacher_rejected: "تم رفض طلب حساب المعلم.",
    join_denied: "الوصول مرفوض. يجب الموافقة على دفعتك أولاً.",
    session_created: "تم إنشاء الجلسة بنجاح!",
    session_updated: "تم تحديث الجلسة.",
    error_generic: "حدث خطأ. يرجى المحاولة مرة أخرى.",
    loading: "جارٍ التحميل…",
    no_data: "لا توجد بيانات بعد.",
    bank_iban: "SA03 8000 0000 6080 1016 7519",
    bank_name_val: "مصرف الراجحي",
    account_holder: "معهد تعلّم القرآن الكريم",
    price_label: "ر.س",
    enrolled_of: "مسجّل من أصل",
  }
};

/* ═══════════════════════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════════════════════ */
let currentLang = localStorage.getItem("lang") || "en";
let currentUser = null;       // Firebase user
let userProfile = null;       // Firestore profile
let currentPage = "home";
let unsubListeners = [];      // Firestore snapshot listeners to clean up

const t = (key) => T[currentLang][key] || key;

/* ═══════════════════════════════════════════════════════════════
   TOAST NOTIFICATION
   ═══════════════════════════════════════════════════════════════ */
function showToast(msg, type = "info", duration = 4000) {
  const icons = { success: "✅", error: "❌", info: "ℹ️", warning: "⚠️" };
  const container = document.getElementById("toast-container");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.animation = "toastOut 0.3s ease forwards";
    setTimeout(() => el.remove(), 300);
  }, duration);
}

/* ═══════════════════════════════════════════════════════════════
   LANGUAGE SYSTEM
   ═══════════════════════════════════════════════════════════════ */
function setLang(lang) {
  currentLang = lang;
  localStorage.setItem("lang", lang);
  document.body.classList.toggle("lang-ar", lang === "ar");
  document.documentElement.lang = lang;
  document.documentElement.dir  = lang === "ar" ? "rtl" : "ltr";
  document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === lang));
  // Re-render current page content
  renderCurrentPage();
}

/* ═══════════════════════════════════════════════════════════════
   PAGE ROUTER
   ═══════════════════════════════════════════════════════════════ */
function navigate(page, params = {}) {
  unsubListeners.forEach(u => u && u()); unsubListeners = [];
  currentPage = page;
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const el = document.getElementById(`page-${page}`);
  if (el) { el.classList.add("active"); window.scrollTo(0, 0); }
  renderCurrentPage(params);
}

function renderCurrentPage(params = {}) {
  switch (currentPage) {
    case "home":      renderHome(); break;
    case "login":     renderLogin(); break;
    case "register":  renderRegister(); break;
    case "sessions":  renderPublicSessions(); break;
    case "student":   renderStudentDash(params); break;
    case "teacher":   renderTeacherDash(params); break;
    case "admin":     renderAdminDash(params); break;
  }
  updateNavbar();
}

/* ═══════════════════════════════════════════════════════════════
   NAVBAR UPDATER
   ═══════════════════════════════════════════════════════════════ */
function updateNavbar() {
  const navRight = document.getElementById("navbar-right");
  if (!navRight) return;
  if (userProfile) {
    navRight.innerHTML = `
      <button class="btn btn-outline btn-sm" onclick="goToDash()">${t("dashboard")}</button>
      <button class="btn btn-danger btn-sm" onclick="handleSignOut()">${t("signout")}</button>
    `;
  } else {
    navRight.innerHTML = `
      <button class="btn btn-outline btn-sm" onclick="navigate('login')">${t("login")}</button>
      <button class="btn btn-gold btn-sm" onclick="navigate('register')">${t("register")}</button>
    `;
  }
}

function goToDash() {
  if (!userProfile) return navigate("login");
  const role = userProfile.role;
  if (role === "admin")   navigate("admin");
  else if (role === "teacher") navigate("teacher");
  else                    navigate("student");
}

/* ═══════════════════════════════════════════════════════════════
   AUTH
   ═══════════════════════════════════════════════════════════════ */
async function handleRegister(e) {
  e.preventDefault();
  const name     = document.getElementById("reg-name").value.trim();
  const email    = document.getElementById("reg-email").value.trim().toLowerCase();
  const password = document.getElementById("reg-password").value;
  const confirm  = document.getElementById("reg-confirm").value;
  const role     = document.getElementById("reg-role").value;
  const errEl    = document.getElementById("reg-error");

  errEl.classList.add("hidden");
  if (role === "admin") { errEl.textContent = t("admin_note"); errEl.classList.remove("hidden"); return; }
  if (password !== confirm) { errEl.textContent = "Passwords do not match."; errEl.classList.remove("hidden"); return; }
  if (password.length < 6) { errEl.textContent = "Password must be at least 6 characters."; errEl.classList.remove("hidden"); return; }

  const btn = document.getElementById("reg-btn");
  btn.disabled = true; btn.textContent = t("loading");

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid, name, email, role,
      status: role === "teacher" ? "pending" : "active",
      createdAt: serverTimestamp(), avatar: name[0].toUpperCase()
    });
    showToast(role === "teacher" ? t("teacher_note") : "Account created! Signing you in…", "success");
    // Auth listener will redirect
  } catch (err) {
    errEl.textContent = err.message; errEl.classList.remove("hidden");
    btn.disabled = false; btn.textContent = t("register_btn");
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;
  const errEl    = document.getElementById("login-error");
  errEl.classList.add("hidden");

  const btn = document.getElementById("login-btn");
  btn.disabled = true; btn.textContent = t("loading");

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // Redirect handled by auth listener
  } catch (err) {
    errEl.textContent = "Invalid email or password.";
    errEl.classList.remove("hidden");
    btn.disabled = false; btn.textContent = t("signin_btn");
  }
}

async function handleSignOut() {
  await signOut(auth);
  currentUser = null; userProfile = null;
  navigate("home");
}

/* ═══════════════════════════════════════════════════════════════
   AUTH LISTENER
   ═══════════════════════════════════════════════════════════════ */
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      userProfile = snap.data();
      if (userProfile.status === "pending") {
        showToast(t("teacher_note"), "warning", 6000);
        await signOut(auth); currentUser = null; userProfile = null;
        navigate("login"); return;
      }
      goToDash();
    }
  } else {
    currentUser = null; userProfile = null;
    updateNavbar();
  }
});

/* ═══════════════════════════════════════════════════════════════
   CLOUDINARY UPLOAD
   ═══════════════════════════════════════════════════════════════ */
async function uploadToCloudinary(file) {
  const allowed = ["image/jpeg","image/png","image/gif","application/pdf"];
  if (!allowed.includes(file.type)) throw new Error("Invalid file type. Use JPG, PNG, or PDF.");
  if (file.size > 5 * 1024 * 1024) throw new Error("File too large. Maximum 5MB.");

  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", UPLOAD_PRESET);
  fd.append("folder", "quran_receipts");

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, { method: "POST", body: fd });
  if (!res.ok) { const j = await res.json(); throw new Error(j.error?.message || "Upload failed"); }
  const data = await res.json();
  return { url: data.secure_url, publicId: data.public_id };
}

/* ═══════════════════════════════════════════════════════════════
   RENDER: HOME
   ═══════════════════════════════════════════════════════════════ */
function renderHome() {
  const el = document.getElementById("home-content");
  if (!el) return;
  el.innerHTML = `
    <div class="hero-section">
      <div class="hero-ayah">وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا</div>
      <div class="hero-title">${currentLang==="ar" ? "تعلّم القرآن الكريم مع معلمين معتمدين" : "Learn Quran with certified teachers online"}</div>
      <p class="hero-desc">${currentLang==="ar" ? "جلسات مباشرة عبر Zoom في التجويد والحفظ واللغة العربية القرآنية. احجز مكانك اليوم وابدأ رحلتك." : "Live Zoom sessions in Tajweed, Hifz, and Quranic Arabic. Book your seat today and begin your journey."}</p>
      <div class="hero-actions">
        <button class="btn btn-gold btn-lg" onclick="navigate('register')">${t("register")} ←</button>
        <button class="btn btn-outline btn-lg" onclick="navigate('sessions')">${currentLang==="ar"?"تصفح الجلسات":"Browse Sessions"}</button>
      </div>
    </div>
    <div class="features-section">
      ${[
        { icon:"📖", en:"Live Tajweed Classes", ar:"دروس التجويد المباشرة", enD:"One-on-one and group sessions with certified teachers via Zoom.", arD:"جلسات فردية وجماعية مع معلمين معتمدين عبر Zoom." },
        { icon:"🌙", en:"Hifz Program", ar:"برنامج الحفظ", enD:"Structured memorization curriculum from Juz Amma to full Quran.", arD:"منهج حفظ منظم من جزء عم إلى ختم القرآن." },
        { icon:"🔒", en:"Secure Booking", ar:"حجز آمن", enD:"Bank transfer with admin payment verification before joining.", arD:"تحويل بنكي مع مراجعة إدارية قبل الانضمام." },
        { icon:"⭐", en:"Certified Teachers", ar:"معلمون معتمدون", enD:"All teachers are vetted and approved by our administration.", arD:"جميع المعلمين خضعوا للتدقيق وتم اعتمادهم من قبل الإدارة." },
      ].map(f => `
        <div class="feature-card">
          <div class="feature-icon">${f.icon}</div>
          <div class="feature-title">${currentLang==="ar"?f.ar:f.en}</div>
          <div class="feature-desc">${currentLang==="ar"?f.arD:f.enD}</div>
        </div>`).join("")}
    </div>
    <footer class="site-footer">
      <div class="footer-arabic">اللَّهُمَّ عَلِّمْنَا مَا يَنْفَعُنَا</div>
      © 2025 Quran Learning Platform · ${currentLang==="ar"?"جميع الحقوق محفوظة":"All rights reserved"}
    </footer>
  `;
}

/* ═══════════════════════════════════════════════════════════════
   RENDER: AUTH PAGES
   ═══════════════════════════════════════════════════════════════ */
function renderLogin() {
  document.getElementById("login-content").innerHTML = `
    <div class="auth-page arabesque-bg">
      <div class="auth-card gold-top">
        <div class="auth-logo">
          <div class="arabic-title">بِسْمِ اللَّهِ</div>
          <div class="subtitle">${currentLang==="ar"?"سجّل دخولك للمتابعة":"Sign in to continue your journey"}</div>
        </div>
        <h2 class="auth-title">${t("signin_title")}</h2>
        <div id="login-error" class="alert alert-error hidden"></div>
        <form onsubmit="handleLogin(event)">
          <div class="form-group"><label class="form-label">${t("email")}</label>
            <input id="login-email" type="email" class="form-input" placeholder="${currentLang==="ar"?"بريدك@example.com":"your@email.com"}" required></div>
          <div class="form-group"><label class="form-label">${t("password")}</label>
            <input id="login-password" type="password" class="form-input" placeholder="••••••••" required></div>
          <button id="login-btn" type="submit" class="btn btn-primary btn-full" style="margin-top:.5rem">${t("signin_btn")}</button>
        </form>
        <p class="auth-footer-text">${t("no_account")} <span class="auth-link" onclick="navigate('register')">${t("register")}</span></p>
        <div class="divider"><div class="divider-icon">✦</div></div>
        <p class="text-muted text-sm" style="text-align:center;margin-bottom:8px">${currentLang==="ar"?"حسابات تجريبية:":"Demo accounts:"}</p>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
          ${[["Admin","admin@quran.edu","admin123"],["Teacher","ahmad@quran.edu","teacher123"],["Student","student@quran.edu","student123"]].map(
            ([l,e,p])=>`<button class="btn btn-outline btn-sm" onclick="quickLogin('${e}','${p}')">${l}</button>`
          ).join("")}
        </div>
      </div>
    </div>`;
}

async function quickLogin(email, password) {
  try {
    // First ensure demo users exist in Firebase
    await ensureDemoUsers();
    await signInWithEmailAndPassword(auth, email, password);
  } catch(e) {
    showToast("Demo login: " + e.message, "error");
  }
}

// Creates demo accounts in Firebase if they don't exist
async function ensureDemoUsers() {
  const demos = [
    { email:"admin@quran.edu", password:"admin123", name:"Admin User", role:"admin", status:"active" },
    { email:"ahmad@quran.edu", password:"teacher123", name:"Sheikh Ahmad", role:"teacher", status:"active" },
    { email:"student@quran.edu", password:"student123", name:"Abdullah Rahman", role:"student", status:"active" },
  ];
  for (const d of demos) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, d.email, d.password);
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid, name: d.name, email: d.email,
        role: d.role, status: d.status, avatar: d.name[0],
        createdAt: serverTimestamp()
      });
    } catch(e) { /* already exists — ignore */ }
  }
}

function renderRegister() {
  document.getElementById("register-content").innerHTML = `
    <div class="auth-page arabesque-bg">
      <div class="auth-card gold-top">
        <div class="auth-logo">
          <div class="arabic-title">انضم إلينا</div>
          <div class="subtitle">${currentLang==="ar"?"أنشئ حسابك للبدء":"Create your account to begin"}</div>
        </div>
        <h2 class="auth-title">${t("register_title")}</h2>
        <div id="reg-error" class="alert alert-error hidden"></div>
        <form onsubmit="handleRegister(event)">
          <div class="form-group"><label class="form-label">${t("fullname")}</label>
            <input id="reg-name" class="form-input" placeholder="${currentLang==="ar"?"اسمك الكامل":"Your full name"}" required></div>
          <div class="form-group"><label class="form-label">${t("email")}</label>
            <input id="reg-email" type="email" class="form-input" placeholder="${currentLang==="ar"?"بريدك@example.com":"your@email.com"}" required></div>
          <div class="form-group"><label class="form-label">${t("role")}</label>
            <select id="reg-role" class="form-select" onchange="onRoleChange(this.value)">
              <option value="student">${t("student")}</option>
              <option value="teacher">${t("teacher")}</option>
            </select></div>
          <div id="role-note" class="hidden"></div>
          <div class="form-group"><label class="form-label">${t("password")}</label>
            <input id="reg-password" type="password" class="form-input" placeholder="6+ ${currentLang==="ar"?"أحرف":"characters"}" required></div>
          <div class="form-group"><label class="form-label">${t("confirmpass")}</label>
            <input id="reg-confirm" type="password" class="form-input" placeholder="••••••••" required></div>
          <button id="reg-btn" type="submit" class="btn btn-primary btn-full" style="margin-top:.5rem">${t("register_btn")}</button>
        </form>
        <p class="auth-footer-text">${t("have_account")} <span class="auth-link" onclick="navigate('login')">${t("login")}</span></p>
      </div>
    </div>`;
}

function onRoleChange(role) {
  const note = document.getElementById("role-note");
  if (role === "teacher") {
    note.className = "alert alert-info mb-2";
    note.textContent = "📋 " + t("teacher_note");
  } else {
    note.className = "hidden";
  }
}

/* ═══════════════════════════════════════════════════════════════
   RENDER: PUBLIC SESSIONS
   ═══════════════════════════════════════════════════════════════ */
async function renderPublicSessions() {
  const el = document.getElementById("sessions-content");
  el.innerHTML = `<div style="max-width:900px;margin:0 auto;padding:2rem 1rem">
    <div style="text-align:center;margin-bottom:2rem">
      <div style="font-family:var(--font-arabic);font-size:2.2rem;color:var(--gold);margin-bottom:8px">جلساتنا</div>
      <p class="text-muted">${currentLang==="ar"?"تصفح واحجز جلسات تعلّم القرآن":"Browse and book Quran learning sessions"}</p>
    </div>
    <div id="pub-session-list" class="session-grid">${loadingHTML()}</div>
  </div>`;
  const sessions = await fetchSessions();
  renderSessionCards(document.getElementById("pub-session-list"), sessions, null, true);
}

/* ═══════════════════════════════════════════════════════════════
   FETCH HELPERS
   ═══════════════════════════════════════════════════════════════ */
async function fetchSessions(teacherId = null) {
  let q = teacherId
    ? query(collection(db,"sessions"), where("teacherId","==",teacherId))
    : collection(db,"sessions");
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function fetchUserBookings(uid) {
  const snap = await getDocs(query(collection(db,"bookings"), where("studentId","==",uid)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function fetchAllUsers(role = null) {
  let q = role ? query(collection(db,"users"), where("role","==",role)) : collection(db,"users");
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function fetchAllBookings() {
  const snap = await getDocs(collection(db,"bookings"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

function loadingHTML() {
  return `<div style="text-align:center;padding:3rem;color:var(--gold);opacity:.6">${t("loading")}</div>`;
}

/* ═══════════════════════════════════════════════════════════════
   SESSION CARDS RENDERER
   ═══════════════════════════════════════════════════════════════ */
function renderSessionCards(container, sessions, bookings, isPublic = false) {
  if (!sessions.length) { container.innerHTML = `<p class="text-muted" style="text-align:center;padding:2rem">${t("no_data")}</p>`; return; }
  container.innerHTML = sessions.map(s => {
    const booking = bookings ? bookings.find(b => b.sessionId === s.id) : null;
    const pct = Math.round((s.enrolled||0)/(s.capacity||1)*100);
    const catColors = { Tajweed:"badge-active", Hifz:"badge-pending", Arabic:"badge-student", Tafsir:"badge-teacher" };
    let actionHTML = "";
    if (isPublic) {
      actionHTML = `<button class="btn btn-primary btn-sm" onclick="navigate('register')">${t("book_now")} →</button>`;
    } else if (booking) {
      if (booking.paymentStatus === "approved") {
        actionHTML = `<button class="join-btn" onclick="handleJoinSession('${s.id}')">${t("join_session")}</button>`;
      } else if (booking.paymentStatus === "pending" || booking.paymentStatus === "receipt_uploaded") {
        actionHTML = `<span class="badge badge-pending">${t("awaiting_approval")}</span>`;
      } else if (booking.paymentStatus === "rejected") {
        actionHTML = `<span class="badge badge-rejected">${t("rejected_badge")}</span>`;
      } else {
        actionHTML = `<button class="btn btn-gold btn-sm" onclick="openUploadModal('${s.id}','${booking.id}')">${t("upload_payment")}</button>`;
      }
    } else if (!isPublic) {
      if (s.status === "completed") {
        actionHTML = `<span class="badge badge-rejected">${t("session_completed")}</span>`;
      } else if ((s.enrolled||0) >= (s.capacity||0)) {
        actionHTML = `<span class="badge badge-rejected">${t("session_full")}</span>`;
      } else {
        actionHTML = `<button class="btn btn-primary btn-sm" onclick="openBookModal('${s.id}')">${t("book_now")}</button>`;
      }
    }
    return `
      <div class="session-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap">
          <div style="flex:1">
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
              <span class="badge ${catColors[s.category]||"badge-upcoming"}">${s.category||""}</span>
              <span class="badge badge-upcoming">${s.level||""}</span>
              <span class="badge ${s.status==="active"?"badge-active":s.status==="completed"?"badge-rejected":"badge-upcoming"}">${s.status||""}</span>
            </div>
            <div class="session-title">${s.title}</div>
          </div>
          <div class="session-price">${t("price_label")} ${s.price||0}</div>
        </div>
        <div class="info-row" style="margin:8px 0">
          <span>📅 ${s.date||""}</span><span>⏰ ${s.time||""}</span>
          <span>⏱️ ${s.duration||60}min</span>
          <span>👤 ${s.teacherName||""}</span>
          <span>🪑 ${s.enrolled||0} ${t("enrolled_of")} ${s.capacity||0}</span>
        </div>
        ${s.description?`<p class="text-muted text-sm" style="margin-bottom:10px;line-height:1.6">${s.description}</p>`:""}
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="session-actions">${actionHTML}</div>
      </div>`;
  }).join("");
}

/* ═══════════════════════════════════════════════════════════════
   BOOKING FLOW
   ═══════════════════════════════════════════════════════════════ */
let _bookSessionId = null;
let _uploadBookingId = null, _uploadSessionId = null;
let _uploadFile = null;

async function openBookModal(sessionId) {
  _bookSessionId = sessionId;
  const snap = await getDoc(doc(db,"sessions",sessionId));
  const s = snap.data();
  const price = s.price || 0;
  document.getElementById("modal-book-title").textContent = `${t("book_title")} — ${s.title}`;
  document.getElementById("modal-book-body").innerHTML = `
    <div class="glass-card-light" style="padding:1rem;margin-bottom:1rem">
      <p style="font-weight:500;margin-bottom:6px">${s.title}</p>
      <div class="info-row"><span>📅 ${s.date} ${currentLang==="ar"?"الساعة":"at"} ${s.time}</span><span>⏱️ ${s.duration}min</span></div>
    </div>
    <div class="alert alert-info">💳 ${currentLang==="ar"?"بعد الحجز، ارفع إيصال التحويل البنكي لتأكيد مقعدك.":"After booking, upload your bank transfer proof to confirm your seat."}</div>
    <div style="background:rgba(9,30,18,.5);padding:1rem;border-radius:var(--r-sm);font-size:13px;border:1px solid var(--border)">
      <p style="font-weight:600;color:var(--gold-light);margin-bottom:10px">🏦 ${t("bank_details")}</p>
      <div style="display:grid;grid-template-columns:auto 1fr;gap:5px 14px">
        <span class="text-muted">${t("bank_name")}:</span><span>${t("bank_name_val")}</span>
        <span class="text-muted">${t("account_name")}:</span><span>${t("account_holder")}</span>
        <span class="text-muted">${t("account_no")}:</span><span style="font-family:monospace">${t("bank_iban")}</span>
        <span class="text-muted">${t("amount")}:</span><span style="color:var(--gold);font-weight:700">${t("price_label")} ${price}</span>
      </div>
    </div>`;
  showModal("modal-book");
}

async function confirmBooking() {
  if (!currentUser || !_bookSessionId) return;
  const btn = document.getElementById("confirm-book-btn");
  btn.disabled = true; btn.textContent = t("loading");
  try {
    const sessionRef = doc(db,"sessions",_bookSessionId);
    const sSnap = await getDoc(sessionRef);
    const s = sSnap.data();
    if ((s.enrolled||0) >= (s.capacity||0)) { showToast(t("session_full"), "error"); closeModal("modal-book"); return; }
    const existing = await getDocs(query(collection(db,"bookings"), where("studentId","==",currentUser.uid), where("sessionId","==",_bookSessionId)));
    if (!existing.empty) { showToast(currentLang==="ar"?"حجزت هذه الجلسة مسبقاً":"Already booked.", "warning"); closeModal("modal-book"); return; }
    const bRef = await addDoc(collection(db,"bookings"), {
      studentId: currentUser.uid, studentName: userProfile.name,
      sessionId: _bookSessionId, sessionTitle: s.title,
      teacherId: s.teacherId, status: "pending", paymentStatus: "pending",
      bookedAt: serverTimestamp()
    });
    await updateDoc(sessionRef, { enrolled: (s.enrolled||0) + 1 });
    await addDoc(collection(db,"audit_logs"), { userId: currentUser.uid, action: "SESSION_BOOKED", target: `Session:${_bookSessionId}`, timestamp: serverTimestamp() });
    closeModal("modal-book");
    showToast(t("booked_success"), "success");
    openUploadModal(_bookSessionId, bRef.id);
  } catch(e) {
    showToast(e.message, "error");
    btn.disabled = false; btn.textContent = t("confirm_book");
  }
}

async function openUploadModal(sessionId, bookingId) {
  _uploadSessionId = sessionId; _uploadBookingId = bookingId;
  _uploadFile = null;
  document.getElementById("modal-upload-body").innerHTML = `
    <div id="upload-error" class="alert alert-error hidden"></div>
    <div class="form-group"><label class="form-label">${t("amount_paid")}</label>
      <input id="upload-amount" type="number" class="form-input" placeholder="0"></div>
    <div class="form-group">
      <label class="form-label">${t("receipt_file")}</label>
      <div class="upload-area" id="upload-zone" onclick="document.getElementById('upload-file-input').click()"
           ondragover="onDragOver(event)" ondrop="onDrop(event)" ondragleave="onDragLeave()">
        <input id="upload-file-input" type="file" accept="image/*,.pdf" style="display:none" onchange="onFileSelect(event)">
        <div class="upload-icon" id="upload-icon">📎</div>
        <div class="upload-title" id="upload-title">${t("drag_drop")}</div>
        <div class="upload-sub">${t("file_types")}</div>
        <div class="upload-preview" id="upload-preview"></div>
      </div>
    </div>
    <div class="form-group"><label class="form-label">${t("notes")}</label>
      <textarea id="upload-notes" class="form-textarea" rows="2" placeholder="${currentLang==="ar"?"أي معلومات إضافية…":"Any additional info…"}"></textarea></div>`;
  showModal("modal-upload");
}

function onDragOver(e) { e.preventDefault(); document.getElementById("upload-zone").classList.add("dragover"); }
function onDragLeave()  { document.getElementById("upload-zone").classList.remove("dragover"); }
function onDrop(e) { e.preventDefault(); onDragLeave(); if(e.dataTransfer.files[0]) setUploadFile(e.dataTransfer.files[0]); }
function onFileSelect(e) { if(e.target.files[0]) setUploadFile(e.target.files[0]); }

function setUploadFile(file) {
  _uploadFile = file;
  document.getElementById("upload-icon").textContent = file.type==="application/pdf"?"📄":"🖼️";
  document.getElementById("upload-title").textContent = file.name;
  const prev = document.getElementById("upload-preview");
  if (file.type.startsWith("image/")) {
    const url = URL.createObjectURL(file);
    prev.innerHTML = `<img src="${url}" style="max-height:90px;border-radius:6px;margin-top:8px">`;
  } else { prev.innerHTML = ""; }
}

async function submitPayment() {
  if (!_uploadFile) { showToast(currentLang==="ar"?"يرجى اختيار ملف الإيصال":"Please select a receipt file.", "error"); return; }
  const btn = document.getElementById("submit-payment-btn");
  btn.disabled = true; btn.textContent = t("uploading");
  const errEl = document.getElementById("upload-error");
  errEl.classList.add("hidden");
  try {
    const { url, publicId } = await uploadToCloudinary(_uploadFile);
    await updateDoc(doc(db,"bookings",_uploadBookingId), {
      paymentStatus: "receipt_uploaded",
      receiptUrl: url, receiptPublicId: publicId,
      amountPaid: parseFloat(document.getElementById("upload-amount").value)||0,
      paymentNotes: document.getElementById("upload-notes").value,
      uploadedAt: serverTimestamp()
    });
    await addDoc(collection(db,"audit_logs"), { userId: currentUser.uid, action: "PAYMENT_UPLOADED", target: `Booking:${_uploadBookingId}`, timestamp: serverTimestamp() });
    closeModal("modal-upload");
    showToast(t("upload_success"), "success");
    renderCurrentPage();
  } catch(e) {
    errEl.textContent = e.message; errEl.classList.remove("hidden");
    btn.disabled = false; btn.textContent = t("submit_payment");
  }
}

/* ═══════════════════════════════════════════════════════════════
   JOIN SESSION (secure check)
   ═══════════════════════════════════════════════════════════════ */
async function handleJoinSession(sessionId) {
  if (!currentUser) { navigate("login"); return; }
  const booksSnap = await getDocs(query(collection(db,"bookings"),
    where("studentId","==",currentUser.uid), where("sessionId","==",sessionId)));
  if (booksSnap.empty) { showToast(t("join_denied"), "error"); return; }
  const booking = booksSnap.docs[0].data();
  if (booking.paymentStatus !== "approved") { showToast(t("join_denied"), "warning"); return; }
  const sSnap = await getDoc(doc(db,"sessions",sessionId));
  const session = sSnap.data();
  if (!session.zoomLink) { showToast(currentLang==="ar"?"رابط الجلسة غير متاح بعد":"Session link not available yet.", "warning"); return; }
  await addDoc(collection(db,"audit_logs"), { userId: currentUser.uid, action: "SESSION_JOIN", target: `Session:${sessionId}`, timestamp: serverTimestamp() });
  window.open(session.zoomLink, "_blank", "noopener,noreferrer");
}

/* ═══════════════════════════════════════════════════════════════
   STUDENT DASHBOARD
   ═══════════════════════════════════════════════════════════════ */
let studentTab = "overview";

async function renderStudentDash(params = {}) {
  if (params.tab) studentTab = params.tab;
  const el = document.getElementById("student-content");
  el.innerHTML = buildDashLayout("student", [
    { section: currentLang==="ar"?"الرئيسية":"Main", items: [
      { id:"overview", icon:"🏠", label:t("overview") },
      { id:"sessions", icon:"📚", label:currentLang==="ar"?"تصفح الجلسات":"Browse Sessions" },
      { id:"mybookings", icon:"📋", label:t("my_bookings") },
      { id:"notifications", icon:"🔔", label:t("notifications") },
    ]}
  ], studentTab);

  const contentArea = document.getElementById("dash-content-area");
  contentArea.innerHTML = loadingHTML();

  const [sessions, bookings] = await Promise.all([fetchSessions(), fetchUserBookings(currentUser.uid)]);

  if (studentTab === "overview")    renderStudentOverview(contentArea, sessions, bookings);
  else if (studentTab === "sessions")  renderStudentSessions(contentArea, sessions, bookings);
  else if (studentTab === "mybookings") renderStudentBookings(contentArea, bookings, sessions);
  else if (studentTab === "notifications") renderNotifications(contentArea, currentUser.uid);
}

function renderStudentOverview(container, sessions, bookings) {
  const approved = bookings.filter(b => b.paymentStatus === "approved").length;
  const pending  = bookings.filter(b => b.paymentStatus === "pending" || b.paymentStatus === "receipt_uploaded").length;
  container.innerHTML = `
    <div style="margin-bottom:1.5rem">
      <div style="font-family:var(--font-arabic);font-size:1.3rem;color:var(--gold);margin-bottom:4px">أَهْلاً وَسَهْلاً، ${userProfile.name.split(" ")[0]}</div>
      <p class="text-muted text-sm">${currentLang==="ar"?"مرحباً بعودتك. هذا ملخص رحلتك التعليمية.":"Welcome back. Here's your learning overview."}</p>
    </div>
    ${pending>0?`<div class="alert alert-warning">⏳ ${currentLang==="ar"?`لديك ${pending} حجز قيد مراجعة الدفع.`:`You have ${pending} booking(s) awaiting payment review.`}</div>`:""}
    <div class="stats-grid">
      ${[
        { label:t("my_bookings_count"), value:bookings.length, icon:"📋" },
        { label:t("approved"), value:approved, icon:"✅" },
        { label:t("pending"), value:pending, icon:"⏳" },
        { label:t("available"), value:sessions.length, icon:"📚" },
      ].map(s=>`<div class="stat-card"><div class="stat-icon">${s.icon}</div><div class="stat-label">${s.label}</div><div class="stat-value">${s.value}</div></div>`).join("")}
    </div>
    <div class="section-header"><div class="section-title">${currentLang==="ar"?"أحدث الجلسات":"Recent Sessions"}</div></div>
    <div class="session-grid" id="st-sess-mini"></div>`;
  renderSessionCards(document.getElementById("st-sess-mini"), sessions.slice(0,3), bookings);
}

function renderStudentSessions(container, sessions, bookings) {
  container.innerHTML = `
    <div class="section-header"><div class="section-title">${currentLang==="ar"?"تصفح الجلسات المتاحة":"Available Sessions"}</div></div>
    <div class="session-grid" id="st-all-sess"></div>`;
  renderSessionCards(document.getElementById("st-all-sess"), sessions, bookings);
}

async function renderStudentBookings(container, bookings, sessions) {
  if (!bookings.length) { container.innerHTML = `<p class="text-muted" style="text-align:center;padding:3rem">${t("no_data")}</p>`; return; }
  container.innerHTML = `
    <div class="section-header"><div class="section-title">${t("my_bookings")}</div></div>
    <div style="display:flex;flex-direction:column;gap:1rem">
      ${bookings.map(b => {
        const s = sessions.find(ss => ss.id === b.sessionId);
        const ps = b.paymentStatus||"pending";
        let action = "";
        if (ps === "approved") action = `<button class="join-btn" onclick="handleJoinSession('${b.sessionId}')">${t("join_session")}</button>`;
        else if (!b.receiptUrl) action = `<button class="btn btn-gold btn-sm" onclick="openUploadModal('${b.sessionId}','${b.id}')">${t("upload_payment")}</button>`;
        return `<div class="glass-card-light" style="padding:1.25rem">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px">
            <div><p style="font-weight:500;margin-bottom:4px">${b.sessionTitle||"Session"}</p>
              <div class="info-row"><span>📅 ${s?.date||""}</span><span>👤 ${s?.teacherName||""}</span></div></div>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
              <span class="badge ${ps==="approved"?"badge-active":ps==="rejected"?"badge-rejected":"badge-pending"}">${ps==="approved"?t("approved_badge"):ps==="rejected"?t("rejected_badge"):t("awaiting_approval")}</span>
              ${action}
            </div>
          </div>
          ${b.receiptUrl?`<div style="margin-top:10px;font-size:12.5px"><span class="text-muted">Receipt: </span><a href="${b.receiptUrl}" target="_blank" class="receipt-link">View ↗</a></div>`:""}
        </div>`;
      }).join("")}
    </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   TEACHER DASHBOARD
   ═══════════════════════════════════════════════════════════════ */
let teacherTab = "overview";
let editingSessionId = null;

async function renderTeacherDash(params = {}) {
  if (params.tab) teacherTab = params.tab;
  const el = document.getElementById("teacher-content");
  el.innerHTML = buildDashLayout("teacher", [
    { section: currentLang==="ar"?"المعلم":"Teacher", items: [
      { id:"overview", icon:"🏠", label:t("overview") },
      { id:"mysessions", icon:"📚", label:t("my_sessions") },
      { id:"students", icon:"👨‍🎓", label:t("students") },
      { id:"notifications", icon:"🔔", label:t("notifications") },
    ]}
  ], teacherTab);
  const contentArea = document.getElementById("dash-content-area");
  contentArea.innerHTML = loadingHTML();
  const sessions = await fetchSessions(currentUser.uid);
  const allBookings = await fetchAllBookings();
  const myBookings = allBookings.filter(b => sessions.some(s => s.id === b.sessionId));

  if (teacherTab === "overview")   renderTeacherOverview(contentArea, sessions, myBookings);
  else if (teacherTab === "mysessions") renderTeacherSessions(contentArea, sessions, myBookings);
  else if (teacherTab === "students") renderTeacherStudents(contentArea, sessions, myBookings);
  else if (teacherTab === "notifications") renderNotifications(contentArea, currentUser.uid);
}

function renderTeacherOverview(container, sessions, bookings) {
  const enrolled  = sessions.reduce((a,s) => a+(s.enrolled||0), 0);
  const revenue   = bookings.filter(b=>b.paymentStatus==="approved").length; // simplified
  container.innerHTML = `
    <div style="margin-bottom:1.5rem">
      <div style="font-family:var(--font-arabic);font-size:1.3rem;color:var(--gold);margin-bottom:4px">مرحباً، ${userProfile.name.split(" ")[0]}</div>
      <p class="text-muted text-sm">${currentLang==="ar"?"إدارة جلساتك ومتابعة الطلاب":"Manage your sessions and track students."}</p>
    </div>
    <div class="stats-grid">
      ${[
        { label:t("my_sessions"), value:sessions.length, icon:"📚" },
        { label:t("students"), value:enrolled, icon:"👨‍🎓" },
        { label:t("approved"), value:revenue, icon:"✅" },
        { label:currentLang==="ar"?"قادمة":"Upcoming", value:sessions.filter(s=>s.status==="upcoming").length, icon:"📅" },
      ].map(s=>`<div class="stat-card"><div class="stat-icon">${s.icon}</div><div class="stat-label">${s.label}</div><div class="stat-value">${s.value}</div></div>`).join("")}
    </div>
    <div style="margin-bottom:1.5rem"><button class="btn btn-primary" onclick="openSessionModal()">${t("create_session")}</button></div>
    <div class="section-header"><div class="section-title">${t("my_sessions")}</div></div>
    <div class="session-grid" id="tr-sess-mini"></div>`;
  renderTeacherSessionCards(document.getElementById("tr-sess-mini"), sessions, bookings);
}

function renderTeacherSessions(container, sessions, bookings) {
  container.innerHTML = `
    <div class="section-header">
      <div class="section-title">${t("my_sessions")}</div>
      <button class="btn btn-primary btn-sm" onclick="openSessionModal()">${t("create_session")}</button>
    </div>
    <div class="session-grid" id="tr-sess-list"></div>`;
  renderTeacherSessionCards(document.getElementById("tr-sess-list"), sessions, bookings);
}

function renderTeacherSessionCards(container, sessions, bookings) {
  if (!sessions.length) { container.innerHTML = `<p class="text-muted" style="text-align:center;padding:2rem">${t("no_data")}</p>`; return; }
  container.innerHTML = sessions.map(s => {
    const sBookings = bookings.filter(b => b.sessionId === s.id);
    return `<div class="session-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px">
        <div style="flex:1">
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
            <span class="badge badge-upcoming">${s.category||""}</span>
            <span class="badge ${s.status==="active"?"badge-active":s.status==="completed"?"badge-rejected":"badge-upcoming"}">${s.status||""}</span>
          </div>
          <div class="session-title">${s.title}</div>
          <div class="info-row" style="margin:6px 0"><span>📅 ${s.date}</span><span>⏰ ${s.time}</span><span>🪑 ${s.enrolled||0}/${s.capacity||0}</span></div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="openSessionModal('${s.id}')">✏️ ${t("edit_session")}</button>
      </div>
      ${sBookings.length?`
        <div style="margin-top:12px;padding:10px;background:rgba(9,30,18,.4);border-radius:var(--r-sm);border:1px solid var(--border)">
          <p class="text-muted text-xs" style="margin-bottom:8px;text-transform:uppercase;letter-spacing:.06em">${currentLang==="ar"?"الطلاب المسجلون":"Enrolled Students"}</p>
          ${sBookings.map(b=>`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-top:1px solid var(--border);font-size:13px">
              <span>${b.studentName||""}</span>
              <span class="badge ${b.paymentStatus==="approved"?"badge-active":b.paymentStatus==="rejected"?"badge-rejected":"badge-pending"}">${b.paymentStatus||"pending"}</span>
            </div>`).join("")}
        </div>`:""}
    </div>`;
  }).join("");
}

async function renderTeacherStudents(container, sessions, bookings) {
  container.innerHTML = `
    <div class="section-header"><div class="section-title">${t("students")}</div></div>
    <div class="table-wrap"><table class="data-table">
      <thead><tr><th>${t("student_name")}</th><th>${t("session_name")}</th><th>${t("uploaded_at")}</th><th>${t("status")}</th></tr></thead>
      <tbody>
        ${bookings.length ? bookings.map(b => {
          const s = sessions.find(ss=>ss.id===b.sessionId);
          return `<tr><td><p class="fw-500">${b.studentName||""}</p></td>
            <td class="text-muted">${s?.title||""}</td>
            <td class="text-muted text-sm">${b.bookedAt?.toDate?.()?.toLocaleDateString()||""}</td>
            <td><span class="badge ${b.paymentStatus==="approved"?"badge-active":b.paymentStatus==="rejected"?"badge-rejected":"badge-pending"}">${b.paymentStatus||"pending"}</span></td></tr>`;
        }).join("") : `<tr><td colspan="4" style="text-align:center;padding:2rem;color:rgba(201,168,76,.4)">${t("no_data")}</td></tr>`}
      </tbody>
    </table></div>`;
}

/* ─── Session Create/Edit Modal ───── */
async function openSessionModal(sessionId = null) {
  editingSessionId = sessionId;
  let s = { title:"",description:"",date:"",time:"",duration:"60",zoomLink:"",capacity:"10",category:"Tajweed",level:"All Levels",price:"50",status:"upcoming" };
  if (sessionId) {
    const snap = await getDoc(doc(db,"sessions",sessionId));
    if (snap.exists()) s = { ...s, ...snap.data() };
  }
  document.getElementById("modal-session-title").textContent = sessionId
    ? (currentLang==="ar"?"تعديل الجلسة":"Edit Session")
    : (currentLang==="ar"?"إنشاء جلسة جديدة":"Create New Session");
  document.getElementById("modal-session-body").innerHTML = `
    <div id="sess-error" class="alert alert-error hidden"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem 1rem">
      <div class="form-group" style="grid-column:1/-1"><label class="form-label">${currentLang==="ar"?"عنوان الجلسة":"Session Title"} *</label>
        <input id="sf-title" class="form-input" value="${s.title}" placeholder="${currentLang==="ar"?"مثال: التجويد للمبتدئين":"e.g. Tajweed Fundamentals"}"></div>
      <div class="form-group" style="grid-column:1/-1"><label class="form-label">${t("description")}</label>
        <textarea id="sf-desc" class="form-textarea" rows="2">${s.description}</textarea></div>
      <div class="form-group"><label class="form-label">${t("date")} *</label><input id="sf-date" type="date" class="form-input" value="${s.date}"></div>
      <div class="form-group"><label class="form-label">${t("time")} *</label><input id="sf-time" type="time" class="form-input" value="${s.time}"></div>
      <div class="form-group"><label class="form-label">${t("duration")}</label><input id="sf-dur" type="number" class="form-input" value="${s.duration}"></div>
      <div class="form-group"><label class="form-label">${t("capacity")}</label><input id="sf-cap" type="number" class="form-input" value="${s.capacity}"></div>
      <div class="form-group"><label class="form-label">${t("category")}</label>
        <select id="sf-cat" class="form-select">
          ${["Tajweed","Hifz","Arabic","Tafsir","Fiqh","General"].map(c=>`<option ${s.category===c?"selected":""}>${c}</option>`).join("")}
        </select></div>
      <div class="form-group"><label class="form-label">${t("level")}</label>
        <select id="sf-level" class="form-select">
          ${["Beginner","Intermediate","Advanced","All Levels"].map(l=>`<option ${s.level===l?"selected":""}>${l}</option>`).join("")}
        </select></div>
      <div class="form-group"><label class="form-label">${t("price")}</label><input id="sf-price" type="number" class="form-input" value="${s.price}"></div>
      <div class="form-group"><label class="form-label">${currentLang==="ar"?"الحالة":"Status"}</label>
        <select id="sf-status" class="form-select">
          ${["upcoming","active","completed"].map(st=>`<option value="${st}" ${s.status===st?"selected":""}>${st}</option>`).join("")}
        </select></div>
      <div class="form-group" style="grid-column:1/-1">
        <label class="form-label">🔒 ${t("zoom_link")} *</label>
        <input id="sf-zoom" type="url" class="form-input" value="${s.zoomLink||""}" placeholder="https://zoom.us/j/…">
        <p class="text-muted text-xs mt-1">${currentLang==="ar"?"يُخزَّن هذا الرابط بأمان ولا يُعرض للطلاب مباشرةً.":"Stored securely. Never exposed to students directly."}</p>
      </div>
    </div>`;
  showModal("modal-session");
}

async function saveSession() {
  const btn = document.getElementById("save-session-btn");
  const errEl = document.getElementById("sess-error");
  errEl.classList.add("hidden");
  const title   = document.getElementById("sf-title").value.trim();
  const zoom    = document.getElementById("sf-zoom").value.trim();
  const dateVal = document.getElementById("sf-date").value;
  const timeVal = document.getElementById("sf-time").value;
  if (!title || !zoom || !dateVal || !timeVal) {
    errEl.textContent = currentLang==="ar"?"يرجى ملء الحقول الإلزامية":"Please fill required fields.";
    errEl.classList.remove("hidden"); return;
  }
  if (!zoom.startsWith("https://zoom.us/") && !zoom.startsWith("https://us06web.zoom.us/")) {
    errEl.textContent = currentLang==="ar"?"يرجى إدخال رابط Zoom صحيح":"Please enter a valid Zoom URL.";
    errEl.classList.remove("hidden"); return;
  }
  btn.disabled = true; btn.textContent = t("loading");
  const data = {
    title, description: document.getElementById("sf-desc").value.trim(),
    date: dateVal, time: timeVal,
    duration: parseInt(document.getElementById("sf-dur").value)||60,
    capacity: parseInt(document.getElementById("sf-cap").value)||10,
    category: document.getElementById("sf-cat").value,
    level: document.getElementById("sf-level").value,
    price: parseFloat(document.getElementById("sf-price").value)||0,
    status: document.getElementById("sf-status").value,
    zoomLink: zoom,
    teacherId: currentUser.uid, teacherName: userProfile.name,
  };
  try {
    if (editingSessionId) {
      await updateDoc(doc(db,"sessions",editingSessionId), data);
      showToast(t("session_updated"), "success");
    } else {
      data.enrolled = 0; data.createdAt = serverTimestamp();
      await addDoc(collection(db,"sessions"), data);
      showToast(t("session_created"), "success");
    }
    await addDoc(collection(db,"audit_logs"), { userId: currentUser.uid, action: editingSessionId?"SESSION_UPDATED":"SESSION_CREATED", target: title, timestamp: serverTimestamp() });
    closeModal("modal-session");
    renderCurrentPage();
  } catch(e) {
    errEl.textContent = e.message; errEl.classList.remove("hidden");
    btn.disabled = false; btn.textContent = editingSessionId ? t("update") : t("save");
  }
}

/* ═══════════════════════════════════════════════════════════════
   ADMIN DASHBOARD
   ═══════════════════════════════════════════════════════════════ */
let adminTab = "overview";

async function renderAdminDash(params = {}) {
  if (params.tab) adminTab = params.tab;
  const el = document.getElementById("admin-content");
  // Count pending items for badges
  let pendingPayments = 0, pendingTeachers = 0;
  try {
    const pSnap = await getDocs(query(collection(db,"bookings"), where("paymentStatus","==","receipt_uploaded")));
    pendingPayments = pSnap.size;
    const tSnap = await getDocs(query(collection(db,"users"), where("role","==","teacher"), where("status","==","pending")));
    pendingTeachers = tSnap.size;
  } catch(e) {}

  el.innerHTML = buildDashLayout("admin", [
    { section: currentLang==="ar"?"الإدارة":"Admin Control", items: [
      { id:"overview", icon:"🏠", label:t("overview") },
      { id:"payments", icon:"💳", label:t("payments"), badge: pendingPayments||null },
      { id:"teachers", icon:"👨‍🏫", label:t("teacher_approvals"), badge: pendingTeachers||null },
      { id:"users", icon:"👥", label:t("users_mgmt") },
      { id:"allsessions", icon:"📚", label:t("all_sessions") },
      { id:"allbookings", icon:"📋", label:t("all_bookings") },
      { id:"reports", icon:"📊", label:t("reports") },
      { id:"audit", icon:"🔍", label:t("audit_log") },
      { id:"notifications", icon:"🔔", label:t("notifications") },
    ]}
  ], adminTab);

  const contentArea = document.getElementById("dash-content-area");
  contentArea.innerHTML = loadingHTML();

  if (adminTab === "overview")    await renderAdminOverview(contentArea);
  else if (adminTab === "payments")  await renderAdminPayments(contentArea);
  else if (adminTab === "teachers")  await renderAdminTeachers(contentArea);
  else if (adminTab === "users")     await renderAdminUsers(contentArea);
  else if (adminTab === "allsessions") await renderAdminSessions(contentArea);
  else if (adminTab === "allbookings") await renderAdminBookings(contentArea);
  else if (adminTab === "reports")   await renderAdminReports(contentArea);
  else if (adminTab === "audit")     await renderAdminAudit(contentArea);
  else if (adminTab === "notifications") renderNotifications(contentArea, currentUser.uid);
}

async function renderAdminOverview(container) {
  const [users, sessions, bookings] = await Promise.all([fetchAllUsers(), fetchSessions(), fetchAllBookings()]);
  const stats = {
    students: users.filter(u=>u.role==="student").length,
    teachers: users.filter(u=>u.role==="teacher"&&u.status==="active").length,
    sessions: sessions.length,
    bookings: bookings.length,
    pendingPay: bookings.filter(b=>b.paymentStatus==="receipt_uploaded").length,
    revenue: 0,
  };
  container.innerHTML = `
    <div style="margin-bottom:1.5rem">
      <div style="font-family:var(--font-arabic);font-size:1.3rem;color:var(--gold);margin-bottom:4px">لوحة الإدارة</div>
      <p class="text-muted text-sm">${currentLang==="ar"?"نظرة عامة على المنصة":"Platform administration overview."}</p>
    </div>
    ${stats.pendingPay>0?`<div class="alert alert-warning">⚠️ ${currentLang==="ar"?`${stats.pendingPay} مدفوعات تنتظر المراجعة.`:`${stats.pendingPay} payment(s) awaiting review.`} <span style="cursor:pointer;text-decoration:underline;color:var(--gold)" onclick="switchAdminTab('payments')">${currentLang==="ar"?"راجع الآن ←":"Review now →"}</span></div>`:""}
    <div class="stats-grid">
      ${[
        { label:t("total_students"), value:stats.students, icon:"🎓" },
        { label:t("total_teachers"), value:stats.teachers, icon:"👨‍🏫" },
        { label:t("total_sessions"), value:stats.sessions, icon:"📚" },
        { label:t("total_bookings"), value:stats.bookings, icon:"📋" },
        { label:t("pending_payments"), value:stats.pendingPay, icon:"⏳" },
      ].map(s=>`<div class="stat-card"><div class="stat-icon">${s.icon}</div><div class="stat-label">${s.label}</div><div class="stat-value">${s.value}</div></div>`).join("")}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-top:1rem">
      <div>
        <div class="section-header"><div class="section-title">${currentLang==="ar"?"آخر الحجوزات":"Recent Bookings"}</div></div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${bookings.slice(0,4).map(b=>`
            <div class="glass-card-light" style="display:flex;justify-content:space-between;align-items:center;padding:.75rem 1rem">
              <div><p class="fw-500 text-sm">${b.studentName||""}</p><p class="text-muted text-xs">${b.sessionTitle||""}</p></div>
              <span class="badge ${b.paymentStatus==="approved"?"badge-active":b.paymentStatus==="rejected"?"badge-rejected":"badge-pending"}">${b.paymentStatus||"pending"}</span>
            </div>`).join("")}
        </div>
      </div>
      <div>
        <div class="section-header"><div class="section-title">${currentLang==="ar"?"آخر الجلسات":"Recent Sessions"}</div></div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${sessions.slice(0,4).map(s=>`
            <div class="glass-card-light" style="padding:.75rem 1rem">
              <p class="fw-500 text-sm">${s.title}</p>
              <p class="text-muted text-xs">${s.date||""} · ${s.enrolled||0}/${s.capacity||0}</p>
            </div>`).join("")}
        </div>
      </div>
    </div>`;
}

async function renderAdminPayments(container) {
  const bookings = await fetchAllBookings();
  const withReceipts = bookings.filter(b => b.receiptUrl || b.paymentStatus === "receipt_uploaded" || b.paymentStatus === "approved" || b.paymentStatus === "rejected");
  container.innerHTML = `
    <div class="section-header"><div class="section-title">${t("payments")}</div></div>
    <div class="table-wrap"><table class="data-table">
      <thead><tr>
        <th>${t("student_name")}</th><th>${t("session_name")}</th>
        <th>${t("amount_paid")}</th><th>${t("view_receipt")}</th>
        <th>${t("uploaded_at")}</th><th>${t("status")}</th><th>${t("actions")}</th>
      </tr></thead>
      <tbody>
        ${withReceipts.length ? withReceipts.map(b=>`
          <tr>
            <td><p class="fw-500">${b.studentName||""}</p></td>
            <td class="text-muted">${b.sessionTitle||""}</td>
            <td class="fw-600" style="color:var(--gold)">${t("price_label")} ${b.amountPaid||0}</td>
            <td>${b.receiptUrl?`<a href="${b.receiptUrl}" target="_blank" class="btn btn-outline btn-sm">🖼️ ${t("view_receipt")}</a>`:"-"}</td>
            <td class="text-muted text-sm">${b.uploadedAt?.toDate?.()?.toLocaleDateString()||""}</td>
            <td><span class="badge ${b.paymentStatus==="approved"?"badge-active":b.paymentStatus==="rejected"?"badge-rejected":"badge-pending"}">${b.paymentStatus||""}</span></td>
            <td>
              ${b.paymentStatus==="receipt_uploaded"?`
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                  <button class="btn btn-primary btn-sm" onclick="adminApprovePayment('${b.id}','approved')">${t("approve")}</button>
                  <button class="btn btn-danger btn-sm" onclick="adminApprovePayment('${b.id}','rejected')">${t("reject")}</button>
                </div>`:"–"}
            </td>
          </tr>`).join("")
        : `<tr><td colspan="7" style="text-align:center;padding:2rem;color:rgba(201,168,76,.4)">${t("no_data")}</td></tr>`}
      </tbody>
    </table></div>`;
}

async function adminApprovePayment(bookingId, decision) {
  try {
    const bSnap = await getDoc(doc(db,"bookings",bookingId));
    const booking = bSnap.data();
    await updateDoc(doc(db,"bookings",bookingId), {
      paymentStatus: decision,
      reviewedAt: serverTimestamp(),
      reviewedBy: currentUser.uid
    });
    // Notify student
    await addDoc(collection(db,"notifications"), {
      userId: booking.studentId, type: decision==="approved"?"success":"error",
      message: decision==="approved" ? t("approved_msg") : t("rejected_msg"),
      read: false, createdAt: serverTimestamp()
    });
    await addDoc(collection(db,"audit_logs"), { userId: currentUser.uid, action: `PAYMENT_${decision.toUpperCase()}`, target: `Booking:${bookingId}`, timestamp: serverTimestamp() });
    showToast(decision==="approved" ? t("approved_msg") : t("rejected_msg"), decision==="approved"?"success":"info");
    switchAdminTab("payments");
  } catch(e) { showToast(e.message, "error"); }
}

async function renderAdminTeachers(container) {
  const teachers = await fetchAllUsers("teacher");
  container.innerHTML = `
    <div class="section-header"><div class="section-title">${t("teacher_approvals")}</div></div>
    <div class="table-wrap"><table class="data-table">
      <thead><tr><th>${t("name")}</th><th>${t("email_col")}</th><th>${t("joined")}</th><th>${t("status")}</th><th>${t("actions")}</th></tr></thead>
      <tbody>
        ${teachers.length ? teachers.map(u=>`
          <tr>
            <td class="fw-500">${u.name}</td>
            <td class="text-muted text-sm">${u.email}</td>
            <td class="text-muted text-sm">${u.createdAt?.toDate?.()?.toLocaleDateString()||""}</td>
            <td><span class="badge ${u.status==="active"?"badge-active":u.status==="pending"?"badge-pending":"badge-rejected"}">${u.status}</span></td>
            <td>
              ${u.status==="pending"?`
                <div style="display:flex;gap:6px">
                  <button class="btn btn-primary btn-sm" onclick="adminApproveTeacher('${u.uid||u.id}','active')">${t("approve")}</button>
                  <button class="btn btn-danger btn-sm" onclick="adminApproveTeacher('${u.uid||u.id}','rejected')">${t("reject")}</button>
                </div>`:"–"}
            </td>
          </tr>`).join("")
        : `<tr><td colspan="5" style="text-align:center;padding:2rem;color:rgba(201,168,76,.4)">${t("no_data")}</td></tr>`}
      </tbody>
    </table></div>`;
}

async function adminApproveTeacher(uid, status) {
  try {
    await updateDoc(doc(db,"users",uid), { status });
    await addDoc(collection(db,"notifications"), {
      userId: uid, type: status==="active"?"success":"error",
      message: status==="active" ? t("teacher_approved") : t("teacher_rejected"),
      read: false, createdAt: serverTimestamp()
    });
    await addDoc(collection(db,"audit_logs"), { userId: currentUser.uid, action: `TEACHER_${status.toUpperCase()}`, target: `User:${uid}`, timestamp: serverTimestamp() });
    showToast(status==="active" ? t("teacher_approved") : t("teacher_rejected"), "success");
    switchAdminTab("teachers");
  } catch(e) { showToast(e.message, "error"); }
}

async function renderAdminUsers(container) {
  const users = await fetchAllUsers();
  container.innerHTML = `
    <div class="section-header"><div class="section-title">${t("users_mgmt")}</div></div>
    <div class="table-wrap"><table class="data-table">
      <thead><tr><th>${t("name")}</th><th>${t("email_col")}</th><th>${t("role_col")}</th><th>${t("status")}</th><th>${t("joined")}</th></tr></thead>
      <tbody>
        ${users.map(u=>`
          <tr>
            <td><div style="display:flex;align-items:center;gap:9px">
              <div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--emerald-mid),var(--gold-dark));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0">${u.avatar||u.name?.[0]||"?"}</div>
              <span class="fw-500">${u.name}</span></div></td>
            <td class="text-muted text-sm">${u.email}</td>
            <td><span class="badge ${u.role==="admin"?"badge-admin":u.role==="teacher"?"badge-teacher":"badge-student"}">${u.role}</span></td>
            <td><span class="badge ${u.status==="active"?"badge-active":u.status==="pending"?"badge-pending":"badge-rejected"}">${u.status}</span></td>
            <td class="text-muted text-sm">${u.createdAt?.toDate?.()?.toLocaleDateString()||""}</td>
          </tr>`).join("")}
      </tbody>
    </table></div>`;
}

async function renderAdminSessions(container) {
  const sessions = await fetchSessions();
  container.innerHTML = `
    <div class="section-header"><div class="section-title">${t("all_sessions")}</div></div>
    <div class="table-wrap"><table class="data-table">
      <thead><tr><th>${currentLang==="ar"?"العنوان":"Title"}</th><th>${currentLang==="ar"?"المعلم":"Teacher"}</th><th>${t("date")}</th><th>${t("category")}</th><th>${currentLang==="ar"?"المسجلون":"Enrolled"}</th><th>${t("status")}</th></tr></thead>
      <tbody>
        ${sessions.map(s=>`
          <tr>
            <td class="fw-500">${s.title}</td>
            <td class="text-muted text-sm">${s.teacherName||""}</td>
            <td class="text-muted text-sm">${s.date||""} ${s.time||""}</td>
            <td><span class="badge badge-upcoming">${s.category||""}</span></td>
            <td>${s.enrolled||0}/${s.capacity||0}</td>
            <td><span class="badge ${s.status==="active"?"badge-active":s.status==="completed"?"badge-rejected":"badge-upcoming"}">${s.status||""}</span></td>
          </tr>`).join("")}
      </tbody>
    </table></div>`;
}

async function renderAdminBookings(container) {
  const bookings = await fetchAllBookings();
  container.innerHTML = `
    <div class="section-header"><div class="section-title">${t("all_bookings")}</div></div>
    <div class="table-wrap"><table class="data-table">
      <thead><tr><th>${t("student_name")}</th><th>${t("session_name")}</th><th>${t("uploaded_at")}</th><th>${t("status")}</th></tr></thead>
      <tbody>
        ${bookings.map(b=>`
          <tr>
            <td class="fw-500">${b.studentName||""}</td>
            <td class="text-muted">${b.sessionTitle||""}</td>
            <td class="text-muted text-sm">${b.bookedAt?.toDate?.()?.toLocaleDateString()||""}</td>
            <td><span class="badge ${b.paymentStatus==="approved"?"badge-active":b.paymentStatus==="rejected"?"badge-rejected":"badge-pending"}">${b.paymentStatus||"pending"}</span></td>
          </tr>`).join("")}
      </tbody>
    </table></div>`;
}

async function renderAdminReports(container) {
  const [users, sessions, bookings] = await Promise.all([fetchAllUsers(), fetchSessions(), fetchAllBookings()]);
  const catCount = {};
  sessions.forEach(s => { catCount[s.category||"Other"] = (catCount[s.category||"Other"]||0)+1; });
  const totalSess = sessions.length || 1;
  container.innerHTML = `
    <div class="section-header"><div class="section-title">${t("reports")}</div></div>
    <div class="stats-grid" style="margin-bottom:2rem">
      ${[
        { label:currentLang==="ar"?"إجمالي المستخدمين":"Total Users", value:users.length, icon:"👥" },
        { label:t("total_teachers"), value:users.filter(u=>u.role==="teacher"&&u.status==="active").length, icon:"👨‍🏫" },
        { label:t("total_sessions"), value:sessions.length, icon:"📚" },
        { label:t("total_bookings"), value:bookings.length, icon:"📋" },
        { label:t("pending_payments"), value:bookings.filter(b=>b.paymentStatus==="receipt_uploaded").length, icon:"⏳" },
        { label:t("approved"), value:bookings.filter(b=>b.paymentStatus==="approved").length, icon:"✅" },
      ].map(s=>`<div class="stat-card"><div class="stat-icon">${s.icon}</div><div class="stat-label">${s.label}</div><div class="stat-value">${s.value}</div></div>`).join("")}
    </div>
    <div class="section-header"><div class="section-title">${currentLang==="ar"?"الجلسات حسب الفئة":"Sessions by Category"}</div></div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${Object.entries(catCount).map(([cat,count])=>`
        <div class="glass-card-light" style="padding:1rem;display:flex;align-items:center;gap:16px">
          <div style="flex:1">
            <p class="fw-500" style="margin-bottom:6px">${cat}</p>
            <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(count/totalSess*100)}%"></div></div>
          </div>
          <span style="font-weight:700;color:var(--gold);min-width:60px;text-align:right">${count} ${currentLang==="ar"?"جلسات":"sessions"}</span>
        </div>`).join("")}
    </div>`;
}

async function renderAdminAudit(container) {
  const snap = await getDocs(query(collection(db,"audit_logs"), orderBy("timestamp","desc")));
  const logs = snap.docs.map(d => ({ id:d.id, ...d.data() }));
  container.innerHTML = `
    <div class="section-header"><div class="section-title">${t("audit_log")}</div></div>
    <div class="table-wrap"><table class="data-table">
      <thead><tr><th>${currentLang==="ar"?"الإجراء":"Action"}</th><th>${currentLang==="ar"?"الهدف":"Target"}</th><th>${currentLang==="ar"?"المستخدم":"User"}</th><th>${currentLang==="ar"?"التوقيت":"Timestamp"}</th></tr></thead>
      <tbody>
        ${logs.length ? logs.slice(0,50).map(l=>`
          <tr>
            <td><code style="font-size:11.5px;background:rgba(9,30,18,.5);padding:2px 8px;border-radius:4px;color:var(--emerald-light)">${l.action}</code></td>
            <td class="text-sm">${l.target||""}</td>
            <td class="text-muted text-sm">${l.userId?.substring(0,8)||""}…</td>
            <td class="text-muted text-sm">${l.timestamp?.toDate?.()?.toLocaleString()||""}</td>
          </tr>`).join("")
        : `<tr><td colspan="4" style="text-align:center;padding:2rem;color:rgba(201,168,76,.4)">${t("no_data")}</td></tr>`}
      </tbody>
    </table></div>`;
}

/* ═══════════════════════════════════════════════════════════════
   NOTIFICATIONS
   ═══════════════════════════════════════════════════════════════ */
async function renderNotifications(container, uid) {
  const snap = await getDocs(query(collection(db,"notifications"), where("userId","==",uid), orderBy("createdAt","desc")));
  const notifs = snap.docs.map(d => ({ id:d.id, ...d.data() }));
  // Mark as read
  notifs.forEach(async n => { if (!n.read) await updateDoc(doc(db,"notifications",n.id), { read: true }); });
  const icons = { success:"✅", error:"❌", info:"ℹ️", warning:"⚠️" };
  container.innerHTML = `
    <div class="section-header"><div class="section-title">${t("notifications")}</div></div>
    ${!notifs.length ? `<p class="text-muted" style="text-align:center;padding:3rem">${t("no_data")}</p>` :
      `<div style="display:flex;flex-direction:column;gap:10px">
        ${notifs.map(n=>`
          <div class="glass-card-light" style="display:flex;gap:12px;align-items:flex-start;padding:1rem;opacity:${n.read?.1:.7}" data-notif="${n.id}">
            <div style="font-size:20px">${icons[n.type]||"ℹ️"}</div>
            <div>
              <p style="font-size:14px">${n.message}</p>
              <p class="text-muted text-xs mt-1">${n.createdAt?.toDate?.()?.toLocaleDateString()||""}</p>
            </div>
          </div>`).join("")}
      </div>`}`;
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD LAYOUT BUILDER
   ═══════════════════════════════════════════════════════════════ */
function buildDashLayout(role, navSections, activeTab) {
  const roleLabel = { admin:`👑 ${t("admin")}`, teacher:`📚 ${t("teacher")}`, student:`🎓 ${t("student")}` }[role];
  const switchFn = { admin:"switchAdminTab", teacher:"switchTeacherTab", student:"switchStudentTab" }[role];

  const navHTML = navSections.map(sec => `
    <div class="nav-section-label">${sec.section}</div>
    ${sec.items.map(item => `
      <button class="nav-item ${activeTab===item.id?"active":""}" onclick="${switchFn}('${item.id}')">
        <span class="nav-icon">${item.icon}</span>
        ${item.label}
        ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ""}
      </button>`).join("")}
  `).join("");

  return `
    <div class="dashboard-layout">
      <aside class="sidebar" id="main-sidebar">
        <div class="sidebar-logo">
          <div class="sidebar-logo-icon">☾</div>
          <div class="sidebar-logo-text">
            <div class="name">Quran Platform</div>
            <div class="sub">مدرسة القرآن الكريم</div>
          </div>
        </div>
        <nav class="sidebar-nav">${navHTML}</nav>
        <div class="sidebar-user">
          <div class="sidebar-user-row">
            <div class="user-avatar">${userProfile?.avatar||"?"}</div>
            <div>
              <div class="user-info-name">${userProfile?.name||""}</div>
              <div class="user-info-email">${userProfile?.email||""}</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <span class="badge ${role==="admin"?"badge-admin":role==="teacher"?"badge-teacher":"badge-student"}">${roleLabel}</span>
            <button class="btn btn-outline btn-sm" style="flex:1;justify-content:center" onclick="handleSignOut()">${t("signout")}</button>
          </div>
        </div>
      </aside>
      <div class="main-content">
        <div class="topbar">
          <div style="display:flex;align-items:center;gap:12px">
            <button class="mobile-menu-btn" onclick="toggleSidebar()">☰</button>
            <h1 class="topbar-title" id="topbar-title">${navSections.flatMap(s=>s.items).find(i=>i.id===activeTab)?.label||t("dashboard")}</h1>
          </div>
          <div class="topbar-right">
            <div style="position:relative">
              <button class="btn btn-outline btn-sm" onclick="goToNotifications()">🔔</button>
            </div>
            <div class="lang-toggle">
              <button class="lang-btn ${currentLang==="en"?"active":""}" data-lang="en" onclick="setLang('en')">EN</button>
              <button class="lang-btn ${currentLang==="ar"?"active":""}" data-lang="ar" onclick="setLang('ar')">AR</button>
            </div>
          </div>
        </div>
        <div class="page-content arabesque-bg" id="dash-content-area">${loadingHTML()}</div>
      </div>
    </div>`;
}

function goToNotifications() {
  if (!userProfile) return;
  if (userProfile.role==="admin") switchAdminTab("notifications");
  else if (userProfile.role==="teacher") switchTeacherTab("notifications");
  else switchStudentTab("notifications");
}

function switchStudentTab(tab) { studentTab = tab; renderStudentDash(); }
function switchTeacherTab(tab) { teacherTab = tab; renderTeacherDash(); }
function switchAdminTab(tab)   { adminTab = tab;   renderAdminDash(); }

function toggleSidebar() {
  document.getElementById("main-sidebar")?.classList.toggle("open");
}

/* ═══════════════════════════════════════════════════════════════
   MODAL HELPERS
   ═══════════════════════════════════════════════════════════════ */
function showModal(id) { document.getElementById(id)?.classList.remove("modal-overlay"); document.getElementById(id).style.display = "flex"; }
function closeModal(id) { const el = document.getElementById(id); if(el) el.style.display = "none"; }
// Click outside closes
document.addEventListener("click", e => {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.style.display = "none";
  }
});

/* ═══════════════════════════════════════════════════════════════
   EXPOSE TO GLOBAL SCOPE (needed for inline onclick)
   ═══════════════════════════════════════════════════════════════ */
Object.assign(window, {
  navigate, setLang, goToDash, handleSignOut, handleLogin, handleRegister,
  quickLogin, onRoleChange, openBookModal, confirmBooking,
  openUploadModal, submitPayment, onDragOver, onDragLeave, onDrop, onFileSelect,
  handleJoinSession, openSessionModal, saveSession,
  adminApprovePayment, adminApproveTeacher,
  switchStudentTab, switchTeacherTab, switchAdminTab,
  goToNotifications, toggleSidebar, closeModal
});

/* ═══════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════ */
function init() {
  // Apply saved language
  document.body.classList.toggle("lang-ar", currentLang === "ar");
  document.documentElement.lang = currentLang;
  document.documentElement.dir  = currentLang === "ar" ? "rtl" : "ltr";
  document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === currentLang));
  navigate("home");
}

init();
