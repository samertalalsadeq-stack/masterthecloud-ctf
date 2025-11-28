/**
 * FlagForge CTF Entities
 */
import { IndexedEntity } from "./core-utils";
import type { User, Challenge, Submission } from "@shared/types";
import { MOCK_USERS, MOCK_CHALLENGES } from "@shared/mock-data";
// USER ENTITY
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "", score: 0, solvedChallenges: [] };
  static seedData = MOCK_USERS;
}
// CHALLENGE ENTITY
export type ChallengeState = Challenge & { flag: string };
export class ChallengeEntity extends IndexedEntity<ChallengeState> {
  static readonly entityName = "challenge";
  static readonly indexName = "challenges";
  static readonly initialState: ChallengeState = {
    id: "",
    title: "",
    description: "",
    points: 0,
    difficulty: 'Easy',
    tags: [],
    createdAt: 0,
    flag: "",
  };
  static seedData = MOCK_CHALLENGES;
}
// SUBMISSION ENTITY
export class SubmissionEntity extends IndexedEntity<Submission> {
  static readonly entityName = "submission";
  static readonly indexName = "submissions";
  static readonly initialState: Submission = {
    id: "",
    challengeId: "",
    userId: "",
    userName: "",
    ts: 0,
    pointsAwarded: 0,
    isFirstBlood: false,
  };
}