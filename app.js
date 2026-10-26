/* جسور: موقع ثابت (HTML + CSS + JS) متصل بقاعدة بيانات Supabase.
   تنبيه: لم يُختبر هذا الكود على بيئة حقيقية بعد. املأ الإعدادات أدناه، ثم ارفع الملفات الثلاثة.
   الحماية الفعلية للبيانات تتم في قاعدة البيانات (RLS)، وليس بإخفاء الأزرار هنا. */
(function () {
"use strict";

// ================= الإعدادات (املأها قبل الرفع) =================
const CONFIG = {
  SUPABASE_URL: "",        // مثال: https://xxxx.supabase.co
  SUPABASE_ANON_KEY: "",   // المفتاح العام (anon public) من Project Settings > API
  // لا تفعّل عملة للدفع قبل أن تتوفر لها وسيلة دفع فعلية
  PAYABLE: { EG: true, SA: false, INT: false },
  // تعليمات التحويل التي تظهر للطالب بعد الحجز (لكل سوق)
  PAY_INSTRUCTIONS: { EG: "", SA: "", INT: "" }
};

// ================= بيانات ثابتة =================
const MARKETS = {
  EG: { cur: "EGP", sym: "ج.م", name: "مصر • جنيه" },
  SA: { cur: "SAR", sym: "ر.س", name: "السعودية • ريال" },
  INT: { cur: "USD", sym: "$", name: "دولي • دولار" }
};
// أسعار الاحتياط (المعتمدة). تُستبدل بأسعار قاعدة البيانات عند توفرها
const FALLBACK = { EG: [1499, 2799, 3899, 4799], SA: [399, 749, 1049, 1299], INT: [49, 89, 129, 159] };
const PKGS = [
  { name: "باقة البداية", s: 4, f: ["تحفيظ ومراجعة", "تقييم مستوى الطالب", "خطة حفظ أولية"] },
  { name: "باقة الاستمرار", s: 8, f: ["تحفيظ جديد ومراجعة تراكمية", "متابعة مستوى الطالب", "تقرير دوري لولي الأمر عند اشتراك الأطفال"] },
  { name: "باقة الإنجاز", s: 12, f: ["خطة حفظ أكثر كثافة", "مراجعة دورية لما سبق حفظه", "متابعة منتظمة للتقدم"] },
  { name: "باقة الإتقان", s: 16, f: ["برنامج مكثف للحفظ والمراجعة", "خطة تقدم فردية", "تقييم شهري للمستوى"] }
];
const PROGRAMS = { new_memorization: "حفظ جديد", revision: "مراجعة المحفوظ", tajweed: "التجويد", recitation_correction: "تصحيح التلاوة" };
const LANGS = { ar: "العربية", en: "English", fr: "Français" };
const GRADES = { excellent: "ممتاز", very_good: "جيد جدًا", good: "جيد", needs_review: "يحتاج مراجعة" };
const ATT = { attended: "حضر", student_absent: "غاب الطالب", teacher_absent: "غاب المعلم", disconnected: "انقطع الاتصال" };
const STATUS = { pending_payment: ["بانتظار الدفع", "wait"], confirmed: ["مؤكدة", "ok"], completed: ["مكتملة", "ok"], cancelled: ["ملغاة", "bad"], disputed: ["محل نزاع", "dis"] };
const PAYST = { pending: "بانتظار إثبات التحويل", proof_submitted: "بانتظار تأكيد الإدارة", held: "تم الاستلام", released: "سُوّيت", refunded: "مستردة" };
const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]; // ترتيب getDay()
const DAY_ORDER = [6, 0, 1, 2, 3, 4, 5];
const TZ = (Intl.DateTimeFormat().resolvedOptions().timeZone) || "UTC";
const MEET_RE = /^https:\/\/([a-z0-9-]+\.)?(zoom\.us|zoom\.com|meet\.google\.com)\/\S+$/i;

const S = { sb: null, user: null, profile: null, tp: null, market: "EG", catalog: null, catalogDb: false, cur: null };
try { const m = localStorage.getItem("jm"); if (MARKETS[m]) S.market = m; } catch (e) {}

// ================= أدوات =================
const $ = (s, r) => (r || document).querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = (x, d) => Number(x).toLocaleString("en-US", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
const money = (m, x, d) => MARKETS[m].sym === "$" ? "$" + num(x, d) : num(x, d) + " " + MARKETS[m].sym;
const mkOfCur = cur => Object.keys(MARKETS).find(k => MARKETS[k].cur === cur) || "EG";
const moneyCur = (cur, x, d) => money(mkOfCur(cur), x, d);
const app = () => $("#app");
const pad = n => String(n).padStart(2, "0");
const loading = () => '<div class="wrap sec muted">جارٍ التحميل...</div>';
const fmtDT = iso => new Date(iso).toLocaleString("ar-EG", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" });
const fmtD = iso => new Date(iso).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" });
const fmtT = d => d.toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" });
const fmtDay = d => d.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" });
const chip = (t, c) => '<span class="chip ' + (c || "") + '">' + esc(t) + "</span>";
const avatar = '<div class="av"><svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="#A5BFB1"/><path d="M4 21c0-5 3.6-8 8-8s8 3 8 8z" fill="#A5BFB1"/></svg></div>';

function toast(msg, type) {
  const t = document.createElement("div");
  t.className = "toast " + (type || ""); t.setAttribute("role", "status"); t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 4500);
}
function must(res) {
  if (res && res.error) { const e = new Error(res.error.message); e.code = res.error.code; throw e; }
  return res ? res.data : null;
}
async function run(fn) {
  try { await fn(); } catch (e) {
    console.error(e);
    toast(e.code === "23P01" ? "هذا الموعد لم يعد متاحًا، اختر موعدًا آخر." : (e.message || "حدث خطأ"), "bad");
  }
}
function needDb() {
  if (S.sb) return false;
  app().innerHTML = '<div class="wrap sec"><div class="card"><h2>الموقع غير مربوط بقاعدة البيانات بعد</h2><p class="muted" style="margin-top:8px">افتح الملف app.js وأضف رابط Supabase والمفتاح العام في أعلاه.</p></div></div>';
  return true;
}
function requireLogin() {
  if (needDb()) return false;
  if (!S.user) { location.hash = "#/login"; return false; }
  return true;
}

// تحويل وقت محلي في منطقة زمنية إلى لحظة UTC
function tzOffsetMs(date, tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(date).map(x => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - date.getTime();
}
function zonedToUtc(y, m, d, hh, mm, tz) {
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const off1 = tzOffsetMs(new Date(guess), tz);
  const off2 = tzOffsetMs(new Date(guess - off1), tz);
  return new Date(guess - off2);
}

// ================= الباقات والأسعار =================
async function loadCatalog(force) {
  if (S.catalog && !force) return S.catalog;
  const cat = { EG: [], SA: [], INT: [] }; let ok = false;
  if (S.sb) {
    try {
      const pk = must(await S.sb.from("packages").select("id,name,sessions_per_month,features,sort_order").eq("active", true).order("sort_order"));
      const pp = must(await S.sb.from("package_prices").select("package_id,market,price").eq("status", "approved"));
      if (pk.length && pp.length) {
        pk.forEach(p => Object.keys(cat).forEach(m => {
          const r = pp.find(x => x.package_id === p.id && x.market === m);
          if (r) cat[m].push({ id: p.id, name: p.name, s: p.sessions_per_month, price: Number(r.price), f: p.features || [] });
        }));
        ok = true;
      }
    } catch (e) { console.warn(e); }
  }
  if (!ok) Object.keys(cat).forEach(m => PKGS.forEach((p, i) => cat[m].push({ id: null, name: p.name, s: p.s, price: FALLBACK[m][i], f: p.f })));
  S.catalog = cat; S.catalogDb = ok; return cat;
}
function pkgBlock(cat) {
  const m = S.market, list = cat[m], base = list.length ? list[0].price / list[0].s : 0;
  const tabs = Object.keys(MARKETS).map(k => '<button class="tab" data-act="market" data-m="' + k + '" aria-pressed="' + (k === m) + '">' + MARKETS[k].name + "</button>").join("");
  const cards = list.map((p, i) => {
    const per = p.price / p.s;
    const sav = i === 0 ? "سعر الحصة الأعلى بين الباقات، وهو أساس المقارنة" : "توفير " + num((1 - per / base) * 100, 1) + "% في سعر الحصة مقارنة بأول باقة";
    return '<div class="card pk"><h3>' + esc(p.name) + '</h3><div class="price" style="margin-top:8px">' + money(m, p.price) + ' <span class="muted small" style="font-weight:400">/ شهريًا</span></div>' +
      '<p style="margin-top:8px;font-weight:600">' + p.s + " حصص • كل حصة 60 دقيقة</p>" +
      '<p class="gold small">سعر الحصة: ' + money(m, per, 2) + '</p><p class="muted small">إجمالي الاشتراك الشهري: ' + money(m, p.price) + '</p><p class="save">' + sav + "</p>" +
      "<ul>" + p.f.map(x => "<li>" + esc(x) + "</li>").join("") + '</ul><a class="btn block" href="#/teachers">اشترك في الباقة</a></div>';
  }).join("");
  const pay = CONFIG.PAYABLE[m] ? "" : '<p class="muted small" style="margin-top:12px">الدفع بهذه العملة غير مفعّل بعد، وستظهر طرق الدفع عند تفعيله.</p>';
  return '<div class="tabsbar" style="justify-content:center">' + tabs + '</div><div class="grid g4">' + cards + "</div>" + pay +
    '<p class="muted small" style="margin-top:14px">أسعار كل سوق مستقلة وثابتة، ولا تُحوَّل تلقائيًا بين العملات. ترى الإجمالي النهائي قبل تأكيد الحجز.</p>';
}
async function refreshPackages() {
  const cat = await loadCatalog();
  document.querySelectorAll(".pk-wrap").forEach(el => { el.innerHTML = pkgBlock(cat); });
}
const FAQS = [
  ["كيف أعرف أن المعلم مُجاز؟", "نراجع الهوية وسند الإجازة يدويًا قبل ظهور المعلم في نتائج البحث."],
  ["كيف تُسوّى مستحقات المعلم؟", "تُسوَّى مستحقات المعلم بعد إتمام الحصة وتسجيلها وفق سياسة التسوية المعلنة. [مدة التسوية]"],
  ["ماذا أحتاج لحضور الحصة؟", "جهاز بكاميرا وميكروفون، وتطبيق زوم أو جوجل ميت (أو المتصفح). يظهر زر «انضم إلى الحصة» في لوحتك قبل الموعد بعشر دقائق."],
  ["التجديد التلقائي", "يتجدد اشتراكك تلقائيًا كل شهر، ولا يتغير سعر اشتراكك القائم أثناء مدته، وتُبلَّغ بأي تعديل قبل التجديد."],
  ["الحصص غير المستخدمة", "تنتهي الحصص غير المستخدمة بانتهاء مدة الاشتراك. سياسة الترحيل: [تُحدَّد قبل الإطلاق]."],
  ["الإلغاء والاسترداد", "[تُحدَّد سياسة الإلغاء والاسترداد وتُنشر في صفحة السياسات قبل الإطلاق]."]
];

// ================= الصفحات العامة =================
async function home() {
  const cat = await loadCatalog();
  const steps = [["أنشئ حسابك", "بحساب جوجل في ثوانٍ.", "var(--green)"], ["اختر معلمك", "قارن الإجازات والتقييمات.", "var(--gold)"], ["احجز وادفع", "اختر الموعد وأكمل الدفع.", "#3E9B76"], ["انضم للحصة", "بضغطة زر على زوم أو جوجل ميت.", "#C9824A"]];
  app().innerHTML =
    '<section class="wrap hero"><div class="verse">اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ</div><p class="muted small center">سورة العلق، الآية 1</p>' +
    '<div class="two"><div><span class="pill">حصص فردية مع معلمين مُجازين</span><h1>احفظ كتاب الله مع معلم <span class="gold">مُجاز</span>، من أي مكان</h1>' +
    '<p class="sub">نربطك بمعلم أو معلمة من أهل الإجازة، يتابع حفظك ومراجعتك حصةً بعد حصة. للصغار والكبار، بالعربية وبلغات أخرى.</p>' +
    '<div class="btns"><a class="btn lg" href="#/teachers">ابحث عن معلم</a><a class="btn ghost lg" href="#steps" data-scroll="steps">كيف أبدأ؟</a></div></div>' +
    '<div class="emb"><div class="ring"></div><div class="logo-b" role="img" aria-label="شعار جسور"></div></div></div></section>' +
    '<section class="wrap sec" id="steps"><div class="two" style="align-items:start"><div><span class="pill">خطوات بسيطة</span><h2 style="margin-top:12px">خطوات التسجيل في <span class="gold">جسور</span></h2><p class="muted" style="margin-top:8px">أربع خطوات فقط تفصلك عن أول حصة.</p></div><div class="stack">' +
    steps.map((s, i) => '<div class="card step"><b class="n" style="background:' + s[2] + '">' + (i + 1) + "</b><div><b>" + s[0] + '</b><div class="muted">' + s[1] + "</div></div></div>").join("") + "</div></div></section>" +
    '<section class="wrap sec center" id="packages"><span class="pill">اشتراك شهري</span><h2 style="margin:12px 0 8px">باقات <span class="gold">جسور</span> الشهرية</h2><p class="muted" style="margin-bottom:20px">كل حصة مدتها 60 دقيقة. اختر سوقك لترى الأسعار بعملتك، أو احجز حصة واحدة دون اشتراك.</p><div class="pk-wrap">' + pkgBlock(cat) + '</div><p class="muted" style="margin-top:18px">لا تريد الاشتراك؟ <a href="#/teachers">احجز حصة فردية</a></p></section>' +
    '<section class="wrap sec" style="max-width:820px"><h2 class="center" style="margin-bottom:20px">أسئلة <span class="gold">شائعة</span></h2>' + FAQS.map(q => '<details class="faq"><summary>' + esc(q[0]) + "</summary><p>" + esc(q[1]) + "</p></details>").join("") + "</section>" +
    '<section class="wrap sec"><div class="cta"><div><h2 style="font-size:28px">هل أنت معلم قرآن مُجاز؟</h2><p class="muted" style="margin-top:6px">قدّم طلب انضمام، وبعد مراجعة الإدارة لهويتك وإجازتك تظهر للطلاب.</p></div><a class="btn lg" href="#/apply">انضم كمعلم</a></div></section>';
}
async function packagesPage() {
  const cat = await loadCatalog();
  app().innerHTML = '<section class="wrap sec center"><h1 style="font-size:clamp(28px,4vw,44px)">الباقات الشهرية</h1><p class="muted" style="margin:8px 0 20px">كل حصة 60 دقيقة. الاشتراك يتجدد تلقائيًا ويمكنك إيقافه قبل موعد التجديد.</p><div class="pk-wrap">' + pkgBlock(cat) + '</div><div style="max-width:820px;margin:28px auto 0;text-align:start">' + FAQS.slice(3).map(q => '<details class="faq"><summary>' + esc(q[0]) + "</summary><p>" + esc(q[1]) + "</p></details>").join("") + "</div></section>";
}
function policiesPage() {
  app().innerHTML = '<section class="wrap sec" style="max-width:820px"><h1 style="font-size:clamp(28px,4vw,40px)">السياسات</h1><p class="muted" style="margin:8px 0 20px">مسودة تحتاج مراجعة قانونية قبل الإطلاق. البنود بين الأقواس تُحدَّد وتُنشر قبل البدء.</p>' +
    [["الشروط والأحكام", "[تُكتب قبل الإطلاق]"], ["الخصوصية", "نجمع الاسم والبريد الإلكتروني فقط عند تسجيل الدخول بجوجل، ولا نعرض صورة حسابك. لا نسجّل الحصص تلقائيًا. بيانات كل طفل وسجلاته منفصلة ومرتبطة بحساب ولي أمره."], ["حماية الأطفال", "يملك ولي الأمر حساب الطفل ويديره. يُراجع كل معلم هويته وإجازته قبل ظهوره. [تُستكمل السياسة قبل الإطلاق]"], ["الإلغاء والاسترداد", "[تُحدَّد قبل الإطلاق]"], ["ترحيل الحصص وانتهاؤها", "تنتهي الحصص غير المستخدمة بانتهاء مدة الاشتراك. [سياسة الترحيل]"]].map(x => '<div class="card" style="margin-bottom:12px"><h3>' + x[0] + '</h3><p class="muted" style="margin-top:6px">' + x[1] + "</p></div>").join("") + "</section>";
}
function loginPage() {
  if (needDb()) return;
  let intent = "student"; try { intent = localStorage.getItem("jr") || "student"; } catch (e) {}
  app().innerHTML = '<section class="wrap sec" style="max-width:480px"><div class="card center"><div class="logo-b" style="margin:0 auto 12px"></div><h2>مرحبًا بك في جسور</h2><p class="muted" style="margin:6px 0 14px">سجّل دخولك بحساب جوجل في ثوانٍ، دون كلمة مرور جديدة.</p>' +
    '<div class="tabsbar" style="justify-content:center"><button class="tab" data-act="intent" data-v="student" aria-pressed="' + (intent === "student") + '">طالب أو ولي أمر</button><button class="tab" data-act="intent" data-v="teacher" aria-pressed="' + (intent === "teacher") + '">معلم</button></div>' +
    '<p class="muted small" id="hint" style="min-height:48px">' + (intent === "teacher" ? "بعد الدخول تقدّم طلب انضمام وترفع إجازتك، وتراجعه الإدارة قبل ظهورك للطلاب." : "للطلاب وأولياء الأمور. إذا كان الطالب طفلًا، يسجّل ولي الأمر دخوله ثم يضيف الطالب.") + '</p>' +
    '<button class="btn block lg" data-act="google" style="background:#fff;color:#1F1F1F;border-color:#DADCE0">المتابعة عبر جوجل</button><p class="muted small" style="margin-top:14px">نحصل على اسمك وبريدك فقط، ولا نعرض صورة حسابك. بالمتابعة توافق على <a href="#/policies">السياسات</a>.</p></div></section>';
}

// ================= المعلمون =================
async function teachersPage() {
  if (needDb()) return;
  let f = {}; try { f = JSON.parse(sessionStorage.getItem("tf") || "{}"); } catch (e) {}
  const opt = (obj, cur, all) => '<option value="">' + all + "</option>" + Object.keys(obj).map(k => '<option value="' + k + '"' + (cur === k ? " selected" : "") + ">" + obj[k] + "</option>").join("");
  app().innerHTML = '<section class="wrap sec"><h1 style="font-size:clamp(28px,4vw,44px)">اختر معلمك من <span class="gold">أهل الإجازة</span></h1><p class="muted" style="margin:8px 0 20px">كل معلم هنا راجعنا هويته وسند إجازته.</p>' +
    '<form class="card" data-form="tfilter"><div class="form-row"><div><label class="f" for="fc">البلد</label><input id="fc" name="country" value="' + esc(f.country || "") + '" placeholder="الكل"></div>' +
    '<div><label class="f" for="fl">لغة الشرح</label><select id="fl" name="lang">' + opt(LANGS, f.lang, "الكل") + "</select></div>" +
    '<div><label class="f" for="fp">البرنامج</label><select id="fp" name="prog">' + opt(PROGRAMS, f.prog, "الكل") + "</select></div>" +
    '<div><label class="f" for="fg">المعلم</label><select id="fg" name="gender">' + opt({ male: "معلم", female: "معلمة" }, f.gender, "لا يهم") + "</select></div>" +
    '<div><label class="f" for="fr">التقييم</label><select id="fr" name="rating">' + opt({ 4: "4 فأكثر", 4.5: "4.5 فأكثر" }, f.rating, "الكل") + "</select></div></div>" +
    '<button class="btn" style="margin-top:14px">ابحث</button></form><div id="tlist" class="grid g3" style="margin-top:16px"></div></section>';
  await loadTeachers(f);
}
async function loadTeachers(f) {
  const el = $("#tlist"); if (!el) return;
  el.innerHTML = '<p class="muted">جارٍ التحميل...</p>';
  let q = S.sb.from("public_teachers").select("*");
  if (f.country) q = q.ilike("country", "%" + f.country + "%");
  if (f.lang) q = q.contains("languages", [f.lang]);
  if (f.prog) q = q.contains("programs", [f.prog]);
  if (f.gender) q = q.eq("gender", f.gender);
  if (f.rating) q = q.gte("rating_avg", Number(f.rating));
  const rows = must(await q.order("rating_avg", { ascending: false }).limit(60));
  if (!rows.length) { el.innerHTML = '<div class="card" style="grid-column:1/-1"><p class="muted">لا يوجد معلمون معتمدون بحسب اختيارك حاليًا.</p></div>'; return; }
  el.innerHTML = rows.map(t => '<div class="card tcard"><div style="display:flex;gap:14px;align-items:center">' + avatar + "<div><h3>" + esc(t.full_name) + '</h3><div class="muted small">' + esc(t.country || "") + "</div>" + chip("إجازة موثقة", "ok") + "</div></div>" +
    '<div style="display:flex;gap:6px;flex-wrap:wrap">' + (t.programs || []).map(p => chip(PROGRAMS[p] || p)).join("") + (t.languages || []).map(l => chip(LANGS[l] || l)).join("") + "</div>" +
    '<div class="muted small">' + (t.rating_count > 0 ? "★ " + num(t.rating_avg, 1) + " (" + t.rating_count + " تقييم)" : "لا تقييمات بعد") + '</div><a class="btn block" href="#/teacher/' + t.user_id + '">الملف الشخصي والحجز</a></div>').join("");
}

// ================= ملف المعلم والحجز =================
const B = { mode: "single", program: "new_memorization", slots: [], slot: null, pkgId: null, picks: [], child: "", single: {}, kids: [], t: null };

async function loadSlots(t) {
  const av = must(await S.sb.from("availability").select("*").eq("teacher_id", t.user_id));
  const busy = must(await S.sb.rpc("teacher_busy", { p_teacher: t.user_id })) || [];
  const tz = t.timezone || "UTC", out = [], now = Date.now(), base = new Date();
  for (let d = 0; d < 14; d++) {
    const day = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + d));
    const y = day.getUTCFullYear(), m = day.getUTCMonth() + 1, dd = day.getUTCDate(), wd = day.getUTCDay();
    av.filter(a => a.weekday === wd).forEach(a => {
      const s = a.start_time.split(":").map(Number), e = a.end_time.split(":").map(Number);
      for (let mins = s[0] * 60 + s[1]; mins + 60 <= e[0] * 60 + e[1]; mins += 60) {
        const st = zonedToUtc(y, m, dd, Math.floor(mins / 60), mins % 60, tz), en = new Date(st.getTime() + 3600000);
        if (st.getTime() < now + 2 * 3600000) continue;
        if (busy.some(b => new Date(b.starts_at) < en && new Date(b.ends_at) > st)) continue;
        out.push({ start: st, end: en });
      }
    });
  }
  return out.sort((a, b) => a.start - b.start);
}
async function teacherProfile(id) {
  if (needDb()) return;
  app().innerHTML = loading();
  const t = must(await S.sb.from("public_teachers").select("*").eq("user_id", id).maybeSingle());
  if (!t) { app().innerHTML = '<div class="wrap sec"><p>لم نجد هذا المعلم.</p><a href="#/teachers">العودة للمعلمين</a></div>'; return; }
  Object.assign(B, { mode: "single", program: (t.programs && t.programs[0]) || "new_memorization", slots: [], slot: null, pkgId: null, picks: [], child: "", single: {}, kids: [], t: t });
  app().innerHTML = '<div class="wrap sec"><p class="muted small" style="margin-bottom:14px"><a href="#/teachers">المعلمون</a> / ' + esc(t.full_name) + '</p><div class="grid" style="grid-template-columns:1fr 400px;align-items:start" id="pgrid">' +
    '<div class="stack"><div class="card"><div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">' + avatar + "<div><h1 style=\"font-size:clamp(26px,4vw,36px)\">" + esc(t.full_name) + "</h1>" + chip("إجازة موثقة", "ok") + " " + chip(t.country || "") + '<p class="muted small" style="margin-top:6px">يشرح بـ ' + (t.languages || []).map(l => LANGS[l] || l).join("، ") + "</p></div></div>" +
    '<p class="muted small" style="margin-top:12px">' + (t.rating_count > 0 ? "★ " + num(t.rating_avg, 1) + " من " + t.rating_count + " تقييم" : "لا تقييمات بعد") + "</p></div>" +
    '<div class="card"><h3>نبذة</h3><p class="muted" style="margin-top:6px">' + (esc(t.bio) || "لم يضف المعلم نبذة بعد.") + '</p><h3 style="margin-top:16px">البرامج</h3><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">' + (t.programs || []).map(p => chip(PROGRAMS[p] || p)).join("") + "</div></div></div>" +
    '<aside class="card" id="book" style="position:sticky;top:84px"></aside></div></div>';
  if (window.matchMedia("(max-width:980px)").matches) $("#pgrid").style.gridTemplateColumns = "1fr";
  S.cur = t;
  if (S.user && S.user.id !== id) {
    $("#book").innerHTML = '<p class="muted">جارٍ تحميل المواعيد...</p>';
    await run(async () => {
      await loadCatalog();
      B.kids = must(await S.sb.from("children").select("*").eq("guardian_id", S.user.id)) || [];
      const sp = must(await S.sb.from("single_session_prices").select("*")) || [];
      sp.forEach(r => { B.single[r.market] = r; });
      B.slots = await loadSlots(t);
    });
  }
  renderBook();
}
function slotsHtml(list, act, isOn) {
  if (!list.length) return '<p class="muted small">لا توجد مواعيد متاحة خلال الأسبوعين القادمين.</p>';
  let out = "", last = "";
  list.forEach(({ s, i }) => {
    const dk = fmtDay(s.start);
    if (dk !== last) { out += '<div class="day">' + dk + '</div><div class="slots">'; last = dk; }
    out += '<button type="button" class="slot" data-act="' + act + '" data-i="' + i + '" aria-pressed="' + isOn(i) + '">' + fmtT(s.start) + "</button>";
    const nxt = list[list.findIndex(x => x.i === i) + 1];
    if (!nxt || fmtDay(nxt.s.start) !== dk) out += "</div>";
  });
  return out;
}
function renderBook() {
  const el = $("#book"), t = B.t; if (!el || !t) return;
  if (!S.sb) { el.innerHTML = '<p class="muted">الحجز غير متاح قبل ربط قاعدة البيانات.</p>'; return; }
  if (!S.user) { el.innerHTML = '<h3>احجز مع ' + esc(t.full_name) + '</h3><p class="muted" style="margin:8px 0 14px">سجّل الدخول بحساب جوجل لعرض المواعيد وإتمام الحجز.</p><a class="btn block" href="#/login" data-next="#/teacher/' + t.user_id + '">تسجيل الدخول</a>'; return; }
  if (S.user.id === t.user_id) { el.innerHTML = '<p class="muted">هذا ملفك الشخصي.</p>'; return; }
  const m = S.market, cur = MARKETS[m].cur, payable = CONFIG.PAYABLE[m], cat = S.catalog[m];
  const head = '<h3 style="font-size:22px">ابدأ مع ' + esc(t.full_name) + '</h3><div class="tabsbar">' + Object.keys(MARKETS).map(k => '<button class="tab sm" data-act="market" data-m="' + k + '" aria-pressed="' + (k === m) + '">' + MARKETS[k].name + "</button>").join("") + "</div>" +
    '<div class="tabsbar" style="margin-top:0"><button class="tab" data-act="mode" data-v="single" aria-pressed="' + (B.mode === "single") + '">حصة فردية</button><button class="tab" data-act="mode" data-v="pkg" aria-pressed="' + (B.mode === "pkg") + '">باقة شهرية</button></div>';
  const kids = B.kids.length ? '<label class="f" for="kid">الطالب</label><select id="kid" data-chg="child"><option value="">أنا</option>' + B.kids.map(k => '<option value="' + k.id + '"' + (B.child === k.id ? " selected" : "") + ">" + esc(k.full_name) + "</option>").join("") + "</select>" : "";
  const nopay = payable ? "" : '<p class="err">الدفع بهذه العملة غير مفعّل بعد.</p>';
  const tzNote = '<p class="muted small" style="margin-top:8px">المواعيد بتوقيتك المحلي (' + esc(TZ) + ")، ومدة الحصة 60 دقيقة.</p>";
  let body = "";
  if (B.mode === "single") {
    const sp = B.single[m], all = B.slots.map((s, i) => ({ s, i }));
    body = '<div class="day">البرنامج</div><div class="slots">' + Object.keys(PROGRAMS).map(k => '<button type="button" class="slot" data-act="prog" data-v="' + k + '" aria-pressed="' + (B.program === k) + '">' + PROGRAMS[k] + "</button>").join("") + "</div>" + slotsHtml(all, "slot", i => B.slot === i) + kids + tzNote +
      '<div class="sum"><div><span>سعر الحصة</span><b>' + (sp ? moneyCur(sp.currency, sp.price) : "لم يُحدَّد بعد") + "</b></div><div><span>رسوم الدفع والضرائب</span><b>[المعتمدة، إن وُجدت]</b></div><div class=\"tot\"><span>الإجمالي</span><b>" + (sp ? moneyCur(sp.currency, sp.price) + " + الرسوم" : "—") + "</b></div></div>" + nopay +
      '<button class="btn block" style="margin-top:14px" data-act="book-single"' + (payable && sp && B.slot !== null ? "" : " disabled") + ">تأكيد الحجز والدفع</button><p class=\"muted small\" style=\"margin-top:10px\">لا تحتاج إلى اشتراك. تُسوَّى مستحقات المعلم بعد إتمام الحصة وتسجيلها.</p>";
  } else {
    const pkg = cat.find(p => p.id === B.pkgId), need = pkg ? pkg.s / 4 : 0, week = B.slots.map((s, i) => ({ s, i })).filter(x => x.s.start.getTime() < Date.now() + 7 * 86400000);
    body = '<div class="day">الباقة</div><div class="slots">' + cat.map(p => '<button type="button" class="slot" data-act="pkg" data-id="' + (p.id || "") + '" aria-pressed="' + (B.pkgId === p.id && p.id !== null) + '">' + esc(p.name.replace("باقة ", "")) + " • " + money(m, p.price) + "</button>").join("") + "</div>" +
      (pkg ? '<p class="muted small">' + pkg.s + " حصص شهريًا. اختر " + need + " موعد(ًا) أسبوعيًا ثابتًا (" + B.picks.length + "/" + need + "):</p>" + slotsHtml(week, "pick", i => B.picks.includes(i)) : '<p class="muted small">اختر باقة أولًا.</p>') + kids + tzNote +
      (pkg ? '<div class="sum"><div><span>سعر الباقة</span><b>' + money(m, pkg.price) + '</b></div><div><span>سعر الحصة</span><b>' + money(m, pkg.price / pkg.s, 2) + "</b></div><div><span>رسوم الدفع والضرائب</span><b>[المعتمدة، إن وُجدت]</b></div><div class=\"tot\"><span>الإجمالي</span><b>" + money(m, pkg.price) + " + الرسوم</b></div></div>" : "") + nopay +
      '<button class="btn block" style="margin-top:14px" data-act="book-sub"' + (payable && pkg && pkg.id && B.picks.length === need ? "" : " disabled") + ">ابدأ الاشتراك</button><p class=\"muted small\" style=\"margin-top:10px\">يتجدد تلقائيًا كل شهر، ولا يتغير سعر اشتراكك القائم أثناء مدته. تنتهي الحصص غير المستخدمة بانتهاء الاشتراك.</p>";
  }
  el.innerHTML = head + body + '<p class="muted small" style="margin-top:12px">لا نعرض عملة للدفع إلا إذا كانت مفعّلة.</p>';
}
async function bookSingle() {
  const t = B.t, m = S.market, sp = B.single[m], sl = B.slots[B.slot];
  if (!sp || !sl || !CONFIG.PAYABLE[m]) throw new Error("لا يمكن إتمام الحجز الآن.");
  const key = "bk:" + t.user_id + ":" + sl.start.toISOString();
  const idem = sessionStorage.getItem(key) || crypto.randomUUID(); sessionStorage.setItem(key, idem);
  const bk = must(await S.sb.from("bookings").insert({ student_id: S.user.id, teacher_id: t.user_id, program: B.program, starts_at: sl.start.toISOString(), ends_at: sl.end.toISOString(), price: sp.price, currency: sp.currency, child_id: B.child || null }).select().single());
  must(await S.sb.from("payments").insert({ booking_id: bk.id, amount: sp.price, currency: sp.currency, method: "manual_transfer", idempotency_key: idem }));
  sessionStorage.removeItem(key);
  toast("تم إنشاء الحجز. أكمل الدفع وارفع إثبات التحويل من لوحتك.", "ok"); location.hash = "#/student";
}
async function bookSub() {
  const t = B.t, m = S.market, pkg = S.catalog[m].find(p => p.id === B.pkgId);
  if (!pkg || !pkg.id || B.picks.length !== pkg.s / 4 || !CONFIG.PAYABLE[m]) throw new Error("أكمل اختيار الباقة والمواعيد أولًا.");
  const picked = B.picks.map(i => B.slots[i].start).sort((a, b) => a - b);
  const weekly = picked.map(d => ({ weekday: d.getDay(), time: pad(d.getHours()) + ":" + pad(d.getMinutes()) }));
  const d0 = picked[0], startsOn = d0.getFullYear() + "-" + pad(d0.getMonth() + 1) + "-" + pad(d0.getDate());
  const key = "sb:" + t.user_id + ":" + pkg.id + ":" + JSON.stringify(weekly);
  const idem = sessionStorage.getItem(key) || crypto.randomUUID(); sessionStorage.setItem(key, idem);
  const sub = must(await S.sb.from("subscriptions").insert({ student_id: S.user.id, teacher_id: t.user_id, package_id: pkg.id, weekly_slots: weekly, student_timezone: TZ, starts_on: startsOn, market: m, price: pkg.price, currency: MARKETS[m].cur, sessions_total: pkg.s, child_id: B.child || null }).select().single());
  must(await S.sb.from("payments").insert({ subscription_id: sub.id, amount: pkg.price, currency: MARKETS[m].cur, method: "manual_transfer", idempotency_key: idem }));
  sessionStorage.removeItem(key);
  toast("تم إنشاء الاشتراك. أكمل الدفع وارفع إثبات التحويل من لوحتك.", "ok"); location.hash = "#/student";
}

// ================= لوحات المستخدمين =================
const card = (title, inner) => '<div class="card"><h3 style="margin-bottom:8px">' + title + "</h3>" + inner + "</div>";
const rowH = (l, r) => '<div class="row"><div>' + l + "</div><div>" + (r || "") + "</div></div>";
const stChip = s => STATUS[s] ? chip(STATUS[s][0], STATUS[s][1]) : chip(s);

async function studentDash() {
  if (!requireLogin()) return;
  app().innerHTML = loading();
  const uid = S.user.id;
  const r = await Promise.all([
    S.sb.from("bookings").select("*").eq("student_id", uid).order("starts_at"),
    S.sb.from("subscriptions").select("*").eq("student_id", uid).order("created_at", { ascending: false }),
    S.sb.from("payments").select("*").order("created_at", { ascending: false }),
    S.sb.from("children").select("*").eq("guardian_id", uid).order("created_at"),
    S.sb.from("packages").select("id,name")]);
  const BK = must(r[0]), SU = must(r[1]), KD = must(r[3]), PK = must(r[4]);
  const mineB = new Set(BK.map(x => x.id)), mineS = new Set(SU.map(x => x.id));
  const PY = must(r[2]).filter(p => mineB.has(p.booking_id) || mineS.has(p.subscription_id));
  const ids = [...new Set(BK.map(x => x.teacher_id).concat(SU.map(x => x.teacher_id)))], names = {};
  if (ids.length) must(await S.sb.from("public_teachers").select("user_id,full_name").in("user_id", ids)).forEach(x => { names[x.user_id] = x.full_name; });
  const kid = {}; KD.forEach(k => { kid[k.id] = k.full_name; });
  const now = Date.now(), up = BK.filter(b => ["pending_payment", "confirmed"].includes(b.status) && new Date(b.ends_at) > now), past = BK.filter(b => !up.includes(b)).reverse();
  const line = b => "<b>" + fmtDT(b.starts_at) + '</b><div class="muted small">' + esc(names[b.teacher_id] || "") + " • " + (PROGRAMS[b.program] || "") + (b.child_id ? " • " + esc(kid[b.child_id] || "") : "") + "</div>";
  const upH = up.length ? up.map(b => rowH(line(b), stChip(b.status) + (b.status === "confirmed" ? ' <button class="btn sm" data-act="join" data-id="' + b.id + '">انضم إلى الحصة</button>' : "") + ' <button class="btn ghost sm" data-act="cancel" data-id="' + b.id + '">إلغاء</button>')).join("") : '<p class="muted">لا توجد حصص قادمة. <a href="#/teachers">ابحث عن معلم</a></p>';
  const pastH = past.length ? past.map(b => rowH(line(b), stChip(b.status) + (["completed", "confirmed"].includes(b.status) ? ' <button class="btn ghost sm" data-act="dispute" data-id="' + b.id + '">شكوى</button>' : ""))).join("") : '<p class="muted">لا يوجد سجل بعد.</p>';
  const pk = {}; PK.forEach(p => { pk[p.id] = p.name; });
  const subH = SU.length ? SU.map(s => rowH("<b>" + esc(pk[s.package_id] || "اشتراك") + '</b><div class="muted small">' + esc(names[s.teacher_id] || "") + " • المستخدم " + s.sessions_used + " من " + (s.sessions_total || "—") + (s.period_end ? " • ينتهي " + fmtD(s.period_end) : "") + "</div>", chip(s.status === "active" ? "نشط" : s.status === "pending_payment" ? "بانتظار الدفع" : s.status, s.status === "active" ? "ok" : "wait") + ' <button class="btn ghost sm" data-act="renew" data-id="' + s.id + '" data-v="' + (s.auto_renew ? 0 : 1) + '">' + (s.auto_renew ? "إيقاف التجديد" : "تفعيل التجديد") + "</button>")).join("") : '<p class="muted">لا توجد اشتراكات.</p>';
  const payH = PY.length ? PY.map(p => {
    const open = ["pending", "proof_submitted"].includes(p.status);
    const ins = open ? '<div class="muted small" style="margin-top:6px">' + esc(CONFIG.PAY_INSTRUCTIONS[mkOfCur(p.currency)] || "[تعليمات التحويل تُضاف من إعدادات الموقع]") + '</div><label class="f">ارفع إثبات التحويل (صورة أو PDF)</label><input type="file" accept="image/*,application/pdf" data-chg="proof" data-id="' + p.id + '">' : "";
    return '<div class="row" style="display:block"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><b>' + moneyCur(p.currency, p.amount) + "</b>" + chip(PAYST[p.status] || p.status, p.status === "pending" || p.status === "proof_submitted" ? "wait" : "ok") + '</div><div class="muted small">' + fmtD(p.created_at) + "</div>" + ins + "</div>";
  }).join("") : '<p class="muted">لا توجد مدفوعات.</p>';
  const kidH = KD.map(k => rowH(esc(k.full_name), chip(k.gender === "female" ? "أنثى" : k.gender === "male" ? "ذكر" : ""))).join("") +
    '<form data-form="kid" class="form-row" style="margin-top:12px"><div><label class="f" for="kn">اسم الابن</label><input id="kn" name="name" required></div><div><label class="f" for="kg">الجنس</label><select id="kg" name="gender"><option value="male">ذكر</option><option value="female">أنثى</option></select></div><div style="align-self:end"><button class="btn">إضافة</button></div></form>';
  app().innerHTML = '<section class="wrap sec stack"><h1 style="font-size:clamp(26px,4vw,38px)">أهلًا ' + esc((S.profile && S.profile.full_name) || "") + '</h1><p class="muted small">المواعيد بتوقيتك المحلي (' + esc(TZ) + "). زر الانضمام يعمل قبل الموعد بعشر دقائق.</p>" +
    card("الحصص القادمة", upH + '<p class="muted small" style="margin-top:8px">لإعادة الجدولة: ألغِ الحجز ثم احجز موعدًا جديدًا.</p>') + card("اشتراكاتي", subH) + card("المدفوعات", payH) + card("أبنائي", '<p class="muted small" style="margin-bottom:8px">بيانات كل ابن وسجلاته منفصلة، ويظهر اسمه عند الحجز.</p>' + kidH) + card("سجل الحصص", pastH) + "</section>";
}

async function teacherDash() {
  if (!requireLogin()) return;
  if (!S.tp) { location.hash = "#/apply"; return; }
  if (S.tp.status !== "approved") { app().innerHTML = '<section class="wrap sec" style="max-width:640px"><div class="card"><h2>طلبك ' + (S.tp.status === "pending" ? "قيد المراجعة" : S.tp.status === "rejected" ? "لم يُقبل" : "موقوف") + '</h2><p class="muted" style="margin-top:8px">' + (S.tp.status === "pending" ? "تراجع الإدارة هويتك وإجازتك، وسنُظهر ملفك للطلاب فور الاعتماد." : "تواصل مع الإدارة لمعرفة التفاصيل.") + "</p></div></section>"; return; }
  app().innerHTML = loading();
  const uid = S.user.id;
  const r = await Promise.all([
    S.sb.from("teacher_meeting_links").select("*").eq("teacher_id", uid).maybeSingle(),
    S.sb.from("availability").select("*").eq("teacher_id", uid),
    S.sb.from("teacher_lessons").select("*").order("starts_at", { ascending: false }).limit(60),
    S.sb.from("teacher_balance").select("*"),
    S.sb.from("payouts").select("*").order("requested_at", { ascending: false }).limit(15)]);
  const lnk = must(r[0]), av = must(r[1]), L = must(r[2]), bal = must(r[3]), po = must(r[4]);
  const now = Date.now(), up = L.filter(b => ["pending_payment", "confirmed"].includes(b.status) && new Date(b.ends_at) > now).reverse(), done = L.filter(b => !up.includes(b));
  const eligible = L.filter(b => b.status === "confirmed" && new Date(b.starts_at) < now);
  const avH = av.sort((a, b) => DAY_ORDER.indexOf(a.weekday) - DAY_ORDER.indexOf(b.weekday) || a.start_time.localeCompare(b.start_time)).map(a => rowH("<b>" + DAYS[a.weekday] + '</b> <span class="muted">' + a.start_time.slice(0, 5) + " – " + a.end_time.slice(0, 5) + "</span>", '<button class="btn ghost sm" data-act="delav" data-id="' + a.id + '">حذف</button>')).join("") || '<p class="muted">لم تضف مواعيد بعد، ولن يستطيع الطلاب الحجز معك.</p>';
  const lh = b => "<b>" + fmtDT(b.starts_at) + '</b><div class="muted small">' + esc(b.student_name || "") + " • " + (PROGRAMS[b.program] || "") + "</div>";
  const balH = bal.length ? bal.map(b => rowH("<b>" + b.currency + '</b><div class="muted small">قيد التسوية: ' + moneyCur(b.currency, b.settling || 0) + " • إجمالي ما كسبته: " + moneyCur(b.currency, b.total_earned || 0) + "</div>", "<b>" + moneyCur(b.currency, b.available || 0) + '</b> <button class="btn sm" data-act="payout" data-c="' + b.currency + '"' + (Number(b.available || 0) > 0 ? "" : " disabled") + ">اطلب السحب</button>")).join("") : '<p class="muted">لا أرباح بعد. تُحتسب الأرباح بعد إنهاء الحصة وتسجيل حضورها.</p>';
  app().innerHTML = '<section class="wrap sec stack"><h1 style="font-size:clamp(26px,4vw,38px)">لوحة المعلم</h1><p class="muted small">مواعيدك بتوقيت ' + esc((S.profile && S.profile.timezone) || TZ) + "، وتظهر لكل طالب بتوقيته.</p>" +
    card("رابط الحصة (زوم أو جوجل ميت)", '<form data-form="link"><label class="f" for="lk">رابط غرفتك الدائم</label><input id="lk" name="url" type="url" dir="ltr" required placeholder="https://zoom.us/j/...  أو  https://meet.google.com/..." value="' + esc(lnk ? lnk.url : "") + '"><p class="muted small" style="margin-top:6px">يظهر للطالب زر الانضمام قبل الموعد بعشر دقائق. فعّل غرفة الانتظار أو كلمة المرور، خاصة مع الأطفال.</p><button class="btn" style="margin-top:10px">احفظ الرابط</button></form>') +
    card("الحصص القادمة", up.length ? up.map(b => rowH(lh(b), stChip(b.status))).join("") : '<p class="muted">لا توجد حصص قادمة.</p>') +
    card("سجّل الحصة", eligible.length ? '<form data-form="log"><label class="f" for="lb">الحصة</label><select id="lb" name="booking">' + eligible.map(b => '<option value="' + b.id + '">' + fmtDT(b.starts_at) + " • " + esc(b.student_name || "") + "</option>").join("") + '</select><label class="f" for="la">الحضور</label><select id="la" name="attendance">' + Object.keys(ATT).map(k => '<option value="' + k + '">' + ATT[k] + "</option>").join("") + '</select><label class="f" for="lm">الورد المحفوظ</label><input id="lm" name="range" placeholder="السورة والآيات"><label class="f" for="lr">ما يحتاج مراجعة</label><input id="lr" name="review"><label class="f" for="lg">التقدير</label><select id="lg" name="grade"><option value="">—</option>' + Object.keys(GRADES).map(k => '<option value="' + k + '">' + GRADES[k] + "</option>").join("") + '</select><label class="f" for="ln">ملاحظة للطالب أو ولي الأمر</label><textarea id="ln" name="note" rows="2"></textarea><div class="btns" style="margin-top:12px"><button class="btn">احفظ السجل</button><button type="button" class="btn ghost" data-act="complete">أنهِ الحصة واحتسبها</button></div><p class="muted small" style="margin-top:8px">لا تُحتسب الحصة مكتملة إلا بعد انتهاء وقتها وتسجيل الحضور «حضر». الغياب والانقطاع تقرّره الإدارة.</p></form>' : '<p class="muted">لا توجد حصص مؤكدة تحتاج إلى تسجيل.</p>') +
    card("مواعيدي المتاحة", avH + '<form data-form="avail" class="form-row" style="margin-top:12px"><div><label class="f" for="aw">اليوم</label><select id="aw" name="weekday">' + DAY_ORDER.map(d => '<option value="' + d + '">' + DAYS[d] + "</option>").join("") + '</select></div><div><label class="f" for="as">من</label><input id="as" name="start" type="time" required></div><div><label class="f" for="ae">إلى</label><input id="ae" name="end" type="time" required></div><div style="align-self:end"><button class="btn">إضافة</button></div></form>') +
    card("الأرباح", balH) + card("سجل السحوبات", po.length ? po.map(p => rowH("<b>" + moneyCur(p.currency, p.amount) + '</b><div class="muted small">' + fmtD(p.requested_at) + "</div>", chip({ requested: "قيد المراجعة", approved: "معتمد", paid: "تم التحويل", rejected: "مرفوض" }[p.status] || p.status, p.status === "paid" ? "ok" : "wait"))).join("") : '<p class="muted">لا توجد سحوبات.</p>') +
    card("الحصص السابقة", done.length ? done.map(b => rowH(lh(b), stChip(b.status))).join("") : '<p class="muted">لا يوجد سجل بعد.</p>') + "</section>";
}

async function applyPage() {
  if (!requireLogin()) return;
  if (S.tp) { location.hash = "#/teach"; return; }
  const chk = (name, obj) => '<div class="chk">' + Object.keys(obj).map(k => '<label><input type="checkbox" name="' + name + '" value="' + k + '"> ' + obj[k] + "</label>").join("") + "</div>";
  app().innerHTML = '<section class="wrap sec" style="max-width:680px"><div class="card"><h1 style="font-size:30px">طلب الانضمام كمعلم</h1><p class="muted" style="margin:6px 0 10px">تراجع الإدارة هويتك وإجازتك وسندك قبل ظهورك للطلاب.</p><form data-form="apply">' +
    '<label class="f" for="an">الاسم الكامل</label><input id="an" name="name" required value="' + esc((S.profile && S.profile.full_name) || "") + '">' +
    '<div class="form-row"><div><label class="f" for="ac">البلد</label><input id="ac" name="country" required></div><div><label class="f" for="ag">الجنس</label><select id="ag" name="gender"><option value="male">معلم</option><option value="female">معلمة</option></select></div></div>' +
    '<label class="f" for="ab">نبذة عنك وأسلوبك</label><textarea id="ab" name="bio" rows="3"></textarea><label class="f">لغات الشرح</label>' + chk("langs", LANGS) + '<label class="f">البرامج التي تدرّسها</label>' + chk("progs", PROGRAMS) +
    '<label class="f" for="af">ملف الإجازة والسند (صورة أو PDF)</label><input id="af" name="file" type="file" accept="image/*,application/pdf" required><p class="muted small" style="margin-top:6px">يُحفظ ملفك بخصوصية، ولا يراه إلا فريق الإدارة.</p><button class="btn block lg" style="margin-top:16px">أرسل الطلب</button></form></div></section>';
}

async function adminDash() {
  if (!requireLogin()) return;
  if (!S.profile || S.profile.role !== "admin") { app().innerHTML = '<div class="wrap sec"><div class="card"><h2>هذه الصفحة للإدارة فقط</h2></div></div>'; return; }
  const items = [["over", "نظرة عامة"], ["teachers", "طلبات المعلمين"], ["pay", "المدفوعات"], ["prices", "الأسعار"], ["fin", "الإعدادات المالية"], ["disp", "النزاعات"], ["audit", "سجل التغييرات"]];
  const tab = S.atab || "over";
  app().innerHTML = '<div class="wrap dash"><nav class="side" aria-label="أقسام الإدارة">' + items.map(i => '<button data-act="atab" data-k="' + i[0] + '" aria-current="' + (i[0] === tab) + '">' + i[1] + '</button>').join("") + '</nav><div class="stack" id="abody">' + loading() + "</div></div>";
  await run(async () => { $("#abody").innerHTML = await adminTab(tab); });
}
async function cnt(q) { const r = await q; if (r.error) throw new Error(r.error.message); return r.count || 0; }
async function adminTab(tab) {
  const sb = S.sb;
  if (tab === "over") {
    const c = await Promise.all([cnt(sb.from("teacher_profiles").select("user_id", { count: "exact", head: true }).eq("status", "pending")), cnt(sb.from("payments").select("id", { count: "exact", head: true }).in("status", ["pending", "proof_submitted"])), cnt(sb.from("disputes").select("id", { count: "exact", head: true }).eq("status", "open")), cnt(sb.from("bookings").select("id", { count: "exact", head: true })), cnt(sb.from("bookings").select("id", { count: "exact", head: true }).eq("status", "completed")), cnt(sb.from("bookings").select("id", { count: "exact", head: true }).eq("status", "cancelled"))]);
    const pays = must(await sb.from("payments").select("amount,currency,status").in("status", ["held", "released"])), rev = {};
    pays.forEach(p => { rev[p.currency] = (rev[p.currency] || 0) + Number(p.amount); });
    const k = (l, v) => '<div class="card kpi"><div class="muted small">' + l + "</div><b>" + v + "</b></div>";
    return '<h2>نظرة عامة</h2><p class="muted small">كل الأرقام من قاعدة البيانات مباشرة.</p><div class="grid g3">' + k("طلبات معلمين جديدة", c[0]) + k("مدفوعات بانتظار التحقق", c[1]) + k("شكاوى مفتوحة", c[2]) + k("إجمالي الحجوزات", c[3]) + k("حصص مكتملة", c[4]) + k("حجوزات ملغاة", c[5]) + "</div>" + card("الإيرادات المستلمة", Object.keys(rev).length ? Object.keys(rev).map(cu => rowH("<b>" + cu + "</b>", moneyCur(cu, rev[cu]))).join("") : '<p class="muted">لا إيرادات بعد.</p>');
  }
  if (tab === "teachers") {
    const tp = must(await sb.from("teacher_profiles").select("*").eq("status", "pending")), ids = tp.map(x => x.user_id), nm = {};
    if (ids.length) must(await sb.from("profiles").select("id,full_name,country,gender").in("id", ids)).forEach(p => { nm[p.id] = p; });
    return "<h2>طلبات انضمام المعلمين</h2>" + (tp.length ? tp.map(t => card(esc((nm[t.user_id] || {}).full_name || "معلم"), '<p class="muted small">' + esc((nm[t.user_id] || {}).country || "") + " • " + (t.programs || []).map(p => PROGRAMS[p] || p).join("، ") + '</p><p style="margin:8px 0">' + esc(t.bio) + '</p><div class="btns"><button class="btn ghost sm" data-act="doc" data-b="ijaza" data-p="' + esc(t.ijaza_path || "") + '">عرض الإجازة</button><button class="btn sm" data-act="approve" data-id="' + t.user_id + '">اعتماد</button><button class="btn ghost sm" data-act="reject" data-id="' + t.user_id + '">رفض</button></div>')).join("") : '<p class="muted">لا توجد طلبات.</p>');
  }
  if (tab === "pay") {
    const py = must(await sb.from("payments").select("*").in("status", ["pending", "proof_submitted"]).order("created_at"));
    return "<h2>المدفوعات بانتظار التحقق</h2><p class=\"muted small\">تحقق من وصول المبلغ فعليًا قبل التأكيد.</p>" + (py.length ? py.map(p => rowH("<b>" + moneyCur(p.currency, p.amount) + '</b><div class="muted small">' + fmtD(p.created_at) + " • " + (PAYST[p.status] || "") + "</div>", (p.proof_path ? '<button class="btn ghost sm" data-act="doc" data-b="payment-proofs" data-p="' + esc(p.proof_path) + '">الإثبات</button> ' : "") + '<button class="btn sm" data-act="confirmpay" data-id="' + p.id + '">تأكيد الدفع</button> <button class="btn ghost sm" data-act="rejectpay" data-id="' + p.id + '">رفض الإثبات</button>')).join("") : '<p class="muted">لا توجد مدفوعات معلّقة.</p>');
  }
  if (tab === "prices") {
    const pk = must(await sb.from("packages").select("id,name,sessions_per_month").order("sort_order")), pp = must(await sb.from("package_prices").select("*")), ss = must(await sb.from("single_session_prices").select("*"));
    const inp = (n, v) => '<input type="number" min="0" step="any" name="' + n + '" value="' + (v == null ? "" : v) + '" placeholder="غير محدد">';
    return '<h2>الأسعار</h2><p class="muted small">سعر مستقل لكل عملة، دون تحويل تلقائي. تعديل السعر لا يغيّر الاشتراكات القائمة، وكل تغيير يُسجَّل في السجل.</p><form data-form="prices" class="stack">' +
      pk.map(p => card(esc(p.name) + " (" + p.sessions_per_month + " حصص)", '<div class="form-row">' + Object.keys(MARKETS).map(m => { const r = pp.find(x => x.package_id === p.id && x.market === m); return "<div><label class=\"f\">" + MARKETS[m].name + "</label>" + inp("pp|" + p.id + "|" + m, r ? r.price : "") + "</div>"; }).join("") + "</div>")).join("") +
      card("سعر الحصة الفردية (خارج الاشتراك)", '<p class="muted small">يجب أن يكون أعلى من أعلى سعر حصة داخل الباقات في السوق نفسه، وإلا يرفضه النظام.</p><div class="form-row">' + Object.keys(MARKETS).map(m => { const r = ss.find(x => x.market === m); return "<div><label class=\"f\">" + MARKETS[m].name + "</label>" + inp("ss|" + m, r ? r.price : "") + "</div>"; }).join("") + "</div>") + '<button class="btn lg">احفظ الأسعار</button></form>';
  }
  if (tab === "fin") {
    const fs = must(await sb.from("finance_settings").select("*")), F = [["teacher_rate_per_session", "أجر المعلم للحصة"], ["gateway_fee_percent", "رسوم البوابة %"], ["gateway_fee_fixed", "رسوم البوابة الثابتة"], ["tax_percent", "الضريبة %"], ["settlement_days", "مدة التسوية (أيام)"]];
    return '<h2>الإعدادات المالية</h2><p class="muted small">لا نفترض أي قيمة. تبقى الحقول فارغة حتى تُدخلها، ولا تُحتسب أرباح المعلمين قبل تحديد أجر الحصة.</p><form data-form="fin" class="stack">' + fs.map(r => card(MARKETS[r.market].name, '<div class="form-row">' + F.map(f => '<div><label class="f">' + f[1] + '</label><input type="number" min="0" step="any" name="fs|' + r.market + "|" + f[0] + '" value="' + (r[f[0]] == null ? "" : r[f[0]]) + '" placeholder="غير محدد"></div>').join("") + "</div>")).join("") + '<button class="btn lg">احفظ الإعدادات</button></form>';
  }
  if (tab === "disp") {
    const d = must(await sb.from("disputes").select("*").eq("status", "open").order("created_at"));
    return "<h2>الشكاوى المفتوحة</h2>" + (d.length ? d.map(x => rowH("<b>حجز " + x.booking_id.slice(0, 8) + '</b><div class="muted small">' + esc(x.reason) + "</div>", '<button class="btn ghost sm" data-act="resolve" data-id="' + x.id + '" data-v="resolved_refund">استرداد للطالب</button> <button class="btn sm" data-act="resolve" data-id="' + x.id + '" data-v="resolved_release">تسوية للمعلم</button> <button class="btn ghost sm" data-act="resolve" data-id="' + x.id + '" data-v="dismissed">رفض</button>')).join("") : '<p class="muted">لا توجد شكاوى مفتوحة.</p>') + '<p class="muted small" style="margin-top:10px">هذه الأزرار تسجّل القرار فقط، ويُنفَّذ الاسترداد المالي يدويًا حاليًا.</p>';
  }
  const lg = must(await sb.from("audit_log").select("*").order("at", { ascending: false }).limit(40));
  return '<h2>سجل التغييرات</h2><div class="card scroll"><table class="t"><thead><tr><th>الوقت</th><th>الإجراء</th><th>الجدول</th></tr></thead><tbody>' + (lg.map(l => "<tr><td>" + fmtDT(l.at) + "</td><td>" + esc(l.action) + "</td><td>" + esc(l.entity) + "</td></tr>").join("") || '<tr><td colspan="3" class="muted">لا يوجد سجل بعد.</td></tr>') + "</tbody></table></div>";
}

// ================= الإجراءات والنماذج =================
const reload = () => route();
const ACTIONS = {
  market(el) { S.market = el.dataset.m; try { localStorage.setItem("jm", S.market); } catch (e) {} if (B.t && $("#book")) renderBook(); refreshPackages(); },
  mode(el) { B.mode = el.dataset.v; renderBook(); },
  prog(el) { B.program = el.dataset.v; renderBook(); },
  slot(el) { B.slot = +el.dataset.i; renderBook(); },
  pkg(el) { B.pkgId = el.dataset.id || null; B.picks = []; renderBook(); },
  pick(el) {
    const i = +el.dataset.i, pkg = S.catalog[S.market].find(p => p.id === B.pkgId), need = pkg ? pkg.s / 4 : 0, k = B.picks.indexOf(i);
    if (k >= 0) B.picks.splice(k, 1); else if (B.picks.length < need) B.picks.push(i); else toast("اخترت العدد المطلوب. ألغِ موعدًا لتغييره.");
    renderBook();
  },
  "book-single": () => bookSingle(),
  "book-sub": () => bookSub(),
  intent(el) { try { localStorage.setItem("jr", el.dataset.v); } catch (e) {} loginPage(); },
  async google() {
    let intent = "student", nx = null; try { intent = localStorage.getItem("jr") || "student"; nx = localStorage.getItem("jnext"); } catch (e) {}
    try { if (!nx) localStorage.setItem("jnext", intent === "teacher" ? "#/apply" : "#/student"); } catch (e) {}
    must(await S.sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname } }));
  },
  async logout() { await S.sb.auth.signOut(); location.hash = "#/"; },
  async join(el) {
    const u = must(await S.sb.rpc("get_join_url", { p_booking: el.dataset.id }));
    if (!u) { toast("يظهر الرابط قبل الموعد بعشر دقائق. إن لم يضع المعلم رابطًا فتواصل معه."); return; }
    window.open(u, "_blank", "noopener,noreferrer");
  },
  async cancel(el) { const r = prompt("سبب الإلغاء؟"); if (r === null) return; must(await S.sb.rpc("cancel_booking", { p_booking: el.dataset.id, p_reason: r })); toast("تم إلغاء الحجز", "ok"); reload(); },
  async dispute(el) { const r = prompt("اكتب سبب الشكوى"); if (!r) return; must(await S.sb.from("disputes").insert({ booking_id: el.dataset.id, opened_by: S.user.id, reason: r })); toast("وصلت شكواك للإدارة", "ok"); reload(); },
  async renew(el) { must(await S.sb.rpc("set_auto_renew", { p_sub: el.dataset.id, p_val: el.dataset.v === "1" })); reload(); },
  async delav(el) { must(await S.sb.from("availability").delete().eq("id", el.dataset.id)); reload(); },
  async complete() {
    const id = $("#lb") && $("#lb").value; if (!id) return;
    must(await S.sb.rpc("complete_booking", { p_booking: id })); toast("تم إنهاء الحصة واحتساب أجرها", "ok"); reload();
  },
  async payout(el) { must(await S.sb.rpc("request_payout", { p_currency: el.dataset.c })); toast("تم إرسال طلب السحب", "ok"); reload(); },
  atab(el) { S.atab = el.dataset.k; adminDash(); },
  async doc(el) {
    if (!el.dataset.p) { toast("لا يوجد ملف مرفق."); return; }
    const r = must(await S.sb.storage.from(el.dataset.b).createSignedUrl(el.dataset.p, 300));
    window.open(r.signedUrl, "_blank", "noopener,noreferrer");
  },
  async approve(el) { must(await S.sb.rpc("approve_teacher", { p_user: el.dataset.id })); toast("تم اعتماد المعلم", "ok"); adminDash(); },
  async reject(el) { must(await S.sb.from("teacher_profiles").update({ status: "rejected" }).eq("user_id", el.dataset.id)); toast("تم رفض الطلب", "ok"); adminDash(); },
  async confirmpay(el) { if (!confirm("هل وصل المبلغ فعليًا؟")) return; must(await S.sb.rpc("confirm_payment", { p_payment: el.dataset.id })); toast("تم تأكيد الدفع", "ok"); adminDash(); },
  async rejectpay(el) { must(await S.sb.from("payments").update({ status: "pending", proof_path: null }).eq("id", el.dataset.id)); adminDash(); },
  async resolve(el) { const n = prompt("ملاحظة القرار (اختياري)") || null; must(await S.sb.from("disputes").update({ status: el.dataset.v, resolution_note: n }).eq("id", el.dataset.id)); adminDash(); }
};
const CHANGES = {
  child(el) { B.child = el.value; },
  async proof(el) {
    const f = el.files[0]; if (!f) return;
    const path = S.user.id + "/" + el.dataset.id + "-" + Date.now() + "-" + f.name.replace(/[^\w.-]+/g, "_");
    must(await S.sb.storage.from("payment-proofs").upload(path, f));
    must(await S.sb.from("payments").update({ proof_path: path, status: "proof_submitted" }).eq("id", el.dataset.id));
    toast("وصل إثبات التحويل. ستؤكد الإدارة الدفع قريبًا.", "ok"); reload();
  }
};
const FORMS = {
  async tfilter(f) { const d = Object.fromEntries(new FormData(f)); try { sessionStorage.setItem("tf", JSON.stringify(d)); } catch (e) {} await loadTeachers(d); },
  async kid(f) { const d = Object.fromEntries(new FormData(f)); must(await S.sb.from("children").insert({ guardian_id: S.user.id, full_name: d.name.trim(), gender: d.gender })); reload(); },
  async link(f) {
    const url = new FormData(f).get("url").trim();
    if (!MEET_RE.test(url)) throw new Error("الرابط يجب أن يكون https من زوم أو جوجل ميت.");
    must(await S.sb.from("teacher_meeting_links").upsert({ teacher_id: S.user.id, url: url, updated_at: new Date().toISOString() }));
    toast("تم حفظ الرابط", "ok");
  },
  async avail(f) {
    const d = Object.fromEntries(new FormData(f));
    if (d.end <= d.start) throw new Error("وقت النهاية يجب أن يكون بعد البداية.");
    must(await S.sb.from("availability").insert({ teacher_id: S.user.id, weekday: +d.weekday, start_time: d.start, end_time: d.end })); reload();
  },
  async log(f) {
    const d = Object.fromEntries(new FormData(f));
    must(await S.sb.from("lesson_logs").upsert({ booking_id: d.booking, attendance: d.attendance, memorized_range: d.range || "", needs_review: d.review || "", grade: d.grade || null, note: d.note || "" }));
    toast("تم حفظ السجل", "ok");
  },
  async apply(f) {
    const fd = new FormData(f), file = fd.get("file"), uid = S.user.id;
    if (!file || !file.size) throw new Error("ارفع ملف الإجازة.");
    const langs = fd.getAll("langs"), progs = fd.getAll("progs");
    if (!langs.length || !progs.length) throw new Error("اختر لغة وبرنامجًا واحدًا على الأقل.");
    const path = uid + "/" + Date.now() + "-" + file.name.replace(/[^\w.-]+/g, "_");
    must(await S.sb.storage.from("ijaza").upload(path, file));
    must(await S.sb.from("profiles").update({ full_name: fd.get("name").trim(), country: fd.get("country").trim(), gender: fd.get("gender") }).eq("id", uid));
    must(await S.sb.from("teacher_profiles").insert({ user_id: uid, bio: fd.get("bio") || "", languages: langs, programs: progs, ijaza_path: path }));
    await setSession((await S.sb.auth.getSession()).data.session);
    toast("وصل طلبك وستراجعه الإدارة.", "ok"); location.hash = "#/teach";
  },
  async prices(f) {
    const d = Object.fromEntries(new FormData(f)), now = new Date().toISOString();
    for (const k of Object.keys(d)) {
      if (d[k] === "") continue; const p = k.split("|"), price = Number(d[k]);
      if (p[0] === "pp") must(await S.sb.from("package_prices").upsert({ package_id: p[1], market: p[2], currency: MARKETS[p[2]].cur, price: price, status: "approved", approved_by: S.user.id, approved_at: now }, { onConflict: "package_id,market" }));
      if (p[0] === "ss") must(await S.sb.from("single_session_prices").upsert({ market: p[1], currency: MARKETS[p[1]].cur, price: price, updated_at: now }, { onConflict: "market" }));
    }
    S.catalog = null; toast("تم حفظ الأسعار", "ok");
  },
  async fin(f) {
    const d = Object.fromEntries(new FormData(f)), rows = {};
    Object.keys(d).forEach(k => { const p = k.split("|"); rows[p[1]] = rows[p[1]] || {}; rows[p[1]][p[2]] = d[k] === "" ? null : Number(d[k]); });
    for (const m of Object.keys(rows)) must(await S.sb.from("finance_settings").update(Object.assign({ updated_at: new Date().toISOString() }, rows[m])).eq("market", m));
    toast("تم حفظ الإعدادات", "ok");
  }
};

