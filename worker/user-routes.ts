import { Hono } from "hono";
import { z } from 'zod';
import type { Env } from './core-utils';
import { UserEntity, ChallengeEntity, SubmissionEntity } from "./entities";
import type { ChallengeState } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { ScoreboardEntry, Submission, User } from "@shared/types";
console.log('[WORKER] Loading Master the Cloud protocols...');
const DEFAULT_ADMIN_TOKEN = 'secret-admin-token';
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
type MasterEnv = Env & { ADMIN_TOKEN?: string };
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // Use a type-safe middleware to ensure the environment matches our MasterEnv needs
  app.use('/api/*', async (c, next) => {
    if (!isSeeded) {
      try {
        await Promise.all([
          UserEntity.ensureSeed(c.env),
          ChallengeEntity.ensureSeed(c.env),
          SubmissionEntity.ensureSeed(c.env),
        ]);
        isSeeded = true;
      } catch (e) {
        console.error('[FATAL] Synchronization failed:', e);
      }
    }
    await next();
  });
  // --- Challenges ---
  app.get('/api/challenges', async (c) => {
    const { cursor, limit, difficulty, tags } = c.req.query();
    const limitNum = limit ? Math.min(parseInt(limit, 10), 50) : 12;
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
    const { items: allSubmissions } = await SubmissionEntity.list(c.env, null, 2000);
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
      message: `Correct flag! Protocol verified. ${isFirstBlood ? 'First Blood bonus awarded!' : ''}`, 
      pointsAwarded 
    });
  });
  app.get('/api/scoreboard', async (c) => {
    const [{ items: users }, { items: submissions }] = await Promise.all([
      UserEntity.list(c.env, null, 100),
      SubmissionEntity.list(c.env, null, 5000)
    ]);
    const subsByUser: Record<string, number[]> = submissions.reduce((acc, s) => {
      const uid = s.userId;
      if (!acc[uid]) acc[uid] = [];
      acc[uid].push(s.ts);
      return acc;
    }, {} as Record<string, number[]>);
    const scoreboard: ScoreboardEntry[] = users.map(user => {
      const userSubsTs = subsByUser[user.id] || [];
      const lastSolve = userSubsTs.length > 0 ? Math.max(...userSubsTs) : 0;
      return {
        userId: user.id,
        name: user.name,
        score: user.score,
        solvedCount: user.solvedChallenges.length,
        lastSolveTs: lastSolve,
      };
    }).sort((a, b) => {
      if (a.score === 0 && b.score > 0) return 1;
      if (b.score === 0 && a.score > 0) return -1;
      if (b.score !== a.score) return b.score - a.score;
      if (a.lastSolveTs !== b.lastSolveTs) {
        if (a.lastSolveTs === 0) return 1;
        if (b.lastSolveTs === 0) return -1;
        return a.lastSolveTs - b.lastSolveTs;
      }
      return a.name.localeCompare(b.name);
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
    const masterEnv = c.env as MasterEnv;
    const configuredToken = masterEnv.ADMIN_TOKEN || DEFAULT_ADMIN_TOKEN;
    if (c.req.header('x-admin-token') !== configuredToken) {
      return c.json({ success: false, error: 'Unauthorized Command Center Access' }, 401);
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
    const challenge = new ChallengeEntity(c.env, id);
    if (!await challenge.exists()) return notFound(c, 'Challenge not found');
    await challenge.delete();
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