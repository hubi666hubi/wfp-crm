# Handoff Report: Production Configuration and Client-Side Optimizations

## 1. Observation
- **File**: `firebase.json`
  - Replaced the firestore configuration object with firestore + dataconnect block.
- **File**: `dataconnect/connector/queries.gql`
  - Observation: Compile command outputted error: `connector\queries.gql:64: On leads: (where: Lead_Filter): cannot mix _and/_or/_not with specific fields [_or] and [status userId]`
  - Re-structured `where` filtering inside query `ListDeadLeads` using logical nested block.
- **File**: `server.ts`
  - Observation: Line 287 had Python-style `.strip ? l.strip() : l.trim()`. Replaced it with `.trim()`.
  - Observation: Express server had fallback wildcard route `app.get('*')`. This threw TypeError: `Missing parameter name at index 1: *` in the installed newer version of `path-to-regexp`. Replaced it with RegExp literal `/.*`.
  - Spawned self-healing python process in `app.listen()` and redirected console logs.
  - Wrapped verbose logs in `logVerbose` helper.
- **File**: `server/queueBull.ts`
  - Removed `QueueScheduler` from imports, properties, and close operations.
  - Wrapped `job.id` inside the failed event handler with safe navigation `job?.id`.
- **File**: `server/inboundService.ts`
  - Wrapped fallback content warnings and seeding notifications in `logVerbose` helper.
- **File**: `src/pages/VslGenerator.tsx` and `src/components/vsl/VslScriptPartCard.tsx`
  - Observation: `VslScriptPartCard` took `previewModes` object. Replaced with primitive `previewMode` string prop and `setPreviewMode` stable callback prop.
  - Replaced `abortControllerRef` in `VslGenerator.tsx` with `activeControllersRef = useRef<Set<AbortController>>(new Set())` and registered/deregistered controllers.
- **File**: `src/pages/Zapalnik.tsx`
  - Created `leadsRef` to store lead data. Compared stringified version of state with fetched leads to skip Firestore `setDoc` loop when data is equal.
- **File**: `src/pages/GmailIntegration.tsx`
  - Implemented `isMountedRef` and abort controller within `fetchEmails`.

## 2. Logic Chain
1. **GraphQL Compile Error**: Nested filters in Firebase Data Connect must not mix fields and logical operators at the root level of `where`. Nesting them inside `_and` solves the schema compilation issue.
2. **Path-to-Regexp Error**: The Express router failed to initialize under node/production because the wildcard route `'*'` is no longer supported as a raw string without parameter name. Using a regex literal `/.*/` completely bypasses path-to-regexp parsing issues.
3. **Firestore Synchronization Bottleneck**: Storing lead state in a ref allows checking whether lead data actually changed before executing Firestore sync operations. This prevents thousands of repetitive writes during idle polling.
4. **Memory Leaks**: By instantiating unique abort controllers per fetch operation and tracking them in a Set, we ensure all pending connections are terminated upon component unmount, preventing state updates on dead nodes.

## 3. Caveats
No caveats.

## 5. Verification Method
1. Run the TypeScript type check command:
   ```bash
   npx tsc --noEmit
   ```
2. Build the project:
   ```bash
   npm run build
   ```
3. Run the production server:
   ```bash
   node dist/server.cjs
   ```
4. Verify that the console prints successful startup messages and runs successfully.
