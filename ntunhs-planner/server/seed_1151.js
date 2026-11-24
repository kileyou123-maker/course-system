import { computePeriodMask } from './db.js';

/**
 * Real NTUNHS 1151 courses extracted from the uploaded 1151 全校修課資料表,
 * covering 通識必修/選修 and 專業必修/選修 across all major departments.
 */
export const COURSES_1151 = [
  // === 資訊管理系 (22140) ===
  {
    code: '221400059011A0', semester: '1151', department: '資訊管理系 (22140)', grade: 1,
    name_zh: '企業概論', name_en: 'Introduction to Business', credits: 3, category: '專業必修(系所)',
    teacher_name: '陳巧珊', teacher_en: 'CHIAO-SHAN CHEN', weekday: 3, periods: '2,3,4', room: 'F607',
    enrolled: 50, capacity: 55, min_grade: 1, tags: '',
    restriction_note_zh: '本系四技一般生、外系四技一般生',
    syllabus_summary_zh: '介紹企業的內涵、職能活動、公司治理、企業社會責任與六大管理領域。'
  },
  {
    code: '221400124011A0', semester: '1151', department: '資訊管理系 (22140)', grade: 1,
    name_zh: '程式設計', name_en: 'Introduction of Computer Programming', credits: 3, category: '專業必修(系所)',
    teacher_name: '吳承翰', teacher_en: 'CHENG-HAN WU', weekday: 3, periods: '5,6,7', room: 'F601',
    enrolled: 47, capacity: 55, min_grade: 1, tags: '程式設計課程',
    restriction_note_zh: '本系四技一般生、外系四技一般生',
    syllabus_summary_zh: '教授程式設計概念、問題解決方法、程式流程圖與物件導向基礎實作。'
  },
  {
    code: '221400075011A0', semester: '1151', department: '資訊管理系 (22140)', grade: 1,
    name_zh: '微積分', name_en: 'Calculus', credits: 3, category: '專業必修(系所)',
    teacher_name: '林良憲', teacher_en: 'LIANG-HSIEN LIN', weekday: 2, periods: '2,3,4', room: 'F607',
    enrolled: 42, capacity: 55, min_grade: 1, tags: '',
    restriction_note_zh: '本系四技一般生、外系四技一般生',
    syllabus_summary_zh: '介紹極限與連續、導函數、指數對數函數、積分技巧與多變數函數。'
  },
  {
    code: '221400142011A0', semester: '1151', department: '資訊管理系 (22140)', grade: 1,
    name_zh: '職場資訊能力應用實務', name_en: 'E-Commerce', credits: 3, category: '專業必修(系所)',
    teacher_name: '陳巧珊', teacher_en: 'CHIAO-SHAN CHEN', weekday: 4, periods: '5,6,7', room: 'F601',
    enrolled: 47, capacity: 55, min_grade: 1, tags: '',
    restriction_note_zh: '本系四技一般生大一、外系四技一般生',
    syllabus_summary_zh: '電子商務架構概論、經營模式、市場行銷與企業資源於電子商務之應用。'
  },
  {
    code: '22140014801220', semester: '1151', department: '資訊管理系 (22140)', grade: 2,
    name_zh: '健康照護資料處理', name_en: 'Healthcare Data Processing', credits: 3, category: '專業選修(系所)',
    teacher_name: '施堯啓', teacher_en: 'YAO-CHI SHIH', weekday: 2, periods: '6,7,8', room: 'B210',
    enrolled: 50, capacity: 55, min_grade: 2, tags: '程式設計課程',
    restriction_note_zh: '本系四技一般生大二以上、長照系',
    syllabus_summary_zh: '針對健康照護作業過程（掛號、體檢、居家個案管理）實作資料處理系統。'
  },
  {
    code: '22140119601221', semester: '1151', department: '資訊管理系 (22140)', grade: 2,
    name_zh: '程式設計邏輯', name_en: 'Programming Logic', credits: 3, category: '專業選修(系所)',
    teacher_name: '蔡坤孝', teacher_en: 'KUN-HSIAO TSAI', weekday: 1, periods: '2,3,4', room: 'F601',
    enrolled: 27, capacity: 45, min_grade: 2, tags: '程式設計課程',
    restriction_note_zh: '本系四技一般生大二以上、外系四技一般生大二以上',
    syllabus_summary_zh: '以 C 語言進行邏輯思考訓練、條件與迴圈結構及檔案資料擷取分析。'
  },
  {
    code: '22140002201280', semester: '1151', department: '資訊管理系 (22140)', grade: 2,
    name_zh: '電腦軟體整合應用', name_en: 'Computer Software Integrated Application', credits: 2, category: '通識選修(通識)',
    teacher_name: '王正航', teacher_en: 'CHENG-HANG WANG', weekday: 4, periods: '3,4', room: 'F601',
    enrolled: 47, capacity: 55, min_grade: 2, tags: '程式設計課程',
    restriction_note_zh: '本系四技一般生大二以上、外系四技一般生大二以上',
    syllabus_summary_zh: '資料分析處理與多媒體製作整合應用，輔導取得資訊技能認證。'
  },
  {
    code: '22140022301281', semester: '1151', department: '資訊管理系 (22140)', grade: 2,
    name_zh: '國防科技', name_en: 'Defense Technology', credits: 2, category: '通識選修(通識)',
    teacher_name: '陳品如', teacher_en: 'PIN-JU CHEN', weekday: 3, periods: '6,7', room: 'G203',
    enrolled: 50, capacity: 60, min_grade: 1, tags: '',
    restriction_note_zh: '全校四技、二技一般生皆可選修',
    syllabus_summary_zh: '介紹我國國防科技發展、現代防衛武器與國家安全議題。'
  },
  {
    code: '221401523012A0', semester: '1151', department: '資訊管理系 (22140)', grade: 2,
    name_zh: '進階統計學應用', name_en: 'Statistical Programming with R', credits: 2, category: '專業必修(系所)',
    teacher_name: '陳楚杰', teacher_en: 'CHU-CHIEH CHEN', weekday: 1, periods: '6,7', room: 'B210',
    enrolled: 44, capacity: 55, min_grade: 2, tags: '',
    restriction_note_zh: '本系四技一般生大二以上',
    syllabus_summary_zh: '簡介 R 語言基本語法，進行敘述統計、t檢定、ANOVA、迴歸分析與資料爬蟲。'
  },
  {
    code: '221400045012A0', semester: '1151', department: '資訊管理系 (22140)', grade: 2,
    name_zh: '會計學', name_en: 'Accounting', credits: 3, category: '專業必修(系所)',
    teacher_name: '陳彥宏', teacher_en: 'YEN-HUNG CHEN', weekday: 4, periods: '8,9,10', room: 'B210',
    enrolled: 43, capacity: 55, min_grade: 2, tags: '',
    restriction_note_zh: '本系四技一般生大二以上',
    syllabus_summary_zh: '強化會計循環、財務報表編制、買賣業會計與財報分析能力。'
  },
  {
    code: '221400061012A0', semester: '1151', department: '資訊管理系 (22140)', grade: 2,
    name_zh: '醫療資訊概論', name_en: 'Introduction to Medical Informatics', credits: 3, category: '專業必修(系所)',
    teacher_name: '徐建業', teacher_en: 'CHIEN-YEH HSU', weekday: 4, periods: '5,6,7', room: 'F404',
    enrolled: 44, capacity: 55, min_grade: 2, tags: '跨域課程',
    restriction_note_zh: '本系四技一般生大二以上、外系四技一般生大二以上',
    syllabus_summary_zh: '電子病歷、HL7、DICOM、醫療決策支援系統與遠距醫療實務。'
  },
  {
    code: '221400058013A0', semester: '1151', department: '資訊管理系 (22140)', grade: 3,
    name_zh: '研究概論', name_en: 'Introduction to Research Methodology', credits: 3, category: '專業必修(系所)',
    teacher_name: '林劍秋', teacher_en: 'CHIEN-CHIU LIN', weekday: 5, periods: '8,9,10', room: 'F304',
    enrolled: 40, capacity: 50, min_grade: 3, tags: '',
    restriction_note_zh: '本系四技一般生大三以上',
    syllabus_summary_zh: '科學研究思維、研究步驟、問卷設計與研究文獻批判。'
  },
  {
    code: '22140008701440', semester: '1151', department: '資訊管理系 (22140)', grade: 4,
    name_zh: '健康照護人力資源管理學', name_en: 'Healthcare Human Resource Management', credits: 3, category: '專業選修(系所)',
    teacher_name: '黃遵誠', teacher_en: 'TSUN-CHENG HUANG', weekday: 1, periods: '8,9,10', room: 'G204',
    enrolled: 27, capacity: 45, min_grade: 4, tags: '',
    restriction_note_zh: '不符修課資格：本課程僅限四年級學生修習',
    syllabus_summary_zh: '策略性人力資源管理、招募甄選、績效管理與健康照護職場應用。'
  },
  {
    code: '22140012001441', semester: '1151', department: '資訊管理系 (22140)', grade: 4,
    name_zh: '醫院電腦化實務與應用', name_en: 'Hospital Computerized Practice and Application', credits: 2, category: '專業選修(系所)',
    teacher_name: '黃純文', teacher_en: 'CHUN-WEN HUANG', weekday: 3, periods: '6,7', room: 'G205',
    enrolled: 31, capacity: 45, min_grade: 4, tags: '',
    restriction_note_zh: '不符修課資格：本課程僅限四年級學生修習',
    syllabus_summary_zh: '探討台灣醫院資訊化現況、eHealth Care、電子病歷與遠距醫療應用。'
  },
  {
    code: '22140162801445', semester: '1151', department: '資訊管理系 (22140)', grade: 4,
    name_zh: '醫療機構管理實務', name_en: 'Management and Practice of Health Care Institutions', credits: 2, category: '專業選修(系所)',
    teacher_name: '洪素英', teacher_en: 'SU-YING HUNG', weekday: 4, periods: '7,8', room: 'G204',
    enrolled: 45, capacity: 50, min_grade: 4, tags: '',
    restriction_note_zh: '不符修課資格：本課程僅限四年級學生修習',
    syllabus_summary_zh: '以醫院實務案例演練策略管理、品質管理、財務管理與危機應變。'
  },

  // === 全校通識必修 / 通識選修 (含國文、英文、邏輯、哲學、環境教育、法律倫理、體育) ===
  {
    code: '221400000011A0', semester: '1151', department: '通識教育中心 (10000)', grade: 1,
    name_zh: '國文一（劍俠與志怪）', name_en: 'Chinese Literature I', credits: 2, category: '通識必修(通識)',
    teacher_name: '謝婉馨', teacher_en: 'WAN-HSIN HSIEH', weekday: 1, periods: '8,9', room: 'F409',
    enrolled: 55, capacity: 60, min_grade: 1, tags: '',
    restriction_note_zh: '第二、三階段開放跨系及重補修生選課',
    syllabus_summary_zh: '以古典與現代文學選讀培養閱讀、寫作與口語表達能力。'
  },
  {
    code: '221400213011A0', semester: '1151', department: '通識教育中心 (10000)', grade: 1,
    name_zh: '資訊素養與網路運用', name_en: 'Information Literacy and Network Application', credits: 2, category: '通識必修(通識)',
    teacher_name: '王正航', teacher_en: 'CHENG-HANG WANG', weekday: 4, periods: '8,9', room: 'S104',
    enrolled: 45, capacity: 55, min_grade: 1, tags: '',
    restriction_note_zh: '大一必修，外系大二以上可跨班選修',
    syllabus_summary_zh: '培養電腦基礎概念、網路應用、資訊安全與智慧財產權素養。'
  },
  {
    code: '221400027011A0', semester: '1151', department: '通識教育中心 (10000)', grade: 1,
    name_zh: '藝術文化史', name_en: 'History of Artistic Culture', credits: 2, category: '通識必修(通識)',
    teacher_name: '黃渼娟', teacher_en: 'MEI-CHUAN HUANG', weekday: 2, periods: '8,9', room: 'F407',
    enrolled: 49, capacity: 58, min_grade: 1, tags: '',
    restriction_note_zh: '第二階段開放跨班選課',
    syllabus_summary_zh: '探討中西方藝術演進與賞析，提升審美素養與文化視野。'
  },
  {
    code: '131400028014A0', semester: '1151', department: '通識教育中心 (10000)', grade: 4,
    name_zh: '世界文明史', name_en: 'The History of World Civilization', credits: 2, category: '通識必修(通識)',
    teacher_name: '李佳馨', teacher_en: 'CHIA-HSIN LEE', weekday: 4, periods: '3,4', room: 'F408',
    enrolled: 30, capacity: 55, min_grade: 1, tags: '',
    restriction_note_zh: '第二階段開放重補修及跨班選課',
    syllabus_summary_zh: '探討世界古文明、中古至近代文明發展與全球視野。'
  },
  {
    code: '131400024011A0', semester: '1151', department: '通識教育中心 (10000)', grade: 1,
    name_zh: '法律倫理與生活', name_en: 'Laws and Ethics of Daily Life', credits: 2, category: '通識必修(通識)',
    teacher_name: '李筱苓', teacher_en: 'HSIAO-LING LEE', weekday: 3, periods: '6,7', room: 'G305',
    enrolled: 48, capacity: 55, min_grade: 1, tags: '',
    restriction_note_zh: '第二階段開放跨班選課',
    syllabus_summary_zh: '介紹法律理念、正義概念及日常常見法律與倫理議題。'
  },
  {
    code: '211400021012A0', semester: '1151', department: '通識教育中心 (10000)', grade: 2,
    name_zh: '環境教育', name_en: 'Environmental Education', credits: 2, category: '通識必修(通識)',
    teacher_name: '林和駿', teacher_en: 'HO-CHUN LIN', weekday: 4, periods: '6,7', room: 'F401',
    enrolled: 55, capacity: 60, min_grade: 1, tags: '',
    restriction_note_zh: '第二階段開放跨班選課',
    syllabus_summary_zh: '闡述環境永續發展、環境倫理、減碳能源與生態保育。'
  },
  {
    code: '221400031014A0', semester: '1151', department: '通識教育中心 (10000)', grade: 4,
    name_zh: '哲學與人生', name_en: 'Philosophy and Life', credits: 2, category: '通識必修(通識)',
    teacher_name: '陳紹韻', teacher_en: 'SHAO-YUN CHEN', weekday: 5, periods: '1,2', room: 'F408',
    enrolled: 52, capacity: 58, min_grade: 1, tags: '',
    restriction_note_zh: '第二階段開放跨班選課',
    syllabus_summary_zh: '對生命、命運、道德、藝術與存在意義進行哲學反省與討論。'
  },
  {
    code: '111400032013A0', semester: '1151', department: '通識教育中心 (10000)', grade: 3,
    name_zh: '邏輯概論', name_en: 'Introduction to Logic', credits: 2, category: '通識必修(通識)',
    teacher_name: '李佳馨', teacher_en: 'CHIA-HSIN LEE', weekday: 2, periods: '1,2', room: 'F408',
    enrolled: 49, capacity: 55, min_grade: 1, tags: '',
    restriction_note_zh: '第二階段開放跨班選課',
    syllabus_summary_zh: '介紹演繹法、歸納法、非形式謬誤與語言陷阱，培養邏輯思辨能力。'
  },
  {
    code: '21140105501111', semester: '1151', department: '通識教育中心 (10000)', grade: 1,
    name_zh: '英文一', name_en: 'Freshman English I', credits: 2, category: '通識必修(通識)',
    teacher_name: '楊婉琪', teacher_en: 'WAN-CHI YANG', weekday: 4, periods: '3,4', room: 'F610',
    enrolled: 42, capacity: 50, min_grade: 1, tags: '',
    exemption_note_zh: '多益 (TOEIC) 達 600 分以上或全民英檢中級複試通過可申請抵免',
    exemption_note_en: 'Exemptible with TOEIC 600+ or GEPT Intermediate',
    syllabus_summary_zh: '文法複習、英文閱讀技巧與一般英語文章理解。'
  },
  {
    code: '21140022401211', semester: '1151', department: '通識教育中心 (10000)', grade: 2,
    name_zh: '進階英文', name_en: 'Advanced English', credits: 2, category: '通識必修(通識)',
    teacher_name: '陳儀庭', teacher_en: 'I-TING CHEN', weekday: 2, periods: '3,4', room: 'F610',
    enrolled: 49, capacity: 55, min_grade: 2, tags: '',
    exemption_note_zh: '多益 (TOEIC) 達 650 分以上可依規定申請抵免',
    exemption_note_en: 'Exemptible with TOEIC 650+',
    syllabus_summary_zh: '中級至中高級英文文法、閱讀策略與文章摘要訓練。'
  },
  {
    code: '21140106101221', semester: '1151', department: '通識教育中心 (10000)', grade: 2,
    name_zh: '職場英文', name_en: 'English for the Work Place', credits: 2, category: '通識必修(通識)',
    teacher_name: '蘇琬婷', teacher_en: 'WAN-TING SU', weekday: 2, periods: '1,2', room: 'F609',
    enrolled: 36, capacity: 45, min_grade: 2, tags: '全英語授課',
    exemption_note_zh: '多益 (TOEIC) 達 700 分以上可申請抵免',
    exemption_note_en: 'Exemptible with TOEIC 700+',
    syllabus_summary_zh: '全英語授課，強化職場英語常用字彙、商務對話與溝通技巧。'
  },
  {
    code: '11140021201231', semester: '1151', department: '通識教育中心 (10000)', grade: 2,
    name_zh: '新聞英語', name_en: 'Journalistic English', credits: 2, category: '通識必修(通識)',
    teacher_name: '林淑雯', teacher_en: 'SHU-WEN LIN', weekday: 5, periods: '3,4', room: 'F610',
    enrolled: 41, capacity: 50, min_grade: 2, tags: '遠距教學課程,全英語授課',
    syllabus_summary_zh: '遠距教學課程，導讀國際新聞報導與健康醫療時事英語。'
  },
  {
    code: '11140026401460', semester: '1151', department: '通識教育中心 (10000)', grade: 4,
    name_zh: '羽球（通識選修）', name_en: 'Badminton', credits: 2, category: '通識選修(通識)',
    teacher_name: '黃俊清', teacher_en: 'CHUN-CHING HUANG', weekday: 1, periods: '1,2', room: '體育館',
    enrolled: 46, capacity: 50, min_grade: 1, tags: '',
    restriction_note_zh: '全校各學制皆可選修',
    syllabus_summary_zh: '教授羽球基本技巧、戰術與競賽規則，培養終身運動習慣。'
  },
  {
    code: '221401726012A0', semester: '1151', department: '通識教育中心 (10000)', grade: 2,
    name_zh: '體育-匹克球', name_en: 'PE - Pickleball', credits: 0, category: '通識必修(通識)',
    teacher_name: '鄭俊雄', teacher_en: 'CHUN-HSIUNG CHENG', weekday: 3, periods: '3,4', room: '體育室',
    enrolled: 50, capacity: 55, min_grade: 2, tags: '跨校',
    syllabus_summary_zh: '教導匹克球基本動作、比賽規則與策略，培養團隊合作精神。'
  },

  // === 健康事業管理系 (21140) ===
  {
    code: '211400589011A0', semester: '1151', department: '健康事業管理系 (21140)', grade: 1,
    name_zh: '健康照護體系概論', name_en: 'Introduction to Health Care Delivery Systems', credits: 2, category: '專業必修(系所)',
    teacher_name: '蔡懿玲', teacher_en: 'I-LING TSAI', weekday: 3, periods: '6,7', room: 'F805',
    enrolled: 48, capacity: 55, min_grade: 1, tags: '跨校',
    syllabus_summary_zh: '介紹國內外醫院體系、長期照護與三段五級健康照護體系沿革。'
  },
  {
    code: '211400046011A0', semester: '1151', department: '健康事業管理系 (21140)', grade: 1,
    name_zh: '經濟學', name_en: 'Economics', credits: 2, category: '專業必修(系所)',
    teacher_name: '徐瑋', teacher_en: 'WEI HSU', weekday: 3, periods: '8,9', room: 'F805',
    enrolled: 44, capacity: 55, min_grade: 1, tags: '跨校',
    syllabus_summary_zh: '解析經濟學基本原則、供需原理與醫療健康經濟分析。'
  },
  {
    code: '21140010201220', semester: '1151', department: '健康事業管理系 (21140)', grade: 2,
    name_zh: '病歷管理', name_en: 'Health Information and Medical Record Management', credits: 2, category: '專業選修(系所)',
    teacher_name: '李培芬', teacher_en: 'PEI-FEN LEE', weekday: 5, periods: '8,9', room: 'F607',
    enrolled: 52, capacity: 55, min_grade: 2, tags: '',
    syllabus_summary_zh: '電子病歷發展趨勢、疾病分類系統、病歷隱私與資訊安全管理。'
  },
  {
    code: '21140068601220', semester: '1151', department: '健康事業管理系 (21140)', grade: 2,
    name_zh: '顧客關係管理', name_en: 'Customer Relationship Management', credits: 3, category: '專業選修(系所)',
    teacher_name: '莊士勇', teacher_en: 'SHIH-YUNG CHUANG', weekday: 1, periods: '5,6,7', room: 'F404',
    enrolled: 59, capacity: 60, min_grade: 2, tags: '',
    syllabus_summary_zh: '透過本土醫療與服務業個案探討 CRM 理論與實務應用。'
  },
  {
    code: '211400034013A0', semester: '1151', department: '健康事業管理系 (21140)', grade: 3,
    name_zh: '流行病學', name_en: 'Epidemiology', credits: 2, category: '專業必修(系所)',
    teacher_name: '陳素秋', teacher_en: 'SU-CHIU CHEN', weekday: 4, periods: '9,10', room: 'F804',
    enrolled: 40, capacity: 50, min_grade: 3, tags: '',
    syllabus_summary_zh: '應用流行病學理論與方法分析疾病分佈、危險因子與健康現況。'
  },
  {
    code: '21140188101440', semester: '1151', department: '健康事業管理系 (21140)', grade: 4,
    name_zh: '人工智慧概論', name_en: 'Introduction to Artificial Intelligence', credits: 2, category: '專業選修(系所)',
    teacher_name: '黃偉綸', teacher_en: 'WEI-LUN HUANG', weekday: 3, periods: '6,7', room: 'F804',
    enrolled: 41, capacity: 50, min_grade: 2, tags: '',
    syllabus_summary_zh: '介紹人工智慧基礎概念與健康產業智慧應用實例。'
  },
  {
    code: '21140012101440', semester: '1151', department: '健康事業管理系 (21140)', grade: 4,
    name_zh: '統計套裝軟體', name_en: 'Statistical Software', credits: 2, category: '專業選修(系所)',
    teacher_name: '翁仕彥', teacher_en: 'SHIH-YEN WENG', weekday: 3, periods: '3,4', room: 'B210',
    enrolled: 24, capacity: 45, min_grade: 2, tags: '',
    syllabus_summary_zh: '以實際案例教授 SPSS 資料鍵入、探索分析與統計檢定實作。'
  },

  // === 護理系 (11140) ===
  {
    code: '11140104101110', semester: '1151', department: '護理系 (11140)', grade: 1,
    name_zh: '性別與健康照護', name_en: 'Gender and Healthcare', credits: 2, category: '專業選修(系所)',
    teacher_name: '蘇美禎', teacher_en: 'MEI-CHEN SU', weekday: 5, periods: '8,9', room: 'G203',
    enrolled: 32, capacity: 45, min_grade: 1, tags: '混合式遠距教學,跨域課程',
    syllabus_summary_zh: '以性別主流化為基礎，探討醫療環境與職場中的性別平等議題。'
  },
  {
    code: '111400051011A0', semester: '1151', department: '護理系 (11140)', grade: 1,
    name_zh: '解剖學', name_en: 'Human Anatomy', credits: 2, category: '專業必修(系所)',
    teacher_name: '林君樺', teacher_en: 'CHUN-HUA LIN', weekday: 1, periods: '6,7', room: 'B113',
    enrolled: 58, capacity: 60, min_grade: 1, tags: '',
    syllabus_summary_zh: '學習人體細胞、組織及各大器官系統構造與功能。'
  },
  {
    code: '111400302011A0', semester: '1151', department: '護理系 (11140)', grade: 1,
    name_zh: '關懷與溝通', name_en: 'Caring and Communication', credits: 2, category: '專業必修(系所)',
    teacher_name: '李坤黛', teacher_en: 'KUN-TAI LEE', weekday: 2, periods: '6,7', room: 'G202',
    enrolled: 59, capacity: 60, min_grade: 1, tags: '跨域課程',
    syllabus_summary_zh: '培養關懷內涵與人際溝通技巧，應用於自我與健康照護互動。'
  },
  {
    code: '11140031101440', semester: '1151', department: '護理系 (11140)', grade: 4,
    name_zh: '危機處理', name_en: 'Crisis Intervention', credits: 2, category: '專業選修(系所)',
    teacher_name: '林佑蓉', teacher_en: 'YU-JUNG LIN', weekday: 1, periods: '3,4', room: 'G206',
    enrolled: 45, capacity: 50, min_grade: 3, tags: '',
    syllabus_summary_zh: '透過情境演練與案例分析學習個人與臨床危機處置能力。'
  },

  // === 生死與健康心理諮商系 (33140) ===
  {
    code: '33140196001110', semester: '1151', department: '生死與健康心理諮商系 (33140)', grade: 1,
    name_zh: '綠色照護輔助療法', name_en: 'Green Care–Assisted Health Interventions', credits: 2, category: '專業選修(系所)',
    teacher_name: '葉明理', teacher_en: 'MING-LI YEH', weekday: 4, periods: '8,9', room: 'G303',
    enrolled: 58, capacity: 60, min_grade: 1, tags: '',
    syllabus_summary_zh: '介紹動物輔助療法、園藝輔助療法、森林療癒與綠色處方箋設計。'
  },
  {
    code: '331401072012A0', semester: '1151', department: '生死與健康心理諮商系 (33140)', grade: 2,
    name_zh: '社會心理學', name_en: 'Introduction to Social Psychology', credits: 2, category: '專業必修(系所)',
    teacher_name: '吳庶深', teacher_en: 'SHU-SHEN WU', weekday: 4, periods: '8,9', room: 'B114',
    enrolled: 67, capacity: 70, min_grade: 2, tags: '跨域課程',
    syllabus_summary_zh: '從社會認知、社會影響與人際關係切入生活與健康議題。'
  },
  {
    code: '33140111501330', semester: '1151', department: '生死與健康心理諮商系 (33140)', grade: 3,
    name_zh: '社區心理衛生', name_en: 'Community Mental Health', credits: 2, category: '專業選修(系所)',
    teacher_name: '蔡宜樺', teacher_en: 'I-HUA TSAI', weekday: 1, periods: '3,4', room: 'G405',
    enrolled: 43, capacity: 55, min_grade: 3, tags: 'EMI全英語授課',
    syllabus_summary_zh: '全英語授課，探討個人、家庭與社會環境對社區心理健康的影響。'
  },

  // === 休閒產業與健康促進系 (23140) ===
  {
    code: '23140133701110', semester: '1151', department: '休閒產業與健康促進系 (23140)', grade: 1,
    name_zh: '旅遊日語', name_en: 'Japanese for Tourism', credits: 2, category: '專業選修(系所)',
    teacher_name: '郭心華', teacher_en: 'HSIN-HUA KUO', weekday: 2, periods: '1,2', room: 'F902',
    enrolled: 23, capacity: 45, min_grade: 1, tags: '跨校',
    restriction_note_zh: '需具備五十音基礎，開放外系選修 10 名',
    syllabus_summary_zh: '培養赴日旅遊與接待日本旅客之基礎日語聽說溝通能力。'
  },
  {
    code: '23140166901330', semester: '1151', department: '休閒產業與健康促進系 (23140)', grade: 3,
    name_zh: '人際溝通與情緒管理', name_en: 'Interpersonal Communication and Emotion Management', credits: 2, category: '專業選修(系所)',
    teacher_name: '方文熙', teacher_en: 'WEN-HSI FANG', weekday: 4, periods: '6,7', room: 'F402',
    enrolled: 19, capacity: 45, min_grade: 1, tags: '',
    syllabus_summary_zh: '透過自我情緒覺察與案例討論，培養職場人際溝通與情緒調適技巧。'
  },
  {
    code: '23140133301330', semester: '1151', department: '休閒產業與健康促進系 (23140)', grade: 3,
    name_zh: '銀髮族健康休閒規劃', name_en: 'Seniors Health and Leisure Planning', credits: 2, category: '專業選修(系所)',
    teacher_name: '李曉昀', teacher_en: 'HSIAO-YUN LEE', weekday: 1, periods: '6,7', room: 'F902',
    enrolled: 39, capacity: 40, min_grade: 1, tags: '跨域課程,跨校',
    syllabus_summary_zh: '整合高齡行為趨勢、社會資源與健康促進活動規劃實務。'
  },

  // === 高齡健康照護系 (13140) ===
  {
    code: '13140110701110', semester: '1151', department: '高齡健康照護系 (13140)', grade: 1,
    name_zh: '園藝治療概論', name_en: 'Introduction to Horticultural Therapy', credits: 2, category: '專業選修(系所)',
    teacher_name: '藍婉齡', teacher_en: 'WAN-LING LAN', weekday: 2, periods: '3,4', room: 'G305',
    enrolled: 43, capacity: 43, min_grade: 1, tags: '',
    syllabus_summary_zh: '介紹園藝治療評估方法、設計與實作，促進高齡與失能者復健。'
  },
  {
    code: '13140196901220', semester: '1151', department: '高齡健康照護系 (13140)', grade: 2,
    name_zh: '藝術輔療概論', name_en: 'Art Assisted Therapy', credits: 2, category: '專業選修(系所)',
    teacher_name: '孫若馨', teacher_en: 'JO-HSIN SUN', weekday: 1, periods: '3,4', room: 'F304',
    enrolled: 50, capacity: 55, min_grade: 1, tags: '跨域課程',
    syllabus_summary_zh: '結合視覺心理與社區成人方案規劃，設計多元藝術輔療活動。'
  },
  {
    code: '13140197001330', semester: '1151', department: '高齡健康照護系 (13140)', grade: 3,
    name_zh: '音樂輔療概論', name_en: 'Music-Assisted Care', credits: 2, category: '專業選修(系所)',
    teacher_name: '鄒昌婷', teacher_en: 'CHANG-TING TSOU', weekday: 5, periods: '6,7', room: 'F405',
    enrolled: 40, capacity: 40, min_grade: 3, tags: '跨域課程',
    syllabus_summary_zh: '探討音樂於情緒調節、認知促進與高齡照護教案實作。'
  },

  // === 運動保健系 (32140) ===
  {
    code: '321400329012A0', semester: '1151', department: '運動保健系 (32140)', grade: 2,
    name_zh: '緊急救護', name_en: 'Incident Management and First Aid', credits: 2, category: '專業必修(系所)',
    teacher_name: '吳孝觀', teacher_en: 'HSIAO-KUAN WU', weekday: 2, periods: '8,9', room: 'G209',
    enrolled: 58, capacity: 60, min_grade: 2, tags: '跨域課程',
    syllabus_summary_zh: '緊急救護系統、災難處置、傷病患疏散與急救技術演練。'
  },
  {
    code: '32140164401334', semester: '1151', department: '運動保健系 (32140)', grade: 3,
    name_zh: '高齡運動醫學', name_en: 'Sport Medicine of Geriatrics', credits: 2, category: '專業選修(系所)',
    teacher_name: '林懿苑', teacher_en: 'I-YUAN LIN', weekday: 1, periods: '6,7', room: 'G202',
    enrolled: 40, capacity: 40, min_grade: 3, tags: '跨域課程',
    syllabus_summary_zh: '針對肌少症與銀髮常見退化疾病設計個別化安全運動處方。'
  },
  {
    code: '32140055901444', semester: '1151', department: '運動保健系 (32140)', grade: 4,
    name_zh: '運動行銷學', name_en: 'Sports Marketing', credits: 2, category: '專業選修(系所)',
    teacher_name: '賴世烱', teacher_en: 'SHIH-CHIUNG LAI', weekday: 2, periods: '8,9', room: 'F403',
    enrolled: 26, capacity: 45, min_grade: 4, tags: 'EMI全英語授課',
    syllabus_summary_zh: '全英語授課，學習運動產業行銷理論與專案企劃實務。'
  },

  // === 智慧健康照護跨領域學士學位學程 (42140) ===
  {
    code: '42140022901110', semester: '1151', department: '智慧健康照護跨領域學士學位學程 (42140)', grade: 1,
    name_zh: '人工智慧', name_en: 'Artificial Intelligence', credits: 2, category: '專業選修(系所)',
    teacher_name: '郭朝揚', teacher_en: 'CHAO-YANG KUO', weekday: 4, periods: '1,2', room: 'G105',
    enrolled: 36, capacity: 50, min_grade: 1, tags: '跨校',
    syllabus_summary_zh: '介紹機器學習、深度學習演算法與智慧醫療跨領域應用。'
  },

  // === 語言治療與聽力學系 (25140) & 嬰幼兒保育系 (31140) ===
  {
    code: '251401359011A0', semester: '1151', department: '語言治療與聽力學系 (25140)', grade: 1,
    name_zh: '普通心理學', name_en: 'General Psychology', credits: 2, category: '專業必修(系所)',
    teacher_name: '翁仕明', teacher_en: 'SHIH-MING WENG', weekday: 1, periods: '3,4', room: 'F409',
    enrolled: 56, capacity: 60, min_grade: 1, tags: '跨域課程',
    syllabus_summary_zh: '探索心理學研究方法、心理測驗與助人領域同理心發展。'
  },
  {
    code: '31140050101332', semester: '1151', department: '嬰幼兒保育系 (31140)', grade: 3,
    name_zh: '人際關係與溝通', name_en: 'Interpersonal Relationship and Communication', credits: 2, category: '專業選修(系所)',
    teacher_name: '莊芷', teacher_en: 'CHIH CHUANG', weekday: 3, periods: '6,7', room: 'F414',
    enrolled: 51, capacity: 55, min_grade: 2, tags: '',
    syllabus_summary_zh: '分析個人溝通模式與親密關係，學習有效人際互動技巧。'
  }
];

