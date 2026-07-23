export type SupportedLanguage = "en" | "zh-CN" | "zh-TW" | "ja" | "ko" | "hi" | "th" | "ms" | "id" | "vi" | "ar";
export type SupportedCurrency = "USD" | "SGD" | "HKD" | "JPY" | "CNY" | "KRW" | "INR" | "THB" | "MYR" | "IDR" | "PHP" | "VND" | "TWD" | "AUD" | "AED" | "EUR" | "GBP";

export const COUNTRY_CURRENCY: Record<string, SupportedCurrency> = {
  Singapore: "SGD", "Hong Kong": "HKD", Japan: "JPY", "South Korea": "KRW", China: "CNY",
  India: "INR", Thailand: "THB", Malaysia: "MYR", Indonesia: "IDR", Philippines: "PHP",
  Vietnam: "VND", Taiwan: "TWD", Australia: "AUD", "New Zealand": "AUD", "United Arab Emirates": "AED",
};
export const COUNTRY_LANGUAGE: Record<string, SupportedLanguage> = {
  Singapore: "en", "Hong Kong": "zh-TW", Japan: "ja", "South Korea": "ko", China: "zh-CN",
  India: "hi", Thailand: "th", Malaysia: "ms", Indonesia: "id", Philippines: "en",
  Vietnam: "vi", Taiwan: "zh-TW", Australia: "en", "New Zealand": "en", "United Arab Emirates": "ar",
};
export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: "English", "zh-CN": "简体中文", "zh-TW": "繁體中文", ja: "日本語", ko: "한국어",
  hi: "हिन्दी", th: "ไทย", ms: "Bahasa Melayu", id: "Bahasa Indonesia", vi: "Tiếng Việt", ar: "العربية",
};
export const CURRENCY_LABELS: Record<SupportedCurrency, string> = {
  USD: "US Dollar", SGD: "Singapore Dollar", HKD: "Hong Kong Dollar", JPY: "Japanese Yen",
  CNY: "Chinese Yuan", KRW: "South Korean Won", INR: "Indian Rupee", THB: "Thai Baht",
  MYR: "Malaysian Ringgit", IDR: "Indonesian Rupiah", PHP: "Philippine Peso", VND: "Vietnamese Dong",
  TWD: "Taiwan Dollar", AUD: "Australian Dollar", AED: "UAE Dirham", EUR: "Euro", GBP: "British Pound",
};

