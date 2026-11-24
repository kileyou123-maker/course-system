import { useEffect, useMemo, useState, useRef, lazy, Suspense } from "react";
import { apiRequest, getStoredToken, setStoredToken } from "./api.js";
const MaterialWorkspace = lazy(() => import("./MaterialWorkspace.jsx"));
import { MESSAGES } from "./i18n.js";

const PERIODS = Array.from({ length: 14 }, (_, i) => i + 1);
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

const normalizeCourseName = (name) =>
  String(name || "")
    .replace(/（.*?）|\(.*?\)/g, "")
    .trim()
    .toLowerCase();

const AI_PROGRAM_SET = new Set(
  [
    "統計學",
    "研究概論",
    "經濟學",
    "進階統計學應用",
    "健康照護資料分析與決策",
    "統計套裝軟體",
    "資料倉儲",
    "健康照護資料處理",
    "人工智慧",
    "LINUX系統實務",
    "管理數學",
    "資訊與法律",
    "提示工程與商務應用",
    "統計應用與資料分析",
    "程式設計邏輯",
    "品質分析統計應用",
    "SAS基礎資料處理",
    "行動軟體APP設計",
    "SAS應用資料處理",
    "商業智慧",
    "C#.NET程式開發與應用",
    "巨量資料分析工具與應用",
    "雲端運算研討",
    "健康照護物聯網導論",
    "Python程式設計",
    "產業經營績效之大數據分析",
    "機器學習程式設計",
  ].map(normalizeCourseName),
);

const MED_PROGRAM_SET = new Set(
  [
    "醫療資訊概論",
    "組織行為學",
    "健康經濟學",
    "健康保險學",
    "健康政策與策略",
    "健康照護管理學",
    "健康照護品質管理學",
    "健康照護行銷管理學",
    "健康照護財務管理學",
    "健康照護人力資源管理學",
    "專案管理",
    "醫院電腦化實務與應用",
    "健康照護資訊系統",
    "健康照護資料處理",
    "健康照護管理實習",
    "醫療機構見習",
    "科技策略",
    "SAS基礎資料處理",
    "SAS應用資料處理",
    "醫療機構管理實務",
  ].map(normalizeCourseName),
);

