export function toSearchText(markdown: string): string {
  let text = markdown;
  text = text.replace(/^---[\s\S]*?---/, " ");
  text = text.replace(/^(import|export)\s.+$/gm, " ");
  text = text.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/~~~[\s\S]*?~~~/g, " ");
  text = text.replace(/`([^`]+)`/g, "$1");
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/^[ \t]*[-*+]\s+/gm, " ");
  text = text.replace(/^[ \t]*>\s?/gm, " ");
  text = text.replace(/^#{1,6}\s+/gm, " ");
  text = text.replace(/[*_~]/g, "");
  text = text.replace(/\|/g, " ");
  text = text.replace(/\s+/g, " ").trim();
  return text;
}
