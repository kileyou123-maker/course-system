# 北護課程規劃

使用 React 19，提供 Material Design（MUI 9.6，Material Design 2）及 Ant Design 6.7 兩套實際元件介面。右上角切換版本，保留同一份搜尋、課表、帳號及修課進度狀態。預設 Material，可用 ?design=ant 直接開啟 Ant。桌面預設表格、窄版改用課程列表；以白灰與自然綠色統一主題。

## 功能

- 課程探索：課名、教師、代碼搜尋；學期、系所、課別、年級、分類、學程、星期、節次及衝堂篩選；300ms防抖與過期回應保護；伺服器分頁。
- 課程與教師明細：課程摘要、限制、抵免說明、教師聯絡資訊。
- 我的課表：規劃學期與查詢學期分開；整週／每日檢視，涵蓋星期一至日、第1至14節；空堂反向找課、加入／移除、學分摘要與去識別化分享。
- 修課進度：清楚標示自行備註及預排估算，分類明細、兩個學程與額外學分調整。沿用原資管113學年門檻假設，不是官方畢業審查。
- 帳號：登入、學生註冊、登入狀態及登出；訪客備註與登入帳號分開。
- 管理：課程新增、編輯、永久刪除確認、JSON匯入檢查與確認；伺服器驗證管理權限。
- 中文／英文、深淺模式、手機導覽抽屜、表單驗證、空結果重設及錯誤重試。

## 兩種執行模式

### 獨立伺服器

Node.js 22.5以上（建議24）。Express與SQLite提供同源API及建置後的前端。

```bash
npm ci
npm --prefix client ci
cp .env.example .env
npm run build
npm start
```

從專案根目錄啟動，預設 http://localhost:3001。支援`--host`、`--port`或`HOST`、`PORT`；開發前端使用`npm run dev:client`。

請在正式環境設定`JWT_SECRET`、`DEMO_STUDENT_PASSWORD`及`DEMO_ADMIN_PASSWORD`（以`.env.example`的實際變數名稱為準）。不要提交`.env`。原始碼保留示範帳號fallback，僅供本機示範；JWT未設定時程序重啟將使舊token失效。

`DB_PATH`可指定SQLite檔案或`:memory:`；也可用`DATA_DIR`指定資料目錄。預設`server/data/courses.db`，雲端部署必須使用持久磁碟。新初始化只建立通用示範帳號及課程，不含原始的個人學生種子。

本版獨立後端已將衝堂與25學分上限限定為相同學期，POST新增課表檢查先修條件，並保留0學分課程。名額及額外系所規則未另行新增。

### 已代管的新版介面

`npm run build:hosted`將前端與固定來源API代理打包為Worker ESM。這個模式沿用 https://ntunhs-course-system-web.onrender.com 的帳號、課程及資料：登入後的預排與自行備註會回寫原系統。新介面會在登入頁提示這項行為。

代理只接受已列出的`/api`路由，不轉送Cookie、不快取私人API回應，並阻擋跨來源寫入。原站若休眠或故障，新版介面也會受影響。**獨立後端的修正不會自動套用到原站API**；如要全面使用本版後端，請部署上述獨立伺服器。

```bash
npm run build:hosted
```

產物：`dist/server/index.js`及`dist/.openai/hosting.json`。生成檔不提交Git；部署須依相同來源重新建置。

## 驗證

```bash
npm test
npm run build
```

API整合測試使用獨立暫存SQLite及隨機帳密，不接觸線上資料。涵蓋權限、跨學期衝堂、先修、學分上限、0學分、帳號隔離及分享。Worker測試驗證資源、路由限制、同源寫入與錯誤回應。

## 來源

功能及課程資料基礎：[mochi0821/ntunhs-course-system-web](https://github.com/mochi0821/ntunhs-course-system-web)。此版重寫使用介面及互動框架，並修正上述獨立後端行為。校方正式選課及畢業認定仍以官方規定為準。

## GitHub 與 Vercel 部署

此專案位於 `kileyou123-maker/course-system/ntunhs-planner`，以獨立 Vercel 專案部署。Root Directory 設為 `ntunhs-planner`，設定檔會安裝根目錄與 client 相依套件，建置 React 前端並發布 `client/dist`。

`/api/*` 透過 Vercel 同源代理連到原 Render 系統，因此可沿用原帳號、課程、預排與自行備註。登入後的資料變更會寫回原系統。此部署使用原後端行為，獨立 Express/SQLite 伺服器的修正需另外部署後端才會生效。

首頁預設 Material Design，右上角可切換 Ant Design，切換時保留目前搜尋、規劃學期與登入狀態。網址 `?design=ant` 可直接開啟 Ant Design 版本。
