import { useState, useEffect } from "react";
import {
  ConfigProvider,
  App as AntApp,
  Layout,
  Menu,
  Typography,
  Button,
  Card,
  Row,
  Col,
  Space,
  Flex,
  Form,
  Input,
  Select,
  InputNumber,
  Checkbox,
  Collapse,
  Table,
  List,
  Tag,
  Badge,
  Tooltip,
  Modal,
  Drawer,
  Tabs,
  Segmented,
  Progress,
  Statistic,
  Alert,
  Empty,
  Result,
  Descriptions,
  Avatar,
  Dropdown,
  Grid,
  Divider,
  Steps,
  theme,
} from "antd";
import zhTW from "antd/locale/zh_TW";
import enUS from "antd/locale/en_US";
import {
  ReadOutlined,
  SearchOutlined,
  CalendarOutlined,
  TrophyOutlined,
  SettingOutlined,
  UserOutlined,
  LoginOutlined,
  LogoutOutlined,
  SunOutlined,
  MoonOutlined,
  GlobalOutlined,
  MenuOutlined,
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  ShareAltOutlined,
  CopyOutlined,
  FilterOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined,
  SafetyCertificateOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  BookOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
const { Sider, Header, Content, Footer } = Layout;
const { Title, Text, Paragraph, Link } = Typography;
const DAYS = [1, 2, 3, 4, 5, 6, 7],
  PERIODS = Array.from({ length: 14 }, (_, i) => i + 1);
const categoryEN = {
  "專業必修(系所)": "Major required",
  "專業選修(系所)": "Major elective",
  "通識必修(通識)": "General required",
  "通識選修(通識)": "General elective",
};
const departmentEN = {
  "資訊管理系 (22140)": "Information Management (22140)",
  "護理系 (11140)": "Nursing (11140)",
  "健康事業管理系 (21140)": "Health Care Management (21140)",
  "休閒產業與健康促進系 (23140)": "Leisure Industry & Health Promotion (23140)",
  "嬰幼兒保育系 (31140)": "Infant & Child Care (31140)",
  "智慧健康照護跨領域學士學位學程 (42140)":
    "Smart Health Care Interdisciplinary Program (42140)",
  "生死與健康心理諮商系 (33140)": "Thanatology & Health Counseling (33140)",
  "語言治療與聽力學系 (25140)": "Speech Language Pathology & Audiology (25140)",
  "跨領域學位學程 (41140)": "Interdisciplinary Degree Program (41140)",
  "通識教育中心 (10000)": "General Education Center (10000)",
  "運動保健系 (32140)": "Exercise & Health Science (32140)",
  "高齡健康照護系 (13140)": "Gerontological Health Care (13140)",
};
const tagEN = {
  跨域課程: "Interdisciplinary",
  EMI全英語授課: "EMI",
  全英語授課: "English-taught",
  遠距教學課程: "Distance learning",
  跨校: "Interuniversity",
  程式設計課程: "Programming",
};
export const semesterLabel = (s, zh = true) =>
  s === "ALL"
    ? zh
      ? "全部學期"
      : "All semesters"
    : zh
      ? `${s.slice(0, -1)} 學年 第 ${s.slice(-1)} 學期`
      : `Year ${s.slice(0, -1)} · Semester ${s.slice(-1)}`;
const option = (value, label) => ({ value, label });

export default function Workspace({ controller }) {
  const { lang, darkMode } = controller;
  return (
    <ConfigProvider
      locale={lang === "zh" ? zhTW : enUS}
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#318257",
          colorInfo: "#318257",
          colorSuccess: "#389e0d",
          colorLink: darkMode ? "#95de64" : "#237804",
          colorPrimaryText: darkMode ? "#95de64" : "#237804",
          borderRadius: 8,
          fontSize: 14,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", "Microsoft JhengHei", sans-serif',
        },
        components: {
          Button: { primaryColor: "#ffffff" },
          Layout: {
            siderBg: darkMode ? "#141414" : "#ffffff",
            headerBg: darkMode ? "#141414" : "#ffffff",
          },
          Menu: {
            itemBg: darkMode ? "#141414" : "#ffffff",
            itemColor: darkMode ? "#d9d9d9" : "#262626",
            itemSelectedBg: darkMode ? "#262626" : "#f0f0f0",
            itemSelectedColor: darkMode ? "#d9f7be" : "#262626",
            itemHoverBg: darkMode ? "#1f1f1f" : "#f5f5f5",
            subMenuItemBg: darkMode ? "#1f1f1f" : "#f5f5f5",
            subMenuItemSelectedColor: darkMode ? "#b7eb8f" : "#389e0d",
            itemHeight: 44,
            itemBorderRadius: 8,
            itemMarginBlock: 4,
            itemMarginInline: 8,
          },
        },
      }}
    >
      <AntApp>
        <Planner controller={controller} />
      </AntApp>
    </ConfigProvider>
  );
}

