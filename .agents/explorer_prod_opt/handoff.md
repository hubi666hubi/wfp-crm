# Handoff Report: Production Optimization and Performance Analysis

This report provides the analysis and findings for WFP CRM regarding production mode setup, client-side/server-side memory leaks, verbose developer logs, and React rendering bottlenecks.

---

## 1. Observation

Direct observations and findings across the codebase:

### A. Production Mode Setup
- **File**: `server.ts`
  - **Line 518**: `const isProd = process.env.NODE_ENV === 'production';`
  - **Lines 520–527**:
    ```typescript
    if (isProd) {
      // Production: serve pre-built Vite output
      const distPath = path.resolve(_dirname, 'dist');
      app.use(express.static(distPath));
      // SPA fallback: any non-API route serves index.html
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
    ```
  - **Lines 528–536**:
    ```typescript
    else {
      // Development: integrate Vite dev server as middleware (HMR + SPA)
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    }
    ```
- **File**: `package.json`
  - **Lines 5–8**:
    ```json
    "scripts": {
      "dev": "tsx server.ts",
      "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
      "start": "node dist/server.cjs",
    ```

### B. Memory Leaks
- **File**: `src/pages/VslGenerator.tsx`
  - **Lines 69, 1339–1368**:
    ```typescript
    const abortControllerRef = useRef<AbortController | null>(null);
    ...
    useEffect(() => {
      // limit concurrency to 2
      if (processingTasks.length < 2 && pendingTasks.length > 0) {
        const taskToRun = pendingTasks[0];
        const executeTask = async () => {
          ...
          if (taskToRun.type === "image") {
            await executeImageGeneration(taskToRun.partIndex, taskToRun.options);
          } ...
        };
        executeTask();
      }
    }, [tasks, pendingTasks, processingTasks]);
    ```
  - **Lines 1050–1051** (inside `executeImageGeneration`) and **lines 1154–1155** (inside `execute3DGeneration`):
    ```typescript
    const controller = new AbortController();
    abortControllerRef.current = controller;
    ```
- **File**: `src/pages/Zapalnik.tsx`
  - **Lines 72–123**:
    ```typescript
    useEffect(() => {
      let activeController: AbortController | null = null;
      let interval: NodeJS.Timeout;

      const fetchLeadsData = async () => {
        if (activeController) {
          activeController.abort();
        }
        const controller = new AbortController();
        activeController = controller;
        ...
      };

      fetchLeadsData();
      interval = setInterval(fetchLeadsData, 5000);

      return () => {
        clearInterval(interval);
        if (activeController) {
          activeController.abort();
        }
      };
    }, []);
    ```
- **File**: `src/pages/GmailIntegration.tsx`
  - **Lines 111–114**:
    ```typescript
    useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchEmails();
    }, []);
    ```
  - `fetchEmails()` (defined at lines 65–109) initiates two nested `fetch` requests (first is a list query, then a parallel map of `fetch` queries via `Promise.all`). It does not use any `AbortController` and performs no component mounted check before setting component state (`setMessages`, `setLoading`).