document.addEventListener("click", e => {
  const nx = e.target.closest("[data-next]"); if (nx) { try { localStorage.setItem("jnext", nx.dataset.next); } catch (x) {} }
  const sc = e.target.closest("[data-scroll]"); if (sc) { e.preventDefault(); const t = document.getElementById(sc.dataset.scroll); if (t) t.scrollIntoView({ behavior: "smooth" }); return; }
  const el = e.target.closest("[data-act]"); if (!el) return;
  const fn = ACTIONS[el.dataset.act]; if (fn) { e.preventDefault(); run(() => fn(el, e)); }
});
document.addEventListener("change", e => { const el = e.target.closest("[data-chg]"); if (el && CHANGES[el.dataset.chg]) run(() => CHANGES[el.dataset.chg](el)); });
document.addEventListener("submit", e => { const f = e.target.closest("[data-form]"); if (f && FORMS[f.dataset.form]) { e.preventDefault(); run(() => FORMS[f.dataset.form](f)); } });

// ================= التوجيه والبدء =================
function renderNav() {
  const el = $("#navAuth"); if (!el) return;
  el.innerHTML = !S.sb ? "" : S.user ? '<a class="btn sm" href="#/dash">لوحتي</a><button class="btn ghost sm" data-act="logout">خروج</button>' : '<a class="btn sm" href="#/login">تسجيل الدخول</a>';
}
async function setSession(sess) {
  S.user = sess ? sess.user : null; S.profile = null; S.tp = null;
  if (S.user) {
    try {
      S.profile = must(await S.sb.from("profiles").select("*").eq("id", S.user.id).maybeSingle());
      if (S.profile && S.profile.timezone === "UTC" && TZ !== "UTC") { await S.sb.from("profiles").update({ timezone: TZ }).eq("id", S.user.id); S.profile.timezone = TZ; }
      S.tp = must(await S.sb.from("teacher_profiles").select("status").eq("user_id", S.user.id).maybeSingle());
    } catch (e) { console.error(e); }
    if (location.search) history.replaceState(null, "", location.pathname + location.hash);
  }
  renderNav();
}
const ROUTES = [
  [/^#\/?$/, home], [/^#\/packages$/, packagesPage], [/^#\/teachers$/, teachersPage], [/^#\/teacher\/([\w-]+)$/, teacherProfile],
  [/^#\/login$/, loginPage], [/^#\/policies$/, policiesPage], [/^#\/student$/, studentDash], [/^#\/teach$/, teacherDash], [/^#\/apply$/, applyPage], [/^#\/admin$/, adminDash],
  [/^#\/dash$/, () => { location.hash = !S.user ? "#/login" : S.profile && S.profile.role === "admin" ? "#/admin" : S.tp ? "#/teach" : "#/student"; }]
];
async function route() {
  const hash = (location.hash || "#/").split("?")[0];
  document.querySelectorAll("#links a").forEach(a => a.setAttribute("aria-current", a.getAttribute("href") === hash ? "page" : "false"));
  for (const r of ROUTES) {
    const m = hash.match(r[0]);
    if (m) { await run(async () => { await r[1](m[1]); }); window.scrollTo(0, 0); const a = app(); if (a) a.focus({ preventScroll: true }); return; }
  }
  location.hash = "#/";
}
async function init() {
  if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY && window.supabase) {
    S.sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, { auth: { flowType: "pkce", persistSession: true, detectSessionInUrl: true } });
  }
  $("#banner").innerHTML = S.sb ? "" : '<div class="note">الموقع غير مربوط بقاعدة البيانات بعد. افتح app.js وأضف رابط Supabase والمفتاح العام. الأسعار المعروضة هي الأسعار المعتمدة.</div>';
  window.addEventListener("hashchange", route);
  if (S.sb) {
    const r = await S.sb.auth.getSession(); await setSession(r.data.session);
    S.sb.auth.onAuthStateChange((ev, sess) => {
      if (ev === "SIGNED_IN" || ev === "SIGNED_OUT") {
        setSession(sess).then(() => {
          let nx = null; try { nx = localStorage.getItem("jnext"); } catch (e) {}
          if (sess && nx) { try { localStorage.removeItem("jnext"); } catch (e) {} location.hash = nx; } else if (ev === "SIGNED_IN") { route(); }
        });
      }
    });
    let nx = null; try { nx = localStorage.getItem("jnext"); } catch (e) {}
    if (S.user && nx) { try { localStorage.removeItem("jnext"); } catch (e) {} location.hash = nx; }
  }
  renderNav(); route();
}
init();
})();
