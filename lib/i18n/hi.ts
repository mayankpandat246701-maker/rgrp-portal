export const hi = {
  common: {
    dashboard: "डैशबोर्ड",
    backToDashboard: "डैशबोर्ड पर वापस जाएँ",
    addNew: "नया जोड़ें",
    save: "सहेजें",
    update: "अपडेट करें",
    archive: "संग्रहीत करें",
    restore: "पुनर्स्थापित करें",
    publish: "प्रकाशित करें",
    unpublish: "अप्रकाशित करें",
    draft: "प्रारूप",
    pending: "लंबित",
    active: "सक्रिय",
    inactive: "निष्क्रिय",
    suspended: "निलंबित",
    revoked: "रद्द",
    expired: "समाप्त",
    verified: "सत्यापित",
    noRecords: "कोई रिकॉर्ड उपलब्ध नहीं है",
    tryAgain: "कृपया फिर प्रयास करें।",
    loading: "लोड हो रहा है...",
    filter: "फ़िल्टर करें",
    resetFilters: "फ़िल्टर हटाएँ",
    viewAll: "सभी देखें",
  },
  navigation: {
    home: "मुख्य पृष्ठ",
    about: "परिचय",
    sangh: "संघ",
    activities: "गतिविधियाँ",
    contact: "संपर्क",
    portal: "पोर्टल",
    applicationStatus: "आवेदन स्थिति देखें",
    karyakartas: "सक्षम कार्यकर्ता",
    verifyId: "पहचान पत्र सत्यापित करें",
    verifyCertificate: "प्रमाणपत्र सत्यापित करें",
    officialLinks: "आधिकारिक लिंक",
    join: "हमसे जुड़ें",
    adminLogin: "प्रशासक प्रवेश",
  },
  news: {
    title: "समाचार एवं महत्वपूर्ण सूचनाएँ",
    subtitle: "राष्ट्रीय गौ रक्षा परिषद से जुड़ी नवीनतम जानकारी",
    all: "सभी समाचार देखें",
  },
  groundWork: {
    title: "जमीनी स्तर पर हमारे कार्य",
    subtitle: "सेवा, संरक्षण और संगठन के माध्यम से किए जा रहे कार्यों की झलक",
    all: "सभी कार्य देखें",
  },
  certificate: {
    title: "कार्यकर्ता नियुक्ति / जॉइनिंग प्रमाणपत्र",
    verifiedBy: "राष्ट्रीय गौ रक्षा परिषद द्वारा सत्यापित",
    unknown:
      "इस प्रमाणपत्र संख्या के लिए कोई सक्रिय सत्यापित रिकॉर्ड उपलब्ध नहीं है। कृपया राष्ट्रीय गौ रक्षा परिषद के आधिकारिक प्रशासन से संपर्क करें।",
  },
} as const;

export function formatHindiDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  return new Intl.DateTimeFormat("hi-IN", {
    ...options,
    timeZone: "Asia/Kolkata",
  }).format(typeof date === "string" ? new Date(date) : date);
}
