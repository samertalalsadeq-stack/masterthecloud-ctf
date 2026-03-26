import { Hono } from "hono";
import { z } from 'zod';
import type { Env } from './core-utils';
import { UserEntity, ChallengeEntity, SubmissionEntity, ChallengeState } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { ScoreboardEntry, Submission, User, Challenge } from "@shared/types";
const ADMIN_TOKEN = 'secret-admin-token';
// Module-level seeding guard to prevent redundant DO operations on every request
let isSeeded = false;
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
  // --- Optimized Seeding Middleware ---
  app.use('/api/*', async (c, next) => {
    if (!isSeeded) {
      try {
        await Promise.all([
          UserEntity.ensureSeed(c.env),
          ChallengeEntity.ensureSeed(c.env),
        ]);
        isSeeded = true;
      } catch (e) {
        console.error('[SEED ERROR]', e);
        // We don't block the request, but we don't set isSeeded to true so it retries next time
      }
    }
    await next();
  });
  // --- Challenges ---
  app.get('/api/challenges', async (c) => {
    const { cursor, limit, difficulty, tags } = c.req.query();
    const limitNum = limit ? Math.min(parseInt(limit, 10), 50) : 12;
    // Fetch with a reasonable cap to avoid DO execution limits
    const { items: allChallenges } = await ChallengeEntity.list(c.env, null, 200);
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
    const { items: submissions } = await SubmissionEntity.list(c.env, null, 500);
    const challengeSubmissions = submissions.filter(s => s.challengeId === challengeId);
    const sortedSolves = challengeSubmissions.sort((a, b) => a.ts - b.ts);
    const firstBloodSubmission = sortedSolves[0];
    let firstBloodUser = null;
    if (firstBloodSubmission) {
      firstBloodUser = { id: firstBloodSubmission.userId, name: firstBloodSubmission.userName };
    }
    return ok(c, {
      solvesCount: challengeSubmissions.length,
      firstBloodUser,
    });
  });
  app.post('/api/challenges/:id/submit', async (c) => {
    const { userId, flag } = await c.req.json<{ userId: string, flag: string }>();
    if (!isStr(userId) || !isStr(flag)) return bad(c, 'User ID and Flag are required');
    const challengeId = c.req.param('id');
    const challengeEntity = new ChallengeEntity(c.env, challengeId);
    if (!await challengeEntity.exists()) return notFound(c, 'Challenge not found');
    const userEntity = new UserEntity(c.env, userId);
    if (!await userEntity.exists()) return notFound(c, 'User profile not found');
    const user = await userEntity.getState();
    if (user.solvedChallenges.includes(challengeId)) {
      return bad(c, 'You have already captured this flag!');
    }
    const challenge = await challengeEntity.getState();
    if (flag.trim() !== challenge.flag) {
      return bad(c, 'Incorrect flag. Try harder!');
    }
    // Atomic solve awarding
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
      message: `Correct flag! Master the Cloud protocol verified. ${isFirstBlood ? 'First Blood bonus awarded!' : ''}`,
      pointsAwarded
    });
  });
  app.get('/api/scoreboard', async (c) => {
    // Parallelize fetches for performance
    const [{ items: users }, { items: submissions }] = await Promise.all([
      UserEntity.list(c.env, null, 100),
      SubmissionEntity.list(c.env, null, 500)
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
      return a.lastSolveTs - b.lastSolveTs || a.name.localeCompare(b.name);
    });
    return ok(c, scoreboard);
  });
  app.get('/api/users', async (c) => {
    const { items } = await UserEntity.list(c.env, null, 100);
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
    if (!name?.trim()) return bad(c, 'Display name is required');
    const user: User = { id: crypto.randomUUID(), name: name.trim(), score: 0, solvedChallenges: [] };
    return ok(c, await UserEntity.create(c.env, user));
  });
  // --- Admin Routes ---
  const admin = new Hono<{ Bindings: Env }>();
  admin.use('*', async (c, next) => {
    if (c.req.header('x-admin-token') !== ADMIN_TOKEN) {
      return c.json({ success: false, error: 'Unauthorized Administrative Access' }, 401);
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