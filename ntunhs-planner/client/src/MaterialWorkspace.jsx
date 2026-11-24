import { useState, useEffect, useId } from "react";
import { ThemeProvider, createTheme, CssBaseline, Box, AppBar, Toolbar, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Button, IconButton, TextField, FormControl, InputLabel, Select, MenuItem, Stack, Paper, Divider, Chip, Table, TableHead, TableBody, TableRow, TableCell, TableContainer, TablePagination, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, LinearProgress, CircularProgress, Checkbox, FormControlLabel, Accordion, AccordionSummary, AccordionDetails, Tabs, Tab, Tooltip, ToggleButton, ToggleButtonGroup, Avatar, Collapse, useMediaQuery } from "@mui/material";
import { Search, CalendarMonth, School, Settings, Person, Login, Logout, Menu as MenuIcon, Close, Add, Check, DeleteOutlined, EditOutlined, Share, ContentCopy, ExpandMore, ChevronLeft, DarkMode, LightMode, Language, FilterList, RestartAlt, ViewList, ViewModule, Schedule, LocationOn, BookmarkBorder, Bookmark, InfoOutlined, UploadFile, LockOutlined, Visibility, VisibilityOff } from "@mui/icons-material";
const DAYS = [1, 2, 3, 4, 5, 6, 7],
  PERIODS = Array.from({
    length: 14
  }, (_, i) => i + 1);