// Full site-wide translations
const T: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    bankName: "RuiFeng", bankSubtitle: "Private Bank", welcome: "Welcome", signIn: "Sign in", signOut: "Sign out",
    dashboard: "Overview", accounts: "Accounts", transfers: "Transfers", cards: "Cards", investments: "Investments",
    lending: "Lending", fxDesk: "FX Desk", beneficiaries: "Beneficiaries", concierge: "Concierge", profile: "Profile",
    settings: "Settings", admin: "Administration", overview: "Overview", openAccount: "Open Account",
    newTransfer: "New Transfer", totalWealth: "Total Wealth", cashBalances: "Cash Balances", activeLoans: "Active Loans",
    privateBanking: "Private Banking", commandCenter: "Command Center", recentActivity: "Recent Activity",
    notifications: "Notifications", clientSince: "Client Since", secureSession: "Secure Session",
    billPayments: "Bill Payments", cryptoFunding: "Crypto Funding", news: "News", receipts: "Receipts",
    amount: "Amount", submit: "Submit", cancel: "Cancel", save: "Save", close: "Close", loading: "Loading...",
    pending: "Pending", completed: "Completed", active: "Active", blocked: "Blocked",
    fromAccount: "From Account", toAccount: "To Account", reference: "Reference",
    balance: "Balance", currency: "Currency", language: "Language", search: "Search",
    apply: "Apply", buy: "Buy", sell: "Sell", confirm: "Confirm", date: "Date",
    status: "Status", type: "Type", details: "Details", total: "Total", fee: "Fee",
    fundCard: "Fund Card", viewReceipt: "View Receipt", manageCard: "Manage Card",
    loanDue: "Loan Due", monthlyPayment: "Monthly Payment", autoDebit: "Auto-Debit",
    cardNumber: "Card Number", cvv: "CVV", expiry: "Expiry", cardholder: "Cardholder", recurringPayments: "Recurring Payments", statements: "Statements", security: "Security",
  },
  "zh-CN": {
    bankName: "瑞峯", bankSubtitle: "私人银行", welcome: "欢迎", signIn: "登录", signOut: "退出",
    dashboard: "概览", accounts: "账户", transfers: "转账", cards: "银行卡", investments: "投资",
    lending: "贷款", fxDesk: "外汇", beneficiaries: "收款人", concierge: "管家", profile: "个人资料",
    settings: "设置", admin: "管理", overview: "概览", openAccount: "开户",
    newTransfer: "新转账", totalWealth: "总资产", cashBalances: "现金余额", activeLoans: "活跃贷款",
    privateBanking: "私人银行", commandCenter: "管理中心", recentActivity: "近期动态",
    notifications: "通知", clientSince: "客户自", secureSession: "安全会话",
    billPayments: "缴费", cryptoFunding: "加密充值", news: "新闻", receipts: "收据",
    amount: "金额", submit: "提交", cancel: "取消", save: "保存", close: "关闭", loading: "加载中...",
    pending: "处理中", completed: "已完成", active: "活跃", blocked: "已冻结",
    fromAccount: "转出账户", toAccount: "转入账户", reference: "参考号",
    balance: "余额", currency: "货币", language: "语言", search: "搜索",
    apply: "申请", buy: "买入", sell: "卖出", confirm: "确认", date: "日期",
    status: "状态", type: "类型", details: "详情", total: "总计", fee: "费用",
    fundCard: "卡充值", viewReceipt: "查看收据", manageCard: "管理卡片",
    loanDue: "贷款到期", monthlyPayment: "月供", autoDebit: "自动扣款",
    cardNumber: "卡号", cvv: "安全码", expiry: "有效期", cardholder: "持卡人", recurringPayments: "定期付款", statements: "账单", security: "安全",
  },
  "zh-TW": {
    bankName: "瑞峯", bankSubtitle: "私人銀行", welcome: "歡迎", signIn: "登入", signOut: "登出",
    dashboard: "總覽", accounts: "賬戶", transfers: "轉賬", cards: "銀行卡", investments: "投資",
    lending: "貸款", fxDesk: "外匯", beneficiaries: "收款人", concierge: "管家", profile: "個人資料",
    settings: "設定", admin: "管理", overview: "總覽", openAccount: "開戶",
    newTransfer: "新轉賬", totalWealth: "總資產", cashBalances: "現金餘額", activeLoans: "活躍貸款",
    privateBanking: "私人銀行", commandCenter: "管理中心", recentActivity: "近期動態",
    notifications: "通知", clientSince: "客戶自", secureSession: "安全會話",
    billPayments: "繳費", cryptoFunding: "加密充值", news: "新聞", receipts: "收據",
    amount: "金額", submit: "提交", cancel: "取消", save: "保存", close: "關閉", loading: "載入中...",
    pending: "處理中", completed: "已完成", active: "活躍", blocked: "已凍結",
    fromAccount: "轉出賬戶", toAccount: "轉入賬戶", reference: "參考號",
    balance: "餘額", currency: "貨幣", language: "語言", search: "搜索",
    apply: "申請", buy: "買入", sell: "賣出", confirm: "確認", date: "日期",
    status: "狀態", type: "類型", details: "詳情", total: "總計", fee: "費用",
    fundCard: "卡充值", viewReceipt: "查看收據", manageCard: "管理卡片",
    loanDue: "貸款到期", monthlyPayment: "月供", autoDebit: "自動扣款",
    cardNumber: "卡號", cvv: "安全碼", expiry: "有效期", cardholder: "持卡人", recurringPayments: "定期付款", statements: "賬單", security: "安全",
  },
  ja: {
    bankName: "瑞峯", bankSubtitle: "プライベートバンク", welcome: "ようこそ", signIn: "ログイン", signOut: "ログアウト",
    dashboard: "ダッシュボード", accounts: "口座", transfers: "送金", cards: "カード", investments: "投資",
    lending: "融資", fxDesk: "為替", beneficiaries: "受取人", concierge: "コンシェルジュ", profile: "プロフィール",
    settings: "設定", admin: "管理", overview: "概要", openAccount: "口座開設",
    newTransfer: "新規送金", totalWealth: "総資産", cashBalances: "現金残高", activeLoans: "ローン",
    privateBanking: "プライベートバンク", commandCenter: "管理センター", recentActivity: "最近の取引",
    notifications: "通知", clientSince: "開始", secureSession: "セキュアセッション",
    billPayments: "請求書払い", cryptoFunding: "暗号通貨入金", news: "ニュース", receipts: "領収書",
    amount: "金額", submit: "送信", cancel: "キャンセル", save: "保存", close: "閉じる", loading: "読込中...",
    pending: "処理中", completed: "完了", active: "有効", blocked: "停止",
    fromAccount: "送金元", toAccount: "送金先", reference: "参照番号",
    balance: "残高", currency: "通貨", language: "言語", search: "検索",
    apply: "申請", buy: "購入", sell: "売却", confirm: "確認", date: "日付",
    status: "状態", type: "種類", details: "詳細", total: "合計", fee: "手数料",
    fundCard: "カード入金", viewReceipt: "領収書を見る", manageCard: "カード管理",
    loanDue: "返済期限", monthlyPayment: "月額返済", autoDebit: "自動引落",
    cardNumber: "カード番号", cvv: "セキュリティコード", expiry: "有効期限", cardholder: "カード名義", recurringPayments: "定期支払い", statements: "明細書", security: "セキュリティ",
  },
  ko: {
    bankName: "瑞峯", bankSubtitle: "프라이빗 뱅크", welcome: "환영합니다", signIn: "로그인", signOut: "로그아웃",
    dashboard: "대시보드", accounts: "계좌", transfers: "송금", cards: "카드", investments: "투자",
    lending: "대출", fxDesk: "외환", beneficiaries: "수취인", concierge: "컨시어지", profile: "프로필",
    settings: "설정", admin: "관리", overview: "개요", openAccount: "계좌개설",
    newTransfer: "새 송금", totalWealth: "총 자산", cashBalances: "현금 잔액", activeLoans: "대출",
    privateBanking: "프라이빗 뱅킹", commandCenter: "관리 센터", recentActivity: "최근 활동",
    notifications: "알림", clientSince: "가입일", secureSession: "보안 세션",
    billPayments: "청구서 결제", cryptoFunding: "암호화폐 입금", news: "뉴스", receipts: "영수증",
    amount: "금액", submit: "제출", cancel: "취소", save: "저장", close: "닫기", loading: "로딩...",
    pending: "처리중", completed: "완료", active: "활성", blocked: "차단",
    fromAccount: "출금계좌", toAccount: "입금계좌", reference: "참조번호",
    balance: "잔액", currency: "통화", language: "언어", search: "검색",
    apply: "신청", buy: "매수", sell: "매도", confirm: "확인", date: "날짜",
    status: "상태", type: "유형", details: "상세", total: "합계", fee: "수수료",
    fundCard: "카드충전", viewReceipt: "영수증보기", manageCard: "카드관리",
    loanDue: "대출만기", monthlyPayment: "월 상환액", autoDebit: "자동이체",
    cardNumber: "카드번호", cvv: "보안코드", expiry: "유효기간", cardholder: "카드소유자", recurringPayments: "정기결제", statements: "거래내역", security: "보안",
  },
  hi: { bankName: "RuiFeng 瑞峯", bankSubtitle: "निजी बैंक", welcome: "स्वागत है", signIn: "लॉगिन", signOut: "लॉगआउट", dashboard: "डैशबोर्ड", accounts: "खाते", transfers: "ट्रांसफर", cards: "कार्ड", investments: "निवेश", lending: "ऋण", fxDesk: "विदेशी मुद्रा", beneficiaries: "लाभार्थी", concierge: "कंसीयज", profile: "प्रोफ़ाइल", settings: "सेटिंग्स", admin: "प्रशासन", overview: "अवलोकन", openAccount: "खाता खोलें", newTransfer: "नया ट्रांसफर", totalWealth: "कुल संपत्ति", cashBalances: "नकद शेष", activeLoans: "ऋण", privateBanking: "निजी बैंकिंग", commandCenter: "कमांड सेंटर", recentActivity: "हाल की गतिविधि", notifications: "सूचनाएं", clientSince: "ग्राहक", secureSession: "सुरक्षित सत्र", billPayments: "बिल भुगतान", cryptoFunding: "क्रिप्टो जमा", news: "समाचार", receipts: "रसीदें", amount: "राशि", submit: "जमा करें", cancel: "रद्द करें", save: "सहेजें", close: "बंद करें", loading: "लोड हो रहा है...", pending: "लंबित", completed: "पूर्ण", active: "सक्रिय", blocked: "अवरुद्ध", fromAccount: "खाते से", toAccount: "खाते में", reference: "संदर्भ", balance: "शेष", currency: "मुद्रा", language: "भाषा", search: "खोजें", apply: "आवेदन", buy: "खरीदें", sell: "बेचें", confirm: "पुष्टि", date: "तारीख", status: "स्थिति", type: "प्रकार", details: "विवरण", total: "कुल", fee: "शुल्क", fundCard: "कार्ड फंड", viewReceipt: "रसीद देखें", manageCard: "कार्ड प्रबंधन", loanDue: "ऋण देय", monthlyPayment: "मासिक भुगतान", autoDebit: "ऑटो-डेबिट", cardNumber: "कार्ड नंबर", cvv: "CVV", expiry: "समाप्ति", cardholder: "कार्डधारक", recurringPayments: "Recurring", statements: "Statements", security: "Security" },
  th: { bankName: "RuiFeng 瑞峯", bankSubtitle: "ธนาคารส่วนตัว", welcome: "ยินดีต้อนรับ", signIn: "เข้าสู่ระบบ", signOut: "ออกจากระบบ", dashboard: "แดชบอร์ด", accounts: "บัญชี", transfers: "โอนเงิน", cards: "บัตร", investments: "การลงทุน", lending: "สินเชื่อ", fxDesk: "แลกเปลี่ยน", beneficiaries: "ผู้รับเงิน", concierge: "บริการ", profile: "โปรไฟล์", settings: "ตั้งค่า", admin: "ผู้ดูแล", overview: "ภาพรวม", openAccount: "เปิดบัญชี", newTransfer: "โอนเงินใหม่", totalWealth: "สินทรัพย์รวม", cashBalances: "เงินสด", activeLoans: "สินเชื่อ", privateBanking: "ธนาคารส่วนตัว", commandCenter: "ศูนย์ควบคุม", recentActivity: "กิจกรรมล่าสุด", notifications: "การแจ้งเตือน", clientSince: "ลูกค้าตั้งแต่", secureSession: "เซสชัน", billPayments: "ชำระบิล", cryptoFunding: "เติมเงินคริปโต", news: "ข่าว", receipts: "ใบเสร็จ", amount: "จำนวนเงิน", submit: "ส่ง", cancel: "ยกเลิก", save: "บันทึก", close: "ปิด", loading: "กำลังโหลด...", pending: "รอดำเนินการ", completed: "เสร็จสิ้น", active: "ใช้งาน", blocked: "ถูกบล็อก", fromAccount: "จากบัญชี", toAccount: "ไปยังบัญชี", reference: "อ้างอิง", balance: "ยอดคงเหลือ", currency: "สกุลเงิน", language: "ภาษา", search: "ค้นหา", apply: "สมัคร", buy: "ซื้อ", sell: "ขาย", confirm: "ยืนยัน", date: "วันที่", status: "สถานะ", type: "ประเภท", details: "รายละเอียด", total: "รวม", fee: "ค่าธรรมเนียม", fundCard: "เติมเงินบัตร", viewReceipt: "ดูใบเสร็จ", manageCard: "จัดการบัตร", loanDue: "ครบกำหนด", monthlyPayment: "ผ่อนรายเดือน", autoDebit: "หักอัตโนมัติ", cardNumber: "หมายเลขบัตร", cvv: "CVV", expiry: "หมดอายุ", cardholder: "ชื่อบนบัตร", recurringPayments: "Recurring", statements: "Statements", security: "Security" },
  ms: { bankName: "RuiFeng 瑞峯", bankSubtitle: "Bank Peribadi", welcome: "Selamat datang", signIn: "Log masuk", signOut: "Log keluar", dashboard: "Papan Pemuka", accounts: "Akaun", transfers: "Pemindahan", cards: "Kad", investments: "Pelaburan", lending: "Pinjaman", fxDesk: "Pertukaran", beneficiaries: "Penerima", concierge: "Concierge", profile: "Profil", settings: "Tetapan", admin: "Pentadbiran", overview: "Gambaran", openAccount: "Buka Akaun", newTransfer: "Pemindahan Baharu", totalWealth: "Jumlah Kekayaan", cashBalances: "Baki Tunai", activeLoans: "Pinjaman", privateBanking: "Perbankan Peribadi", commandCenter: "Pusat Kawalan", recentActivity: "Aktiviti Terkini", notifications: "Pemberitahuan", clientSince: "Pelanggan Sejak", secureSession: "Sesi Selamat", billPayments: "Bayaran Bil", cryptoFunding: "Pendanaan Kripto", news: "Berita", receipts: "Resit", amount: "Jumlah", submit: "Hantar", cancel: "Batal", save: "Simpan", close: "Tutup", loading: "Memuatkan...", pending: "Menunggu", completed: "Selesai", active: "Aktif", blocked: "Disekat", fromAccount: "Dari Akaun", toAccount: "Ke Akaun", reference: "Rujukan", balance: "Baki", currency: "Mata Wang", language: "Bahasa", search: "Cari", apply: "Mohon", buy: "Beli", sell: "Jual", confirm: "Sahkan", date: "Tarikh", status: "Status", type: "Jenis", details: "Butiran", total: "Jumlah", fee: "Yuran", fundCard: "Isi Kad", viewReceipt: "Lihat Resit", manageCard: "Urus Kad", loanDue: "Tarikh Matang", monthlyPayment: "Bayaran Bulanan", autoDebit: "Debit Auto", cardNumber: "No. Kad", cvv: "CVV", expiry: "Luput", cardholder: "Pemegang Kad", recurringPayments: "Recurring", statements: "Statements", security: "Security" },
  id: { bankName: "RuiFeng 瑞峯", bankSubtitle: "Bank Pribadi", welcome: "Selamat datang", signIn: "Masuk", signOut: "Keluar", dashboard: "Dasbor", accounts: "Akun", transfers: "Transfer", cards: "Kartu", investments: "Investasi", lending: "Pinjaman", fxDesk: "Valas", beneficiaries: "Penerima", concierge: "Layanan", profile: "Profil", settings: "Pengaturan", admin: "Admin", overview: "Ringkasan", openAccount: "Buka Akun", newTransfer: "Transfer Baru", totalWealth: "Total Aset", cashBalances: "Saldo Kas", activeLoans: "Pinjaman", privateBanking: "Perbankan Pribadi", commandCenter: "Pusat Kendali", recentActivity: "Aktivitas", notifications: "Notifikasi", clientSince: "Nasabah Sejak", secureSession: "Sesi Aman", billPayments: "Bayar Tagihan", cryptoFunding: "Dana Kripto", news: "Berita", receipts: "Kwitansi", amount: "Jumlah", submit: "Kirim", cancel: "Batal", save: "Simpan", close: "Tutup", loading: "Memuat...", pending: "Menunggu", completed: "Selesai", active: "Aktif", blocked: "Diblokir", fromAccount: "Dari Akun", toAccount: "Ke Akun", reference: "Referensi", balance: "Saldo", currency: "Mata Uang", language: "Bahasa", search: "Cari", apply: "Ajukan", buy: "Beli", sell: "Jual", confirm: "Konfirmasi", date: "Tanggal", status: "Status", type: "Jenis", details: "Detail", total: "Total", fee: "Biaya", fundCard: "Isi Kartu", viewReceipt: "Lihat Kwitansi", manageCard: "Kelola Kartu", loanDue: "Jatuh Tempo", monthlyPayment: "Cicilan", autoDebit: "Debit Otomatis", cardNumber: "No Kartu", cvv: "CVV", expiry: "Kadaluarsa", cardholder: "Pemegang Kartu", recurringPayments: "Recurring", statements: "Statements", security: "Security" },
  vi: { bankName: "RuiFeng 瑞峯", bankSubtitle: "Ngân hàng Tư nhân", welcome: "Chào mừng", signIn: "Đăng nhập", signOut: "Đăng xuất", dashboard: "Bảng điều khiển", accounts: "Tài khoản", transfers: "Chuyển khoản", cards: "Thẻ", investments: "Đầu tư", lending: "Cho vay", fxDesk: "Ngoại hối", beneficiaries: "Người nhận", concierge: "Dịch vụ", profile: "Hồ sơ", settings: "Cài đặt", admin: "Quản trị", overview: "Tổng quan", openAccount: "Mở tài khoản", newTransfer: "Chuyển mới", totalWealth: "Tổng tài sản", cashBalances: "Số dư", activeLoans: "Khoản vay", privateBanking: "Ngân hàng tư nhân", commandCenter: "Trung tâm", recentActivity: "Hoạt động", notifications: "Thông báo", clientSince: "Khách hàng từ", secureSession: "Phiên bảo mật", billPayments: "Thanh toán", cryptoFunding: "Nạp tiền crypto", news: "Tin tức", receipts: "Biên lai", amount: "Số tiền", submit: "Gửi", cancel: "Hủy", save: "Lưu", close: "Đóng", loading: "Đang tải...", pending: "Đang xử lý", completed: "Hoàn tất", active: "Hoạt động", blocked: "Bị khóa", fromAccount: "Từ TK", toAccount: "Đến TK", reference: "Tham chiếu", balance: "Số dư", currency: "Tiền tệ", language: "Ngôn ngữ", search: "Tìm kiếm", apply: "Đăng ký", buy: "Mua", sell: "Bán", confirm: "Xác nhận", date: "Ngày", status: "Trạng thái", type: "Loại", details: "Chi tiết", total: "Tổng", fee: "Phí", fundCard: "Nạp thẻ", viewReceipt: "Xem biên lai", manageCard: "Quản lý thẻ", loanDue: "Đáo hạn", monthlyPayment: "Trả hàng tháng", autoDebit: "Tự động trừ", cardNumber: "Số thẻ", cvv: "CVV", expiry: "Hết hạn", cardholder: "Chủ thẻ", recurringPayments: "Recurring", statements: "Statements", security: "Security" },
  ar: { bankName: "RuiFeng 瑞峯", bankSubtitle: "بنك خاص", welcome: "مرحباً", signIn: "تسجيل الدخول", signOut: "خروج", dashboard: "لوحة المعلومات", accounts: "الحسابات", transfers: "التحويلات", cards: "البطاقات", investments: "الاستثمارات", lending: "الإقراض", fxDesk: "العملات", beneficiaries: "المستفيدون", concierge: "الخدمة", profile: "الملف", settings: "الإعدادات", admin: "الإدارة", overview: "نظرة عامة", openAccount: "فتح حساب", newTransfer: "تحويل جديد", totalWealth: "الثروة", cashBalances: "الأرصدة", activeLoans: "القروض", privateBanking: "المصرفية الخاصة", commandCenter: "مركز التحكم", recentActivity: "النشاط", notifications: "الإشعارات", clientSince: "عميل منذ", secureSession: "جلسة آمنة", billPayments: "دفع الفواتير", cryptoFunding: "تمويل العملات", news: "الأخبار", receipts: "الإيصالات", amount: "المبلغ", submit: "إرسال", cancel: "إلغاء", save: "حفظ", close: "إغلاق", loading: "جاري التحميل...", pending: "قيد المعالجة", completed: "مكتمل", active: "نشط", blocked: "محظور", fromAccount: "من حساب", toAccount: "إلى حساب", reference: "مرجع", balance: "الرصيد", currency: "العملة", language: "اللغة", search: "بحث", apply: "تقديم", buy: "شراء", sell: "بيع", confirm: "تأكيد", date: "التاريخ", status: "الحالة", type: "النوع", details: "التفاصيل", total: "المجموع", fee: "الرسوم", fundCard: "شحن البطاقة", viewReceipt: "عرض الإيصال", manageCard: "إدارة البطاقة", loanDue: "استحقاق القرض", monthlyPayment: "القسط الشهري", autoDebit: "خصم تلقائي", cardNumber: "رقم البطاقة", cvv: "CVV", expiry: "انتهاء الصلاحية", cardholder: "حامل البطاقة", recurringPayments: "Recurring", statements: "Statements", security: "Security" },
};

