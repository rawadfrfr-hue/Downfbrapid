export interface TranslateLanguageOption {
  code: string;
  name: string;
  nativeName: string;
  isLatinScript: boolean;
}

export const TRANSLATE_LANGUAGES: TranslateLanguageOption[] = [
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', isLatinScript: false },
  { code: 'en', name: 'English', nativeName: 'English', isLatinScript: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', isLatinScript: false },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', isLatinScript: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', isLatinScript: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', isLatinScript: true },
  { code: 'fr', name: 'French', nativeName: 'Français', isLatinScript: true },
  { code: 'de', name: 'German', nativeName: 'Deutsch', isLatinScript: true },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', isLatinScript: true },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', isLatinScript: false },
  { code: 'ko', name: 'Korean', nativeName: '한국어', isLatinScript: false },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', isLatinScript: false },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', isLatinScript: false },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', isLatinScript: false },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', isLatinScript: true },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', isLatinScript: true },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', isLatinScript: true },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', isLatinScript: false },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', isLatinScript: false },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', isLatinScript: false },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', isLatinScript: false },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', isLatinScript: false },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', isLatinScript: false },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', isLatinScript: false },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', isLatinScript: false },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', isLatinScript: false },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', isLatinScript: true },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', isLatinScript: true },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', isLatinScript: true },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', isLatinScript: true },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', isLatinScript: false },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', isLatinScript: false },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', isLatinScript: false },
  { code: 'tl', name: 'Filipino', nativeName: 'Tagalog', isLatinScript: true },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', isLatinScript: true },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', isLatinScript: true },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', isLatinScript: true },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', isLatinScript: true },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', isLatinScript: true },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', isLatinScript: true },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', isLatinScript: true },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', isLatinScript: true },
];

export function findTranslateLanguage(code: string): TranslateLanguageOption | undefined {
  const normalized = code.trim().toLowerCase();
  return TRANSLATE_LANGUAGES.find(
    (l) => l.code.toLowerCase() === normalized || normalized.startsWith(`${l.code.toLowerCase()}-`)
  );
}
