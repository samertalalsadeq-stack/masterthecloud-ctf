import { Hono } from "hono";
import { z } from 'zod';
import type { Env } from './core-utils';
import { UserEntity, ChallengeEntity, SubmissionEntity, ChallengeState } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { ScoreboardEntry, Submission, User, Challenge } from "@shared/types";
const ADMIN_TOKEN = 'secret-admin-token';
const challengeSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  points: z.number().int().min(1),
  difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Insane']),
  tags: z.array(z.string()),
  flag: z.string().min(5),
  hint: z.string().optional(),
  codeLanguage: z.string().optional(),
  codeSnippet: z.string().optional(),
});
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // --- Seeding ---
  app.use('/api/*', async (c, next) => {
    await Promise.all([
      UserEntity.ensureSeed(c.env),
      ChallengeEntity.ensureSeed(c.env),
    ]);
    await next();
  });
  // --- Challenges ---
  app.get('/api/challenges', async (c) => {
    const { cursor, limit, difficulty, tags } = c.req.query();
    const limitNum = limit ? Math.min(parseInt(limit, 10), 100) : 10;
    // Use a safe limit for DO listing (1000)
    const { items: allChallenges } = await ChallengeEntity.list(c.env, null, 1000);
    let filteredItems = allChallenges;
    if (difficulty && difficulty !== 'all') {
      filteredItems = filteredItems.filter(item => item.difficulty === difficulty);
    }
    if (tags) {
      const tagList = tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      if (tagList.length > 0) {
        filteredItems = filteredItems.filter(item =>
          tagList.some(t => item.tags.some(it => it.toLowerCase().includes(t)))
        );
      }
    }
    const startIndex = cursor ? filteredItems.findIndex(item => item.id === cursor) + 1 : 0;
    const paginatedItems = filteredItems.slice(startIndex, startIndex + limitNum);
    // Safety check: only access ID if paginatedItems has content
    const nextCursor = (paginatedItems.length > 0 && startIndex + limitNum < filteredItems.length)
      ? paginatedItems[paginatedItems.length - 1].id
      : null;
    const publicChallenges = paginatedItems.map(({ flag, ...rest }: any) => rest);
    return ok(c, { items: publicChallenges, next: nextCursor });
  });
  app.get('/api/challenges/:id', async (c) => {
    const id = c.req.param('id');
    const challenge = new ChallengeEntity(c.env, id);
    if (!await challenge.exists()) return notFound(c, 'Challenge not found');
    const { flag, ...publicChallenge } = await challenge.getState();
    return ok(c, publicChallenge);
  });
  app.get('/api/challenges/:id/stats', async (c) => {
    const challengeId = c.req.param('id');
    // Reduced limit from 5000 to 1000 to prevent DO storage errors
    const { items: submissions } = await SubmissionEntity.list(c.env, null, 1000);
    const challengeSubmissions = submissions.filter(s => s.challengeId === challengeId);
    const sortedSolves = challengeSubmissions.sort((a, b) => a.ts - b.ts);
    const firstBloodSubmission = sortedSolves[0];
    let firstBloodUser = null;
    if (firstBloodSubmission) {
      const user = await new UserEntity(c.env, firstBloodSubmission.userId).getState();
      if (user.id) firstBloodUser = { id: user.id, name: user.name };
    }
    return ok(c, {
      solvesCount: challengeSubmissions.length,
      firstBloodUser,
    });
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
    if (flag.trim() !== challenge.flag) {
      return bad(c, 'Incorrect flag. Try again!');
    }
    // Reduced limit from 5000 to 1000 to prevent DO storage errors
    const { items: allSubmissions } = await SubmissionEntity.list(c.env, null, 1000);
    const isFirstBlood = !allSubmissions.some(s => s.challengeId === challengeId);
    let pointsAwarded = challenge.points;
    if (isFirstBlood) pointsAwarded += 50;
    await userEntity.mutate(u => ({
      ...u,
      score: u.score + pointsAwarded,
      solvedChallenges: [...u.solvedChallenges, challengeId],
    }));
    const submission: Submission = {
      id: crypto.randomUUID(),
      challengeId,
      userId,
      userName: user.name,
      ts: Date.now(),
      pointsAwarded,
      isFirstBlood,
    };
    await SubmissionEntity.create(c.env, submission);
    return ok(c, {
      message: `Correct flag! ${isFirstBlood ? 'First blood bonus!' : ''}`,
      pointsAwarded
    });
  });
  app.get('/api/scoreboard', async (c) => {
    // Reduced limits from 5000 to 1000 to prevent DO storage errors
    const [{ items: users }, { items: submissions }] = await Promise.all([
      UserEntity.list(c.env, null, 1000),
      SubmissionEntity.list(c.env, null, 1000)
    ]);
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
    }).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.score === 0 && b.score === 0) return a.name.localeCompare(b.name);
      if (a.lastSolveTs === 0 && b.lastSolveTs !== 0) return 1;
      if (b.lastSolveTs === 0 && a.lastSolveTs !== 0) return -1;
      return a.lastSolveTs - b.lastSolveTs;
    });
    return ok(c, scoreboard);
  });
  app.get('/api/users', async (c) => {
    const { items } = await UserEntity.list(c.env);
    return ok(c, items.map(({id, name}) => ({id, name})));
  });
  app.get('/api/users/:id', async (c) => {
    const id = c.req.param('id');
    const user = new UserEntity(c.env, id);
    if (!await user.exists()) return notFound(c, 'User not found');
    return ok(c, await user.getState());
  });
  app.post('/api/users', async (c) => {
    const { name } = (await c.req.json()) as { name?: string };
    if (!name?.trim()) return bad(c, 'name required');
    const user: User = { id: crypto.randomUUID(), name: name.trim(), score: 0, solvedChallenges: [] };
    return ok(c, await UserEntity.create(c.env, user));
  });
  // --- Admin Routes ---
  const admin = new Hono<{ Bindings: Env }>();
  admin.use('*', async (c, next) => {
    if (c.req.header('x-admin-token') !== ADMIN_TOKEN) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    await next();
  });
  admin.get('/challenges', async (c) => {
    const { items } = await ChallengeEntity.list(c.env);
    return ok(c, items);
  });
  admin.post('/challenges', async (c) => {
    const body = await c.req.json();
    const validation = challengeSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.message);
    const newChallenge: ChallengeState = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      ...validation.data
    };
    await ChallengeEntity.create(c.env, newChallenge);
    return ok(c, newChallenge);
  });
  admin.put('/challenges/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const validation = challengeSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.message);
    const challenge = new ChallengeEntity(c.env, id);
    if (!await challenge.exists()) return notFound(c, 'Challenge not found');
    const updatedState = await challenge.mutate(current => ({
      ...current,
      ...validation.data
    }));
    return ok(c, updatedState);
  });
  admin.delete('/challenges/:id', async (c) => {
    const id = c.req.param('id');
    const deleted = await ChallengeEntity.delete(c.env, id);
    if (!deleted) return notFound(c, 'Challenge not found');
    return ok(c, { id });
  });
  admin.get('/users', async (c) => {
    const { items } = await UserEntity.list(c.env);
    return ok(c, items);
  });
  admin.get('/submissions', async (c) => {
    const { items } = await SubmissionEntity.list(c.env, null, 1000);
    return ok(c, items.sort((a, b) => b.ts - a.ts));
  });
  app.route('/api/admin', admin);
}