export function t(lang: string, key: string): string {
  const l = (lang || "en") as SupportedLanguage;
  return T[l]?.[key] || T.en[key] || key;
}

export function getDefaultCurrency(country: string): SupportedCurrency { return COUNTRY_CURRENCY[country] || "USD"; }
export function getDefaultLanguage(country: string): SupportedLanguage { return COUNTRY_LANGUAGE[country] || "en"; }

export function fmtCurrency(amount: string | number | null | undefined, currency: string, lang: string) {
  const value = typeof amount === "string" ? parseFloat(amount) : amount ?? 0;
  const localeMap: Record<string, string> = { en:"en-SG","zh-CN":"zh-CN","zh-TW":"zh-TW",ja:"ja-JP",ko:"ko-KR",hi:"en-IN",th:"th-TH",ms:"ms-MY",id:"id-ID",vi:"vi-VN",ar:"ar-AE" };
  return new Intl.NumberFormat(localeMap[lang] || "en-SG", {
    style: "currency", currency,
    minimumFractionDigits: ["JPY","KRW","VND","IDR"].includes(currency) ? 0 : 2,
    maximumFractionDigits: ["JPY","KRW","VND","IDR"].includes(currency) ? 0 : 2,
  }).format(Number.isFinite(value) ? value : 0);
}
