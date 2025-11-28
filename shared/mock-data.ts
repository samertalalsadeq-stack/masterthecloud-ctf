import type { User, Challenge, Submission, Chat, ChatMessage, ChallengeDifficulty } from './types';
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alice', score: 0, solvedChallenges: [] },
  { id: 'u2', name: 'Bob', score: 0, solvedChallenges: [] },
  { id: 'u3', name: 'Charlie', score: 0, solvedChallenges: [] },
  { id: 'u4', name: 'Diana', score: 0, solvedChallenges: [] },
  { id: 'u5', name: 'Eve', score: 0, solvedChallenges: [] },
];
export const MOCK_CHALLENGES: (Challenge & { flag: string })[] = [
  {
    id: 'c1',
    title: 'Web Warmup',
    description: 'Find the hidden comment in the page source. It\'s a classic for a reason!',
    points: 50,
    difficulty: 'Easy',
    tags: ['web', 'recon'],
    hint: 'Right-click, View Page Source. Look for HTML comments.',
    flag: 'FLAG{w3lc0me_t0_th3_w3b}',
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'c2',
    title: 'Cookie Monster',
    description: 'There\'s a special cookie set by the server. Can you find it and read its value?',
    points: 100,
    difficulty: 'Easy',
    tags: ['web', 'cookies'],
    hint: 'Use your browser\'s developer tools (Application tab) to inspect cookies.',
    flag: 'FLAG{c00k1e_f0r_y0u}',
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'c3',
    title: 'Base-ic Knowledge',
    description: 'This string looks weird: `RkxBR3tCMVNJQ19FTkMwRElOR19JU19GVU59`. What could it be?',
    points: 150,
    difficulty: 'Medium',
    tags: ['crypto', 'encoding'],
    hint: 'This is a very common encoding scheme that uses an alphabet of A-Z, a-z, 0-9, +, and /. The trailing = is a giveaway.',
    flag: 'FLAG{B1SIC_ENC0DING_IS_FUN}',
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'c4',
    title: 'Caesar\'s Salad',
    description: 'Decrypt this message: `IOF{jbu_jbu_jbu}`. I heard the Romans liked to shift things around.',
    points: 200,
    difficulty: 'Medium',
    tags: ['crypto', 'classic'],
    hint: 'This is a simple substitution cipher where each letter is shifted by a fixed number of positions. The key is small.',
    flag: 'FLAG{eat_eat_eat}',
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'c5',
    title: 'Admin Access',
    description: 'There\'s an admin panel at `/admin`, but it\'s protected. Can you bypass the login? The developers left a note in `robots.txt`.',
    points: 300,
    difficulty: 'Hard',
    tags: ['web', 'recon'],
    hint: 'Check the `/robots.txt` file for disallowed entries. Maybe there\'s a backup or test login page.',
    flag: 'FLAG{r0b0ts_d0nt_l1e}',
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'c6',
    title: 'The Inspector',
    description: 'A secret is hidden in the network traffic. Use your browser\'s developer tools to find a request with a special header.',
    points: 400,
    difficulty: 'Hard',
    tags: ['web', 'forensics'],
    hint: 'Open the Network tab in your developer tools and inspect the headers of each request. Look for a custom header like `X-Secret-Flag`.',
    flag: 'FLAG{n3tw0rk_sn1ff3r_pr0}',
    createdAt: Date.now(),
  },
];
export const MOCK_SUBMISSIONS: Submission[] = [];
// --- Original Template Mocks ---
export const MOCK_CHATS: Chat[] = [
  { id: 'c1', title: 'General' },
];
export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'm1', chatId: 'c1', userId: 'u1', text: 'Hello', ts: Date.now() },
];