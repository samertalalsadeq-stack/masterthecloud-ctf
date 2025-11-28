export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface PaginatedResponse<T> {
  items: T[];
  next?: string | null;
}
// --- FlagForge CTF Types ---
export type ChallengeDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Insane';
export interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  difficulty: ChallengeDifficulty;
  tags: string[];
  hint?: string;
  createdAt: number; // epoch millis
  codeLanguage?: string;
  codeSnippet?: string;
}
export interface Submission {
  id:string;
  challengeId: string;
  userId: string;
  userName: string; // denormalized for scoreboard
  ts: number; // epoch millis
  pointsAwarded: number;
  isFirstBlood: boolean;
}
export interface ScoreboardEntry {
  userId: string;
  name: string;
  score: number;
  solvedCount: number;
  lastSolveTs: number;
}
export interface ChallengeStats {
  solvesCount: number;
  firstBloodUser?: { id: string; name: string };
}
export interface User {
  id: string;
  name: string;
  score: number;
  solvedChallenges: string[]; // array of challenge IDs
}