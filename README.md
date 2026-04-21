# Catch the Cloud CTF
A lightweight, visually exceptional Capture-The-Flag (CTF) platform built to run at the Cloudflare edge using Workers and Durable Objects. It supports up to 10 active users, featuring a public scoreboard, challenge gallery, per-challenge solve UI, and an admin panel for managing challenges and viewing user scores. The platform emphasizes a polished, responsive, and accessible UI with shadcn/ui and Tailwind CSS, delivering delightful interactions and seamless performance.
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/samertalalsadeq-stack/flagforge-ctf)
## Key Features
- **Public Scoreboard**: Real-time leaderboard showing top players with scores, solved challenges, and timestamps.
- **Challenge Gallery**: Responsive grid of challenges with difficulty badges, points, descriptions, tags, and quick navigation to solve pages.
- **Challenge Solve UI**: Detailed view with descriptions, hints, attachments, and a secure flag submission form with loading states and feedback.
- **User Profile**: Simple display of user info, total points, solved challenges, and display name management.
- **Admin Panel**: Secure interface to create, edit, delete challenges; view and manage users; inspect submissions and scoreboard.
- **Mock Authentication**: Easy username selection for users and token-based admin access (demo-friendly, migratable to real auth).
- **Edge-Native Persistence**: Powered by Durable Objects for atomic operations, first-blood detection, and concurrent-safe scoring.
- **Visual Excellence**: Modern design with gradients, micro-interactions, smooth animations, and responsive layouts across devices.
- **Data Integrity**: Server-side flag validation, CAS-protected updates, and aggregated scoreboard computation.
## Technology Stack
- **Frontend**: React 18, React Router 6, shadcn/ui, Tailwind CSS 3, Framer Motion, Lucide React icons, TanStack Query, Sonner (toasts), Zustand (state management).
- **Backend**: Hono (routing), Cloudflare Workers, Durable Objects (persistence), Zod (validation).
- **Utilities**: clsx, tailwind-merge, class-variance-authority, UUID, Date-fns.
- **Development**: Vite (build tool), TypeScript, ESLint, Bun (package manager).
- **Deployment**: Cloudflare Workers, Wrangler CLI.
## Installation
This project uses Bun as the package manager for faster performance. Ensure you have Bun installed (version 1.0+ recommended).
1. Clone the repository:
   ```
   git clone <your-repo-url>
   cd catch-the-cloud
   ```
2. Install dependencies:
   ```
   bun install
   ```
3. Set up Cloudflare environment (required for Durable Objects):
   - Install Wrangler CLI: `bun add -g wrangler`
   - Authenticate: `wrangler login`
   - Generate types: `bun run cf-typegen`
4. (Optional) Configure local development:
   - Create a `.dev.vars` file for any environment variables (e.g., `ADMIN_TOKEN=secret-admin-token`).
## Usage
### Running Locally
Start the development server:
```
bun run dev
```
The app will be available at `http://localhost:3000`. The worker backend runs on the same port for local testing.
### Key User Flows
- **As a Visitor/User**:
  1. Visit the home page to view the hero and live scoreboard.
  2. Use the login modal to select or create a username (stored in localStorage).
  3. Browse challenges in the gallery and navigate to a challenge detail page.
  4. Read the description, toggle hints, and submit flags via the solve panel.
  5. Check your profile for progress or the scoreboard for rankings.
- **As Admin**:
  1. Access the admin panel via the navigation (requires entering the admin token: `secret-admin-token`).
  2. Create new challenges with title, points, flag, description, and tags.
  3. Edit or delete challenges, adjust points/flags.
  4. View user lists, scores, and submissions; manage the scoreboard.
All interactions use optimistic updates with TanStack Query for caching and refetching. Toasts provide feedback for successes/errors.
### API Endpoints
The backend exposes REST endpoints under `/api/`:
- `GET /api/challenges`: List challenges (paginated).
- `GET /api/challenges/:id`: Fetch challenge details (flags hidden for non-admins).
- `POST /api/challenges/:id/submit`: Submit a flag (returns points awarded or error).
- `GET /api/scoreboard`: Get aggregated leaderboard.
- `POST /api/users`: Create/login user.
- `POST /api/challenges` (admin): Create challenge.
- `PUT /api/challenges/:id` (admin): Update challenge.
Responses follow `ApiResponse<T>` format. Use the `api` helper in `src/lib/api-client.ts` for frontend calls.
## Development
### Project Structure
- `src/`: React frontend (pages, components, hooks, lib).
- `worker/`: Hono backend (routes in `user-routes.ts`, entities in `entities.ts`).
- `shared/`: Shared types and mock data.
- Core utilities (`core-utils.ts`) handle Durable Object interactions—do not modify.
### Adding Features
1. **Frontend Pages**: Add routes in `src/main.tsx` using React Router. Wrap with `AppLayout` for consistent layout.
2. **Backend Routes**: Extend `worker/user-routes.ts` with new endpoints using Entity patterns (e.g., `IndexedEntity` for CRUD).
3. **Entities**: Define new entities in `worker/entities.ts` extending `IndexedEntity` for indexed storage.
4. **State Management**: Use Zustand for client-side state; TanStack Query for API data.
5. **UI Components**: Leverage shadcn/ui primitives; extend Tailwind in `tailwind.config.js`.
6. **Testing**: Add unit tests for entities and routes. Use `wrangler dev` for end-to-end testing.
### Common Tasks
- Lint code: `bun run lint`
- Build for production: `bun run build`
- Preview build: `bun run preview`
- Type generation: `bun run cf-typegen`
Follow the UI non-negotiables: Root wrapper with gutters, shadcn/ui first, Tailwind v3-safe utilities.
### Infinite Loop Prevention
Adhere to React/Zustand best practices:
- Use individual primitive selectors in Zustand (e.g., `useStore(s => s.count)`).
- Avoid setState in render; use effects/event handlers.
- Stabilize dependencies with `useMemo`/`useCallback`.
## Deployment
Deploy to Cloudflare Workers for edge execution and Durable Object persistence.
1. Ensure Wrangler is configured and authenticated.
2. Build the project: `bun run build`.
3. Deploy: `bun run deploy` (or `wrangler deploy`).
The deployment includes:
- Static assets (built React app) served via Cloudflare Pages integration.
- Worker handles API routes and Durable Objects.
- Assets configured for single-page app handling (no 404s on client routes).
For production:
- Set up custom domain via Wrangler.
- Monitor with Cloudflare Observability.
- Migrate mock auth to real (e.g., OAuth) and secure the admin token.
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/samertalalsadeq-stack/flagforge-ctf)
## Contributing
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/amazing-feature`.
3. Commit changes: `git commit -m 'Add amazing feature'`.
4. Push: `git push origin feature/amazing-feature`.
5. Open a Pull Request.
Ensure code follows TypeScript standards, UI excellence guidelines, and passes linting.
## License
This project is licensed under the MIT License. See the LICENSE file for details.
## Support
For issues, open a GitHub issue. For Cloudflare-specific questions, refer to the [Workers documentation](https://developers.cloudflare.com/workers/).