const enCategory = {
  "專業必修(系所)": "Major required",
  "專業選修(系所)": "Major elective",
  "通識必修(通識)": "General required",
  "通識選修(通識)": "General elective"
};
const semester = (s, zh) => s === "ALL" ? zh ? "全部學期" : "All semesters" : zh ? `${s?.slice(0, -1)} 學年 第 ${s?.slice(-1)} 學期` : `Year ${s?.slice(0, -1)} · Semester ${s?.slice(-1)}`;
function Choice({
  label,
  value,
  options,
  onChange,
  sx,
  ...rest
}) {
  const id = useId();
  return <FormControl fullWidth size="small" sx={sx}>
      <InputLabel id={id}>{label}</InputLabel>
      <Select labelId={id} label={label} value={value} onChange={e => onChange(e.target.value)} {...rest}>
        {options.map(([v, l]) => <MenuItem key={v} value={v}>
            {l}
          </MenuItem>)}
      </Select>
    </FormControl>;
}
function Surface({
  title,
  action,
  children,
  sx = {}
}) {
  return <Paper variant="outlined" sx={{
    overflow: "hidden",
    ...sx
  }}>
      {title && <Box sx={{
      px: 3,
      py: 2,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 1,
      flexWrap: "wrap"
    }}>
          <Typography variant="h6">{title}</Typography>
          {action}
        </Box>}
      {title && <Divider />}
      <Box sx={{
      p: {
        xs: 2,
        sm: 3
      }
    }}>{children}</Box>
    </Paper>;
}
function EmptyState({
  text,
  children
}) {
  return <Stack spacing={2} sx={[{
    alignItems: "center"
  }, {
    py: 5
  }]}>
      <Search sx={{
      fontSize: 40,
      color: "text.disabled"
    }} />
      <Typography color="text.secondary" align="center">
        {text}
      </Typography>
      {children}
    </Stack>;
}
export default function MaterialWorkspace({
  controller: c
}) {
  const {
    darkMode
  } = c;
  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        main: "#318257"
      },
      secondary: {
        main: "#546e7a"
      },
      background: {
        default: darkMode ? "#121212" : "#fafafa",
        paper: darkMode ? "#1e1e1e" : "#fff"
      }
    },
    typography: {
      fontFamily: 'Roboto,"Noto Sans TC","Microsoft JhengHei",Arial,sans-serif',
      h4: {
        fontWeight: 400
      },
      h6: {
        fontSize: "1.125rem",
        fontWeight: 500
      },
      button: {
        textTransform: "none"
      }
    },
    shape: {
      borderRadius: 4
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true
        }
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 500
          }
        }
      }
    }
  });
  return <ThemeProvider theme={theme}>
      <CssBaseline />
      <MaterialPlanner c={c} />
    </ThemeProvider>;
}
function MaterialPlanner({
  c
}) {
  const {
    lang,
    setLang,
    darkMode,
    setDarkMode,
    showPassword,
    setShowPassword,
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
    gradAssume,
    setGradAssume,
    newCourse,
    setNewCourse,
    importJson,
    setImportJson,
    editingCourse,
    setEditingCourse,
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
    designSystem,
    setDesignSystem
  } = c;
  const zh = lang === "zh",
    L = (a, b) => zh ? a : b,
    desktop = useMediaQuery("(min-width:1200px)"),
    wide = useMediaQuery("(min-width:768px)");
  const [navOpen, setNavOpen] = useState(false),
    [adminOpen, setAdminOpen] = useState(true),
    [adminTab, setAdminTab] = useState("catalog"),
    [view, setView] = useState("list"),
    [day, setDay] = useState(1),
    [week, setWeek] = useState(() => innerWidth >= 768),
    [confirm, setConfirm] = useState(null),
    [creating, setCreating] = useState(false),
    [saving, setSaving] = useState(false),
    [authError, setAuthError] = useState("");
  const names = zh ? ["", "週一", "週二", "週三", "週四", "週五", "週六", "週日"] : ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const title = {
    search: L("課程探索", "Explore courses"),
    schedule: L("我的課表", "My schedule"),
    progress: L("修課進度", "Learning progress"),
    admin: L("課程管理", "Course management"),
    auth: L("我的帳號", "My account")
  };
  useEffect(() => {
    document.documentElement.lang = zh ? "zh-Hant" : "en";
  }, [zh]);
  useEffect(() => {
    const sync = () => {
      const v = location.hash.slice(2);
      if (["search", "schedule", "progress", "admin", "auth"].includes(v)) setActiveTab(v);
    };
    sync();
    addEventListener("hashchange", sync);
    return () => removeEventListener("hashchange", sync);
  }, []);
  const go = v => {
    setActiveTab(v);
    setNavOpen(false);
    location.hash = `/${v}`;
    scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };
  const filter = (key, value) => setFilters(p => ({
    ...p,
    [key]: value,
    page: 1
  }));
  const name = x => zh ? x.name_zh : x.name_en || x.name_zh,
    category = v => zh ? v : enCategory[v] || v;
  const planned = x => allSchedule.some(s => s.id === x.id);
  const conflict = x => allSchedule.find(s => s.id !== x.id && s.semester === x.semester && s.weekday === x.weekday && (s.period_mask & x.period_mask) > 0);
  const reason = x => x.eligibility?.eligible === false ? zh ? x.eligibility.reason_zh : x.eligibility.reason_en : conflict(x) ? L(`與「${name(conflict(x))}」衝堂`, `Conflicts with ${name(conflict(x))}`) : "";
  const remove = x => setConfirm({
    title: L("移除預排課程？", "Remove planned course?"),
    text: L(`將「${name(x)}」從預排移除，不影響已修備註。`, `Remove ${name(x)} from your plan?`),
    ok: L("移除", "Remove"),
    action: () => handleRemoveFromSchedule(x.id)
  });
  const courseTags = x => <Stack direction="row" sx={{
    gap: 0.5,
    flexWrap: "wrap"
  }}>
      <Chip size="small" variant="outlined" color={x.category?.includes("必修") ? "primary" : "default"} label={category(x.category)} />
      {x.programs?.map(p => <Chip size="small" variant="outlined" key={p.code} label={zh ? p.name : p.name_en} />)}
      {isCourseCompleted(x) && <Chip size="small" color="primary" label={L("已備註修過", "Self-reported")} />}
    </Stack>;
  const courseTitle = x => <Box>
      <Button sx={{
      p: 0,
      textAlign: "left",
      justifyContent: "start",
      lineHeight: 1.6
    }} onClick={() => setSelectedCourse(x)}>
        {name(x)}
      </Button>
      <Typography variant="caption" color="text.secondary" display="block" sx={{
      overflowWrap: "anywhere"
    }}>
        {x.code}
      </Typography>
    </Box>;
  const actions = x => <Stack direction="row" sx={{
    gap: 1,
    alignItems: "center"
  }}>
      <Tooltip title={reason(x)}>
        <span>
          <Button size="small" variant={planned(x) ? "outlined" : "contained"} startIcon={planned(x) ? <Check /> : <Add />} disabled={busy || !planned(x) && !!reason(x)} onClick={() => planned(x) ? remove(x) : handleAddToSchedule(x.id)}>
            {planned(x) ? L("已預排", "Planned") : reason(x) ? L("無法加入", "Unavailable") : L("加入預排", "Add to plan")}
          </Button>
        </span>
      </Tooltip>
      <Tooltip title={L("自行備註已修，非正式成績", "Self-reported, not a verified grade")}>
        <IconButton size="small" color={isCourseCompleted(x) ? "primary" : "default"} aria-label={L(`切換已修備註 ${name(x)}`, `Toggle completion note for ${name(x)}`)} onClick={() => handleToggleCompleted(x)}>
          {isCourseCompleted(x) ? <Bookmark /> : <BookmarkBorder />}
        </IconButton>
      </Tooltip>
    </Stack>;
  const semesters = meta.semesters.map(s => [s, semester(s, zh)]);
  const scope = <Box sx={{
    minWidth: 220
  }}>
      <Choice label={L("規劃學期", "Planning semester")} value={planningSemester} options={semesters} onChange={setPlanningSemester} />
    </Box>;
  const pagination = <TablePagination component="div" count={courseResult.total} page={Math.max(0, filters.page - 1)} rowsPerPage={10} rowsPerPageOptions={[]} onPageChange={(_, v) => setFilters(p => ({
    ...p,
    page: v + 1
  }))} labelDisplayedRows={({
    from,
    to,
    count
  }) => L(`${from}–${to}／共 ${count} 門`, `${from}–${to} of ${count}`)} getItemAriaLabel={v => v === "next" ? L("下一頁", "Next page") : L("上一頁", "Previous page")} />;
  const nav = <Box sx={{
    width: desktop ? "100%" : 240,
    height: "100%",
    display: "flex",
    flexDirection: "column"
  }}>
      <Stack direction="row" sx={[{
      alignItems: "center",
      gap: 1.5
    }, {
      px: 2.5,
      py: 3
    }]}>
        <School color="primary" />
        <Box>
          <Typography variant="subtitle1" sx={{
          fontWeight: 500
        }}>
            {L("北護課程規劃", "NTUNHS Planner")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            MATERIAL DESIGN
          </Typography>
        </Box>
      </Stack>
      <List sx={{
      px: 1
    }}>
        {[["search", Search], ["schedule", CalendarMonth], ["progress", School]].map(([id, Icon]) => <ListItemButton key={id} selected={activeTab === id} onClick={() => go(id)} sx={{
        borderRadius: 1,
        mb: 0.5
      }}>
            <ListItemIcon sx={{
          minWidth: 40
        }}>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={title[id]} />
            {id === "schedule" && <Chip size="small" label={allSchedule.length} />}
          </ListItemButton>)}
        <Divider sx={{
        my: 1
      }} />
        <ListItemButton onClick={() => setAdminOpen(!adminOpen)}>
          <ListItemIcon sx={{
          minWidth: 40
        }}>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={title.admin} />
          <ExpandMore sx={{
          transform: adminOpen ? "rotate(180deg)" : undefined
        }} />
        </ListItemButton>
        <Collapse in={adminOpen}>
          <List disablePadding sx={{
          bgcolor: "action.hover",
          borderRadius: 1,
          my: 0.5
        }}>
            {[["catalog", L("課程資料", "Course catalog")], ["import", L("批次匯入", "Batch import")]].map(([id, label]) => <ListItemButton key={id} selected={activeTab === "admin" && adminTab === id} sx={{
            pl: 7
          }} onClick={() => {
            setAdminTab(id);
            go("admin");
          }}>
                <ListItemText primary={label} />
              </ListItemButton>)}
          </List>
        </Collapse>
        <ListItemButton selected={activeTab === "auth"} onClick={() => go("auth")} sx={{
        borderRadius: 1
      }}>
          <ListItemIcon sx={{
          minWidth: 40
        }}>
            <Person fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={title.auth} />
        </ListItemButton>
      </List>
      <Box sx={{
      mt: "auto",
      p: 3
    }}>
        <Divider sx={{
        mb: 2
      }} />
        <Typography variant="caption" color="text.secondary">
          {L("預排計畫不等同正式選課", "A plan is not official registration")}
        </Typography>
      </Box>
    </Box>;
  const filtersForm = <Box component="form" onSubmit={e => {
    e.preventDefault();
    fetchCourses();
  }}>
      <Stack spacing={3}>
        <Stack direction="row" sx={{
        gap: 1
      }}>
          <TextField size="small" fullWidth label={L("課程關鍵字", "Course keyword")} placeholder={L("課名、代碼或教師", "Course, code or instructor")} value={filters.keyword} onChange={e => filter("keyword", e.target.value)} slotProps={{
          input: {
            startAdornment: <Search fontSize="small" sx={{
              mr: 1,
              color: "text.secondary"
            }} />
          }
        }} />
          <Button type="submit" variant="contained">
            {L("搜尋", "Search")}
          </Button>
        </Stack>
        <Box sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "minmax(0,1fr)",
          sm: "repeat(3,1fr)"
        },
        gap: 2
      }}>
          <Choice label={L("查詢學期", "Search semester")} value={filters.semester} options={[["ALL", L("全部學期", "All semesters")], ...semesters]} onChange={v => filter("semester", v)} />
          <Choice label={L("開課系所", "Department")} value={filters.department} options={[["ALL", L("全部系所", "All departments")], ...meta.departments.map(d => [d, d])]} onChange={v => filter("department", v)} />
          <Choice label={L("課程類別", "Category")} value={filters.category} options={[["ALL", L("全部課別", "All categories")], ...meta.categories.map(x => [x, category(x)])]} onChange={v => filter("category", v)} />
        </Box>
        <Accordion disableGutters elevation={0} sx={{
        "&:before": {
          display: "none"
        },
        borderTop: 1,
        borderColor: "divider"
      }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Stack direction="row" sx={{
            gap: 1,
            alignItems: "center"
          }}>
              <FilterList fontSize="small" />
              {L("進階篩選", "Advanced filters")}
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{
          px: 0
        }}>
            <Box sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0,1fr)",
              sm: "repeat(2,1fr)",
              md: "repeat(3,1fr)"
            },
            gap: 2
          }}>
              {[{
              key: "grade",
              label: L("年級", "Grade"),
              options: [["", L("全部年級", "All grades")], ...[1, 2, 3, 4].map(g => [String(g), L(`${g} 年級`, `Grade ${g}`)])]
            }, {
              key: "tag",
              label: L("課程分類", "Course tag"),
              options: [["ALL", L("不限分類", "All tags")], ...["跨域課程", "EMI全英語授課", "全英語授課", "遠距教學課程", "跨校", "程式設計課程"].map(t => [t, t])]
            }, {
              key: "program",
              label: L("跨系學程", "Program"),
              options: [["ALL", L("不限學程", "All programs")], ...meta.programs.map(p => [p.code, zh ? p.name : p.name_en])]
            }, {
              key: "weekday",
              label: L("上課星期", "Weekday"),
              options: [["", L("全部星期", "All days")], ...DAYS.map(d => [String(d), names[d]])]
            }, {
              key: "matchMode",
              label: L("節次匹配", "Period matching"),
              options: [["strict", L("所有節次均符合", "All periods fit")], ["flexible", L("任一節次重疊", "Any period overlaps")]]
            }].map(f => <Choice key={f.key} label={f.label} value={filters[f.key]} options={f.options} onChange={v => filter(f.key, v)} />)}
            </Box>
            <Typography variant="subtitle2" sx={{
            mt: 3,
            mb: 1
          }}>
              {L("指定節次", "Select periods")}
            </Typography>
            <Stack direction="row" sx={{
            flexWrap: "wrap",
            gap: 1
          }}>
              {PERIODS.map(p => <Button key={p} size="small" variant={filters.periods.includes(p) ? "contained" : "outlined"} aria-pressed={filters.periods.includes(p)} aria-label={L(`第${p}節`, `Period ${p}`)} onClick={() => togglePeriodFilter(p)} sx={{
              minWidth: 36
            }}>
                  {p}
                </Button>)}
            </Stack>
            <Typography variant="caption" color="text.secondary" display="block" sx={{
            my: 1
          }}>
              {filters.matchMode === "strict" ? L("5–7節課程必須選5、6、7節才符合。", "Select 5, 6 and 7 to match a P5–7 course.") : L("選第5節也會找到5–7節的課。", "Selecting P5 also finds a P5–7 course.")}
            </Typography>
            <FormControlLabel control={<Checkbox checked={filters.hideConflicts} onChange={e => filter("hideConflicts", e.target.checked)} />} label={L("隱藏與預排衝堂課程", "Hide time conflicts")} />
          </AccordionDetails>
        </Accordion>
        {(filters.periods.length > 0 || filters.weekday) && <Stack direction="row" sx={{
        gap: 1,
        flexWrap: "wrap"
      }}>
            {filters.weekday && <Chip label={names[Number(filters.weekday)]} onDelete={() => filter("weekday", "")} />}{" "}
            {filters.periods.length > 0 && <Chip label={L(`第 ${filters.periods.join("、")} 節`, `Periods ${filters.periods.join(", ")}`)} onDelete={() => filter("periods", [])} />}
          </Stack>}
      </Stack>
    </Box>;
  const plan = <Surface title={L("學期計畫", "Semester plan")} action={<Button onClick={() => go("schedule")}>{L("查看課表", "View")}</Button>}>
      <Stack spacing={2.5}>
        {scope}
        <Stack direction="row" sx={{
        alignItems: "baseline",
        gap: 1
      }}>
          <Typography variant="h4">{scheduleStats.total}</Typography>
          <Typography color="text.secondary">/ 25 {L("學分", "cr")}</Typography>
        </Stack>
        <LinearProgress variant="determinate" value={Math.min(100, scheduleStats.total * 4)} />
        <Stack direction="row" sx={{
        justifyContent: "space-between"
      }}>
          <Typography variant="body2">
            {L("必修", "Required")} {scheduleStats.req}
          </Typography>
          <Typography variant="body2">
            {L("選修", "Electives")} {scheduleStats.elec}
          </Typography>
        </Stack>
        <Divider />
        {!user ? <Stack spacing={2} sx={[{
        alignItems: "center"
      }, {
        py: 2
      }]}>
            <LockOutlined color="action" fontSize="large" />
            <Typography align="center">
              {L("登入以儲存你的學期計畫", "Sign in to save your semester plan")}
            </Typography>
            <Button variant="contained" fullWidth startIcon={<Login />} onClick={() => go("auth")}>
              {L("登入並開始規劃", "Sign in to plan")}
            </Button>
          </Stack> : schedule.length ? <List disablePadding>
            {schedule.map(x => <ListItem key={x.id} disableGutters secondaryAction={<IconButton size="small" onClick={() => remove(x)} aria-label={L(`移除 ${name(x)}`, `Remove ${name(x)}`)}>
                    <Close fontSize="small" />
                  </IconButton>}>
                <ListItemText primary={<Button sx={{
            p: 0,
            textAlign: "left"
          }} onClick={() => setSelectedCourse(x)}>
                      {name(x)}
                    </Button>} secondary={`${names[x.weekday]} ${x.periods} · ${x.credits} ${L("學分", "cr")}`} />
              </ListItem>)}
          </List> : <Typography color="text.secondary">
            {L("尚未預排課程。從列表加入想學的課。", "Your plan is empty. Add a course from the list.")}
          </Typography>}
        <Typography variant="caption" color="text.secondary">
          {L("預排不會提交正式選課。點選課表空堂可反向找課。", "Plans do not submit official registration. Select empty slots to find courses.")}
        </Typography>
      </Stack>
    </Surface>;
  const progressRows = [["all", L("總修課學分", "Total credits"), gradProgress.total, 128], ["genReq", L("通識必修", "General required"), gradProgress.genReq, 28], ["profReq", L("系所專業必修", "Major required"), gradProgress.profReq, 62], ["profElec", L("專業選修", "Major electives"), gradProgress.profElec, 19], ["genElec", L("一般與通識選修", "General electives"), gradProgress.genElec, 19], ["cross", L("跨系與跨域", "Interdisciplinary"), gradProgress.cross, 4], ["aiProg", L("人工智慧應用學程", "AI Application Program"), gradProgress.aiProg, 20], ["medProg", L("醫療資訊學程", "Medical Informatics Program"), gradProgress.medProg, 20]];
  const findSlot = (w, p) => {
    filter("semester", planningSemester);
    handleEmptySlotClick(w, p);
    go("search");
  };
  const onAuth = async e => {
    e.preventDefault();
    setAuthError("");
    setSaving(true);
    try {
      const r = await handleAuthSubmit({
        preventDefault() {}
      });
      if (r?.error) setAuthError(r.error);
    } finally {
      setSaving(false);
    }
  };
  return <Box sx={{
    display: "flex",
    minHeight: "100vh"
  }}>
      <Box component="a" href="#material-main" sx={{
      position: "fixed",
      top: -60,
      left: 16,
      zIndex: 2000,
      "&:focus": {
        top: 8,
        bgcolor: "background.paper",
        p: 2
      }
    }}>
        {L("跳至主要內容", "Skip to content")}
      </Box>
      {desktop ? <Drawer variant="permanent" sx={{
      width: 240,
      flexShrink: 0,
      "& .MuiDrawer-paper": {
        width: 240,
        boxSizing: "border-box"
      }
    }}>
          {nav}
        </Drawer> : <Drawer open={navOpen} onClose={() => setNavOpen(false)}>
          {nav}
        </Drawer>}
      <Box sx={{
      flex: 1,
      minWidth: 0
    }}>
        <AppBar position="sticky" color="inherit" elevation={1}>
          <Toolbar sx={{
          gap: 1,
          justifyContent: "space-between"
        }}>
            {!desktop && <IconButton aria-label={L("開啟導覽", "Open navigation")} onClick={() => setNavOpen(true)}>
                <MenuIcon />
              </IconButton>}
            <Typography variant="subtitle1" sx={{
            flex: 1,
            minWidth: 0,
            display: {
              xs: "none",
              sm: "block"
            }
          }}>
              {title[activeTab]}
            </Typography>
            <Choice label={L("版本", "Version")} value={designSystem || "material"} options={[["material", "Material Design"], ["ant", "Ant Design"]]} onChange={setDesignSystem} sx={{
            width: wide ? 170 : 130,
            flexShrink: 0
          }} />
            <IconButton sx={{
            ml: {
              xs: "auto",
              sm: 0
            }
          }} aria-label={darkMode ? L("切換淺色模式", "Switch to light") : L("切換深色模式", "Switch to dark")} onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <LightMode /> : <DarkMode />}
            </IconButton>
            {wide && <Button startIcon={<Language />} onClick={() => setLang(zh ? "en" : "zh")}>
                {zh ? "EN" : "中文"}
              </Button>}
            <Tooltip title={user?.name || L("登入", "Sign in")}>
              <IconButton aria-label={L("我的帳號", "My account")} onClick={() => go("auth")}>
                {user ? <Avatar sx={{
                width: 30,
                height: 30,
                bgcolor: "primary.main"
              }}>
                    {user.name?.slice(0, 1)}
                  </Avatar> : <Person />}
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>
        <Box component="main" id="material-main" sx={{
        p: {
          xs: 2,
          md: 4
        },
        maxWidth: 1600,
        mx: "auto"
      }}>
          <Stack spacing={3}>
            <Stack direction="row" sx={{
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2
          }}>
              <Box>
                <Typography variant="overline" color="text.secondary">
                  NTUNHS · MATERIAL DESIGN
                </Typography>
                <Typography variant="h4" component="h1">
                  {title[activeTab]}
                </Typography>
                <Typography color="text.secondary" sx={{
                mt: 1
              }}>
                  {L("探索想學的課，安排適合自己的節奏。", "Explore your interests. Plan a semester that fits.")}
                </Typography>
              </Box>
              {["schedule", "progress"].includes(activeTab) && scope}
            </Stack>
            {sharedView && <Surface title={L("分享的課表", "Shared schedule")} action={<IconButton onClick={() => setSharedView(null)} aria-label={L("關閉分享預覽", "Close shared preview")}>
                    <Close />
                  </IconButton>}>
                <Alert severity="info">
                  {L("僅顯示課程內容，不包含姓名及學號。", "Courses only. No names or student IDs.")}
                </Alert>
                <List>
                  {sharedView.items.map(x => <ListItem key={x.id}>
                      <ListItemText primary={name(x)} secondary={`${names[x.weekday]} ${x.periods} · ${x.room}`} />
                    </ListItem>)}
                </List>
              </Surface>}
            {activeTab === "search" && <>
                <Stack direction="row" sx={[{
              gap: {
                xs: 3,
                sm: 8
              },
              flexWrap: "wrap"
            }, {
              pb: 3,
              borderBottom: 1,
              borderColor: "divider"
            }]}>
                  {[[L("目前查詢課程", "Courses found"), courseResult.total], [L("本學期預排學分", "Planned credits"), scheduleStats.total], [L("自行備註已修", "Self-reported credits"), gradProgress.completedTotal]].map(([label, value]) => <Box key={label}>
                      <Typography variant="body2" color="text.secondary">
                        {label}
                      </Typography>
                      <Typography variant="h5" sx={{
                  mt: 0.5
                }}>
                        {value}
                      </Typography>
                    </Box>)}
                </Stack>
                <Box sx={{
              display: "grid",
              gridTemplateColumns: desktop ? "minmax(0,1fr) 300px" : "minmax(0,1fr)",
              gap: 3,
              alignItems: "start"
            }}>
                  <Stack spacing={3}>
                    <Surface title={L("課程查詢", "Course search")} action={<Button startIcon={<RestartAlt />} onClick={handleResetFilters}>
                          {L("重設", "Reset")}
                        </Button>}>
                      {filtersForm}
                    </Surface>
                    <Surface title={L(`課程列表（${courseResult.total}）`, `Courses (${courseResult.total})`)} action={wide && <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)} aria-label={L("檢視方式", "Result view")}>
                            <ToggleButton value="list" aria-label={L("列表", "List")}>
                              <ViewList fontSize="small" />
                            </ToggleButton>
                            <ToggleButton value="cards" aria-label={L("卡片", "Cards")}>
                              <ViewModule fontSize="small" />
                            </ToggleButton>
                          </ToggleButtonGroup>}>
                      <Tabs variant="scrollable" scrollButtons="auto" value={filters.category} onChange={(_, v) => filter("category", v)} sx={{
                    mb: 2
                  }}>
                        {["ALL", ...meta.categories].map(v => <Tab key={v} value={v} label={v === "ALL" ? L("全部", "All") : category(v)} />)}
                      </Tabs>
                      {loadingCourses && <LinearProgress aria-label={L("載入課程", "Loading courses")} />}{" "}
                      {courseError ? <Alert severity="error" action={<Button color="inherit" onClick={fetchCourses}>
                              {L("重試", "Retry")}
                            </Button>}>
                          {courseError}
                        </Alert> : !loadingCourses && !courseResult.items.length ? <EmptyState text={L("沒有符合條件的課程，試試放寬條件。", "No matching courses. Try broadening your filters.")}>
                          <Button variant="outlined" onClick={handleResetFilters}>
                            {L("重設篩選", "Reset filters")}
                          </Button>
                        </EmptyState> : wide && view === "list" ? <TableContainer>
                          <Table aria-label={L("課程列表", "Course results")} sx={{
                      minWidth: 650
                    }}>
                            <TableHead>
                              <TableRow>
                                {[L("課程", "Course"), L("學分", "Credits"), L("教師與時間", "Instructor & time"), L("預排", "Plan")].map(v => <TableCell key={v}>{v}</TableCell>)}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {courseResult.items.map(x => <TableRow hover key={x.id}>
                                  <TableCell sx={{
                            maxWidth: 320
                          }}>
                                    <Stack spacing={1}>
                                      {courseTitle(x)}
                                      {courseTags(x)}
                                      <Typography variant="caption" color="text.secondary">
                                        {semester(x.semester, zh)}
                                      </Typography>
                                    </Stack>
                                  </TableCell>
                                  <TableCell>{x.credits}</TableCell>
                                  <TableCell>
                                    <Stack spacing={0.5}>
                                      <Button size="small" sx={{
                                p: 0,
                                justifyContent: "start"
                              }} onClick={() => setSelectedTeacher(x.teacher || {
                                name: x.teacher_name,
                                name_en: x.teacher_en
                              })}>
                                        {zh ? x.teacher_name : x.teacher_en || x.teacher_name}
                                      </Button>
                                      <Typography variant="body2">
                                        {names[x.weekday]} {x.periods}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {x.room}
                                      </Typography>
                                    </Stack>
                                  </TableCell>
                                  <TableCell>
                                    {actions(x)}
                                    {reason(x) && <Typography variant="caption" color="error">
                                        {reason(x)}
                                      </Typography>}
                                  </TableCell>
                                </TableRow>)}
                            </TableBody>
                          </Table>
                        </TableContainer> : <Stack spacing={2}>
                          {courseResult.items.map(x => <Paper variant="outlined" key={x.id} sx={{
                      p: 2
                    }}>
                              <Stack spacing={2}>
                                <Stack direction="row" sx={{
                          justifyContent: "space-between",
                          gap: 1
                        }}>
                                  {courseTitle(x)}
                                  <Chip size="small" label={`${x.credits} ${L("學分", "cr")}`} />
                                </Stack>
                                {courseTags(x)}
                                <Typography variant="body2" color="text.secondary">
                                  {names[x.weekday]} {x.periods} · {x.room} ·{" "}
                                  {semester(x.semester, zh)}
                                </Typography>
                                <Button size="small" sx={{
                          alignSelf: "start",
                          p: 0
                        }} onClick={() => setSelectedTeacher(x.teacher || {
                          name: x.teacher_name,
                          name_en: x.teacher_en
                        })}>
                                  {zh ? x.teacher_name : x.teacher_en || x.teacher_name}
                                </Button>
                                {reason(x) && <Alert severity="warning">{reason(x)}</Alert>}
                                {actions(x)}
                              </Stack>
                            </Paper>)}
                        </Stack>}
                      {courseResult.total > 0 && pagination}
                    </Surface>
                  </Stack>
                  <Box sx={{
                position: desktop ? "sticky" : "static",
                top: 88
              }}>
                    {plan}
                  </Box>
                </Box>
              </>}
            {activeTab === "schedule" && <>
                <Alert severity="info">
                  {L("預排不會提交正式選課，支援週末與晚間。", "Planning does not submit official registration. Weekends and evenings are supported.")}
                </Alert>
                <Stack direction="row" sx={{
              gap: 5,
              flexWrap: "wrap"
            }}>
                  {[[L("預排課程", "Courses"), schedule.length], [L("總學分", "Credits"), `${scheduleStats.total} / 25`], [L("必修／選修", "Required / elective"), `${scheduleStats.req} / ${scheduleStats.elec}`]].map(([label, value]) => <Box key={label}>
                      <Typography color="text.secondary" variant="body2">
                        {label}
                      </Typography>
                      <Typography variant="h5">{value}</Typography>
                    </Box>)}
                </Stack>
                <Surface title={semester(planningSemester, zh)} action={<Stack direction="row" sx={{
              gap: 1
            }}>
                      <Button onClick={() => go("search")} startIcon={<Search />}>
                        {L("找課", "Find")}
                      </Button>
                      <Button startIcon={<Share />} disabled={!user} onClick={() => setConfirm({
                title: L("建立課表分享連結？", "Create sharing link?"),
                text: L("持有連結且能存取此網站的人可查看課程清單，不包含姓名與學號。", "People with access to this site and link can see courses, without student identity."),
                action: handleShareSchedule
              })}>
                        {L("分享", "Share")}
                      </Button>
                    </Stack>}>
                  <Stack spacing={2}>
                    <Stack direction="row" sx={{
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                      <Typography variant="body2" color="text.secondary">
                        {L("點空堂即可查詢該時段課程。", "Select a free period to find courses.")}
                      </Typography>
                      <ToggleButtonGroup size="small" exclusive value={week ? "week" : "day"} onChange={(_, v) => v && setWeek(v === "week")}>
                        <ToggleButton value="week">
                          {L("整週", "Week")}
                        </ToggleButton>
                        <ToggleButton value="day">
                          {L("每日", "Day")}
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Stack>
                    {week ? <TableContainer>
                        <Table size="small" sx={{
                    minWidth: 940
                  }} aria-label={L("週課表", "Weekly schedule")}>
                          <TableHead>
                            <TableRow>
                              <TableCell>{L("節次", "Period")}</TableCell>
                              {DAYS.map(w => <TableCell key={w} align="center">
                                  {names[w]}
                                </TableCell>)}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {PERIODS.map(p => <TableRow key={p}>
                                <TableCell>{p}</TableCell>
                                {DAYS.map(w => {
                          const x = slotLookup[`${w}-${p}`];
                          return <TableCell key={w} align="center" sx={{
                            height: 52
                          }}>
                                      {x ? <Button size="small" onClick={() => setSelectedCourse(x)} sx={{
                              textAlign: "left"
                            }}>
                                          {name(x)}
                                        </Button> : <Button size="small" color="inherit" aria-label={L(`${names[w]}第${p}節找課`, `Find ${names[w]} P${p} courses`)} onClick={() => findSlot(w, p)}>
                                          ＋
                                        </Button>}
                                    </TableCell>;
                        })}
                              </TableRow>)}
                          </TableBody>
                        </Table>
                      </TableContainer> : <>
                        <Tabs variant="scrollable" value={day} onChange={(_, d) => setDay(d)}>
                          {DAYS.map(d => <Tab key={d} value={d} label={names[d]} />)}
                        </Tabs>
                        <List>
                          {schedule.filter(x => x.weekday === day).map(x => <ListItem key={x.id} secondaryAction={<IconButton aria-label={L(`移除 ${name(x)}`, `Remove ${name(x)}`)} onClick={() => remove(x)}>
                                    <DeleteOutlined />
                                  </IconButton>}>
                                <ListItemText primary={<Button onClick={() => setSelectedCourse(x)}>
                                      {name(x)}
                                    </Button>} secondary={`${x.periods} · ${x.room} · ${x.credits} ${L("學分", "cr")}`} />
                              </ListItem>)}
                        </List>
                        {!schedule.some(x => x.weekday === day) && <Typography color="text.secondary">
                            {L("當日尚無預排課程", "No planned courses today")}
                          </Typography>}
                        <Stack direction="row" sx={{
                    gap: 1,
                    flexWrap: "wrap"
                  }}>
                          {PERIODS.map(p => <Button key={p} variant="outlined" size="small" onClick={() => findSlot(day, p)}>
                              {L(`第${p}節`, `P${p}`)}
                            </Button>)}
                        </Stack>
                      </>}
                  </Stack>
                </Surface>
              </>}
            {activeTab === "progress" && <>
                <Alert severity="warning">
                  {L("本頁是自行備註與預排估算，不是正式成績或畢業審查。門檻沿用資管113學年與原學程20學分假設，請以校方規定核對。", "Self-reported and estimated credits only. Targets inherit the original IM year-113 and 20-credit program assumptions; verify official rules.")}
                </Alert>
                <Stack direction={{
              xs: "column",
              sm: "row"
            }} sx={{
              gap: 4,
              alignItems: {
                sm: "center"
              }
            }}>
                  <Box>
                    <Typography variant="h4">
                      {gradProgress.total}
                      <Typography component="span" color="text.secondary">
                        {" "}
                        / 128 {L("學分", "cr")}
                      </Typography>
                    </Typography>
                    <Typography color="text.secondary">
                      {L(`自行備註 ${gradProgress.completedTotal}・本學期預排 ${gradProgress.plannedCredits}`, `Self-reported ${gradProgress.completedTotal} · Planned ${gradProgress.plannedCredits}`)}
                    </Typography>
                  </Box>
                  <FormControlLabel control={<Checkbox checked={includePlannedInGrad} onChange={e => setIncludePlannedInGrad(e.target.checked)} />} label={L("納入本學期預排模擬", "Include planned courses")} />
                </Stack>
                <Paper variant="outlined">
                  {progressRows.map(([key, label, current, target]) => <Accordion key={key} disableGutters elevation={0}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box sx={{
                    width: "100%",
                    pr: 2,
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "minmax(0,1fr)",
                      sm: "2fr 2fr 90px"
                    },
                    alignItems: "center",
                    gap: 1
                  }}>
                          <Typography>{label}</Typography>
                          <LinearProgress variant="determinate" value={Math.min(100, current / target * 100)} />
                          <Typography variant="body2" sx={{
                      textAlign: "right"
                    }}>
                            {current} / {target}
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        {gradProgress.lists[key]?.length ? <List dense>
                            {gradProgress.lists[key].map((x, i) => <ListItem key={`${x.code}-${i}`}>
                                <ListItemText primary={x.name_zh} secondary={x.isPlanned ? L("預排", "Planned") : L("自行備註", "Self-reported")} />
                                <Typography>
                                  {x.credits} {L("學分", "cr")}
                                </Typography>
                              </ListItem>)}
                          </List> : <Typography color="text.secondary">
                            {L("尚無認列課程", "No recorded courses")}
                          </Typography>}
                      </AccordionDetails>
                    </Accordion>)}
                </Paper>
                <Surface title={L("額外學分調整", "Additional credit estimates")}>
                  <Stack direction={{
                xs: "column",
                sm: "row"
              }} sx={{
                gap: 2
              }}>
                    {[["extraProfElective", L("額外專業選修", "Major elective"), 60], ["extraGenElective", L("額外一般選修", "General elective"), 60], ["extraCrossDept", L("額外跨系／跨域", "Interdisciplinary"), 30]].map(([key, label, max]) => <TextField fullWidth key={key} type="number" label={label} value={gradAssume[key]} onChange={e => setGradAssume(p => ({
                  ...p,
                  [key]: Math.max(0, Math.min(max, Math.floor(Number(e.target.value) || 0)))
                }))} slotProps={{
                  htmlInput: {
                    min: 0,
                    max,
                    step: 1
                  }
                }} />)}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {L("僅影響目前畫面估算，不代表正式認列。", "Estimates only, not official credit recognition.")}
                  </Typography>
                </Surface>
              </>}
            {activeTab === "admin" && (user?.role !== "admin" ? <EmptyState text={L("需要管理者權限才能維護課程。", "An administrator account is required.")}>
                  <Button variant="contained" onClick={() => go("auth")}>
                    {L("前往登入", "Sign in")}
                  </Button>
                </EmptyState> : <Surface title={title.admin} action={<Button variant="contained" startIcon={<Add />} onClick={() => setCreating(true)}>
                      {L("新增課程", "Create course")}
                    </Button>}>
                  <Tabs value={adminTab} onChange={(_, v) => setAdminTab(v)} sx={{
              mb: 3
            }}>
                    <Tab value="catalog" label={L("課程資料", "Catalog")} />
                    <Tab value="import" label={L("批次匯入", "Import")} />
                  </Tabs>
                  {adminTab === "catalog" ? <Stack spacing={3}>
                      {filtersForm}
                      <TableContainer>
                        <Table sx={{
                  minWidth: 600
                }}>
                          <TableHead>
                            <TableRow>
                              {[L("課程", "Course"), L("學期", "Semester"), L("教師", "Instructor"), L("操作", "Actions")].map(t => <TableCell key={t}>{t}</TableCell>)}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {courseResult.items.map(x => <TableRow key={x.id}>
                                <TableCell>{courseTitle(x)}</TableCell>
                                <TableCell>{x.semester}</TableCell>
                                <TableCell>{x.teacher_name}</TableCell>
                                <TableCell>
                                  <IconButton aria-label={L(`編輯 ${name(x)}`, `Edit ${name(x)}`)} onClick={() => setEditingCourse({
                          ...x
                        })}>
                                    <EditOutlined />
                                  </IconButton>
                                  <IconButton color="error" aria-label={L(`刪除 ${name(x)}`, `Delete ${name(x)}`)} onClick={() => setConfirm({
                          title: L("永久刪除課程？", "Permanently delete course?"),
                          text: L(`「${name(x)}」及關聯預排會永久移除，無法復原。`, `This permanently deletes ${name(x)} and linked plans.`),
                          danger: true,
                          action: () => handleAdminDelete(x.id)
                        })}>
                                    <DeleteOutlined />
                                  </IconButton>
                                </TableCell>
                              </TableRow>)}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      {pagination}
                    </Stack> : <Stack spacing={3}>
                      <Alert severity="info">
                        {L("貼上JSON課程陣列。代碼、中文課名與教師為必填；重複代碼會略過。", "Paste a JSON array. Code, Chinese course name and instructor are required. Duplicate codes are skipped.")}
                      </Alert>
                      <TextField multiline rows={10} label={L("JSON匯入內容", "JSON import content")} value={importJson} onChange={e => setImportJson(e.target.value)} placeholder='[{"code":"DEMO01","name_zh":"示範課程","teacher_name":"示範教師"}]' />
                      <Button variant="contained" startIcon={<UploadFile />} disabled={!importJson.trim()} sx={{
                alignSelf: "start"
              }} onClick={() => {
                try {
                  const v = JSON.parse(importJson),
                    list = Array.isArray(v) ? v : v.courses;
                  if (!Array.isArray(list) || !list.length) throw Error();
                  setConfirm({
                    title: L(`匯入 ${list.length} 筆課程？`, `Import ${list.length} courses?`),
                    text: L("此操作會新增資料，請先核對內容。", "This adds catalog records. Review the data first."),
                    action: handleAdminImport
                  });
                } catch {
                  setToast({
                    type: "error",
                    message: L("請輸入有效且非空白的JSON陣列", "Enter a valid, non-empty JSON array")
                  });
                }
              }}>
                        {L("檢查並匯入", "Review and import")}
                      </Button>
                    </Stack>}
                </Surface>)}
            {activeTab === "auth" && (user ? <Surface title={L(`你好，${user.name}`, `Hello, ${user.name}`)}>
                  <Stack spacing={3}>
                    <Stack direction="row" sx={{
                gap: 2,
                alignItems: "center"
              }}>
                      <Avatar sx={{
                  bgcolor: "primary.main"
                }}>
                        {user.name?.slice(0, 1)}
                      </Avatar>
                      <Box>
                        <Typography>{user.username}</Typography>
                        <Typography color="text.secondary">
                          {user.department} · {user.grade} {L("年級", "grade")}
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography>
                      {user.role === "admin" ? L("管理者帳號", "Administrator") : L("學生帳號", "Student account")}
                    </Typography>
                    <Stack direction="row" sx={{
                gap: 1
              }}>
                      <Button variant="contained" onClick={() => go("search")}>
                        {L("繼續探索", "Explore courses")}
                      </Button>
                      <Button startIcon={<Logout />} onClick={handleLogout}>
                        {L("登出", "Sign out")}
                      </Button>
                    </Stack>
                  </Stack>
                </Surface> : <Box sx={{
            maxWidth: 480,
            mx: "auto",
            width: "100%"
          }}>
                  <Surface title={authMode === "login" ? L("歡迎回來", "Welcome back") : L("註冊學生帳號", "Create student account")}>
                    <Box component="form" onSubmit={onAuth}>
                      <Stack spacing={3}>
                        <Alert severity="info">
                          {L("此預覽沿用原系統帳號與資料；預排及已修備註變更會儲存回原系統。", "This preview uses the existing account and data. Plan and completion changes are saved to the original system.")}
                        </Alert>
                        <TextField required label={L("帳號", "Username")} autoComplete="username" value={authForm.username} onChange={e => setAuthForm(p => ({
                    ...p,
                    username: e.target.value
                  }))} />
                        <TextField required type={showPassword ? "text" : "password"} label={L("密碼", "Password")} autoComplete={authMode === "login" ? "current-password" : "new-password"} value={authForm.password} onChange={e => setAuthForm(p => ({
                    ...p,
                    password: e.target.value
                  }))} slotProps={{
                    input: {
                      endAdornment: <IconButton aria-label={showPassword ? L("隱藏密碼", "Hide password") : L("顯示密碼", "Show password")} onClick={() => setShowPassword(!showPassword)}>
                                  {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                    },
                    htmlInput: {
                      minLength: authMode === "register" ? 8 : undefined
                    }
                  }} />
                        {authMode === "register" && <>
                            <TextField required label={L("姓名", "Name")} value={authForm.name} onChange={e => setAuthForm(p => ({
                      ...p,
                      name: e.target.value
                    }))} />
                            <Choice label={L("系所", "Department")} value={authForm.department} options={meta.departments.map(d => [d, d])} onChange={v => setAuthForm(p => ({
                      ...p,
                      department: v
                    }))} />
                            <Choice label={L("年級", "Grade")} value={authForm.grade} options={[1, 2, 3, 4].map(g => [g, String(g)])} onChange={v => setAuthForm(p => ({
                      ...p,
                      grade: v
                    }))} />
                          </>}
                        {authError && <Alert severity="error">{authError}</Alert>}
                        <Button variant="contained" type="submit" disabled={saving}>
                          {saving ? <CircularProgress size={22} /> : authMode === "login" ? L("登入", "Sign in") : L("註冊並登入", "Register and sign in")}
                        </Button>
                        <Button onClick={() => {
                    setAuthMode(authMode === "login" ? "register" : "login");
                    setAuthForm(p => ({
                      ...p,
                      password: ""
                    }));
                    setAuthError("");
                  }}>
                          {authMode === "login" ? L("還沒有帳號？註冊學生帳號", "New here? Create an account") : L("已有帳號？返回登入", "Already registered? Sign in")}
                        </Button>
                        <Button color="inherit" onClick={() => go("search")}>
                          {L("先以訪客探索", "Explore as a guest")}
                        </Button>
                      </Stack>
                    </Box>
                  </Surface>
                </Box>)}
            <Typography variant="caption" color="text.secondary" sx={[{
            textAlign: "center"
          }, {
            pt: 2,
            pb: 1
          }]}>
              {L("北護課程規劃 · 預排與估算僅供參考，請依校方正式規定辦理。", "NTUNHS Planner · Plans and estimates are advisory. Refer to official university rules.")}
            </Typography>
          </Stack>
        </Box>
      </Box>
      <Dialog open={!!selectedCourse} onClose={() => setSelectedCourse(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{
        pr: 7
      }}>
          {selectedCourse && name(selectedCourse)}
          <IconButton aria-label={L("關閉課程明細", "Close course details")} onClick={() => setSelectedCourse(null)} sx={{
          position: "absolute",
          right: 12,
          top: 12
        }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedCourse && <Stack spacing={3}>
              {courseTags(selectedCourse)}
              <Table size="small">
                <TableBody>
                  {[[L("代碼", "Code"), selectedCourse.code], [L("學期", "Semester"), semester(selectedCourse.semester, zh)], [L("學分", "Credits"), selectedCourse.credits], [L("時間與地點", "Time and room"), `${names[selectedCourse.weekday]} ${selectedCourse.periods} · ${selectedCourse.room}`]].map(([a, b]) => <TableRow key={a}>
                      <TableCell component="th">{a}</TableCell>
                      <TableCell sx={{
                  overflowWrap: "anywhere"
                }}>
                        {b}
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
              <Typography variant="subtitle1">
                {L("教學計畫摘要", "Syllabus summary")}
              </Typography>
              <Typography>
                {(zh ? selectedCourse.syllabus_summary_zh : selectedCourse.syllabus_summary_en) || L("尚未提供摘要，請洽教師。", "No summary provided. Contact the instructor.")}
              </Typography>
              {selectedCourse.restriction_note_zh && <Alert severity="info">
                  {zh ? selectedCourse.restriction_note_zh : selectedCourse.restriction_note_en || selectedCourse.restriction_note_zh}
                </Alert>}
              {selectedCourse.exemption_note_zh && <Alert severity="warning">
                  {zh ? selectedCourse.exemption_note_zh : selectedCourse.exemption_note_en || selectedCourse.exemption_note_zh}
                </Alert>}
              <Typography variant="caption" color="text.secondary">
                {L("加入預排不等同完成正式選課。", "Adding to a plan does not complete official registration.")}
              </Typography>
            </Stack>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedCourse(null)}>
            {L("關閉", "Close")}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!selectedTeacher} onClose={() => setSelectedTeacher(null)} fullWidth maxWidth="sm">
        <DialogTitle>
          {selectedTeacher?.name} {selectedTeacher?.title}
        </DialogTitle>
        <DialogContent dividers>
          {selectedTeacher && <Stack spacing={2}>
              <Typography color="text.secondary">
                {selectedTeacher.name_en}
              </Typography>
              {[["department", L("系所", "Department")], ["email", "Email"], ["ext", L("分機", "Extension")], ["expertise", L("專長", "Expertise")], ["lab", L("實驗室", "Lab")]].map(([k, l]) => <Box key={k}>
                  <Typography variant="caption" color="text.secondary">
                    {l}
                  </Typography>
                  <Typography>{selectedTeacher[k] || "—"}</Typography>
                </Box>)}
            </Stack>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedTeacher(null)}>
            {L("關閉", "Close")}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!shareUrl} onClose={() => setShareUrl("")} fullWidth>
        <DialogTitle>{L("課表分享連結", "Schedule sharing link")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{
          pt: 1
        }}>
            <Typography>
              {L("連結包含課程清單，不包含姓名與學號。能存取本網站的人可透過連結查看。", "The link contains courses, not student identity. People with site access can view it.")}
            </Typography>
            <TextField label={L("分享連結", "Sharing link")} value={shareUrl} slotProps={{
            input: {
              readOnly: true
            }
          }} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareUrl("")}>{L("關閉", "Close")}</Button>
          <Button variant="contained" startIcon={<ContentCopy />} onClick={async () => {
          try {
            await navigator.clipboard.writeText(shareUrl);
            setToast({
              type: "success",
              message: L("已複製連結", "Link copied")
            });
          } catch {
            setToast({
              type: "error",
              message: L("請選取連結手動複製", "Select and copy the link manually")
            });
          }
        }}>
            {L("複製", "Copy")}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!confirm} onClose={() => !saving && setConfirm(null)}>
        <DialogTitle>{confirm?.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirm?.text}</Typography>
        </DialogContent>
        <DialogActions>
          <Button disabled={saving} onClick={() => setConfirm(null)}>
            {L("取消", "Cancel")}
          </Button>
          <Button disabled={saving} color={confirm?.danger ? "error" : "primary"} onClick={async () => {
          setSaving(true);
          try {
            await confirm.action();
            setConfirm(null);
          } finally {
            setSaving(false);
          }
        }}>
            {saving ? <CircularProgress size={20} /> : confirm?.ok || L("確認", "Confirm")}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={creating || !!editingCourse} onClose={() => {
      setCreating(false);
      setEditingCourse(null);
    }} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCourse ? L("編輯課程", "Edit course") : L("新增課程", "Create course")}
        </DialogTitle>
        <DialogContent dividers>
          <MaterialCourseForm value={editingCourse || newCourse} onChange={editingCourse ? setEditingCourse : setNewCourse} meta={meta} zh={zh} editing={!!editingCourse} onCancel={() => {
          setCreating(false);
          setEditingCourse(null);
        }} onFinish={async () => {
          if (editingCourse) await handleAdminUpdate({
            preventDefault() {}
          });else if (await handleAdminCreate({
            preventDefault() {}
          })) setCreating(false);
        }} />
        </DialogContent>
      </Dialog>
      <Snackbar open={!!toast} autoHideDuration={5500} onClose={() => setToast(null)} anchorOrigin={{
      vertical: "bottom",
      horizontal: "center"
    }}>
        {toast ? <Alert variant="filled" severity={toast.type === "error" ? "error" : toast.type === "success" ? "success" : "info"} onClose={() => setToast(null)}>
            {toast.message}
          </Alert> : undefined}
      </Snackbar>
    </Box>;
}
function MaterialCourseForm({
  value,
  onChange,
  meta,
  zh,
  editing,
  onCancel,
  onFinish
}) {
  const L = (a, b) => zh ? a : b,
    [saving, setSaving] = useState(false);
  const fields = [...(!editing ? [["code", L("課程代碼", "Code"), "text"], ["semester", L("學期", "Semester"), "text"], ["department", L("系所", "Department"), "department"]] : []), ["name_zh", L("中文課名", "Chinese name"), "text"], ["name_en", L("英文課名", "English name"), "text"], ["teacher_name", L("授課教師", "Instructor"), "text"], ["credits", L("學分", "Credits"), "number"], ["category", L("課別", "Category"), "category"], ["weekday", L("星期", "Weekday"), "weekday"], ["periods", L("節次，例如5,6,7", "Periods, e.g. 5,6,7"), "text"], ["room", L("教室", "Room"), "text"], ["min_grade", L("最低修課年級", "Minimum grade"), "number"], ...(editing ? [["restriction_note_zh", L("修課限制", "Restriction"), "text"]] : [])];
  return <Box component="form" onSubmit={async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await onFinish();
    } finally {
      setSaving(false);
    }
  }}>
      <Box sx={{
      display: "grid",
      gridTemplateColumns: {
        xs: "minmax(0,1fr)",
        sm: "1fr 1fr"
      },
      gap: 2
    }}>
        {fields.map(([key, label, type]) => ["category", "department", "weekday"].includes(type) ? <Choice key={key} label={label} value={value[key]} options={type === "weekday" ? DAYS.map(d => [d, String(d)]) : meta[type === "category" ? "categories" : "departments"].map(v => [v, v])} onChange={v => onChange(p => ({
        ...p,
        [key]: v
      }))} /> : <TextField key={key} label={label} type={type} required={["code", "name_zh", "teacher_name", "periods", "semester"].includes(key)} value={value[key] ?? ""} onChange={e => onChange(p => ({
        ...p,
        [key]: type === "number" ? Number(e.target.value) : e.target.value
      }))} slotProps={{
        htmlInput: {
          ...(type === "number" ? {
            min: key === "min_grade" ? 1 : 0,
            max: key === "min_grade" ? 7 : 30,
            step: 1
          } : {}),
          ...(key === "periods" ? {
            pattern: "(1[0-4]|[1-9])(,(1[0-4]|[1-9]))*"
          } : {})
        }
      }} />)}
      </Box>
      <Stack direction="row" sx={[{
      justifyContent: "end",
      gap: 1
    }, {
      mt: 3
    }]}>
        <Button onClick={onCancel}>{L("取消", "Cancel")}</Button>
        <Button variant="contained" type="submit" disabled={saving}>
          {saving ? <CircularProgress size={20} /> : L("儲存", "Save")}
        </Button>
      </Stack>
    </Box>;
}
