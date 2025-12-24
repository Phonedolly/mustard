/* Keyword options extracted from yt-shorts-generator-3/references/keyword.ts */

/*
 * Note: These options are used for both UI display and prompt generation.
 * The Korean values are used directly in prompts to maintain consistency
 * with the original yt-shorts-generator-3 codebase.
 */

export const genreOptions = {
  auto: "자동",
  partTime: "알바 썰",
  school: "학교 썰",
  family: "가족 썰",
  romance: "연애 썰",
  pet: "동물 썰",
  travel: "여행 썰",
  work: "직장 썰",
  fight: "싸움 썰",
  friend: "친구 썰",
  darkChapter: "흑역사",
  custom: "직접 입력",
} as const;

export const moodOptions = {
  auto: "자동",
  funny: "웃기게",
  serious: "진지하게",
  absurd: "허무하게",
  scary: "무섭게",
  sad: "슬프게",
  exciting: "설레게",
  touching: "감동적이게",
} as const;

export const endingStyleOptions = {
  auto: "자동",
  comedic: "해피 엔딩",
  twist: "반전 엔딩",
  bittersweet: "여운있는 엔딩",
  tragic: "슬픈 엔딩",
  warm: "훈훈한 엔딩",
  shocking: "충격적인 엔딩",
} as const;

export const mainCharacterGenderOptions = {
  auto: "자동",
  male: "남자",
  female: "여자",
} as const;

export const mainCharacterAgeOptions = {
  auto: "자동",
  "10s": "10대",
  "20s": "20대",
  "30s": "30대",
  "40s": "40대",
  "50s": "50대",
} as const;

export const toneOptions = {
  auto: "자동",
  mumble: "음슴체",
  hey: "해요체",
  militaryLike: "다나까체",
  historical: "사극체",
  macho: "상남자",
  gyeongsang: "경상도체",
  jeolla: "전라도체",
  chungcheong: "충청도체",
  friendly: "친구체",
  dcinside: "디씨체",
} as const;

export const ratingOptions = {
  mild: "순한 맛",
  medium: "중간 맛",
  hot: "매운 맛",
} as const;

export const lengthOptions = {
  short: "짧게",
  medium: "중간",
  long: "길게",
} as const;
