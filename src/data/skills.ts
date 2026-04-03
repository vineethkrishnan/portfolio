export interface SkillCategory {
  name: string;
  icon: string;
  skills: string[];
}

export const skillCategories: SkillCategory[] = [
  {
    name: "Languages",
    icon: "code",
    skills: ["TypeScript", "JavaScript", "Go", "Rust", "Python", "PHP", "Java", "Shell/Bash"],
  },
  {
    name: "Backend",
    icon: "server",
    skills: ["NestJS", "Express", "FastAPI", "Laravel", "Hono"],
  },
  {
    name: "Frontend",
    icon: "layout",
    skills: ["React", "Next.js", "Astro", "Tailwind CSS", "HTML/CSS"],
  },
  {
    name: "Databases",
    icon: "database",
    skills: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite"],
  },
  {
    name: "DevOps & Cloud",
    icon: "cloud",
    skills: ["Docker", "AWS", "GCP", "Vercel", "Cloudflare", "Nginx", "CI/CD"],
  },
  {
    name: "Tools & CLI",
    icon: "terminal",
    skills: ["Git", "Linux", "Restic", "FFmpeg", "MCP", "Claude Code"],
  },
];
