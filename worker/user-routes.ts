import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ChallengeEntity, SubmissionEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import { MOCK_CHALLENGES, MOCK_USERS } from "@shared/mock-data";
import type { ScoreboardEntry, Submission, User } from "@shared/types";
const ADMIN_TOKEN = 'secret-admin-token';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // --- Seeding ---
  app.use('/api/*', async (c, next) => {
    // Ensure data is seeded on first request
    await Promise.all([
      UserEntity.ensureSeed(c.env),
      ChallengeEntity.ensureSeed(c.env),
    ]);
    await next();
  });
  // --- Challenges ---
  app.get('/api/challenges', async (c) => {
    const { items } = await ChallengeEntity.list(c.env);
    // Strip flags for public listing
    const publicChallenges = items.map(challenge => {
      const { flag, ...rest } = challenge;
      return rest;
    });
    return ok(c, publicChallenges);
  });
  app.get('/api/challenges/:id', async (c) => {
    const id = c.req.param('id');
    const challenge = new ChallengeEntity(c.env, id);
    if (!await challenge.exists()) return notFound(c, 'Challenge not found');
    const state = await challenge.getState();
    const { flag, ...publicChallenge } = state;
    const isAdmin = c.req.header('x-admin-token') === ADMIN_TOKEN;
    return ok(c, isAdmin ? state : publicChallenge);
  });
  app.post('/api/challenges/:id/submit', async (c) => {
    const { userId, flag } = await c.req.json<{ userId: string, flag: string }>();
    if (!isStr(userId) || !isStr(flag)) return bad(c, 'userId and flag are required');
    const challengeId = c.req.param('id');
    const challengeEntity = new ChallengeEntity(c.env, challengeId);
    if (!await challengeEntity.exists()) return notFound(c, 'Challenge not found');
    const userEntity = new UserEntity(c.env, userId);
    if (!await userEntity.exists()) return notFound(c, 'User not found');
    const user = await userEntity.getState();
    if (user.solvedChallenges.includes(challengeId)) {
      return bad(c, 'You have already solved this challenge.');
    }
    const challenge = await challengeEntity.getState();
    if (flag.trim() === challenge.flag) {
      // Correct flag
      await userEntity.mutate(u => ({
        ...u,
        score: u.score + challenge.points,
        solvedChallenges: [...u.solvedChallenges, challengeId],
      }));
      const submission: Submission = {
        id: crypto.randomUUID(),
        challengeId,
        userId,
        userName: user.name,
        ts: Date.now(),
        pointsAwarded: challenge.points,
      };
      await SubmissionEntity.create(c.env, submission);
      return ok(c, { message: 'Correct flag!', pointsAwarded: challenge.points });
    } else {
      return bad(c, 'Incorrect flag. Try again!');
    }
  });
  // --- Scoreboard ---
  app.get('/api/scoreboard', async (c) => {
    const { items: users } = await UserEntity.list(c.env);
    const { items: submissions } = await SubmissionEntity.list(c.env);
    const scoreboard: ScoreboardEntry[] = users.map(user => {
      const userSubmissions = submissions.filter(s => s.userId === user.id);
      const lastSolve = userSubmissions.length > 0
        ? Math.max(...userSubmissions.map(s => s.ts))
        : 0;
      return {
        userId: user.id,
        name: user.name,
        score: user.score,
        solvedCount: user.solvedChallenges.length,
        lastSolveTs: lastSolve,
      };
    }).sort((a, b) => b.score - a.score || a.lastSolveTs - b.lastSolveTs);
    return ok(c, scoreboard);
  });
  // --- Admin Routes ---
  const admin = new Hono<{ Bindings: Env }>();
  admin.use('*', async (c, next) => {
    if (c.req.header('x-admin-token') !== ADMIN_TOKEN) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    await next();
  });
  admin.post('/challenges', async (c) => {
    const body = await c.req.json();
    // Basic validation, zod would be better
    if (!body.title || !body.flag || !body.points) return bad(c, 'Missing required fields');
    const newChallenge = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      ...body
    };
    await ChallengeEntity.create(c.env, newChallenge);
    return ok(c, newChallenge);
  });
  admin.put('/challenges/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const challenge = new ChallengeEntity(c.env, id);
    if (!await challenge.exists()) return notFound(c, 'Challenge not found');
    await challenge.patch(body);
    return ok(c, await challenge.getState());
  });
  admin.get('/users', async (c) => {
    const { items } = await UserEntity.list(c.env);
    return ok(c, items);
  });
  app.route('/api/admin', admin);
  // --- Users ---
  app.get('/api/users', async (c) => {
    const { items } = await UserEntity.list(c.env);
    return ok(c, items.map(({id, name}) => ({id, name}))); // Return only public info
  });
  app.post('/api/users', async (c) => {
    const { name } = (await c.req.json()) as { name?: string };
    if (!name?.trim()) return bad(c, 'name required');
    const user: User = { id: crypto.randomUUID(), name: name.trim(), score: 0, solvedChallenges: [] };
    return ok(c, await UserEntity.create(c.env, user));
  });
}