export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
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
}
export interface Submission {
  id: string;
  challengeId: string;
  userId: string;
  userName: string; // denormalized for scoreboard
  ts: number; // epoch millis
  pointsAwarded: number;
}
export interface ScoreboardEntry {
  userId: string;
  name: string;
  score: number;
  solvedCount: number;
  lastSolveTs: number;
}
// --- Original Template Types (can be removed later) ---
export interface User {
  id: string;
  name: string;
  score: number;
  solvedChallenges: string[]; // array of challenge IDs
}
export interface Chat {
  id: string;
  title: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number; // epoch millis
}