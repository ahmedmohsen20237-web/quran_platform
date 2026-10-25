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
