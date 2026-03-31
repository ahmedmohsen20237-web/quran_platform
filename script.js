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
   i18n — TRANSLATIONS (Extended)
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
    offers: "Offers & Coupons",
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
    promo_code: "Promo Code", apply_promo: "Apply", discount: "Discount",
    payment_method: "Payment Method",
    // Payment Methods
    payment_bank: "Bank Transfer (IBAN)",
    payment_vodafone: "Vodafone Cash",
    payment_paypal: "PayPal",
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
    delete_user: "Delete User", edit_user: "Edit User",
    delete_confirm: "Are you sure you want to delete this user? This action cannot be undone.",
    user_deleted: "User deleted successfully.",
    user_updated: "User updated successfully.",
    // Offers
    create_offer: "+ New Offer",
    offer_code: "Offer Code", offer_discount: "Discount (%)",
    offer_start: "Start Date", offer_end: "End Date",
    offer_active: "Active", offer_inactive: "Inactive",
    offer_created: "Offer created successfully!",
    offer_deleted: "Offer deleted successfully!",
    invalid_code: "Invalid or expired promo code.",
    discount_applied: "Discount applied!",
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
    offers: "العروض والكوبونات",
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
    promo_code: "كود الخصم", apply_promo: "تطبيق", discount: "الخصم",
    payment_method: "طريقة الدفع",
    payment_bank: "تحويل بنكي (آيبان)",
    payment_vodafone: "فودافون كاش",
    payment_paypal: "باي بال",
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
    delete_user: "حذف المستخدم", edit_user: "تعديل المستخدم",
    delete_confirm: "هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.",
    user_deleted: "تم حذف المستخدم بنجاح.",
    user_updated: "تم تحديث المستخدم بنجاح.",
    create_offer: "+ عرض جديد",
    offer_code: "كود العرض", offer_discount: "نسبة الخصم (%)",
    offer_start: "تاريخ البداية", offer_end: "تاريخ النهاية",
    offer_active: "نشط", offer_inactive: "غير نشط",
    offer_created: "تم إنشاء العرض بنجاح!",
    offer_deleted: "تم حذف العرض بنجاح!",
    invalid_code: "كود خصم غير صالح أو منتهي الصلاحية.",
    discount_applied: "تم تطبيق الخصم!",
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
let currentUser = null;
let userProfile = null;
let currentPage = "home";
let unsubListeners = [];
let appliedPromo = null; // Store applied promo code info

const t = (key) => T[currentLang][key] || key;

/* ═══════════════════════════════════════════════════════════════
   TOAST NOTIFICATION
   ═══════════════════════════════════════════════════════════════ */
function showToast(msg, type = "info", duration = 4000) {
  const icons = { success: "✅", error: "❌", info: "ℹ️", warning: "⚠️" };
  const container = document.getElementById("toast-container");
  if (!container) return;
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
   AUTH (Keep existing implementation)
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
    await ensureDemoUsers();
    await signInWithEmailAndPassword(auth, email, password);
  } catch(e) {
    showToast("Demo login: " + e.message, "error");
  }
}

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
    } catch(e) { /* already exists */ }
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