### C. Excessive Developer Logs
- **File**: `server.ts`
  - **Line 83**: `console.log('[BULL] processing job', job.id, job.name, job.data);`
  - **Line 96**: `console.log('[BULL FALLBACK] processing job', job.id, job.name, job.data);`
  - **Lines 116–119**:
    ```typescript
    console.log('\x1b[31m🎯 [ZAPALNIK_CLIP] Mamy uderzenie!\x1b[0m');
    console.log('\x1b[33m[INFO] Metoda:\x1b[0m', req.method);
    console.log('\x1b[33m[INFO] Nagłówki:\x1b[0m', req.headers);
    console.log('\x1b[33m[INFO] Payload:\x1b[0m', JSON.stringify(req.body, null, 2));
    ```
  - **Line 150**: `console.log(`${emoji} [CRITIC L2] ${dossier.issue_id}: ...`);`
  - **Line 173**: `console.log(`[META-GENERATOR L3] Generating hot-patch...`);`
  - **Line 209**: `console.log("[META-GENERATOR L3] Raw LLM response:", responseText);`
  - **Line 250**: `console.log(`\x1b[35m🧪 [SANDBOX L4] ...`);`
  - **Line 290**: `console.log(`${emoji} [DEPLOYMENT L5] ...`);`
  - **Line 308**: `console.log(`[EVOLUTION LOOP] ${msg}`);`
- **File**: `server/inboundService.ts`
  - **Line 9, 14, 19**: `console.log('[Inbound Fallback] ...')`
  - **Line 131**: `console.log("[InboundService] Firestore database is empty. Seeding default premium leads...");`

### D. React Rendering Bottlenecks
- **File**: `src/pages/VslGenerator.tsx`
  - **Lines 1715–1738**:
    ```typescript
    {scriptParts.map((part, index) => {
      const resolvedMode = partViewModes[index] || viewMode;
      return (
        <VslScriptPartCard
          key={`${resolvedMode}-${index}`}
          part={part}
          index={index}
          viewMode={resolvedMode}
          ...
          previewModes={previewModes}
          ...
        />
      );
    })}
    ```
  - `previewModes` is an object reference (`const [previewModes, setPreviewModes] = useState<Record<number, "2d" | "3d">>({});`).
- **File**: `src/pages/Zapalnik.tsx`
  - **Lines 97–101**:
    ```typescript
    // Sync to cloud for cross-module Realtime Monitor
    if (auth.currentUser) {
      sorted.forEach((ld: InboundLead) => {
        setDoc(doc(db, "crm_leads", ld.id), ld).catch(() => {});
      });
    }
    ```
  - **Lines 89–94**:
    ```typescript
    setLeads(prevLeads => {
      if (JSON.stringify(prevLeads) === JSON.stringify(sorted)) {
        return prevLeads;
      }
      return sorted;
    });
    ```

---

## 2. Logic Chain

1. **Production Mode Resolution Bug**:
   - In production, running `node dist/server.cjs` sets `_dirname` to the `dist/` directory.
   - Line 522 resolves static path as `path.resolve(_dirname, 'dist')`.
   - Combining `_dirname` (`c:\...\XX2\dist`) and `'dist'` yields `c:\...\XX2\dist\dist`.
   - Because the build places files in the root `dist/` folder, the server attempts to host from a non-existent `dist/dist/` subfolder, leading to 404s for the SPA assets.

2. **VslGenerator Memory Leak**:
   - `executeImageGeneration` and `execute3DGeneration` write directly to a single shared reference `abortControllerRef.current`.
   - In a concurrent task execution (concurrency up to 2, see line 1341), if task 2 starts after task 1, it overwrites `abortControllerRef.current` with its own controller.
   - If the component is unmounts, the cleanup function (line 77) only aborts `abortControllerRef.current` (task 2). Task 1's fetch promise will resolve or reject in the background without cancellation, leaking memory.

3. **Zapalnik Polling Race Condition**:
   - `setInterval` fires every 5 seconds regardless of whether the previous `fetchLeadsData` has returned.
   - If the API network response takes longer than 5 seconds, multiple concurrent fetch requests will run concurrently. The responses will arrive out-of-order and update state concurrently, creating race conditions.

4. **GmailIntegration Memory Leak**:
   - `fetchEmails` lacks a cancellation token.
   - If a user quickly switches between navigation tabs while emails are downloading, the unresolved promises will return and attempt to call `setMessages` and `setLoading` on a now-unmounted component.

5. **VSL Card Re-render Bottleneck**:
   - `VslScriptPartCard` is memoized via `React.memo`.
   - However, it receives the `previewModes` object as a prop (`previewModes={previewModes}`).
   - Switching the preview mode on a single card modifies state, generating a new object reference for `previewModes`.
   - Due to the reference change of the `previewModes` prop, **all** card instances fail the shallow equality check of `React.memo` and trigger a complete re-render, negating memoization.

6. **Zapalnik Polling Firestore Sync Bottleneck**:
   - Every 5 seconds, `Zapalnik.tsx` syncs the entire lead list to Firestore via `setDoc` loop.
   - This creates an unnecessary load of Firestore write requests every 5 seconds, draining network resources and causing redundant client-side re-renders.

---

## 3. Caveats

- We assumed that `process.env.NODE_ENV` is set to `production` externally (e.g., via container orchestrators, scripts, or env injection) when starting in production mode.
- We did not check local storage performance or constraints, assuming browser local storage write speeds are sufficient for drafts.

---

## 4. Conclusion

- **Production Setup**: The server is ready to run in production mode, but a critical path resolution bug will break static asset delivery. It must be patched.
- **Memory Leaks**: Three separate hooks/effects are susceptible to leaks or overlapping fetches. Fixes require managing sets of active abort controllers and checking unmount states.
- **Developer Logs**: Verbose logs will pollute logs in production. A wrapper logger must be introduced.
- **Rendering Bottlenecks**: Prop passing of object references in card loops overrides memoization. Passing primitive values will solve this. Firestore writes inside polling cycles should be moved to action-based hooks.

---

## 5. Verification Method

### 1. Build and Compilation Verification
Ensure TypeScript type safety and build output:
```bash
# Run build command (generates dist/ and dist/server.cjs)
powershell -ExecutionPolicy Bypass -Command "npm.cmd run build"

# Typecheck the project
npx tsc --noEmit
```

### 2. Production Port and Route Check
Ensure paths serve correctly in production:
1. Temporarily patch the `distPath` resolution in `server.ts` to:
   `const distPath = _dirname.endsWith('dist') ? _dirname : path.resolve(_dirname, 'dist');`
2. Run build and start:
   ```bash
   powershell -ExecutionPolicy Bypass -Command "npm.cmd run build"
   $env:NODE_ENV="production"
   node dist/server.cjs
   ```
3. Request `http://localhost:3000/` and verify that the HTML file loads (no 404 error).