export default function App() {
  const [lang, setLang] = useState("zh");
  const t = MESSAGES[lang];
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("ntunhs_dark_mode") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    try {
      localStorage.setItem("ntunhs_dark_mode", String(darkMode));
    } catch {
      // Ignore storage errors
    }
  }, [darkMode]);

  const [activeTab, setActiveTab] = useState("search"); // search | mobile | admin | auth
  const [mobileView, setMobileView] = useState("search"); // search | schedule
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);

  // Metadata
  const [meta, setMeta] = useState({
    semesters: ["1151", "1142"],
    departments: [],
    categories: [],
    programs: [],
  });

  // Filters
  const [filters, setFilters] = useState({
    semester: "1151",
    department: "ALL",
    category: "ALL",
    grade: "",
    tag: "ALL",
    program: "ALL",
    weekday: "",
    periods: [],
    matchMode: "strict",
    keyword: "",
    hideConflicts: false,
    page: 1,
  });

  // Courses & Schedule
  const [courseResult, setCourseResult] = useState({
    items: [],
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [allSchedule, setSchedule] = useState([]);
  const [planningSemester, setPlanningSemester] = useState("1151");
  const schedule = useMemo(
    () => allSchedule.filter((c) => String(c.semester) === planningSemester),
    [allSchedule, planningSemester],
  );
  const requestSerial = useRef(0);
  const toastTimer = useRef(null);
  const [busy, setBusy] = useState(false);
  const [courseError, setCourseError] = useState("");
  const [completedCourses, setCompletedCourses] = useState(() => {
    try {
      const saved = localStorage.getItem("ntunhs_completed_courses");
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [completedCourseDetails, setCompletedCourseDetails] = useState(() => {
    try {
      const saved = localStorage.getItem("ntunhs_completed_course_details");
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Modals
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [shareUrl, setShareUrl] = useState("");
  const [sharedView, setSharedView] = useState(null);

  // Auth form
  const [authMode, setAuthMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [authForm, setAuthForm] = useState({
    username: "",
    password: "",
    name: "",
    department: "資訊管理系 (22140)",
    grade: 3,
  });

  // Graduation progress manual adjustments & simulation toggle (default: completed courses only)
  const [includePlannedInGrad, setIncludePlannedInGrad] = useState(false);
  const [expandedBars, setExpandedBars] = useState({});
  const toggleBarExpand = (key) =>
    setExpandedBars((prev) => ({ ...prev, [key]: !prev[key] }));
  const [showGradSettings, setShowGradSettings] = useState(false);
  const [gradAssume, setGradAssume] = useState({
    extraProfElective: 0,
    extraGenElective: 0,
    extraCrossDept: 0,
  });

  // Admin form
  const [newCourse, setNewCourse] = useState({
    code: "",
    semester: "1151",
    department: "資訊管理系 (22140)",
    name_zh: "",
    name_en: "",
    credits: 2,
    category: "專業選修(系所)",
    teacher_name: "",
    weekday: 1,
    periods: "3,4",
    room: "F601",
    min_grade: 1,
  });
  const [importJson, setImportJson] = useState("");
  const [editingCourse, setEditingCourse] = useState(null);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5500);
  };

  // Load shared schedule if ?share=token is present in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareToken = params.get("share");
    if (shareToken) {
      apiRequest(`/api/schedule/shared/${encodeURIComponent(shareToken)}`)
        .then((data) => setSharedView(data))
        .catch((err) => showToast(err.message, "error"));
    }
  }, []);

  // Load meta & current user on startup
  useEffect(() => {
    apiRequest("/api/courses/meta")
      .then((data) => setMeta(data))
      .catch(() => {});

    if (getStoredToken()) {
      apiRequest("/api/auth/me")
        .then((data) => setUser(data.user))
        .catch(() => setStoredToken(""));
    }
  }, []);

  // Load user's schedule when logged in
  const refreshSchedule = async () => {
    if (!getStoredToken()) {
      setSchedule([]);
      return;
    }
    try {
      const data = await apiRequest("/api/schedule");
      setSchedule(data.items || []);
    } catch {
      setSchedule([]);
    }
  };

  useEffect(() => {
    refreshSchedule();
    if (!user) {
      try {
        setCompletedCourses(
          JSON.parse(localStorage.getItem("ntunhs_completed_courses") || "[]"),
        );
        setCompletedCourseDetails(
          JSON.parse(
            localStorage.getItem("ntunhs_completed_course_details") || "[]",
          ),
        );
      } catch {
        setCompletedCourses([]);
        setCompletedCourseDetails([]);
      }
    }
    if (user && Array.isArray(user.completed_courses)) {
      setCompletedCourses(user.completed_courses);
      setCompletedCourseDetails(
        Array.isArray(user.completed_course_details)
          ? user.completed_course_details
          : [],
      );
    }
  }, [user]);

  // Debounced AJAX course query (300ms)
  useEffect(() => {
    requestSerial.current += 1;
    setLoadingCourses(true);
    const timer = setTimeout(() => {
      fetchCourses();
    }, 300);
    return () => clearTimeout(timer);
  }, [filters, user]);

  const fetchCourses = async () => {
    const serial = ++requestSerial.current;
    setLoadingCourses(true);
    setCourseError("");
    try {
      const params = new URLSearchParams();
      if (filters.semester) params.set("semester", filters.semester);
      if (filters.department) params.set("department", filters.department);
      if (filters.category) params.set("category", filters.category);
      if (filters.grade) params.set("grade", filters.grade);
      if (filters.tag) params.set("tag", filters.tag);
      if (filters.program) params.set("program", filters.program);
      if (filters.weekday) params.set("weekday", filters.weekday);
      if (filters.periods.length > 0)
        params.set("periods", filters.periods.join(","));
      params.set("matchMode", filters.matchMode);
      if (filters.keyword.trim()) params.set("keyword", filters.keyword.trim());
      if (filters.hideConflicts) params.set("hideConflicts", "true");
      params.set("page", String(filters.page));
      params.set("limit", "10");

      const data = await apiRequest(`/api/courses?${params.toString()}`);
      if (serial === requestSerial.current) setCourseResult(data);
    } catch (err) {
      if (serial === requestSerial.current) setCourseError(err.message);
    } finally {
      if (serial === requestSerial.current) setLoadingCourses(false);
    }
  };

  const togglePeriodFilter = (p) => {
    setFilters((prev) => {
      const exists = prev.periods.includes(p);
      const next = exists
        ? prev.periods.filter((x) => x !== p)
        : [...prev.periods, p].sort((a, b) => a - b);
      return { ...prev, periods: next, page: 1 };
    });
  };

  const handleEmptySlotClick = (weekday, period) => {
    setFilters((prev) => ({
      ...prev,
      department: "ALL",
      weekday: String(weekday),
      periods: [period],
      matchMode: "flexible",
      page: 1,
    }));
    setActiveTab("search");
    showToast(
      lang === "zh"
        ? `已自動篩選 ${t.weekdays[weekday]} 第 ${period} 節可選課程`
        : `Filtered courses for ${t.weekdays[weekday]} Period ${period}`,
    );
  };

  const handleResetFilters = () => {
    setFilters({
      semester: "1151",
      department: "ALL",
      category: "ALL",
      grade: "",
      tag: "ALL",
      program: "ALL",
      weekday: "",
      periods: [],
      matchMode: "strict",
      keyword: "",
      hideConflicts: false,
      page: 1,
    });
  };

  const handleAddToSchedule = async (courseId) => {
    if (!user) {
      showToast(t.loginPrompt, "error");
      setActiveTab("auth");
      window.location.hash = "/auth";
      return;
    }
    if (busy) return;
    setBusy(true);
    const addingCourse = courseResult.items.find((c) => c.id === courseId);
    if (
      addingCourse &&
      allSchedule
        .filter((c) => c.semester === addingCourse.semester)
        .reduce((sum, c) => sum + Number(c.credits), 0) +
        Number(addingCourse.credits) >
        25
    ) {
      showToast(
        lang === "zh"
          ? "這門課會使該學期預排超過25學分，請先調整課表。"
          : "This course would exceed the 25-credit semester limit.",
        "error",
      );
      setBusy(false);
      return;
    }
    try {
      await apiRequest("/api/schedule", {
        method: "POST",
        body: JSON.stringify({ courseId }),
      });
      if (addingCourse) setPlanningSemester(String(addingCourse.semester));
      await refreshSchedule();
      fetchCourses();
      showToast(
        lang === "zh" ? "已加入預排課表" : "Added to planned schedule",
        "success",
      );
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveFromSchedule = async (courseId) => {
    try {
      await apiRequest(`/api/schedule/${courseId}`, { method: "DELETE" });
      await refreshSchedule();
      fetchCourses();
      showToast(lang === "zh" ? "已從預排課表移除" : "Removed from schedule");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleShareSchedule = async () => {
    if (!user) {
      showToast(t.loginPrompt, "error");
      return;
    }
    try {
      const data = await apiRequest("/api/schedule/share", {
        method: "POST",
        body: JSON.stringify({ semester: planningSemester }),
      });
      const url = `${window.location.origin}${import.meta.env.BASE_URL}?share=${data.token}`;
      setShareUrl(url);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint =
        authMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const data = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(authForm),
      });
      setStoredToken(data.token);
      setUser(data.user);
      setAuthForm((p) => ({ ...p, password: "" }));
      setActiveTab("search");
      window.location.hash = "/search";
      showToast(
        lang === "zh"
          ? `歡迎，${data.user.name}`
          : `Welcome, ${data.user.name}`,
        "success",
      );
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const handleLogout = () => {
    setStoredToken("");
    setUser(null);
    setSchedule([]);
    showToast(lang === "zh" ? "已登出系統" : "Signed out");
  };

  const handleAdminCreate = async (e) => {
    e.preventDefault();
    try {
      await apiRequest("/api/courses", {
        method: "POST",
        body: JSON.stringify(newCourse),
      });
      showToast(lang === "zh" ? "新增課程成功" : "Course created", "success");
      fetchCourses();
      return true;
    } catch (err) {
      showToast(err.message, "error");
      return false;
    }
  };

  const handleAdminDelete = async (id) => {
    try {
      await apiRequest(`/api/courses/${id}`, { method: "DELETE" });
      showToast(lang === "zh" ? "已刪除課程" : "Course deleted");
      fetchCourses();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleAdminUpdate = async (e) => {
    e.preventDefault();
    if (!editingCourse) return;
    try {
      await apiRequest(`/api/courses/${editingCourse.id}`, {
        method: "PUT",
        body: JSON.stringify(editingCourse),
      });
      showToast(lang === "zh" ? "更新課程成功" : "Course updated", "success");
      setEditingCourse(null);
      fetchCourses();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleAdminImport = async () => {
    try {
      const parsed = JSON.parse(importJson);
      const courses = Array.isArray(parsed) ? parsed : parsed.courses;
      const res = await apiRequest("/api/courses/import", {
        method: "POST",
        body: JSON.stringify({ courses }),
      });
      showToast(`匯入完成：成功 ${res.inserted} 筆`, "success");
      setImportJson("");
      fetchCourses();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const scheduledIds = useMemo(
    () => new Set(schedule.map((c) => c.id)),
    [schedule],
  );

  const completedCodeSet = useMemo(
    () => new Set(completedCourses.map(String)),
    [completedCourses],
  );

  const isCourseCompleted = (course) => {
    const code = String(course.code || "");
    const baseCode = code.split("_")[0];
    const subjCode = baseCode.length >= 9 ? baseCode.slice(5, 9) : "";
    return (
      completedCodeSet.has(code) ||
      completedCodeSet.has(baseCode) ||
      (subjCode && completedCodeSet.has(subjCode))
    );
  };

  const handleToggleCompleted = async (course) => {
    const rawCode = String(course.code || "");
    const baseCode = rawCode.split("_")[0];
    const subjCode = baseCode.length >= 9 ? baseCode.slice(5, 9) : "";
    const codeToToggle = completedCodeSet.has(rawCode)
      ? rawCode
      : completedCodeSet.has(baseCode)
        ? baseCode
        : subjCode && completedCodeSet.has(subjCode)
          ? subjCode
          : rawCode;
    if (!codeToToggle) return;

    if (user && getStoredToken()) {
      try {
        const res = await apiRequest("/api/auth/completed-courses/toggle", {
          method: "POST",
          body: JSON.stringify({ courseCode: codeToToggle }),
        });
        setCompletedCourses(res.completed_courses || []);
        setCompletedCourseDetails(res.completed_course_details || []);
        fetchCourses();
        showToast(
          res.completed
            ? lang === "zh"
              ? `已備註「${course.name_zh}」為已修過`
              : `Marked "${course.name_en}" as completed`
            : lang === "zh"
              ? `已取消「${course.name_zh}」的已修過備註`
              : `Unmarked "${course.name_en}"`,
          "info",
        );
      } catch (err) {
        showToast(err.message, "error");
      }
      return;
    }

    const exists = completedCourses.includes(codeToToggle);
    const nextCodes = exists
      ? completedCourses.filter((item) => item !== codeToToggle)
      : [...completedCourses, codeToToggle];
    const nextDetails = exists
      ? completedCourseDetails.filter((item) => item.code !== codeToToggle)
      : [
          ...completedCourseDetails,
          {
            code: codeToToggle,
            name_zh: course.name_zh,
            name_en: course.name_en,
            credits: course.credits,
            category: course.category,
            department: course.department,
            tags: course.tags || "",
          },
        ];
    setCompletedCourses(nextCodes);
    setCompletedCourseDetails(nextDetails);
    try {
      localStorage.setItem(
        "ntunhs_completed_courses",
        JSON.stringify(nextCodes),
      );
      localStorage.setItem(
        "ntunhs_completed_course_details",
        JSON.stringify(nextDetails),
      );
    } catch {
      // Ignore storage errors
    }
    showToast(
      !exists
        ? lang === "zh"
          ? `已備註「${course.name_zh}」為已修過`
          : `Marked "${course.name_en}" as completed`
        : lang === "zh"
          ? `已取消「${course.name_zh}」的已修過備註`
          : `Unmarked "${course.name_en}"`,
      "info",
    );
  };

  const getScheduleConflict = (course) => {
    if (!course) return null;
    const coursePeriods = new Set(
      String(course.periods || "")
        .split(",")
        .map((s) => Number.parseInt(s.trim(), 10))
        .filter((n) => Number.isInteger(n)),
    );
    return (
      schedule.find((s) => {
        if (
          s.id === course.id ||
          s.semester !== course.semester ||
          s.weekday !== course.weekday
        )
          return false;
        if (
          s.period_mask &&
          course.period_mask &&
          (s.period_mask & course.period_mask) > 0
        ) {
          return true;
        }
        const sPeriods = String(s.periods || "")
          .split(",")
          .map((p) => Number.parseInt(p.trim(), 10));
        return sPeriods.some((p) => coursePeriods.has(p));
      }) || null
    );
  };

  const scheduleStats = useMemo(() => {
    let total = 0;
    let req = 0;
    let elec = 0;
    for (const c of schedule) {
      total += c.credits || 0;
      if (String(c.category).includes("必修")) req += c.credits || 0;
      else elec += c.credits || 0;
    }
    return { total, req, elec, left: Math.max(23 - total, 0) };
  }, [schedule]);

  const gradProgress = useMemo(() => {
    // 113 學年度資管系四技畢業門檻：總學分 128 = 通識必修 28 + 專業必修 62 + 選修 38 (專業選修>=19 + 一般選修19), 跨系/跨域 >=4
    const getEffectiveCredits = (c) => {
      const name = String(c.name_zh || "");
      const cat = String(c.category || "");
      // 體育必修與服務學習為 0 畢業學分
      if (
        (name.includes("體育-") || name === "基本運動素養") &&
        cat.includes("通識必修")
      )
        return 0;
      if (name === "服務學習") return 0;
      return Number(c.credits) || 0;
    };

    const classifyCourse = (c) => {
      const cr = getEffectiveCredits(c);
      const cat = String(c.category || "");
      const name = String(c.name_zh || "");
      const dept = String(c.department || "");
      const tags = String(c.tags || "");
      const isIM = dept.includes("22140");
      let bucket = "genElec";
      if (cat === "通識必修(通識)") bucket = "genReq";
      else if (cat === "專業必修(系所)" && isIM) bucket = "profReq";
      else if (cat === "專業選修(系所)" && isIM) bucket = "profElec";

      const isCross =
        bucket !== "genReq" &&
        bucket !== "profReq" &&
        (tags.includes("跨域") ||
          tags.includes("跨系") ||
          (!isIM && !cat.includes("通識") && !name.includes("國際禮儀")));

      return { cr, bucket, isCross };
    };

    let doneGenReq = 0;
    let doneProfReq = 0;
    let doneProfElec = Number(gradAssume.extraProfElective) || 0;
    let doneGenElec = Number(gradAssume.extraGenElective) || 0;
    let doneCross = Number(gradAssume.extraCrossDept) || 0;
    let doneAiProg = 0;
    let doneMedProg = 0;

    let planGenReq = 0;
    let planProfReq = 0;
    let planProfElec = 0;
    let planGenElec = 0;
    let planCross = 0;
    let planAiProg = 0;
    let planMedProg = 0;

    const lists = {
      all: [],
      genReq: [],
      profReq: [],
      profElec: [],
      genElec: [],
      cross: [],
      aiProg: [],
      medProg: [],
    };

    const pushCourse = (c, isPlanned) => {
      const { cr, bucket, isCross } = classifyCourse(c);
      const norm = normalizeCourseName(c.name_zh);
      const inAi = AI_PROGRAM_SET.has(norm);
      const inMed = MED_PROGRAM_SET.has(norm);
      const item = { code: c.code, name_zh: c.name_zh, credits: cr, isPlanned };

      lists.all.push(item);
      if (bucket === "genReq") lists.genReq.push(item);
      else if (bucket === "profReq") lists.profReq.push(item);
      else if (bucket === "profElec") lists.profElec.push(item);
      else lists.genElec.push(item);

      if (isCross) lists.cross.push(item);
      if (inAi) lists.aiProg.push(item);
      if (inMed) lists.medProg.push(item);

      return { cr, bucket, isCross, inAi, inMed };
    };

    for (const c of completedCourseDetails) {
      const { cr, bucket, isCross, inAi, inMed } = pushCourse(c, false);
      if (bucket === "genReq") doneGenReq += cr;
      else if (bucket === "profReq") doneProfReq += cr;
      else if (bucket === "profElec") doneProfElec += cr;
      else doneGenElec += cr;
      if (isCross) doneCross += cr;
      if (inAi) doneAiProg += cr;
      if (inMed) doneMedProg += cr;
    }

    for (const c of schedule) {
      if (isCourseCompleted(c)) continue;
      if (!includePlannedInGrad) {
        const { cr, bucket } = classifyCourse(c);
        if (bucket === "genReq") planGenReq += cr;
        else if (bucket === "profReq") planProfReq += cr;
        else if (bucket === "profElec") planProfElec += cr;
        else planGenElec += cr;
        continue;
      }
      const { cr, bucket, isCross, inAi, inMed } = pushCourse(c, true);
      if (bucket === "genReq") planGenReq += cr;
      else if (bucket === "profReq") planProfReq += cr;
      else if (bucket === "profElec") planProfElec += cr;
      else planGenElec += cr;
      if (isCross) planCross += cr;
      if (inAi) planAiProg += cr;
      if (inMed) planMedProg += cr;
    }

    const completedTotal =
      doneGenReq + doneProfReq + doneProfElec + doneGenElec;
    const plannedCredits =
      planGenReq + planProfReq + planProfElec + planGenElec;
    const genReq = doneGenReq + (includePlannedInGrad ? planGenReq : 0);
    const profReq = doneProfReq + (includePlannedInGrad ? planProfReq : 0);
    const profElec = doneProfElec + (includePlannedInGrad ? planProfElec : 0);
    const genElec = doneGenElec + (includePlannedInGrad ? planGenElec : 0);
    const totalElec = profElec + genElec;
    const cross = doneCross + (includePlannedInGrad ? planCross : 0);
    const aiProg = doneAiProg + (includePlannedInGrad ? planAiProg : 0);
    const medProg = doneMedProg + (includePlannedInGrad ? planMedProg : 0);
    const total = completedTotal + (includePlannedInGrad ? plannedCredits : 0);

    return {
      total,
      completedTotal,
      plannedCredits,
      genReq,
      profReq,
      profElec,
      genElec,
      totalElec,
      cross,
      aiProg,
      medProg,
      lists,
    };
  }, [
    completedCourseDetails,
    completedCourses,
    schedule,
    gradAssume,
    includePlannedInGrad,
  ]);

  const slotLookup = useMemo(() => {
    const map = {};
    for (const c of schedule) {
      const pList = String(c.periods || "")
        .split(",")
        .map((s) => Number.parseInt(s.trim(), 10));
      for (const p of pList) {
        map[`${c.weekday}-${p}`] = c;
      }
    }
    return map;
  }, [schedule]);

  return (
    <Suspense
      fallback={
        <div role="status" style={{ padding: 32 }}>
          載入介面…
        </div>
      }
    >
      <MaterialWorkspace
        controller={{
          lang,
          setLang,
          darkMode,
          setDarkMode,
          activeTab,
          setActiveTab,
          user,
          toast,
          setToast,
          meta,
          filters,
          setFilters,
          courseResult,
          loadingCourses,
          courseError,
          busy,
          planningSemester,
          setPlanningSemester,
          schedule,
          allSchedule,
          completedCourses,
          selectedCourse,
          setSelectedCourse,
          selectedTeacher,
          setSelectedTeacher,
          shareUrl,
          setShareUrl,
          sharedView,
          setSharedView,
          authMode,
          setAuthMode,
          showPassword,
          setShowPassword,
          authForm,
          setAuthForm,
          includePlannedInGrad,
          setIncludePlannedInGrad,
          expandedBars,
          toggleBarExpand,
          showGradSettings,
          setShowGradSettings,
          gradAssume,
          setGradAssume,
          newCourse,
          setNewCourse,
          importJson,
          setImportJson,
          editingCourse,
          setEditingCourse,
          showToast,
          fetchCourses,
          togglePeriodFilter,
          handleEmptySlotClick,
          handleResetFilters,
          handleAddToSchedule,
          handleRemoveFromSchedule,
          handleShareSchedule,
          handleAuthSubmit,
          handleLogout,
          handleAdminCreate,
          handleAdminDelete,
          handleAdminUpdate,
          handleAdminImport,
          scheduledIds,
          isCourseCompleted,
          handleToggleCompleted,
          getScheduleConflict,
          scheduleStats,
          gradProgress,
          slotLookup,
        }}
      />
    </Suspense>
  );
}