async function fetchAllOffers() {
  const snap = await getDocs(collection(db,"offers"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

function loadingHTML() {
  return `<div style="text-align:center;padding:3rem;color:var(--gold);opacity:.6">${t("loading")}</div>`;
}

/* ═══════════════════════════════════════════════════════════════
   PROMO CODE VALIDATION
   ═══════════════════════════════════════════════════════════════ */
async function validatePromoCode(code, sessionPrice) {
  const offersSnap = await getDocs(query(collection(db,"offers"), where("code","==",code.toUpperCase())));
  if (offersSnap.empty) return null;
  const offer = offersSnap.docs[0].data();
  const now = new Date();
  const startDate = offer.startDate?.toDate ? offer.startDate.toDate() : new Date(offer.startDate);
  const endDate = offer.endDate?.toDate ? offer.endDate.toDate() : new Date(offer.endDate);
  
  if (!offer.active || now < startDate || now > endDate) return null;
  
  const discountAmount = (sessionPrice * offer.discount) / 100;
  return {
    code: offer.code,
    discount: offer.discount,
    discountedPrice: sessionPrice - discountAmount,
    valid: true
  };
}

/* ═══════════════════════════════════════════════════════════════
   BOOKING FLOW (Updated with promo code and payment methods)
   ═══════════════════════════════════════════════════════════════ */
let _bookSessionId = null;
let _uploadBookingId = null, _uploadSessionId = null;
let _uploadFile = null;
let _currentPromo = null;
let _selectedPaymentMethod = "bank";

async function openBookModal(sessionId) {
  _bookSessionId = sessionId;
  _currentPromo = null;
  _selectedPaymentMethod = "bank";
  
  const snap = await getDoc(doc(db,"sessions",sessionId));
  const s = snap.data();
  const price = s.price || 0;
  
  document.getElementById("modal-book-title").textContent = `${t("book_title")} — ${s.title}`;
  document.getElementById("modal-book-body").innerHTML = `
    <div class="glass-card-light" style="padding:1rem;margin-bottom:1rem">
      <p style="font-weight:500;margin-bottom:6px">${s.title}</p>
      <div class="info-row"><span>📅 ${s.date} ${currentLang==="ar"?"الساعة":"at"} ${s.time}</span><span>⏱️ ${s.duration}min</span></div>
    </div>
    
    <div class="form-group">
      <label class="form-label">${t("payment_method")}</label>
      <select id="payment-method-select" class="form-select" onchange="updatePaymentMethodDetails(this.value)">
        <option value="bank">${t("payment_bank")}</option>
        <option value="vodafone">${t("payment_vodafone")}</option>
        <option value="paypal">${t("payment_paypal")}</option>
      </select>
    </div>
    
    <div id="payment-details-container">
      ${getPaymentMethodDetailsHTML("bank", price)}
    </div>
    
    <div class="form-group" style="margin-top:1rem">
      <label class="form-label">${t("promo_code")}</label>
      <div style="display:flex;gap:8px">
        <input id="promo-code-input" type="text" class="form-input" placeholder="${currentLang==="ar"?"أدخل كود الخصم":"Enter promo code"}">
        <button class="btn btn-outline btn-sm" onclick="applyPromoCode()">${t("apply_promo")}</button>
      </div>
      <div id="promo-feedback" class="text-sm mt-1"></div>
    </div>
    
    <div id="price-display" style="margin-top:1rem;padding:1rem;background:rgba(9,30,18,.3);border-radius:var(--r-sm);text-align:center">
      <span style="font-size:14px">${t("amount")}: </span>
      <span style="font-size:24px;font-weight:700;color:var(--gold)" id="final-price">${t("price_label")} ${price}</span>
    </div>
    
    <div class="alert alert-info mt-2">💳 ${currentLang==="ar"?"بعد الحجز، ارفع إيصال التحويل البنكي لتأكيد مقعدك.":"After booking, upload your bank transfer proof to confirm your seat."}</div>`;
  
  showModal("modal-book");
}

function getPaymentMethodDetailsHTML(method, price) {
  const methods = {
    bank: `
      <div style="background:rgba(9,30,18,.5);padding:1rem;border-radius:var(--r-sm);font-size:13px;border:1px solid var(--border)">
        <p style="font-weight:600;color:var(--gold-light);margin-bottom:10px">🏦 ${t("bank_details")}</p>
        <div style="display:grid;grid-template-columns:auto 1fr;gap:5px 14px">
          <span class="text-muted">${t("bank_name")}:</span><span>${t("bank_name_val")}</span>
          <span class="text-muted">${t("account_name")}:</span><span>${t("account_holder")}</span>
          <span class="text-muted">${t("account_no")}:</span><span style="font-family:monospace">${t("bank_iban")}</span>
          <span class="text-muted">${t("amount")}:</span><span style="color:var(--gold);font-weight:700">${t("price_label")} ${price}</span>
        </div>
      </div>`,
    vodafone: `
      <div style="background:rgba(9,30,18,.5);padding:1rem;border-radius:var(--r-sm);font-size:13px;border:1px solid var(--border)">
        <p style="font-weight:600;color:var(--gold-light);margin-bottom:10px">📱 ${t("payment_vodafone")}</p>
        <div style="display:grid;grid-template-columns:auto 1fr;gap:5px 14px">
          <span class="text-muted">رقم المحفظة:</span><span>0100 0000 000</span>
          <span class="text-muted">${t("amount")}:</span><span style="color:var(--gold);font-weight:700">${t("price_label")} ${price}</span>
        </div>
      </div>`,
    paypal: `
      <div style="background:rgba(9,30,18,.5);padding:1rem;border-radius:var(--r-sm);font-size:13px;border:1px solid var(--border)">
        <p style="font-weight:600;color:var(--gold-light);margin-bottom:10px">💰 ${t("payment_paypal")}</p>
        <div style="display:grid;grid-template-columns:auto 1fr;gap:5px 14px">
          <span class="text-muted">البريد الإلكتروني:</span><span>payments@quran.edu</span>
          <span class="text-muted">${t("amount")}:</span><span style="color:var(--gold);font-weight:700">${t("price_label")} ${price}</span>
        </div>
      </div>`
  };
  return methods[method] || methods.bank;
}

function updatePaymentMethodDetails(method) {
  _selectedPaymentMethod = method;
  const container = document.getElementById("payment-details-container");
  const priceEl = document.getElementById("final-price");
  let price = 0;
  if (priceEl) {
    const priceText = priceEl.textContent;
    const match = priceText.match(/\d+(?:\.\d+)?/);
    price = match ? parseFloat(match[0]) : 0;
  }
  if (container) {
    container.innerHTML = getPaymentMethodDetailsHTML(method, price);
  }
}

async function applyPromoCode() {
  const codeInput = document.getElementById("promo-code-input");
  const code = codeInput.value.trim();
  if (!code) return;
  
  const snap = await getDoc(doc(db,"sessions",_bookSessionId));
  const session = snap.data();
  const originalPrice = session.price || 0;
  
  const promoResult = await validatePromoCode(code, originalPrice);
  const feedback = document.getElementById("promo-feedback");
  
  if (promoResult && promoResult.valid) {
    _currentPromo = promoResult;
    feedback.innerHTML = `<span style="color:var(--success)">✅ ${t("discount_applied")} (${promoResult.discount}% off)</span>`;
    document.getElementById("final-price").innerHTML = `${t("price_label")} ${promoResult.discountedPrice.toFixed(2)} <span style="font-size:12px;text-decoration:line-through;opacity:0.7">${t("price_label")} ${originalPrice}</span>`;
    // Update payment details with discounted price
    updatePaymentMethodDetails(_selectedPaymentMethod);
  } else {
    _currentPromo = null;
    feedback.innerHTML = `<span style="color:var(--error)">❌ ${t("invalid_code")}</span>`;
    document.getElementById("final-price").innerHTML = `${t("price_label")} ${originalPrice}`;
  }
}

async function confirmBooking() {
  if (!currentUser || !_bookSessionId) return;
  const btn = document.getElementById("confirm-book-btn");
  btn.disabled = true; btn.textContent = t("loading");
  try {
    const sessionRef = doc(db,"sessions",_bookSessionId);
    const sSnap = await getDoc(sessionRef);
    const s = sSnap.data();
    if ((s.enrolled||0) >= (s.capacity||0)) { 
      showToast(t("session_full"), "error"); 
      closeModal("modal-book"); 
      return; 
    }
    
    const existing = await getDocs(query(collection(db,"bookings"), 
      where("studentId","==",currentUser.uid), 
      where("sessionId","==",_bookSessionId)));
    if (!existing.empty) { 
      showToast(currentLang==="ar"?"حجزت هذه الجلسة مسبقاً":"Already booked.", "warning"); 
      closeModal("modal-book"); 
      return; 
    }
    
    const finalPrice = _currentPromo ? _currentPromo.discountedPrice : (s.price || 0);
    
    const bRef = await addDoc(collection(db,"bookings"), {
      studentId: currentUser.uid, 
      studentName: userProfile.name,
      sessionId: _bookSessionId, 
      sessionTitle: s.title,
      teacherId: s.teacherId, 
      status: "pending", 
      paymentStatus: "pending",
      paymentMethod: _selectedPaymentMethod,
      originalPrice: s.price || 0,
      finalPrice: finalPrice,
      promoCode: _currentPromo ? _currentPromo.code : null,
      promoDiscount: _currentPromo ? _currentPromo.discount : null,
      bookedAt: serverTimestamp()
    });
    
    await updateDoc(sessionRef, { enrolled: (s.enrolled||0) + 1 });
    await addDoc(collection(db,"audit_logs"), { 
      userId: currentUser.uid, 
      action: "SESSION_BOOKED", 
      target: `Session:${_bookSessionId}`,
      details: _currentPromo ? `Promo:${_currentPromo.code}` : null,
      timestamp: serverTimestamp() 
    });
    
    closeModal("modal-book");
    showToast(t("booked_success"), "success");
    openUploadModal(_bookSessionId, bRef.id);
  } catch(e) {
    showToast(e.message, "error");
    btn.disabled = false; btn.textContent = t("confirm_book");
  }
}

async function openUploadModal(sessionId, bookingId) {
  _uploadSessionId = sessionId; 
  _uploadBookingId = bookingId;
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

function onDragOver(e) { e.preventDefault(); document.getElementById("upload-zone")?.classList.add("dragover"); }
function onDragLeave()  { document.getElementById("upload-zone")?.classList.remove("dragover"); }
function onDrop(e) { e.preventDefault(); onDragLeave(); if(e.dataTransfer.files[0]) setUploadFile(e.dataTransfer.files[0]); }
function onFileSelect(e) { if(e.target.files[0]) setUploadFile(e.target.files[0]); }

function setUploadFile(file) {
  _uploadFile = file;
  const iconEl = document.getElementById("upload-icon");
  const titleEl = document.getElementById("upload-title");
  if (iconEl) iconEl.textContent = file.type==="application/pdf"?"📄":"🖼️";
  if (titleEl) titleEl.textContent = file.name;
  const prev = document.getElementById("upload-preview");
  if (prev) {
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      prev.innerHTML = `<img src="${url}" style="max-height:90px;border-radius:6px;margin-top:8px">`;
    } else { prev.innerHTML = ""; }
  }
}

async function submitPayment() {
  if (!_uploadFile) { 
    showToast(currentLang==="ar"?"يرجى اختيار ملف الإيصال":"Please select a receipt file.", "error"); 
    return; 
  }
  const btn = document.getElementById("submit-payment-btn");
  btn.disabled = true; btn.textContent = t("uploading");
  const errEl = document.getElementById("upload-error");
  if (errEl) errEl.classList.add("hidden");
  try {
    const { url, publicId } = await uploadToCloudinary(_uploadFile);
    await updateDoc(doc(db,"bookings",_uploadBookingId), {
      paymentStatus: "receipt_uploaded",
      receiptUrl: url, 
      receiptPublicId: publicId,
      amountPaid: parseFloat(document.getElementById("upload-amount")?.value)||0,
      paymentNotes: document.getElementById("upload-notes")?.value,
      uploadedAt: serverTimestamp()
    });
    await addDoc(collection(db,"audit_logs"), { 
      userId: currentUser.uid, 
      action: "PAYMENT_UPLOADED", 
      target: `Booking:${_uploadBookingId}`, 
      timestamp: serverTimestamp() 
    });
    closeModal("modal-upload");
    showToast(t("upload_success"), "success");
    renderCurrentPage();
  } catch(e) {
    if (errEl) {
      errEl.textContent = e.message; 
      errEl.classList.remove("hidden");
    }
    btn.disabled = false; 
    btn.textContent = t("submit_payment");
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
  if (!session.zoomLink) { 
    showToast(currentLang==="ar"?"رابط الجلسة غير متاح بعد":"Session link not available yet.", "warning"); 
    return; 
  }
  await addDoc(collection(db,"audit_logs"), { 
    userId: currentUser.uid, 
    action: "SESSION_JOIN", 
    target: `Session:${sessionId}`, 
    timestamp: serverTimestamp() 
  });
  window.open(session.zoomLink, "_blank", "noopener,noreferrer");
}

/* ═══════════════════════════════════════════════════════════════
   STUDENT DASHBOARD (Keep existing implementation)
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
              <div class="info-row"><span>📅 ${s?.date||""}</span><span>👤 ${s?.teacherName||""}</span></div>
              ${b.promoCode ? `<div class="text-muted text-xs mt-1">🎫 ${t("promo_code")}: ${b.promoCode} (${b.promoDiscount}%)</div>` : ""}
              ${b.finalPrice && b.finalPrice !== b.originalPrice ? `<div class="text-muted text-xs">💰 ${t("price_label")} ${b.originalPrice} → ${b.finalPrice}</div>` : ""}
            </div>
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
   TEACHER DASHBOARD (Keep existing implementation)
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
  const revenue   = bookings.filter(b=>b.paymentStatus==="approved").length;
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
          return `<tr>
            <td><p class="fw-500">${b.studentName||""}</p></td>
            <td class="text-muted">${s?.title||""}</td>
            <td class="text-muted text-sm">${b.bookedAt?.toDate?.()?.toLocaleDateString()||""}</td>
            <td><span class="badge ${b.paymentStatus==="approved"?"badge-active":b.paymentStatus==="rejected"?"badge-rejected":"badge-pending"}">${b.paymentStatus||"pending"}</span></td>
          </tr>`;
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
  const title   = document.getElementById("sf-title")?.value.trim();
  const zoom    = document.getElementById("sf-zoom")?.value.trim();
  const dateVal = document.getElementById("sf-date")?.value;
  const timeVal = document.getElementById("sf-time")?.value;
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
    title, 
    description: document.getElementById("sf-desc")?.value.trim() || "",
    date: dateVal, 
    time: timeVal,
    duration: parseInt(document.getElementById("sf-dur")?.value)||60,
    capacity: parseInt(document.getElementById("sf-cap")?.value)||10,
    category: document.getElementById("sf-cat")?.value,
    level: document.getElementById("sf-level")?.value,
    price: parseFloat(document.getElementById("sf-price")?.value)||0,
    status: document.getElementById("sf-status")?.value,
    zoomLink: zoom,
    teacherId: currentUser.uid, 
    teacherName: userProfile.name,
  };
  try {
    if (editingSessionId) {
      await updateDoc(doc(db,"sessions",editingSessionId), data);
      showToast(t("session_updated"), "success");
    } else {
      data.enrolled = 0; 
      data.createdAt = serverTimestamp();
      await addDoc(collection(db,"sessions"), data);
      showToast(t("session_created"), "success");
    }
    await addDoc(collection(db,"audit_logs"), { 
      userId: currentUser.uid, 
      action: editingSessionId?"SESSION_UPDATED":"SESSION_CREATED", 
      target: title, 
      timestamp: serverTimestamp() 
    });
    closeModal("modal-session");
    renderCurrentPage();
  } catch(e) {
    errEl.textContent = e.message; 
    errEl.classList.remove("hidden");
    btn.disabled = false; 
    btn.textContent = editingSessionId ? t("update") : t("save");
  }
}

/* ═══════════════════════════════════════════════════════════════
   ADMIN DASHBOARD
   ═══════════════════════════════════════════════════════════════ */
let adminTab = "overview";

async function renderAdminDash(params = {}) {
  if (params.tab) adminTab = params.tab;
  const el = document.getElementById("admin-content");
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
      { id:"offers", icon:"🏷️", label:t("offers") },
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
  else if (adminTab === "offers")      await renderAdminOffers(contentArea);
  else if (adminTab === "reports")   await renderAdminReports(contentArea);
  else if (adminTab === "audit")     await renderAdminAudit(contentArea);
  else if (adminTab === "notifications") renderNotifications(contentArea, currentUser.uid);
}

async function renderAdminOverview(container) {
  const [users, sessions, bookings, offers] = await Promise.all([fetchAllUsers(), fetchSessions(), fetchAllBookings(), fetchAllOffers()]);
  const stats = {
    students: users.filter(u=>u.role==="student").length,
    teachers: users.filter(u=>u.role==="teacher"&&u.status==="active").length,
    sessions: sessions.length,
    bookings: bookings.length,
    pendingPay: bookings.filter(b=>b.paymentStatus==="receipt_uploaded").length,
    offers: offers.length,
    revenue: bookings.filter(b=>b.paymentStatus==="approved").reduce((sum,b)=>sum+(b.finalPrice||b.originalPrice||0),0),
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
        { label:t("revenue"), value:`${t("price_label")} ${stats.revenue.toFixed(2)}`, icon:"💰" },
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
    <div class="section-header">
      <div class="section-title">${t("payments")}</div>
    </div>
    <div class="table-wrap"><table class="data-table">
      <thead>
        <th>${t("student_name")}</th><th>${t("session_name")}</th>
        <th>${t("amount_paid")}</th><th>${t("view_receipt")}</th>
        <th>${t("payment_method")}</th>
        <th>${t("uploaded_at")}</th><th>${t("status")}</th><th>${t("actions")}</th>
      </thead>
      <tbody>
        ${withReceipts.length ? withReceipts.map(b=>`
          <tr>
              <td><p class="fw-500">${b.studentName||""}</p></td>
            <td class="text-muted">${b.sessionTitle||""}</td>
            <td class="fw-600" style="color:var(--gold)">${t("price_label")} ${b.amountPaid||b.finalPrice||b.originalPrice||0}</td>
            <td>${b.receiptUrl?`<a href="${b.receiptUrl}" target="_blank" class="btn btn-outline btn-sm">🖼️ ${t("view_receipt")}</a>`:"-"}</td>
            <td><span class="badge badge-upcoming">${b.paymentMethod||"bank"}</span></td>
            <td class="text-muted text-sm">${b.uploadedAt?.toDate?.()?.toLocaleDateString()||b.bookedAt?.toDate?.()?.toLocaleDateString()||""}</td>
            <td><span class="badge ${b.paymentStatus==="approved"?"badge-active":b.paymentStatus==="rejected"?"badge-rejected":"badge-pending"}">${b.paymentStatus||"pending"}</span></td>
            <td>
              ${b.paymentStatus==="receipt_uploaded" || b.paymentStatus==="pending" ? `
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                  <button class="btn btn-primary btn-sm" onclick="adminApprovePayment('${b.id}','approved')">${t("approve")}</button>
                  <button class="btn btn-danger btn-sm" onclick="adminApprovePayment('${b.id}','rejected')">${t("reject")}</button>
                </div>`:"–"}
            </td>
           </tr>`).join("")
        : `<tr><td colspan="8" style="text-align:center;padding:2rem;color:rgba(201,168,76,.4)">${t("no_data")}</td></tr>`}
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
    await addDoc(collection(db,"notifications"), {
      userId: booking.studentId, 
      type: decision==="approved"?"success":"error",
      message: decision==="approved" ? t("approved_msg") : t("rejected_msg"),
      read: false, 
      createdAt: serverTimestamp()
    });
    await addDoc(collection(db,"audit_logs"), { 
      userId: currentUser.uid, 
      action: `PAYMENT_${decision.toUpperCase()}`, 
      target: `Booking:${bookingId}`, 
      timestamp: serverTimestamp() 
    });
    showToast(decision==="approved" ? t("approved_msg") : t("rejected_msg"), decision==="approved"?"success":"info");
    switchAdminTab("payments");
  } catch(e) { showToast(e.message, "error"); }
}

async function renderAdminTeachers(container) {
  const teachers = await fetchAllUsers("teacher");
  container.innerHTML = `
    <div class="section-header"><div class="section-title">${t("teacher_approvals")}</div></div>
    <div class="table-wrap"><table class="data-table">
      <thead>
        <th>${t("name")}</th>
        <th>${t("email_col")}</th>
        <th>${t("joined")}</th>
        <th>${t("status")}</th>
        <th>${t("actions")}</th>
      </thead>
      <tbody>
        ${teachers.length ? teachers.map(u=>`
          <tr>
            <td class="fw-500">${u.name}</td>
            <td class="text-muted text-sm">${u.email}</td>
            <td class="text-muted text-sm">${u.createdAt?.toDate?.()?.toLocaleDateString()||""}</td>
            <td><span class="badge ${u.status==="active"?"badge-active":u.status==="pending"?"badge-pending":"badge-rejected"}">${u.status}</span></td>
            <td>
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                ${u.status === "pending" ? `
                  <button class="btn btn-primary btn-sm" onclick="adminApproveTeacher('${u.uid||u.id}','active')">${t("approve")}</button>
                  <button class="btn btn-danger btn-sm" onclick="adminApproveTeacher('${u.uid||u.id}','rejected')">${t("reject")}</button>
                ` : ""}
                <button class="btn btn-primary btn-sm" onclick="editUser('${u.uid||u.id}')">✏️ ${t("edit_user")}</button>
                <button class="btn btn-danger btn-sm" onclick="deleteUser('${u.uid||u.id}')">🗑️ ${t("delete_user")}</button>
              </div>
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
      userId: uid, 
      type: status==="active"?"success":"error",
      message: status==="active" ? t("teacher_approved") : t("teacher_rejected"),
      read: false, 
      createdAt: serverTimestamp()
    });
    await addDoc(collection(db,"audit_logs"), { 
      userId: currentUser.uid, 
      action: `TEACHER_${status.toUpperCase()}`, 
      target: `User:${uid}`, 
      timestamp: serverTimestamp() 
    });
    showToast(status==="active" ? t("teacher_approved") : t("teacher_rejected"), "success");
    switchAdminTab("teachers");
  } catch(e) { showToast(e.message, "error"); }
}

async function renderAdminUsers(container) {
  const users = await fetchAllUsers();
  container.innerHTML = `
    <div class="section-header">
      <div class="section-title">${t("users_mgmt")}</div>
    </div>
    <div class="table-wrap"><table class="data-table">
      <thead>
        <th>${t("name")}</th>
        <th>${t("email_col")}</th>
        <th>${t("role_col")}</th>
        <th>${t("status")}</th>
        <th>${t("joined")}</th>
        <th>${t("actions")}</th>
      </thead>
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
            <td>
              ${u.uid !== currentUser?.uid ? `
                <div style="display:flex;gap:6px">
                  <button class="btn btn-primary btn-sm" onclick="editUser('${u.uid||u.id}')">✏️ ${t("edit_user")}</button>
                  <button class="btn btn-danger btn-sm" onclick="deleteUser('${u.uid||u.id}')">🗑️ ${t("delete_user")}</button>
                </div>
              ` : "<span class=\"text-muted text-sm\">Current</span>"}
            </td>
          </tr>`).join("")}
      </tbody>
    </table></div>`;
}

// Edit User Modal
async function editUser(userId) {
  const userSnap = await getDoc(doc(db, "users", userId));
  if (!userSnap.exists()) return;
  const user = userSnap.data();
  
  document.getElementById("modal-session-title").textContent = `${t("edit_user")}: ${user.name}`;
  document.getElementById("modal-session-body").innerHTML = `
    <div id="edit-user-error" class="alert alert-error hidden"></div>
    <div class="form-group">
      <label class="form-label">${t("name")}</label>
      <input id="edit-user-name" type="text" class="form-input" value="${user.name}">
    </div>
    <div class="form-group">
      <label class="form-label">${t("email_col")}</label>
      <input id="edit-user-email" type="email" class="form-input" value="${user.email}" readonly disabled>
    </div>
    <div class="form-group">
      <label class="form-label">${t("role_col")}</label>
      <select id="edit-user-role" class="form-select">
        <option value="student" ${user.role==="student"?"selected":""}>${t("student")}</option>
        <option value="teacher" ${user.role==="teacher"?"selected":""}>${t("teacher")}</option>
        <option value="admin" ${user.role==="admin"?"selected":""}>${t("admin")}</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">${t("status")}</label>
      <select id="edit-user-status" class="form-select">
        <option value="active" ${user.status==="active"?"selected":""}>Active</option>
        <option value="pending" ${user.status==="pending"?"selected":""}>Pending</option>
        <option value="rejected" ${user.status==="rejected"?"selected":""}>Rejected</option>
      </select>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:1rem">
      <button class="btn btn-outline" onclick="closeModal('modal-session')">${t("cancel")}</button>
      <button class="btn btn-primary" onclick="saveUserEdit('${userId}')">${t("save")}</button>
    </div>
  `;
  showModal("modal-session");
}

async function saveUserEdit(userId) {
  const name = document.getElementById("edit-user-name")?.value.trim();
  const role = document.getElementById("edit-user-role")?.value;
  const status = document.getElementById("edit-user-status")?.value;
  const errEl = document.getElementById("edit-user-error");
  
  if (!name) {
    if (errEl) errEl.textContent = currentLang==="ar"?"الاسم مطلوب":"Name is required";
    if (errEl) errEl.classList.remove("hidden");
    return;
  }
  
  try {
    await updateDoc(doc(db, "users", userId), {
      name: name,
      role: role,
      status: status,
      avatar: name[0].toUpperCase(),
      updatedAt: serverTimestamp()
    });
    await addDoc(collection(db,"audit_logs"), {
      userId: currentUser.uid,
      action: "USER_UPDATED",
      target: `User:${userId}`,
      timestamp: serverTimestamp()
    });
    showToast(t("user_updated"), "success");
    closeModal("modal-session");
    switchAdminTab("users");
  } catch(e) {
    if (errEl) {
      errEl.textContent = e.message;
      errEl.classList.remove("hidden");
    }
  }
}

// Delete User Function
async function deleteUser(userId) {
  if (!currentUser || userProfile?.role !== "admin") {
    showToast("Unauthorized action", "error");
    return;
  }
  
  if (userId === currentUser.uid) {
    showToast(currentLang==="ar"?"لا يمكنك حذف حسابك الخاص":"You cannot delete your own account", "warning");
    return;
  }
  
  const confirmDelete = confirm(t("delete_confirm"));
  if (!confirmDelete) return;
  
  try {
    // Delete user from Firestore
    await deleteDoc(doc(db, "users", userId));
    
    // Also delete user's bookings? Optional - you might want to keep them
    const userBookings = await getDocs(query(collection(db,"bookings"), where("studentId","==",userId)));
    for (const booking of userBookings.docs) {
      // Optional: mark as deleted or delete
      await deleteDoc(doc(db, "bookings", booking.id));
    }
    
    await addDoc(collection(db, "audit_logs"), {
      userId: currentUser.uid,
      action: "USER_DELETED",
      target: `User:${userId}`,
      timestamp: serverTimestamp()
    });
    
    showToast(t("user_deleted"), "success");
    // Refresh the admin users/teachers tab
    if (adminTab === "teachers") switchAdminTab("teachers");
    else if (adminTab === "users") switchAdminTab("users");
  } catch(e) {
    console.error("Error deleting user:", e);
    showToast(e.message || "Error deleting user", "error");
  }
}

async function renderAdminSessions(container) {
  const sessions = await fetchSessions();
  container.innerHTML = `
    <div class="section-header"><div class="section-title">${t("all_sessions")}</div></div>
    <div class="table-wrap"><table class="data-table">
      <thead>
        <th>${currentLang==="ar"?"العنوان":"Title"}</th>
        <th>${currentLang==="ar"?"المعلم":"Teacher"}</th>
        <th>${t("date")}</th>
        <th>${t("category")}</th>
        <th>${currentLang==="ar"?"المسجلون":"Enrolled"}</th>
        <th>${t("status")}</th>
      </thead>
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
      <thead>
        <th>${t("student_name")}</th>
        <th>${t("session_name")}</th>
        <th>${t("payment_method")}</th>
        <th>${t("uploaded_at")}</th>
        <th>${t("status")}</th>
      </thead>
      <tbody>
        ${bookings.map(b=>`
          <tr>
            <td class="fw-500">${b.studentName||""}</td>
            <td class="text-muted">${b.sessionTitle||""}</td>
            <td><span class="badge badge-upcoming">${b.paymentMethod||"bank"}</span></td>
            <td class="text-muted text-sm">${b.bookedAt?.toDate?.()?.toLocaleDateString()||""}</td>
            <td><span class="badge ${b.paymentStatus==="approved"?"badge-active":b.paymentStatus==="rejected"?"badge-rejected":"badge-pending"}">${b.paymentStatus||"pending"}</span></td>
          </tr>`).join("")}
      </tbody>
    </table></div>`;
}

// Offers Management
async function renderAdminOffers(container) {
  const offers = await fetchAllOffers();
  container.innerHTML = `
    <div class="section-header">
      <div class="section-title">${t("offers")}</div>
      <button class="btn btn-primary btn-sm" onclick="openOfferModal()">${t("create_offer")}</button>
    </div>
    <div class="table-wrap"><table class="data-table">
      <thead>
        <th>${t("offer_code")}</th>
        <th>${t("offer_discount")}</th>
        <th>${t("offer_start")}</th>
        <th>${t("offer_end")}</th>
        <th>${t("status")}</th>
        <th>${t("actions")}</th>
      </thead>
      <tbody>
        ${offers.length ? offers.map(o=>`
          <tr>
            <td class="fw-600" style="color:var(--gold)">${o.code}</td>
            <td>${o.discount}%</td>
            <td class="text-muted text-sm">${o.startDate?.toDate?.()?.toLocaleDateString()||o.startDate||""}</td>
            <td class="text-muted text-sm">${o.endDate?.toDate?.()?.toLocaleDateString()||o.endDate||""}</td>
            <td><span class="badge ${o.active?"badge-active":"badge-rejected"}">${o.active?t("offer_active"):t("offer_inactive")}</span></td>
            <td>
              <div style="display:flex;gap:6px">
                <button class="btn btn-primary btn-sm" onclick="toggleOfferStatus('${o.id}', ${!o.active})">${o.active?t("reject"):t("approve")}</button>
                <button class="btn btn-danger btn-sm" onclick="deleteOffer('${o.id}')">🗑️ ${t("delete_user")}</button>
              </div>
            </td>
          </tr>`).join("")
        : `<tr><td colspan="6" style="text-align:center;padding:2rem;color:rgba(201,168,76,.4)">${t("no_data")}</td></tr>`}
      </tbody>
    </table></div>`;
}

async function openOfferModal(offerId = null) {
  let offer = { code: "", discount: 10, startDate: "", endDate: "", active: true };
  if (offerId) {
    const snap = await getDoc(doc(db, "offers", offerId));
    if (snap.exists()) offer = { id: snap.id, ...snap.data() };
  }
  
  document.getElementById("modal-session-title").textContent = offerId ? `${t("edit_user")} ${t("offers")}` : t("create_offer");
  document.getElementById("modal-session-body").innerHTML = `
    <div id="offer-error" class="alert alert-error hidden"></div>
    <div class="form-group">
      <label class="form-label">${t("offer_code")}</label>
      <input id="offer-code" type="text" class="form-input" value="${offer.code}" placeholder="SUMMER25" required>
    </div>
    <div class="form-group">
      <label class="form-label">${t("offer_discount")} (%)</label>
      <input id="offer-discount" type="number" class="form-input" value="${offer.discount}" min="1" max="100" required>
    </div>
    <div class="form-group">
      <label class="form-label">${t("offer_start")}</label>
      <input id="offer-start" type="date" class="form-input" value="${offer.startDate?.toDate?.()?.toISOString().split('T')[0] || offer.startDate || ''}">
    </div>
    <div class="form-group">
      <label class="form-label">${t("offer_end")}</label>
      <input id="offer-end" type="date" class="form-input" value="${offer.endDate?.toDate?.()?.toISOString().split('T')[0] || offer.endDate || ''}">
    </div>
    <div class="form-group">
      <label class="form-label">${t("status")}</label>
      <select id="offer-active" class="form-select">
        <option value="true" ${offer.active?"selected":""}>${t("offer_active")}</option>
        <option value="false" ${!offer.active?"selected":""}>${t("offer_inactive")}</option>
      </select>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:1rem">
      <button class="btn btn-outline" onclick="closeModal('modal-session')">${t("cancel")}</button>
      <button class="btn btn-primary" onclick="saveOffer(${offerId ? `'${offerId}'` : null})">${t("save")}</button>
    </div>
  `;
  showModal("modal-session");
}

async function saveOffer(offerId = null) {
  const code = document.getElementById("offer-code")?.value.trim().toUpperCase();
  const discount = parseInt(document.getElementById("offer-discount")?.value);
  const startDate = document.getElementById("offer-start")?.value;
  const endDate = document.getElementById("offer-end")?.value;
  const active = document.getElementById("offer-active")?.value === "true";
  const errEl = document.getElementById("offer-error");
  
  if (!code || !discount) {
    if (errEl) errEl.textContent = currentLang==="ar"?"يرجى ملء جميع الحقول":"Please fill all fields";
    if (errEl) errEl.classList.remove("hidden");
    return;
  }
  
  try {
    const offerData = {
      code: code,
      discount: discount,
      startDate: startDate ? new Date(startDate) : serverTimestamp(),
      endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30*24*60*60*1000),
      active: active,
      updatedAt: serverTimestamp()
    };
    
    if (offerId) {
      await updateDoc(doc(db, "offers", offerId), offerData);
      showToast(t("offer_updated") || "Offer updated successfully!", "success");
    } else {
      offerData.createdAt = serverTimestamp();
      await addDoc(collection(db, "offers"), offerData);
      showToast(t("offer_created"), "success");
    }
    
    await addDoc(collection(db,"audit_logs"), {
      userId: currentUser.uid,
      action: offerId ? "OFFER_UPDATED" : "OFFER_CREATED",
      target: `Code: ${code}`,
      timestamp: serverTimestamp()
    });
    
    closeModal("modal-session");
    switchAdminTab("offers");
  } catch(e) {
    if (errEl) {
      errEl.textContent = e.message;
      errEl.classList.remove("hidden");
    }
  }
}

async function toggleOfferStatus(offerId, newStatus) {
  try {
    await updateDoc(doc(db, "offers", offerId), { active: newStatus });
    await addDoc(collection(db,"audit_logs"), {
      userId: currentUser.uid,
      action: `OFFER_${newStatus ? "ACTIVATED" : "DEACTIVATED"}`,
      target: `Offer:${offerId}`,
      timestamp: serverTimestamp()
    });
    showToast(`Offer ${newStatus ? "activated" : "deactivated"}`, "success");
    switchAdminTab("offers");
  } catch(e) {
    showToast(e.message, "error");
  }
}

async function deleteOffer(offerId) {
  if (!confirm(currentLang==="ar"?"هل أنت متأكد من حذف هذا العرض؟":"Are you sure you want to delete this offer?")) return;
  try {
    await deleteDoc(doc(db, "offers", offerId));
    await addDoc(collection(db,"audit_logs"), {
      userId: currentUser.uid,
      action: "OFFER_DELETED",
      target: `Offer:${offerId}`,
      timestamp: serverTimestamp()
    });
    showToast(t("offer_deleted"), "success");
    switchAdminTab("offers");
  } catch(e) {
    showToast(e.message, "error");
  }
}

async function renderAdminReports(container) {
  const [users, sessions, bookings, offers] = await Promise.all([fetchAllUsers(), fetchSessions(), fetchAllBookings(), fetchAllOffers()]);
  const catCount = {};
  sessions.forEach(s => { catCount[s.category||"Other"] = (catCount[s.category||"Other"]||0)+1; });
  const totalSess = sessions.length || 1;
  const revenue = bookings.filter(b=>b.paymentStatus==="approved").reduce((sum,b)=>sum+(b.finalPrice||b.originalPrice||0),0);
  
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
        { label:t("revenue"), value:`${t("price_label")} ${revenue.toFixed(2)}`, icon:"💰" },
        { label:t("offers"), value:offers.length, icon:"🏷️" },
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
      <thead>
        <th>${currentLang==="ar"?"الإجراء":"Action"}</th>
        <th>${currentLang==="ar"?"الهدف":"Target"}</th>
        <th>${currentLang==="ar"?"التفاصيل":"Details"}</th>
        <th>${currentLang==="ar"?"المستخدم":"User"}</th>
        <th>${currentLang==="ar"?"التوقيت":"Timestamp"}</th>
      </thead>
      <tbody>
        ${logs.length ? logs.slice(0,100).map(l=>`
          <tr>
            <td><code style="font-size:11.5px;background:rgba(9,30,18,.5);padding:2px 8px;border-radius:4px;color:var(--emerald-light)">${l.action}</code></td>
            <td class="text-sm">${l.target||""}
