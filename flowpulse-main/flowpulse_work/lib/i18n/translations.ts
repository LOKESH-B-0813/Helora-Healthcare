// ============================================================================
// FlowPulse AI — Multilingual Internationalization (i18n) Dictionaries
// Supports English (en), Hindi (hi), Kannada (kn), and Tamil (ta).
// ============================================================================

export type SupportedLanguage = 'en' | 'hi' | 'kn' | 'ta'

export interface TranslationDictionary {
  appName: string
  tagline: string
  trackVisit: string
  bookAppointment: string
  staffPortal: string
  emergency: string
  departments: string
  doctors: string
  hospitalMap: string
  currentStatus: string
  queuePosition: string
  patientsAhead: string
  currentWait: string
  doorToDoor: string
  estimatedExit: string
  recommendedArrival: string
  directions: string
  callHotline: string
  stages: {
    registration: string
    triage: string
    consultation: string
    diagnostics: string
    review: string
    pharmacy: string
    discharge: string
  }
}

export const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    appName: 'FlowPulse AI',
    tagline: 'Hospital Patient Flow & Wait-Time Intelligence',
    trackVisit: 'Track My Visit',
    bookAppointment: 'Book Appointment',
    staffPortal: 'Staff Portal',
    emergency: '24/7 Emergency Trauma Bay',
    departments: 'Departments',
    doctors: 'Doctors',
    hospitalMap: 'Hospital Map',
    currentStatus: 'CURRENT STATUS',
    queuePosition: 'QUEUE POSITION',
    patientsAhead: 'ahead of you',
    currentWait: 'CURRENT WAIT',
    doorToDoor: 'Door-to-door visit estimate',
    estimatedExit: 'ESTIMATED EXIT',
    recommendedArrival: 'Recommended Arrival Window',
    directions: 'Indoor Wayfinding Directions',
    callHotline: 'Call Emergency Hotline',
    stages: {
      registration: 'Registration & Verification',
      triage: 'Initial Clinical Triage',
      consultation: 'Specialist Consultation',
      diagnostics: 'Diagnostic Laboratory & Imaging',
      review: 'Physician Report Review',
      pharmacy: 'Central Pharmacy Fulfillment',
      discharge: 'Discharge Clearance & Paperwork',
    },
  },
  hi: {
    appName: 'फ़्लोपल्स एआई (FlowPulse AI)',
    tagline: 'अस्पताल रोगी प्रवाह और प्रतीक्षा समय प्रबंधन',
    trackVisit: 'अपनी यात्रा ट्रैक करें',
    bookAppointment: 'अपॉइंटमेंट बुक करें',
    staffPortal: 'स्टाफ पोर्टल',
    emergency: '24/7 आपातकालीन ट्रौमा वार्ड',
    departments: 'विभाग',
    doctors: 'डॉक्टर',
    hospitalMap: 'अस्पताल का नक्शा',
    currentStatus: 'वर्तमान स्थिति',
    queuePosition: 'कतार स्थिति',
    patientsAhead: 'मरीज आपसे आगे हैं',
    currentWait: 'वर्तमान प्रतीक्षा',
    doorToDoor: 'संपूर्ण यात्रा का अनुमान',
    estimatedExit: 'अनुमानित प्रस्थान समय',
    recommendedArrival: 'अनुशंसित आगमन समय',
    directions: 'इनडोर मार्ग निर्देश',
    callHotline: 'आपातकालीन हेल्पलाइन पर कॉल करें',
    stages: {
      registration: 'पंजीकरण और सत्यापन',
      triage: 'प्रारंभिक नैदानिक ट्राइएज',
      consultation: 'विशेषज्ञ परामर्श',
      diagnostics: 'डायग्नोस्टिक लैब और इमेजिंग',
      review: 'चिकित्सक रिपोर्ट समीक्षा',
      pharmacy: 'केंद्रीय फार्मेसी दवा वितरण',
      discharge: 'डिस्चार्ज क्लीयरेंस और कागजी कार्रवाई',
    },
  },
  kn: {
    appName: 'ಫ್ಲೋಪಲ್ಸ್ ಎಐ (FlowPulse AI)',
    tagline: 'ಆಸ್ಪತ್ರೆ ರೋಗಿಗಳ ಹರಿವು ಮತ್ತು ಕಾಯುವ ಸಮಯ ಬುದ್ಧಿಮತ್ತೆ',
    trackVisit: 'ನನ್ನ ಭೇಟಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    bookAppointment: 'ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಿ',
    staffPortal: 'ಸಿಬ್ಬಂದಿ ಪೋರ್ಟಲ್',
    emergency: '24/7 ತುರ್ತು ಚಿಕಿತ್ಸಾ ಘಟಕ',
    departments: 'ವಿಭಾಗಗಳು',
    doctors: 'ವೈದ್ಯರು',
    hospitalMap: 'ಆಸ್ಪತ್ರೆಯ ನಕ್ಷೆ',
    currentStatus: 'ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ',
    queuePosition: 'ಸರದಿ ಸಾಲಿನ ಸ್ಥಾನ',
    patientsAhead: 'ರೋಗಿಗಳು ನಿಮ್ಮ ಮುಂದೆ ಇದ್ದಾರೆ',
    currentWait: 'ಪ್ರಸ್ತುತ ಕಾಯುವ ಸಮಯ',
    doorToDoor: 'ಸಂಪೂರ್ಣ ಭೇಟಿಯ ಅಂದಾಜು',
    estimatedExit: 'ಅಂದಾಜು ನಿರ್ಗಮನ ಸಮಯ',
    recommendedArrival: 'ಶಿಫಾರಸು ಮಾಡಿದ ಆಗಮನ ಸಮಯ',
    directions: 'ಒಳಾಂಗಣ ಮಾರ್ಗದರ್ಶನ',
    callHotline: 'ತುರ್ತು ಸಹಾಯವಾಣಿಗೆ ಕರೆ ಮಾಡಿ',
    stages: {
      registration: 'ನೋಂದಣಿ ಮತ್ತು ಪರಿಶೀಲನೆ',
      triage: 'ಆರಂಭಿಕ ಚಿಕಿತ್ಸಾ ವಿಂಗಡಣೆ',
      consultation: 'ತಜ್ಞರ ಸಮಾಲೋಚನೆ',
      diagnostics: 'ರೋಗನಿರ್ಣಯ ಪ್ರಯೋಗಾಲಯ ಮತ್ತು ಇಮೇಜಿಂಗ್',
      review: 'ವೈದ್ಯರ ವರದಿ ಪರಿಶೀಲನೆ',
      pharmacy: 'ಕೇಂದ್ರ ಔಷಧಾಲಯ',
      discharge: 'ಬಿಡುಗಡೆ ಅನುಮತಿ ಮತ್ತು ದಾಖಲೆಗಳು',
    },
  },
  ta: {
    appName: 'ஃப்ளோபல்ஸ் ஏஐ (FlowPulse AI)',
    tagline: 'மருத்துவமனை நோயாளி ஓட்டம் மற்றும் காத்திருப்பு நேர மேலாண்மை',
    trackVisit: 'எனது வருகையைக் கண்காணிக்கவும்',
    bookAppointment: 'முன்பதிவு செய்யவும்',
    staffPortal: 'பணியாளர் தளம்',
    emergency: '24/7 அவசர சிகிச்சை பிரிவு',
    departments: 'துறைகள்',
    doctors: 'மருத்துவர்கள்',
    hospitalMap: 'மருத்துவமனை வரைபடம்',
    currentStatus: 'தற்போதைய நிலை',
    queuePosition: 'வரிசை எண் நிலை',
    patientsAhead: 'நோயாளிகள் உங்களுக்கு முன்னால் உள்ளனர்',
    currentWait: 'தற்போதைய காத்திருப்பு நேரம்',
    doorToDoor: 'முழு வருகை நேர மதிப்பீடு',
    estimatedExit: 'மதிப்பிடப்பட்ட வெளியேறும் நேரம்',
    recommendedArrival: 'பரிந்துரைக்கப்பட்ட வருகை நேரம்',
    directions: 'உட்புற வழிகாட்டுதல்',
    callHotline: 'அவசர உதவிக்கு அழைக்கவும்',
    stages: {
      registration: 'பதிவு மற்றும் சரிபார்ப்பு',
      triage: 'ஆரம்ப அவசர மதிப்பீடு',
      consultation: 'சிறப்பு மருத்துவர் ஆலோசனை',
      diagnostics: 'பரிசோதனை கூடம் மற்றும் ஸ்கேன்',
      review: 'மருத்துவ அறிக்கை மறுஆய்வு',
      pharmacy: 'மருந்தகம்',
      discharge: 'விடுவிப்பு மற்றும் ஆவண அனுமதி',
    },
  },
}