export function seed1151Catalog(db) {
  const cols = db.prepare('PRAGMA table_info(courses)').all().map((c) => c.name);
  if (!cols.includes('tags')) {
    db.exec("ALTER TABLE courses ADD COLUMN tags TEXT DEFAULT ''");
  }

  const insertCourse = db.prepare(`
    INSERT OR IGNORE INTO courses (
      code, semester, department, grade, name_zh, name_en, credits, category,
      teacher_name, teacher_en, weekday, periods, period_mask, room,
      enrolled, capacity, min_grade, restriction_note_zh,
      exemption_note_zh, exemption_note_en, syllabus_summary_zh, tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of COURSES_1151) {
    insertCourse.run(
      c.code,
      c.semester,
      c.department,
      c.grade,
      c.name_zh,
      c.name_en,
      c.credits,
      c.category,
      c.teacher_name,
      c.teacher_en,
      c.weekday,
      c.periods,
      computePeriodMask(c.periods),
      c.room,
      c.enrolled,
      c.capacity,
      c.min_grade,
      c.restriction_note_zh || null,
      c.exemption_note_zh || null,
      c.exemption_note_en || null,
      c.syllabus_summary_zh || null,
      c.tags || ''
    );
  }

  // Link AI course (42140022901110) and Medical Informatics (221400061012A0) to programs
  const medId = db.prepare("SELECT id FROM programs WHERE code = 'MED_INFO'").get()?.id;
  const aiId = db.prepare("SELECT id FROM programs WHERE code = 'AI_APP'").get()?.id;
  const dataId = db.prepare("SELECT id FROM programs WHERE code = 'HEALTH_DATA'").get()?.id;
  const mapProg = db.prepare('INSERT OR IGNORE INTO course_programs (course_id, program_id) VALUES (?, ?)');
  const getId = (code) => db.prepare('SELECT id FROM courses WHERE code = ?').get(code)?.id;

  const extraMaps = [
    ['42140022901110', aiId],
    ['221400061012A0', medId],
    ['21140188101440', aiId],
    ['21140010201220', medId],
    ['221401523012A0', dataId]
  ];
  for (const [code, pid] of extraMaps) {
    const cid = getId(code);
    if (cid && pid) mapProg.run(cid, pid);
  }
}
