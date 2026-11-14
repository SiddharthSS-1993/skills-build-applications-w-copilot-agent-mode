# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision:
  - Keep the UI route-driven and API-backed: one shared fetch client, route components for activities, teams, leaderboard, and workouts, and clear loading, empty, and error states. The presentation layer should render server data only and avoid business logic.
- Logic tier decision:
  - Build the Express API around typed route handlers and a thin service layer, with explicit validation and 4xx responses for bad IDs, missing payloads, missing users/teams, and invalid input. Avoid leaking Mongoose cast errors as 500s.
- Data tier decision:
  - Treat the Mongoose models as the contract boundary: enforce required fields, defaults, and relationships in the schemas, then let the API and seed script rely on those guarantees.
- Activity tracking approach:
  - Activity documents must reference a real user and team, store the submitted type and minutes, and compute points and occurredAt on creation. Validation should reject malformed IDs and unknown references before writing.
- Team management approach:
  - Teams require a name and mascot; members default to an empty array and are stored as ObjectId references. Team creation should reject missing name with 400.
- Leaderboard approach:
  - Aggregate activity points by team, sum totals, sort descending, and assign 1-based ranked entries. The API should return teamName, totalPoints, and rank.
- Workout suggestions approach:
  - Match the requested email to a seeded user, infer the most relevant activity pattern from recent behavior or fitness goal, and return suggestions with title, focus, duration/difficulty metadata, and a reason string. Unknown emails should return a deliberate 4xx.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - Meaning of failure: the Mongoose schema contract is incomplete; required fields/defaults/relationships are missing or not enforced.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - Meaning of failure: route validation, database checks, leaderboard aggregation, and workout suggestion logic are not implemented to the contract.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - Meaning of failure: the React UI still renders placeholder or pending content instead of real API-backed data and does not handle loading/empty/error states as required.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - Meaning of failure: TypeScript or module integration errors in the server and models; backend contract work is not compiling cleanly.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - Meaning of failure: the presentation layer is not building with the expected types, imports, or route/component contracts.
