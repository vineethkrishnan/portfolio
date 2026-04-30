const WORDS_PER_MINUTE = 220;

const STRIP_PATTERNS: RegExp[] = [
  /^---[\s\S]*?---/m,
  /```[\s\S]*?```/g,
  /`[^`]*`/g,
  /!\[[^\]]*\]\([^)]*\)/g,
  /\[([^\]]+)\]\([^)]*\)/g,
  /<[^>]+>/g,
  /[#*_>~|]/g,
];

export function countWords(markdown: string): number {
  let text = markdown;
  for (const re of STRIP_PATTERNS) {
    text = text.replace(re, (_match, captured?: string) => (captured ? captured : " "));
  }
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

export function readingTime(markdown: string): { words: number; minutes: number; label: string } {
  const words = countWords(markdown);
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  const label = `${minutes} min read`;
  return { words, minutes, label };
}