function Planner({ controller: c }) {
  const {
    designSystem,
    setDesignSystem,
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
    isCourseCompleted,
    handleToggleCompleted,
    scheduleStats,
    gradProgress,
    slotLookup,
  } = c;
  const zh = lang === "zh",
    L = (a, b) => (zh ? a : b);
  const { token } = theme.useToken(),
    { message, modal } = AntApp.useApp(),
    screens = Grid.useBreakpoint();
  const mobile = !screens.lg;
  const [navOpen, setNavOpen] = useState(false),
    [view, setView] = useState("table"),
    [day, setDay] = useState(1),
    [calendarView, setCalendarView] = useState(() =>
      window.innerWidth < 992 ? "day" : "week",
    ),
    [createOpen, setCreateOpen] = useState(false),
    [adminMode, setAdminMode] = useState("catalog"),
    [authBusy, setAuthBusy] = useState(false),
    [authError, setAuthError] = useState(""),
    [importBusy, setImportBusy] = useState(false);
  useEffect(() => {
    if (toast) {
      message.open({
        type:
          toast.type === "error"
            ? "error"
            : toast.type === "success"
              ? "success"
              : "info",
        content: toast.message,
        duration: 5,
      });
      setToast(null);
    }
  }, [toast]);
  useEffect(() => {
    document.documentElement.lang = zh ? "zh-Hant" : "en";
  }, [zh]);
  const routes = ["search", "schedule", "progress", "admin", "auth"];
  useEffect(() => {
    const sync = () => {
      const key = window.location.hash.slice(2);
      if (routes.includes(key)) setActiveTab(key);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const go = (id) => {
    setActiveTab(id);
    setNavOpen(false);
    window.location.hash = `/${id}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const setFilter = (key, value) =>
    setFilters((p) => ({ ...p, [key]: value, page: 1 }));
  const names = zh
    ? ["", "週一", "週二", "週三", "週四", "週五", "週六", "週日"]
    : ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const name = (x) => (zh ? x.name_zh : x.name_en || x.name_zh),
    cat = (x) => (zh ? x : categoryEN[x] || x);
  const planned = (x) => allSchedule.some((s) => s.id === x.id);
  const conflict = (x) =>
    allSchedule.find(
      (s) =>
        s.id !== x.id &&
        s.semester === x.semester &&
        s.weekday === x.weekday &&
        (s.period_mask & x.period_mask) > 0,
    );
  const eligibility = (x) =>
    x.eligibility?.eligible === false
      ? zh
        ? x.eligibility.reason_zh
        : x.eligibility.reason_en
      : conflict(x)
        ? L(
            `與「${conflict(x).name_zh}」衝堂`,
            `Conflicts with ${name(conflict(x))}`,
          )
        : "";
  const remove = (x) =>
    modal.confirm({
      title: L("移除這門預排課程？", "Remove this planned course?"),
      content: L(
        `「${x.name_zh}」會從預排課表移除，不影響已修備註。`,
        `Remove ${name(x)} from your plan?`,
      ),
      okText: L("移除預排", "Remove"),
      cancelText: L("保留", "Keep"),
      onOk: () => handleRemoveFromSchedule(x.id),
    });
  const deleteCourse = (x) =>
    modal.confirm({
      title: L("永久刪除課程？", "Permanently delete this course?"),
      content: L(
        `「${x.name_zh}」及關聯預排資料會永久移除，無法從本系統復原。`,
        `This permanently deletes ${name(x)} and linked planned records.`,
      ),
      okText: L("永久刪除", "Delete permanently"),
      cancelText: L("取消", "Cancel"),
      okButtonProps: { danger: true },
      onOk: () => handleAdminDelete(x.id),
    });
  const doShare = () =>
    modal.confirm({
      title: L("建立課表分享連結", "Create a schedule sharing link"),
      content: L(
        "持有連結的人可查看這份課程清單，不包含姓名或學號。確定要建立嗎？",
        "Anyone with the link can see the course list. Names and student IDs are excluded.",
      ),
      okText: L("建立連結", "Create link"),
      cancelText: L("取消", "Cancel"),
      onOk: handleShareSchedule,
    });
  const courseTags = (x) => (
    <Space size={[4, 4]} wrap>
      <Tag color={x.category?.includes("必修") ? "green" : "geekblue"}>
        {cat(x.category)}
      </Tag>
      {x.programs?.map((p) => (
        <Tag key={p.code}>{zh ? p.name : p.name_en}</Tag>
      ))}
      {x.exemption_note_zh && (
        <Tag color="gold">{L("可抵免", "Exemption")}</Tag>
      )}
      {isCourseCompleted(x) && (
        <Tag color="green">{L("已備註修過", "Self-reported")}</Tag>
      )}
    </Space>
  );
  const actions = (x) => {
    const added = planned(x),
      reason = eligibility(x);
    return (
      <Space wrap size={8}>
        <Tooltip title={reason}>
          <Button
            type={added ? "default" : "primary"}
            icon={added ? <CheckOutlined /> : <PlusOutlined />}
            disabled={!added && !!reason}
            loading={busy}
            onClick={() => (added ? remove(x) : handleAddToSchedule(x.id))}
          >
            {added
              ? L("已預排", "Planned")
              : reason
                ? L("無法加入", "Unavailable")
                : L("加入預排", "Add to plan")}
          </Button>
        </Tooltip>
        <Tooltip
          title={L(
            "自行備註修過，非正式成績",
            "Self-reported completion, not a verified grade",
          )}
        >
          <Button
            aria-label={L(
              `${isCourseCompleted(x) ? "取消" : "加入"}已修備註 ${x.name_zh}`,
              `Toggle self-reported completion for ${name(x)}`,
            )}
            icon={<BookOutlined />}
            type={isCourseCompleted(x) ? "primary" : "text"}
            ghost={isCourseCompleted(x)}
            onClick={() => handleToggleCompleted(x)}
          />
        </Tooltip>
      </Space>
    );
  };
  const courseTitle = (x) => (
    <Space orientation="vertical" size={3}>
      <Button
        type="link"
        className="course-name"
        onClick={() => setSelectedCourse(x)}
      >
        {name(x)}
      </Button>
      <Text type="secondary" className="course-code">
        {x.code}
      </Text>
    </Space>
  );
  const pagination = {
    current: filters.page,
    pageSize: 10,
    total: courseResult.total,
    showSizeChanger: false,
    hideOnSinglePage: true,
    showTotal: (total) => L(`共 ${total} 門課程`, `${total} courses`),
    onChange: (page) => setFilters((p) => ({ ...p, page })),
    size: mobile ? "small" : "default",
    simple: !screens.sm,
  };
  const semesterOptions = meta.semesters.map((s) =>
    option(s, semesterLabel(s, zh)),
  );
  const scope = (
    <Select
      aria-label={L("規劃學期", "Planning semester")}
      value={planningSemester}
      options={semesterOptions}
      onChange={setPlanningSemester}
      style={{ minWidth: 200 }}
    />
  );
  const navItems = [
    {
      key: "search",
      icon: <SearchOutlined />,
      label: L("課程探索", "Explore courses"),
    },
    {
      key: "schedule",
      icon: <CalendarOutlined />,
      label: (
        <Flex justify="space-between" align="center">
          <span>{L("我的課表", "My schedule")}</span>
          <Badge count={allSchedule.length} showZero color="#78ad87" />
        </Flex>
      ),
    },
    {
      key: "progress",
      icon: <TrophyOutlined />,
      label: L("修課進度", "Learning progress"),
    },
    { type: "divider" },
    {
      key: "admin-group",
      icon: <SettingOutlined />,
      label: L("課程管理", "Course management"),
      children: [
        { key: "admin-catalog", label: L("課程資料", "Course catalog") },
        { key: "admin-import", label: L("批次匯入", "Batch import") },
      ],
    },
    { key: "auth", icon: <UserOutlined />, label: L("我的帳號", "My account") },
  ];
  const nav = (
    <>
      <div className="brand">
        <ReadOutlined style={{ fontSize: 28, color: token.colorPrimary }} />
        <div>
          <strong>{L("北護課程規劃", "NTUNHS Planner")}</strong>
          <small>COURSE WORKSPACE</small>
        </div>
      </div>
      <Menu
        mode="inline"
        theme="light"
        selectedKeys={[
          activeTab === "admin" ? `admin-${adminMode}` : activeTab,
        ]}
        defaultOpenKeys={["admin-group"]}
        items={navItems}
        onClick={({ key }) => {
          if (key.startsWith("admin-")) {
            setAdminMode(key.slice(6));
            go("admin");
          } else go(key);
        }}
      />
      <div className="sider-note">
        <SafetyCertificateOutlined />
        <p>
          {L(
            "每一步規劃，都更靠近目標。",
            "Every plan is a step toward your goals.",
          )}
        </p>
        <Text style={{ color: token.colorTextSecondary, fontSize: 12 }}>
          {L("預排計畫不等同正式選課", "Planning is not official registration")}
        </Text>
      </div>
    </>
  );
  const titles = {
    search: [
      L("課程探索", "Explore courses"),
      L(
        "找到想學的課，排出適合自己的節奏。",
        "Discover what you want to learn. Plan a semester that fits.",
      ),
    ],
    schedule: [
      L("我的課表", "My schedule"),
      L(
        "安排學期節奏，從空堂找到下一門課。",
        "Build your weekly rhythm and find courses for open slots.",
      ),
    ],
    progress: [
      L("修課進度", "Learning progress"),
      L(
        "看見累積，也看見下一步。",
        "See how far you have come, and plan your next step.",
      ),
    ],
    admin: [
      L("課程管理", "Course management"),
      L(
        "集中維護開課資料與批次匯入。",
        "Manage the course catalog and batch imports.",
      ),
    ],
    auth: [
      L("我的帳號", "My account"),
      L(
        "登入，讓學習計畫接著走。",
        "Sign in and keep your learning plan moving.",
      ),
    ],
  };
  const courseColumns = [
    {
      title: L("課程", "Course"),
      key: "course",
      width: 280,
      render: (_, x) => (
        <Space orientation="vertical" size={8}>
          {courseTitle(x)}
          {courseTags(x)}
        </Space>
      ),
    },
    {
      title: L("學分", "Credits"),
      dataIndex: "credits",
      width: 65,
      align: "center",
    },
    {
      title: L("教師與時間", "Instructor & time"),
      key: "time",
      width: 200,
      render: (_, x) => (
        <Space orientation="vertical" size={4}>
          <Button
            type="link"
            size="small"
            className="teacher-link"
            onClick={() =>
              setSelectedTeacher(
                x.teacher || { name: x.teacher_name, name_en: x.teacher_en },
              )
            }
          >
            {zh ? x.teacher_name : x.teacher_en || x.teacher_name}
          </Button>
          <Text>
            <ClockCircleOutlined /> {names[x.weekday]} {x.periods}
          </Text>
          <Text type="secondary">
            <EnvironmentOutlined /> {x.room || L("未定", "TBA")}
          </Text>
          <Text type="secondary">{semesterLabel(x.semester, zh)}</Text>
        </Space>
      ),
    },
    {
      title: L("預排操作", "Plan"),
      key: "action",
      width: 185,
      render: (_, x) => (
        <Space orientation="vertical" size={8}>
          {actions(x)}
          {eligibility(x) && (
            <Text type="danger">
              <InfoCircleOutlined /> {eligibility(x)}
            </Text>
          )}
        </Space>
      ),
    },
  ];
  const renderCards = () => (
    <List
      grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 3 }}
      dataSource={courseResult.items}
      loading={loadingCourses}
      pagination={pagination}
      locale={{
        emptyText: (
          <Empty
            description={L(
              "沒有符合的課程，試試放寬篩選條件。",
              "No matching courses. Try broadening your filters.",
            )}
          >
            <Button onClick={handleResetFilters}>
              {L("重設篩選", "Reset filters")}
            </Button>
          </Empty>
        ),
      }}
      renderItem={(x) => (
        <List.Item>
          <Card
            className="course-card"
            title={courseTitle(x)}
            extra={
              <Tag color="green">
                {x.credits} {L("學分", "cr")}
              </Tag>
            }
            actions={[<span key="plan">{actions(x)}</span>]}
          >
            <Space orientation="vertical" size={14} style={{ width: "100%" }}>
              {courseTags(x)}
              <Space orientation="vertical" size={5}>
                <Button
                  className="teacher-link"
                  type="link"
                  size="small"
                  icon={<UserOutlined />}
                  onClick={() =>
                    setSelectedTeacher(
                      x.teacher || {
                        name: x.teacher_name,
                        name_en: x.teacher_en,
                      },
                    )
                  }
                >
                  {zh ? x.teacher_name : x.teacher_en || x.teacher_name}
                </Button>
                <Text>
                  <ClockCircleOutlined /> {names[x.weekday]} {x.periods}
                </Text>
                <Text type="secondary">
                  <EnvironmentOutlined /> {x.room || L("未定", "TBA")} ·{" "}
                  {semesterLabel(x.semester, zh)}
                </Text>
              </Space>
              {eligibility(x) && (
                <Alert type="warning" showIcon title={eligibility(x)} />
              )}
            </Space>
          </Card>
        </List.Item>
      )}
    />
  );
  const stats = (
    <Row gutter={[24, 16]} className="summary-statistics">
      <Col xs={24} sm={8}>
        <Statistic
          title={L("目前查詢課程", "Courses found")}
          value={courseResult.total}
          suffix={<Text type="secondary">{L("門", "courses")}</Text>}
        />
      </Col>
      <Col xs={12} sm={8}>
        <Statistic
          title={L("本學期預排", "Planned this semester")}
          value={scheduleStats.total}
          suffix={<Text type="secondary">{L("學分", "cr")}</Text>}
        />
      </Col>
      <Col xs={12} sm={8}>
        <Statistic
          title={L("自行備註已修", "Self-reported credits")}
          value={gradProgress.completedTotal}
          suffix={<Text type="secondary">{L("學分", "cr")}</Text>}
        />
      </Col>
    </Row>
  );
  const activeFilters = [
    filters.weekday && {
      key: "weekday",
      label: names[Number(filters.weekday)],
    },
    filters.grade && {
      key: "grade",
      label: L(`${filters.grade} 年級`, `Grade ${filters.grade}`),
    },
    filters.tag !== "ALL" && {
      key: "tag",
      label: zh ? filters.tag : tagEN[filters.tag],
    },
    filters.program !== "ALL" && {
      key: "program",
      label:
        meta.programs.find((p) => p.code === filters.program)?.[
          zh ? "name" : "name_en"
        ] || filters.program,
    },
    filters.periods.length > 0 && {
      key: "periods",
      label: L(
        `第 ${filters.periods.join("、")} 節`,
        `Periods ${filters.periods.join(", ")}`,
      ),
    },
    filters.hideConflicts && {
      key: "hideConflicts",
      label: L("隱藏衝堂", "Hide conflicts"),
    },
  ].filter(Boolean);
  const filtersForm = (
    <Form layout="vertical" onFinish={fetchCourses}>
      <Input.Search
        aria-label={L("課程關鍵字", "Course keyword")}
        placeholder={L(
          "搜尋課名、課程代碼或授課教師",
          "Search course, code or instructor",
        )}
        value={filters.keyword}
        onChange={(e) => setFilter("keyword", e.target.value)}
        onSearch={fetchCourses}
        enterButton={L("搜尋", "Search")}
        allowClear
        size="large"
      />
      <Row gutter={16} style={{ marginTop: 20 }}>
        <Col xs={24} sm={8}>
          <Form.Item label={L("查詢學期", "Search semester")}>
            <Select
              aria-label={L("查詢學期", "Search semester")}
              value={filters.semester}
              options={[
                option("ALL", L("全部學期", "All semesters")),
                ...semesterOptions,
              ]}
              onChange={(v) => setFilter("semester", v)}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item label={L("開課系所", "Department")}>
            <Select
              aria-label={L("開課系所", "Department")}
              showSearch
              optionFilterProp="label"
              value={filters.department}
              options={[
                option("ALL", L("全部系所", "All departments")),
                ...meta.departments.map((d) =>
                  option(d, zh ? d : departmentEN[d] || d),
                ),
              ]}
              onChange={(v) => setFilter("department", v)}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item label={L("課程類別", "Category")}>
            <Select
              aria-label={L("課程類別", "Category")}
              value={filters.category}
              options={[
                option("ALL", L("全部課別", "All categories")),
                ...meta.categories.map((v) => option(v, cat(v))),
              ]}
              onChange={(v) => setFilter("category", v)}
            />
          </Form.Item>
        </Col>
      </Row>
      <Collapse
        ghost
        items={[
          {
            key: "advanced",
            label: (
              <Space>
                <FilterOutlined />
                {L("進階篩選", "Advanced filters")}
              </Space>
            ),
            children: (
              <>
                <Row gutter={16}>
                  {[
                    {
                      label: L("年級", "Grade"),
                      key: "grade",
                      options: [
                        option("", L("全部年級", "All grades")),
                        ...[1, 2, 3, 4].map((g) =>
                          option(String(g), L(`${g} 年級`, `Grade ${g}`)),
                        ),
                      ],
                    },
                    {
                      label: L("課程分類", "Course tag"),
                      key: "tag",
                      options: [
                        option("ALL", L("不限分類", "All tags")),
                        ...Object.keys(tagEN).map((t) =>
                          option(t, zh ? t : tagEN[t]),
                        ),
                      ],
                    },
                    {
                      label: L("跨系學程", "Program"),
                      key: "program",
                      options: [
                        option("ALL", L("不限學程", "All programs")),
                        ...meta.programs.map((p) =>
                          option(p.code, zh ? p.name : p.name_en),
                        ),
                      ],
                    },
                    {
                      label: L("上課星期", "Weekday"),
                      key: "weekday",
                      options: [
                        option("", L("全部星期", "All days")),
                        ...DAYS.map((d) => option(String(d), names[d])),
                      ],
                    },
                    {
                      label: L("節次匹配", "Period matching"),
                      key: "matchMode",
                      options: [
                        option(
                          "strict",
                          L("所有節次均符合", "All periods fit"),
                        ),
                        option(
                          "flexible",
                          L("任一節次重疊", "Any period overlaps"),
                        ),
                      ],
                    },
                  ].map((f) => (
                    <Col xs={24} sm={12} md={8} key={f.key}>
                      <Form.Item label={f.label}>
                        <Select
                          aria-label={f.label}
                          value={filters[f.key]}
                          options={f.options}
                          onChange={(v) => setFilter(f.key, v)}
                        />
                      </Form.Item>
                    </Col>
                  ))}
                </Row>
                <Form.Item
                  label={L("指定節次", "Select periods")}
                  extra={
                    filters.matchMode === "strict"
                      ? L(
                          "例如選第5節，不會包含5–7節的課；選5、6、7節才符合。",
                          "All course periods must fit your selection. A P5–7 course needs 5, 6 and 7 selected.",
                        )
                      : L(
                          "例如選第5節，也會找到5–7節的課。",
                          "Selecting P5 also finds P5–7 courses.",
                        )
                  }
                >
                  <Space size={[8, 8]} wrap>
                    {PERIODS.map((p) => (
                      <Button
                        key={p}
                        type={
                          filters.periods.includes(p) ? "primary" : "default"
                        }
                        aria-pressed={filters.periods.includes(p)}
                        aria-label={L(`第${p}節`, `Period ${p}`)}
                        onClick={() => togglePeriodFilter(p)}
                      >
                        {p}
                      </Button>
                    ))}
                  </Space>
                </Form.Item>
                <Checkbox
                  checked={filters.hideConflicts}
                  onChange={(e) => setFilter("hideConflicts", e.target.checked)}
                >
                  {L(
                    "隱藏與我的預排衝堂的課程",
                    "Hide courses conflicting with my plan",
                  )}
                </Checkbox>
              </>
            ),
          },
        ]}
      />
      {activeFilters.length > 0 && (
        <Space wrap size={[6, 8]} style={{ marginTop: 16 }}>
          <Text type="secondary">{L("已套用：", "Applied:")}</Text>
          {activeFilters.map((f) => (
            <Tag
              key={f.key}
              closable
              onClose={() => {
                const empty =
                  f.key === "periods"
                    ? []
                    : f.key === "hideConflicts"
                      ? false
                      : ["tag", "program"].includes(f.key)
                        ? "ALL"
                        : "";
                setFilter(f.key, empty);
              }}
            >
              {f.label}
            </Tag>
          ))}
        </Space>
      )}
    </Form>
  );
  const planAside = (
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
      <Card
        title={
          <Space>
            <CalendarOutlined />
            {L("學期計畫", "Semester plan")}
          </Space>
        }
        extra={
          <Button type="link" size="small" onClick={() => go("schedule")}>
            {L("查看課表", "View")}
          </Button>
        }
      >
        <Space orientation="vertical" size={20} style={{ width: "100%" }}>
          <div>
            <Text type="secondary">{L("規劃學期", "Planning semester")}</Text>
            <div style={{ marginTop: 8 }}>{scope}</div>
          </div>
          <Statistic
            title={L("預排學分", "Planned credits")}
            value={scheduleStats.total}
            suffix={<Text type="secondary">/ 25</Text>}
          />
          <Progress
            percent={Math.min(
              100,
              Math.round((scheduleStats.total / 25) * 100),
            )}
            showInfo={false}
          />
          <Flex justify="space-between">
            <Text>
              {L("必修", "Required")} <b>{scheduleStats.req}</b>
            </Text>
            <Text>
              {L("選修", "Electives")} <b>{scheduleStats.elec}</b>
            </Text>
          </Flex>
          <Divider style={{ margin: 0 }} />
          {!user ? (
            <Empty
              image={
                <LoginOutlined
                  style={{ fontSize: 36, color: token.colorPrimary }}
                />
              }
              description={
                <>
                  <Text strong>
                    {L("登入，開始你的新學期", "Sign in to start planning")}
                  </Text>
                  <Paragraph type="secondary" style={{ marginTop: 8 }}>
                    {L(
                      "儲存預排課表，隨時接續你的計畫。",
                      "Save your plan and pick up where you left off.",
                    )}
                  </Paragraph>
                </>
              }
            >
              <Button
                type="primary"
                block
                icon={<LoginOutlined />}
                onClick={() => go("auth")}
              >
                {L("登入並開始規劃", "Sign in to plan")}
              </Button>
            </Empty>
          ) : schedule.length ? (
            <List
              size="small"
              dataSource={schedule}
              renderItem={(x) => (
                <List.Item
                  actions={[
                    <Button
                      key="remove"
                      type="text"
                      icon={<CloseOutlined />}
                      aria-label={L(`移除 ${x.name_zh}`, `Remove ${name(x)}`)}
                      onClick={() => remove(x)}
                    />,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Button
                        type="link"
                        className="course-name"
                        onClick={() => setSelectedCourse(x)}
                      >
                        {name(x)}
                      </Button>
                    }
                    description={`${names[x.weekday]} ${x.periods} · ${x.credits} ${L("學分", "cr")}`}
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={L(
                "還沒有預排課程，試著加入一門課。",
                "Your plan is empty. Add your first course.",
              )}
            />
          )}
          <Text type="secondary" style={{ fontSize: 12 }}>
            <SafetyCertificateOutlined />{" "}
            {L(
              "這是預排計畫，尚未提交正式選課。",
              "A plan only. No official registration is submitted.",
            )}
          </Text>
          <Divider style={{ margin: 0 }} />
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            <InfoCircleOutlined />{" "}
            {L(
              "點選課表空堂，可直接找到該時段的課程。",
              "Select an empty schedule slot to find courses for that time.",
            )}
          </Paragraph>
        </Space>
      </Card>
    </Space>
  );
  const progressRows = [
    ["all", L("總修課學分", "Total credits"), gradProgress.total, 128],
    ["genReq", L("通識必修", "General required"), gradProgress.genReq, 28],
    ["profReq", L("系所專業必修", "Major required"), gradProgress.profReq, 62],
    ["profElec", L("專業選修", "Major electives"), gradProgress.profElec, 19],
    [
      "genElec",
      L("一般與通識選修", "General electives"),
      gradProgress.genElec,
      19,
    ],
    ["cross", L("跨系與跨域", "Cross-disciplinary"), gradProgress.cross, 4],
    [
      "aiProg",
      L("人工智慧應用學程", "AI Application Program"),
      gradProgress.aiProg,
      20,
    ],
    [
      "medProg",
      L("醫療資訊學程", "Medical Informatics Program"),
      gradProgress.medProg,
      20,
    ],
  ];
  const progressItems = progressRows.map(([key, label, current, target]) => ({
    key,
    label: (
      <Row align="middle" gutter={[16, 8]}>
        <Col xs={24} sm={10}>
          <Text strong>{label}</Text>
        </Col>
        <Col xs={16} sm={9}>
          <Progress
            percent={Math.min(100, Math.round((current / target) * 100))}
            showInfo={false}
          />
        </Col>
        <Col xs={8} sm={5} style={{ textAlign: "right" }}>
          <Text strong>{current}</Text>
          <Text type="secondary"> / {target}</Text>
        </Col>
      </Row>
    ),
    children: gradProgress.lists[key]?.length ? (
      <List
        size="small"
        dataSource={gradProgress.lists[key]}
        renderItem={(x) => (
          <List.Item extra={`${x.credits} ${L("學分", "cr")}`}>
            <Space>
              {x.name_zh}
              <Tag>
                {x.isPlanned
                  ? L("預排估算", "Planned")
                  : L("自行備註", "Self-reported")}
              </Tag>
            </Space>
          </List.Item>
        )}
      />
    ) : (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={L("尚無課程備註", "No recorded courses")}
      />
    ),
  }));
  const scheduleCell = (x, p, w) =>
    x ? (
      <Button
        className="calendar-course"
        block
        type="text"
        onClick={() => setSelectedCourse(x)}
        title={name(x)}
      >
        <span>{name(x)}</span>
        <small>{x.room}</small>
      </Button>
    ) : (
      <Button
        block
        type="text"
        size="small"
        icon={<PlusOutlined />}
        aria-label={L(
          `${names[w]}第${p}節找課`,
          `Find ${names[w]} P${p} courses`,
        )}
        onClick={() => {
          setFilter("semester", planningSemester);
          handleEmptySlotClick(w, p);
          go("search");
        }}
      >
        {L("找課", "Find")}
      </Button>
    );
  const weekColumns = [
    {
      title: L("節次", "Period"),
      dataIndex: "period",
      width: 68,
      fixed: "left",
      align: "center",
      render: (p) => <Text type="secondary">{p}</Text>,
    },
    ...DAYS.map((w) => ({
      title: names[w],
      key: String(w),
      width: 140,
      align: "center",
      render: (_, r) =>
        scheduleCell(slotLookup[`${w}-${r.period}`], r.period, w),
    })),
  ];
  const scheduleList = (
    <List
      dataSource={schedule.filter((x) => x.weekday === day)}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={L(
              "今天沒有預排課程",
              "No planned courses for this day",
            )}
          />
        ),
      }}
      renderItem={(x) => (
        <List.Item
          actions={[
            <Button key="remove" onClick={() => remove(x)}>
              {L("移除預排", "Remove")}
            </Button>,
          ]}
        >
          <List.Item.Meta
            title={
              <Button
                type="link"
                className="course-name"
                onClick={() => setSelectedCourse(x)}
              >
                {name(x)}
              </Button>
            }
            description={
              <Space wrap>
                <Tag color="green">
                  {L("第", "P")}
                  {x.periods}
                  {L("節", "")}
                </Tag>
                <Text>{x.room}</Text>
                <Text>
                  {x.credits} {L("學分", "cr")}
                </Text>
              </Space>
            }
          />
        </List.Item>
      )}
    />
  );
  const onAuth = async () => {
    setAuthError("");
    setAuthBusy(true);
    try {
      const result = await handleAuthSubmit({ preventDefault() {} });
      if (result?.error) setAuthError(result.error);
    } finally {
      setAuthBusy(false);
    }
  };
  return (
    <Layout className="planner-layout" style={{ minHeight: "100vh" }}>
      <a href="#main-content" className="skip-link">
        {L("跳至主要內容", "Skip to content")}
      </a>
      {screens.lg && (
        <Sider width={224} className="desktop-sider">
          {nav}
        </Sider>
      )}
      <Drawer
        title={L("北護課程規劃", "NTUNHS Planner")}
        placement="left"
        width={272}
        open={navOpen}
        onClose={() => setNavOpen(false)}
        styles={{ body: { padding: 0, background: token.colorBgContainer } }}
      >
        {nav}
      </Drawer>
      <Layout className={screens.lg ? "with-sider" : ""}>
        <Header
          className="workspace-header"
          style={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}
        >
          <Flex align="center" justify="space-between" gap={12}>
            <Space>
              {!screens.lg && (
                <Button
                  type="text"
                  icon={<MenuOutlined />}
                  aria-label={L("開啟導覽", "Open navigation")}
                  onClick={() => setNavOpen(true)}
                />
              )}
              <Text type="secondary" className="workspace-label">
                {L("學習工作台", "Workspace")}
              </Text>
              <Text strong>{titles[activeTab]?.[0]}</Text>
            </Space>
            <Space size={mobile ? 4 : 12}>
              <Select
                aria-label={L("介面版本", "Interface version")}
                value={designSystem}
                onChange={setDesignSystem}
                style={{ width: mobile ? 115 : 160 }}
                options={[
                  { value: "material", label: "Material Design" },
                  { value: "ant", label: "Ant Design" },
                ]}
              />

              <Tooltip
                title={
                  darkMode
                    ? L("淺色模式", "Light mode")
                    : L("深色模式", "Dark mode")
                }
              >
                <Button
                  type="text"
                  icon={darkMode ? <SunOutlined /> : <MoonOutlined />}
                  aria-label={
                    darkMode
                      ? L("切換淺色模式", "Switch to light mode")
                      : L("切換深色模式", "Switch to dark mode")
                  }
                  onClick={() => setDarkMode(!darkMode)}
                />
              </Tooltip>
              <Button
                type="text"
                icon={<GlobalOutlined />}
                onClick={() => setLang(zh ? "en" : "zh")}
              >
                {zh ? "EN" : "中文"}
              </Button>
              {user ? (
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: "account",
                        label: L("我的帳號", "My account"),
                        icon: <UserOutlined />,
                        onClick: () => go("auth"),
                      },
                      {
                        key: "logout",
                        label: L("登出", "Sign out"),
                        icon: <LogoutOutlined />,
                        onClick: handleLogout,
                      },
                    ],
                  }}
                  trigger={["click"]}
                >
                  <Button type="text">
                    <Avatar
                      size="small"
                      style={{ background: token.colorPrimary }}
                    >
                      {user.name?.slice(0, 1)}
                    </Avatar>
                    <span className="user-name">{user.name}</span>
                  </Button>
                </Dropdown>
              ) : (
                <Button
                  type="primary"
                  icon={<LoginOutlined />}
                  onClick={() => go("auth")}
                >
                  {L("登入", "Sign in")}
                </Button>
              )}
            </Space>
          </Flex>
        </Header>
        <Content id="main-content" className="workspace-content">
          <div className="page-heading">
            <div>
              <Text type="secondary">
                NTUNHS · {L("讓學習有方向", "LEARN WITH INTENTION")}
              </Text>
              <Title level={2}>{titles[activeTab]?.[0]}</Title>
              <Paragraph type="secondary">{titles[activeTab]?.[1]}</Paragraph>
            </div>
            {["schedule", "progress"].includes(activeTab) && scope}
          </div>
          {sharedView && (
            <Card
              title={
                <Space>
                  <ShareAltOutlined />
                  {L("分享的課表", "Shared schedule")}
                  <Tag>{semesterLabel(sharedView.semester, zh)}</Tag>
                </Space>
              }
              extra={
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  aria-label={L("關閉分享預覽", "Close shared preview")}
                  onClick={() => setSharedView(null)}
                />
              }
              style={{ marginBottom: 24 }}
            >
              <Alert
                showIcon
                type="info"
                title={L(
                  "僅顯示課程，不包含姓名或學號。",
                  "Courses only. No names or student IDs.",
                )}
                style={{ marginBottom: 16 }}
              />
              <List
                dataSource={sharedView.items}
                renderItem={(x) => (
                  <List.Item>
                    <Button type="link" onClick={() => setSelectedCourse(x)}>
                      {name(x)}
                    </Button>
                    <Text>
                      {names[x.weekday]} {x.periods} · {x.room}
                    </Text>
                  </List.Item>
                )}
              />
            </Card>
          )}
          {activeTab === "search" && (
            <Space orientation="vertical" size={24} style={{ width: "100%" }}>
              {stats}
              <Row gutter={[24, 24]}>
                <Col xs={24} xl={17}>
                  <Space
                    orientation="vertical"
                    size={24}
                    style={{ width: "100%" }}
                  >
                    <Card
                      title={
                        <Space>
                          <SearchOutlined />
                          {L("找到適合你的課", "Find your next course")}
                        </Space>
                      }
                      extra={
                        <Button
                          type="text"
                          icon={<ReloadOutlined />}
                          onClick={handleResetFilters}
                        >
                          {L("重設", "Reset")}
                        </Button>
                      }
                    >
                      {filtersForm}
                    </Card>
                    <Card
                      title={
                        <Space>
                          {L("課程列表", "Courses")}
                          <Tag color="green">{courseResult.total}</Tag>
                        </Space>
                      }
                      extra={
                        screens.md && (
                          <Segmented
                            aria-label={L("檢視方式", "Result view")}
                            value={view}
                            onChange={setView}
                            options={[
                              {
                                value: "table",
                                icon: <UnorderedListOutlined />,
                                label: L("列表", "List"),
                              },
                              {
                                value: "cards",
                                icon: <AppstoreOutlined />,
                                label: L("卡片", "Cards"),
                              },
                            ]}
                          />
                        )
                      }
                    >
                      <Tabs
                        size="small"
                        activeKey={filters.category}
                        onChange={(v) => setFilter("category", v)}
                        items={["ALL", ...meta.categories].map((v) => ({
                          key: v,
                          label:
                            v === "ALL" ? L("全部課程", "All courses") : cat(v),
                        }))}
                      />
                      {courseError ? (
                        <Result
                          status="warning"
                          title={L("無法載入課程", "Could not load courses")}
                          subTitle={courseError}
                          extra={
                            <Button type="primary" onClick={fetchCourses}>
                              {L("重新載入", "Try again")}
                            </Button>
                          }
                        />
                      ) : screens.md && view === "table" ? (
                        <Table
                          aria-label={L("課程列表", "Course results")}
                          columns={courseColumns}
                          dataSource={courseResult.items}
                          rowKey="id"
                          loading={loadingCourses}
                          pagination={pagination}
                          scroll={{ x: 760 }}
                          locale={{
                            emptyText: (
                              <Empty
                                description={L(
                                  "沒有符合條件的課程",
                                  "No matching courses",
                                )}
                              >
                                <Button onClick={handleResetFilters}>
                                  {L("重設篩選", "Reset filters")}
                                </Button>
                              </Empty>
                            ),
                          }}
                        />
                      ) : (
                        renderCards()
                      )}
                    </Card>
                  </Space>
                </Col>
                <Col xs={24} xl={7}>
                  <div className="plan-aside">{planAside}</div>
                </Col>
              </Row>
            </Space>
          )}
          {activeTab === "schedule" && (
            <Space orientation="vertical" size={24} style={{ width: "100%" }}>
              <Alert
                type="info"
                showIcon
                title={L(
                  "預排課表僅供規劃，不會提交正式選課。",
                  "This is a planning schedule. No official registration is submitted.",
                )}
                action={
                  !user ? (
                    <Button size="small" onClick={() => go("auth")}>
                      {L("登入儲存", "Sign in to save")}
                    </Button>
                  ) : null
                }
              />
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={8}>
                  <Card>
                    <Statistic
                      title={L("預排課程", "Planned courses")}
                      value={schedule.length}
                      suffix={L("門", "courses")}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={8}>
                  <Card>
                    <Statistic
                      title={L("預排總學分", "Planned credits")}
                      value={scheduleStats.total}
                      suffix="/ 25"
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card>
                    <Flex justify="space-around">
                      <Statistic
                        title={L("必修學分", "Required")}
                        value={scheduleStats.req}
                      />
                      <Statistic
                        title={L("選修學分", "Electives")}
                        value={scheduleStats.elec}
                      />
                    </Flex>
                  </Card>
                </Col>
              </Row>
              <Card
                title={semesterLabel(planningSemester, zh)}
                extra={
                  <Space>
                    <Button
                      icon={<SearchOutlined />}
                      onClick={() => go("search")}
                    >
                      {L("找課", "Find courses")}
                    </Button>
                    <Button
                      disabled={!user}
                      icon={<ShareAltOutlined />}
                      onClick={doShare}
                    >
                      {L("分享課表", "Share")}
                    </Button>
                  </Space>
                }
              >
                <Space
                  orientation="vertical"
                  size={20}
                  style={{ width: "100%" }}
                >
                  <Flex justify="space-between" wrap gap={12}>
                    <Text type="secondary">
                      {L(
                        "點選空堂，即可查詢該時段的課程。支援週末與晚間。",
                        "Select an empty slot to find courses. Includes weekends and evenings.",
                      )}
                    </Text>
                    <Segmented
                      aria-label={L("課表檢視", "Schedule view")}
                      options={[
                        { value: "week", label: L("整週", "Week") },
                        { value: "day", label: L("每日", "Day") },
                      ]}
                      value={calendarView}
                      onChange={setCalendarView}
                    />
                  </Flex>
                  {calendarView === "day" ? (
                    <>
                      <Tabs
                        activeKey={String(day)}
                        onChange={(v) => setDay(Number(v))}
                        items={DAYS.map((d) => ({
                          key: String(d),
                          label: names[d],
                        }))}
                      />
                      {scheduleList}
                      <Collapse
                        ghost
                        items={[
                          {
                            key: "find",
                            label: L(
                              "依空堂找課",
                              "Find courses in an empty period",
                            ),
                            children: (
                              <Space wrap>
                                {PERIODS.map((p) => (
                                  <Button
                                    key={p}
                                    onClick={() => {
                                      setFilter("semester", planningSemester);
                                      handleEmptySlotClick(day, p);
                                      go("search");
                                    }}
                                  >
                                    {L(`第${p}節`, `P${p}`)}
                                  </Button>
                                ))}
                              </Space>
                            ),
                          },
                        ]}
                      />
                    </>
                  ) : (
                    <Table
                      className="week-table"
                      columns={weekColumns}
                      dataSource={PERIODS.map((period) => ({
                        period,
                        key: period,
                      }))}
                      pagination={false}
                      size="small"
                      bordered
                      scroll={{ x: 1048 }}
                    />
                  )}
                </Space>
              </Card>
            </Space>
          )}
          {activeTab === "progress" && (
            <Space orientation="vertical" size={24} style={{ width: "100%" }}>
              <Alert
                showIcon
                type="warning"
                title={L(
                  "這是自行備註與預排估算，不是正式成績或畢業審查結果。",
                  "Self-reported progress and planning estimates, not verified grades or graduation approval.",
                )}
                description={L(
                  "門檻沿用原系統資管系113學年設定，請以所屬系所與入學年度規定核對；兩個學程擇一20學分為原介面設定。",
                  "Targets follow the original IM year-113 assumptions. Verify your department and admission-year rules; 20-credit program targets are inherited assumptions.",
                )}
              />
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={8}>
                  <Card title={L("累積你的學習", "Your learning journey")}>
                    <Flex vertical align="center" gap={24}>
                      <Progress
                        type="circle"
                        percent={Math.min(
                          100,
                          Math.round((gradProgress.total / 128) * 100),
                        )}
                        format={() => (
                          <div>
                            <strong>{gradProgress.total}</strong>
                            <div style={{ fontSize: 14 }}>
                              {" "}
                              / 128 {L("學分", "cr")}
                            </div>
                          </div>
                        )}
                      />
                      <Descriptions
                        column={1}
                        size="small"
                        items={[
                          {
                            key: "done",
                            label: L("自行備註已修", "Self-reported"),
                            children: `${gradProgress.completedTotal} ${L("學分", "cr")}`,
                          },
                          {
                            key: "plan",
                            label: L("本學期預排", "Planned this semester"),
                            children: `${gradProgress.plannedCredits} ${L("學分", "cr")}`,
                          },
                          {
                            key: "left",
                            label: L("距總門檻尚缺", "Remaining to target"),
                            children: `${Math.max(128 - gradProgress.total, 0)} ${L("學分", "cr")}`,
                          },
                        ]}
                      />
                      <Checkbox
                        checked={includePlannedInGrad}
                        onChange={(e) =>
                          setIncludePlannedInGrad(e.target.checked)
                        }
                      >
                        {L(
                          "納入本學期預排模擬",
                          "Include this semester’s planned courses",
                        )}
                      </Checkbox>
                    </Flex>
                  </Card>
                </Col>
                <Col xs={24} lg={16}>
                  <Card
                    title={L("各類學分進度", "Credit progress by category")}
                  >
                    <Collapse ghost items={progressItems} />
                  </Card>
                </Col>
              </Row>
              <Card title={L("額外學分調整", "Additional credit adjustments")}>
                <Paragraph type="secondary">
                  {L(
                    "未收錄課程可於此手動估算；只影響目前畫面的估算，不代表正式認列。",
                    "Add unlisted credits to the current estimate. This does not certify credits.",
                  )}
                </Paragraph>
                <Form layout="vertical">
                  <Row gutter={24}>
                    {[
                      [
                        "extraProfElective",
                        L("額外專業選修", "Additional major electives"),
                        60,
                      ],
                      [
                        "extraGenElective",
                        L("額外一般與通識選修", "Additional general electives"),
                        60,
                      ],
                      [
                        "extraCrossDept",
                        L("額外跨系或跨域", "Additional interdisciplinary"),
                        30,
                      ],
                    ].map(([key, label, max]) => (
                      <Col xs={24} md={8} key={key}>
                        <Form.Item label={label}>
                          <InputNumber
                            aria-label={label}
                            min={0}
                            max={max}
                            precision={0}
                            value={gradAssume[key]}
                            onChange={(v) =>
                              setGradAssume((p) => ({
                                ...p,
                                [key]: Math.max(
                                  0,
                                  Math.min(max, Number(v) || 0),
                                ),
                              }))
                            }
                            style={{ width: "100%" }}
                          />
                        </Form.Item>
                      </Col>
                    ))}
                  </Row>
                </Form>
              </Card>
            </Space>
          )}
          {activeTab === "admin" &&
            (user?.role !== "admin" ? (
              <Card>
                <Result
                  status="403"
                  title={L("需要管理者權限", "Administrator access required")}
                  subTitle={L(
                    "課程新增、編輯、刪除與批次匯入僅供管理者使用。",
                    "Creating, editing, deleting and importing courses requires an administrator account.",
                  )}
                  extra={
                    <Button
                      type="primary"
                      icon={<LoginOutlined />}
                      onClick={() => go("auth")}
                    >
                      {L("前往登入", "Sign in")}
                    </Button>
                  }
                />
              </Card>
            ) : (
              <Card
                title={L("開課資料管理", "Course catalog management")}
                extra={
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateOpen(true)}
                  >
                    {L("新增課程", "New course")}
                  </Button>
                }
              >
                <Tabs
                  activeKey={adminMode}
                  onChange={setAdminMode}
                  items={[
                    {
                      key: "catalog",
                      label: L("課程資料", "Course catalog"),
                      children: (
                        <Space
                          orientation="vertical"
                          size={20}
                          style={{ width: "100%" }}
                        >
                          {filtersForm}
                          <Table
                            columns={[
                              {
                                title: L("課程", "Course"),
                                render: (_, x) => courseTitle(x),
                                width: 250,
                              },
                              {
                                title: L("學期", "Semester"),
                                dataIndex: "semester",
                                width: 100,
                              },
                              {
                                title: L("教師", "Instructor"),
                                dataIndex: "teacher_name",
                                width: 120,
                              },
                              {
                                title: L("操作", "Actions"),
                                width: 160,
                                render: (_, x) => (
                                  <Space>
                                    <Button
                                      icon={<EditOutlined />}
                                      onClick={() => setEditingCourse({ ...x })}
                                    >
                                      {L("編輯", "Edit")}
                                    </Button>
                                    <Button
                                      danger
                                      icon={<DeleteOutlined />}
                                      aria-label={L(
                                        `刪除 ${x.name_zh}`,
                                        `Delete ${name(x)}`,
                                      )}
                                      onClick={() => deleteCourse(x)}
                                    />
                                  </Space>
                                ),
                              },
                            ]}
                            dataSource={courseResult.items}
                            rowKey="id"
                            loading={loadingCourses}
                            pagination={pagination}
                            scroll={{ x: 650 }}
                          />
                        </Space>
                      ),
                    },
                    {
                      key: "import",
                      label: L("批次匯入", "Batch import"),
                      children: (
                        <Space
                          orientation="vertical"
                          size={20}
                          style={{ width: "100%" }}
                        >
                          <Alert
                            type="info"
                            showIcon
                            title={L(
                              "貼上JSON課程陣列。重複課程代碼會略過；每筆需包含課程代碼、中文課名及教師。",
                              "Paste a JSON course array. Duplicate codes are skipped. Code, Chinese name and instructor are required.",
                            )}
                          />
                          <Paragraph code copyable>
                            {
                              '[{"code":"DEMO001","semester":"1151","name_zh":"示範課程","teacher_name":"示範教師","credits":2,"weekday":1,"periods":"3,4","room":"F601"}]'
                            }
                          </Paragraph>
                          <Input.TextArea
                            aria-label={L(
                              "JSON匯入內容",
                              "JSON import content",
                            )}
                            value={importJson}
                            onChange={(e) => setImportJson(e.target.value)}
                            rows={10}
                            placeholder={L(
                              "在此貼上課程陣列…",
                              "Paste course array here…",
                            )}
                          />
                          <Button
                            type="primary"
                            icon={<UploadOutlined />}
                            loading={importBusy}
                            disabled={!importJson.trim()}
                            onClick={() => {
                              let list;
                              try {
                                const parsed = JSON.parse(importJson);
                                list = Array.isArray(parsed)
                                  ? parsed
                                  : parsed.courses;
                                if (!Array.isArray(list) || !list.length)
                                  throw Error();
                              } catch {
                                message.error(
                                  L(
                                    "請輸入有效且非空白的課程陣列",
                                    "Enter a valid, non-empty course array",
                                  ),
                                );
                                return;
                              }
                              modal.confirm({
                                title: L(
                                  `匯入 ${list.length} 筆課程？`,
                                  `Import ${list.length} courses?`,
                                ),
                                content: L(
                                  "此操作將新增課程資料。請先確認內容正確。",
                                  "This adds catalog records. Review the data before proceeding.",
                                ),
                                okText: L("確認匯入", "Import"),
                                cancelText: L("取消", "Cancel"),
                                onOk: async () => {
                                  setImportBusy(true);
                                  try {
                                    await handleAdminImport();
                                  } finally {
                                    setImportBusy(false);
                                  }
                                },
                              });
                            }}
                          >
                            {L("檢查並匯入", "Review and import")}
                          </Button>
                        </Space>
                      ),
                    },
                  ]}
                />
              </Card>
            ))}
          {activeTab === "auth" &&
            (user ? (
              <Row justify="center">
                <Col xs={24} md={16} xl={12}>
                  <Card>
                    <Result
                      icon={
                        <Avatar
                          size={80}
                          style={{ background: token.colorPrimary }}
                        >
                          {user.name?.slice(0, 1)}
                        </Avatar>
                      }
                      title={L(`你好，${user.name}`, `Hello, ${user.name}`)}
                      subTitle={L(
                        "你的預排課表與已修備註會儲存在這個帳號。",
                        "Your plans and self-reported completion notes are saved to this account.",
                      )}
                      extra={
                        <Space wrap>
                          <Button type="primary" onClick={() => go("search")}>
                            {L("繼續探索課程", "Explore courses")}
                          </Button>
                          <Button
                            icon={<LogoutOutlined />}
                            onClick={handleLogout}
                          >
                            {L("登出", "Sign out")}
                          </Button>
                        </Space>
                      }
                    />
                    <Descriptions
                      bordered
                      column={1}
                      items={[
                        {
                          key: "username",
                          label: L("帳號", "Username"),
                          children: user.username,
                        },
                        {
                          key: "role",
                          label: L("角色", "Role"),
                          children:
                            user.role === "admin"
                              ? L("管理者", "Administrator")
                              : L("學生", "Student"),
                        },
                        {
                          key: "dept",
                          label: L("系所", "Department"),
                          children: zh
                            ? user.department
                            : departmentEN[user.department] || user.department,
                        },
                        {
                          key: "grade",
                          label: L("年級", "Grade"),
                          children: user.grade,
                        },
                      ]}
                    />
                  </Card>
                </Col>
              </Row>
            ) : (
              <Row justify="center" gutter={[24, 24]}>
                <Col xs={24} md={14} lg={10}>
                  <Card
                    title={
                      authMode === "login"
                        ? L("歡迎回來", "Welcome back")
                        : L("建立學生帳號", "Create a student account")
                    }
                  >
                    <Paragraph type="secondary">
                      {L(
                        "整理想學的，安排接下來的。",
                        "Keep your learning organized and your next semester in sight.",
                      )}
                    </Paragraph>
                    {import.meta.env.VITE_BACKEND_MODE === "upstream" && (
                      <Alert
                        showIcon
                        type="info"
                        style={{ marginBottom: 20 }}
                        title={L(
                          "此版本使用原系統帳號與課程資料。",
                          "This version uses your existing course-system account and data.",
                        )}
                        description={L(
                          "登入後的預排與已修備註變更，會儲存回原系統。",
                          "Changes to plans and completion notes are saved to the existing system.",
                        )}
                      />
                    )}
                    <Form
                      layout="vertical"
                      key={authMode}
                      initialValues={authForm}
                      onValuesChange={(_, values) =>
                        setAuthForm((p) => ({ ...p, ...values }))
                      }
                      onFinish={onAuth}
                      requiredMark="optional"
                    >
                      <Form.Item
                        name="username"
                        label={L("帳號", "Username")}
                        rules={[
                          {
                            required: true,
                            message: L("請輸入帳號", "Enter your username"),
                          },
                          ...(authMode === "register"
                            ? [
                                {
                                  min: 3,
                                  message: L(
                                    "帳號至少3個字元",
                                    "At least 3 characters",
                                  ),
                                },
                              ]
                            : []),
                        ]}
                      >
                        <Input
                          prefix={<UserOutlined />}
                          autoComplete="username"
                          placeholder={L("輸入帳號", "Username")}
                          size="large"
                        />
                      </Form.Item>
                      <Form.Item
                        name="password"
                        label={L("密碼", "Password")}
                        rules={[
                          {
                            required: true,
                            message: L("請輸入密碼", "Enter your password"),
                          },
                          ...(authMode === "register"
                            ? [
                                {
                                  min: 8,
                                  message: L(
                                    "密碼至少8個字元",
                                    "At least 8 characters",
                                  ),
                                },
                              ]
                            : []),
                        ]}
                      >
                        <Input.Password
                          autoComplete={
                            authMode === "login"
                              ? "current-password"
                              : "new-password"
                          }
                          placeholder={L("輸入密碼", "Password")}
                          size="large"
                        />
                      </Form.Item>
                      {authMode === "register" && (
                        <>
                          <Form.Item
                            name="name"
                            label={L("姓名", "Name")}
                            rules={[
                              {
                                required: true,
                                message: L("請輸入姓名", "Enter your name"),
                              },
                            ]}
                          >
                            <Input autoComplete="name" size="large" />
                          </Form.Item>
                          <Form.Item
                            name="department"
                            label={L("系所", "Department")}
                          >
                            <Select
                              options={meta.departments.map((d) =>
                                option(d, zh ? d : departmentEN[d] || d),
                              )}
                            />
                          </Form.Item>
                          <Form.Item name="grade" label={L("年級", "Grade")}>
                            <Select
                              options={[1, 2, 3, 4].map((g) =>
                                option(g, L(`${g} 年級`, `Grade ${g}`)),
                              )}
                            />
                          </Form.Item>
                        </>
                      )}
                      {authError && (
                        <Alert showIcon type="error" title={authError} />
                      )}
                      <Button
                        htmlType="submit"
                        type="primary"
                        block
                        size="large"
                        loading={authBusy}
                        icon={<LoginOutlined />}
                      >
                        {authMode === "login"
                          ? L("登入", "Sign in")
                          : L("註冊並登入", "Create account and sign in")}
                      </Button>
                    </Form>
                    <Divider plain>{L("或", "or")}</Divider>
                    <Button
                      block
                      type="link"
                      onClick={() => {
                        setAuthMode(
                          authMode === "login" ? "register" : "login",
                        );
                        setAuthForm((p) => ({ ...p, password: "" }));
                      }}
                    >
                      {authMode === "login"
                        ? L(
                            "還沒有帳號？註冊學生帳號",
                            "New here? Create a student account",
                          )
                        : L(
                            "已有帳號？返回登入",
                            "Already have an account? Sign in",
                          )}
                    </Button>
                    <Button block type="text" onClick={() => go("search")}>
                      {L("先以訪客探索課程", "Explore courses as a guest")}
                    </Button>
                  </Card>
                </Col>
                <Col xs={24} md={10} lg={8}>
                  <Card
                    title={
                      <Space>
                        <ReadOutlined />
                        {L("把下一步，安排好", "Plan your next chapter")}
                      </Space>
                    }
                  >
                    <Steps
                      orientation="vertical"
                      current={0}
                      items={[
                        {
                          title: L("探索課程", "Explore courses"),
                          content: L(
                            "用系所、學程與時間找到想學的課。",
                            "Filter by department, program and time.",
                          ),
                        },
                        {
                          title: L("建立預排課表", "Build your plan"),
                          content: L(
                            "看見修課資格與時間衝突的提示。",
                            "Review eligibility and schedule conflicts.",
                          ),
                        },
                        {
                          title: L("追蹤修課進度", "Track your progress"),
                          content: L(
                            "以自行備註與預排模擬累積學分。",
                            "Estimate credits with self-reported notes and planned courses.",
                          ),
                        },
                      ]}
                    />
                    <Alert
                      style={{ marginTop: 24 }}
                      showIcon
                      type="info"
                      title={L(
                        "預排不會送出正式選課",
                        "Planning does not submit official registration",
                      )}
                    />
                  </Card>
                </Col>
              </Row>
            ))}
        </Content>
        <Footer className="workspace-footer">
          <Text type="secondary">
            {L(
              "北護課程規劃 · 預排與進度僅供參考，正式選課與畢業資格請依校方規定。",
              "NTUNHS Planner · Plans and estimates are advisory. Refer to official university rules.",
            )}
          </Text>
        </Footer>
      </Layout>
      <Modal
        open={!!selectedCourse}
        onCancel={() => setSelectedCourse(null)}
        footer={null}
        title={selectedCourse ? name(selectedCourse) : ""}
        width={640}
        destroyOnHidden
      >
        {selectedCourse && (
          <Space orientation="vertical" size={20} style={{ width: "100%" }}>
            {courseTags(selectedCourse)}
            <Descriptions
              column={mobile ? 1 : 2}
              bordered
              size="small"
              items={[
                {
                  key: "code",
                  label: L("課程代碼", "Code"),
                  children: selectedCourse.code,
                },
                {
                  key: "semester",
                  label: L("學期", "Semester"),
                  children: semesterLabel(selectedCourse.semester, zh),
                },
                {
                  key: "credits",
                  label: L("學分", "Credits"),
                  children: selectedCourse.credits,
                },
                {
                  key: "teacher",
                  label: L("教師", "Instructor"),
                  children: selectedCourse.teacher_name,
                },
                {
                  key: "time",
                  label: L("上課時間", "Time"),
                  children: `${names[selectedCourse.weekday]} ${selectedCourse.periods}`,
                },
                {
                  key: "room",
                  label: L("地點", "Room"),
                  children: selectedCourse.room,
                },
              ]}
            />
            <div>
              <Title level={5}>{L("教學計畫摘要", "Syllabus summary")}</Title>
              <Paragraph>
                {(zh
                  ? selectedCourse.syllabus_summary_zh
                  : selectedCourse.syllabus_summary_en) ||
                  L(
                    "尚未提供摘要，請洽授課教師。",
                    "No summary provided. Contact the instructor.",
                  )}
              </Paragraph>
            </div>
            {selectedCourse.restriction_note_zh && (
              <Alert
                showIcon
                type="info"
                title={L("修課限制", "Restrictions")}
                description={
                  zh
                    ? selectedCourse.restriction_note_zh
                    : selectedCourse.restriction_note_en ||
                      selectedCourse.restriction_note_zh
                }
              />
            )}{" "}
            {selectedCourse.exemption_note_zh && (
              <Alert
                showIcon
                type="warning"
                title={L("抵免辦法", "Exemption")}
                description={
                  zh
                    ? selectedCourse.exemption_note_zh
                    : selectedCourse.exemption_note_en ||
                      selectedCourse.exemption_note_zh
                }
              />
            )}
            <Alert
              type="info"
              showIcon
              title={L(
                "加入預排不等同完成正式選課。",
                "Adding to a plan does not complete official registration.",
              )}
            />
          </Space>
        )}
      </Modal>
      <Modal
        open={!!selectedTeacher}
        onCancel={() => setSelectedTeacher(null)}
        footer={null}
        title={
          selectedTeacher
            ? `${selectedTeacher.name} ${selectedTeacher.title || ""}`
            : ""
        }
        destroyOnHidden
      >
        {selectedTeacher && (
          <Space orientation="vertical" size={16} style={{ width: "100%" }}>
            <Text type="secondary">{selectedTeacher.name_en}</Text>
            <Descriptions
              column={1}
              bordered
              size="small"
              items={[
                {
                  key: "dept",
                  label: L("所屬系所", "Department"),
                  children: selectedTeacher.department || "—",
                },
                {
                  key: "email",
                  label: "Email",
                  children: selectedTeacher.email ? (
                    <Link href={`mailto:${selectedTeacher.email}`}>
                      {selectedTeacher.email}
                    </Link>
                  ) : (
                    "—"
                  ),
                },
                {
                  key: "ext",
                  label: L("校內分機", "Extension"),
                  children: selectedTeacher.ext || "—",
                },
                {
                  key: "expert",
                  label: L("專長", "Expertise"),
                  children: selectedTeacher.expertise || "—",
                },
                {
                  key: "lab",
                  label: L("實驗室", "Lab"),
                  children: selectedTeacher.lab || "—",
                },
              ]}
            />
          </Space>
        )}
      </Modal>
      <Modal
        open={!!shareUrl}
        title={L("課表分享連結", "Schedule sharing link")}
        onCancel={() => setShareUrl("")}
        footer={
          <Button
            type="primary"
            icon={<CopyOutlined />}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(shareUrl);
                message.success(L("已複製連結", "Link copied"));
              } catch {
                message.error(
                  L(
                    "無法自動複製，請選取連結手動複製。",
                    "Could not copy automatically. Select and copy the link.",
                  ),
                );
              }
            }}
          >
            {L("複製連結", "Copy link")}
          </Button>
        }
      >
        <Paragraph>
          {L(
            "連結僅包含課程清單，不包含姓名與學號。持有連結的人皆可查看。",
            "Anyone with this link can see the course list. No name or student ID is included.",
          )}
        </Paragraph>
        <Input
          aria-label={L("課表分享連結", "Schedule link")}
          readOnly
          value={shareUrl}
        />
      </Modal>
      <Modal
        open={createOpen}
        title={L("新增課程", "Create course")}
        onCancel={() => setCreateOpen(false)}
        footer={null}
        width={760}
        destroyOnHidden
      >
        <CourseForm
          value={newCourse}
          onChange={setNewCourse}
          onFinish={async () => {
            const ok = await handleAdminCreate({ preventDefault() {} });
            if (ok) setCreateOpen(false);
          }}
          meta={meta}
          zh={zh}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>
      <Modal
        open={!!editingCourse}
        title={L("編輯課程", "Edit course")}
        onCancel={() => setEditingCourse(null)}
        footer={null}
        width={760}
        destroyOnHidden
      >
        {editingCourse && (
          <CourseForm
            value={editingCourse}
            onChange={setEditingCourse}
            onFinish={() => handleAdminUpdate({ preventDefault() {} })}
            meta={meta}
            zh={zh}
            editing
            onCancel={() => setEditingCourse(null)}
          />
        )}
      </Modal>
    </Layout>
  );
}

function CourseForm({
  value,
  onChange,
  onFinish,
  meta,
  zh,
  editing = false,
  onCancel,
}) {
  const L = (a, b) => (zh ? a : b);
  const fields = [
    ...(!editing
      ? [
          { key: "code", label: L("課程代碼", "Course code"), required: true },
          {
            key: "semester",
            label: L("學期代碼", "Semester code"),
            required: true,
          },
          {
            key: "department",
            label: L("系所", "Department"),
            type: "select",
            options: meta.departments.map((d) => option(d, d)),
          },
        ]
      : []),
    {
      key: "name_zh",
      label: L("中文課名", "Chinese course name"),
      required: true,
    },
    { key: "name_en", label: L("英文課名", "English course name") },
    { key: "teacher_name", label: L("授課教師", "Instructor"), required: true },
    {
      key: "credits",
      label: L("學分", "Credits"),
      type: "number",
      min: 0,
      max: 30,
    },
    {
      key: "category",
      label: L("課別", "Category"),
      type: "select",
      options: meta.categories.map((c) =>
        option(c, zh ? c : categoryEN[c] || c),
      ),
    },
    {
      key: "weekday",
      label: L("上課星期", "Weekday"),
      type: "select",
      options: DAYS.map((d) =>
        option(
          d,
          zh
            ? ["", "週一", "週二", "週三", "週四", "週五", "週六", "週日"][d]
            : ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][d],
        ),
      ),
    },
    {
      key: "periods",
      label: L("節次，例如 5,6,7", "Periods, e.g. 5,6,7"),
      required: true,
    },
    { key: "room", label: L("教室", "Room") },
    {
      key: "min_grade",
      label: L("最低修課年級", "Minimum grade"),
      type: "number",
      min: 1,
      max: 7,
    },
    ...(editing
      ? [
          {
            key: "restriction_note_zh",
            label: L("修課限制說明", "Restriction note"),
          },
        ]
      : []),
  ];
  const [saving, setSaving] = useState(false);
  return (
    <Form
      layout="vertical"
      initialValues={value}
      onValuesChange={(_, v) => onChange((p) => ({ ...p, ...v }))}
      onFinish={async () => {
        setSaving(true);
        try {
          await onFinish();
        } finally {
          setSaving(false);
        }
      }}
    >
      <Row gutter={20}>
        {fields.map((f) => (
          <Col xs={24} sm={12} key={f.key}>
            <Form.Item
              name={f.key}
              label={f.label}
              rules={[
                ...(f.required
                  ? [
                      {
                        required: true,
                        message: L("請填寫此欄位", "This field is required"),
                      },
                    ]
                  : []),
                ...(f.key === "periods"
                  ? [
                      {
                        pattern: /^(1[0-4]|[1-9])(,(1[0-4]|[1-9]))*$/,
                        message: L(
                          "請以逗號分隔1至14的節次",
                          "Use comma-separated periods from 1 to 14",
                        ),
                      },
                    ]
                  : []),
              ]}
            >
              {f.type === "select" ? (
                <Select options={f.options} />
              ) : f.type === "number" ? (
                <InputNumber
                  min={f.min}
                  max={f.max}
                  precision={0}
                  style={{ width: "100%" }}
                />
              ) : (
                <Input />
              )}
            </Form.Item>
          </Col>
        ))}
      </Row>
      <Flex justify="end" gap={8}>
        <Button onClick={onCancel}>{L("取消", "Cancel")}</Button>
        <Button type="primary" htmlType="submit" loading={saving}>
          {editing
            ? L("儲存變更", "Save changes")
            : L("新增課程", "Create course")}
        </Button>
      </Flex>
    </Form>
  );
}
