## 2026-07-08T22:31:07Z
You are a specialist worker. Your task is to implement the full production mode configuration, optimization, memory-leak fixes, and database SDK generation for WFP CRM at c:\Users\brend\Desktop\XX2\.

Target files to modify:
1. `firebase.json`
2. `server.ts`
3. `server/queueBull.ts`
4. `src/pages/VslGenerator.tsx`
5. `src/components/vsl/VslScriptPartCard.tsx`
6. `src/pages/Zapalnik.tsx`
7. `src/pages/GmailIntegration.tsx`

Detailed Instructions:

### 1. Configure Firebase Data Connect mapping in `firebase.json`
Add the `"dataconnect"` block at the root level of `firebase.json` so that `firebase-tools` can recognize the database project directory:
"dataconnect": {
  "source": "./dataconnect"
}

### 2. Generate Firebase Data Connect SDK
After updating `firebase.json`, run these commands:
- `npx -y firebase-tools@latest dataconnect:compile`
- `npx -y firebase-tools@latest dataconnect:sdk:generate`
Verify that `server/dataconnect/` is successfully created and populated with the generated TypeScript SDK.

### 3. Resolve TypeScript Type Compile Errors in server files
- In `server.ts` line 287 (or near): replace the Python-style `.strip ? l.strip() : l.trim()` check with standard JS `.trim()`.
- In `server/queueBull.ts`:
  - Remove `QueueScheduler` from imports.
  - Remove the class property `private scheduler?: QueueScheduler;`.
  - Remove `this.scheduler` initialization in the constructor.
  - In `failed` worker event listener, use safe navigation `job?.id` instead of `job.id` to prevent undefined dereference error.
  - In `close()` method, remove `this.scheduler` close call.

### 4. Implement Production Mode Config & Logger Optimization in `server.ts`
- Fix the frontend static asset serving path: replace `path.resolve(_dirname, 'dist')` with `_dirname.endsWith('dist') ? _dirname : path.resolve(_dirname, 'dist')` so that when `dist/server.cjs` is run, the assets are served correctly.
- Add Python self-healing core process background liveness: in the `app.listen()` listener, spawn the python core:
  ```typescript
  const pythonScriptPath = fs.existsSync(path.resolve(_dirname, 'nco_pa_start.py'))
    ? path.resolve(_dirname, 'nco_pa_start.py')
    : path.resolve(_dirname, '..', 'nco_pa_start.py');
  
  const pythonProcess = spawn('python', [pythonScriptPath]);
  pythonProcess.stdout.on('data', (data) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[PYTHON CORE] ${data.toString().trim()}`);
    }
  });
  pythonProcess.stderr.on('data', (data) => {
    console.error(`[PYTHON CORE ERROR] ${data.toString().trim()}`);
  });
  ```
- Wrap verbose logs in `server.ts` and `server/inboundService.ts` (such as the Bull queue process prints, Critic analyze prints, Sandbox validation prints, etc.) in a check for `process.env.NODE_ENV !== 'production'` so that production logs remain clean.

### 5. Prevent Client-Side Memory Leaks & Optimize useEffect Cleanups
- In `src/pages/VslGenerator.tsx`:
  - Replace the single `abortControllerRef` with `activeControllersRef` using `useRef<Set<AbortController>>(new Set())`.
  - In `executeImageGeneration` and `execute3DGeneration`, instantiate a new `AbortController`, add it to `activeControllersRef.current`, pass its signal to `fetchWithRetry`/`fetch`, and delete it from `activeControllersRef.current` inside the `finally` block.
  - In the unmount cleanup effect, run:
    ```typescript
    activeControllersRef.current.forEach(c => c.abort());
    activeControllersRef.current.clear();
    ```
- In `src/pages/GmailIntegration.tsx`:
  - Declare a mounted state flag inside the `useEffect` on mount.
  - Add an `AbortController` tracker to cancel active fetches if the component unmounts.
  - Check the mounted flag before calling `setMessages`, `setLoading`, or `setError` inside `fetchEmails()`.
- In `src/pages/Zapalnik.tsx`:
  - Ensure any active polling fetch controller is aborted before running a new fetch, and aborted on unmount.

### 6. React Rendering & Firestore Polling Optimization
- In `src/pages/VslGenerator.tsx` and `src/components/vsl/VslScriptPartCard.tsx`:
  - Optimize `VslScriptPartCard` props: instead of passing the entire `previewModes` object reference (which triggers re-renders of all card items when any card mode changes), pass `previewMode={previewModes[index] || "2d"}` (a primitive string).
  - Pass `setPreviewMode={useCallback((mode: "2d" | "3d") => { setPreviewModes(prev => ({ ...prev, [index]: mode })); }, [index, setPreviewModes])}` (a stable callback reference).
  - Update `VslScriptPartCard.tsx` props type and references to use the simplified `previewMode` and `setPreviewMode`.
- In `src/pages/Zapalnik.tsx`:
  - Prevent repetitive, massive Firestore sync operations every 5 seconds.
  - Only execute the `setDoc` loop to Firestore if the fetched lead data is different from the current `leads` state (e.g. comparing the stringified versions of `leads` and `sorted`). This will reduce Firestore writes by 99% during idle polling.

### 7. Compile and Build Verification
Verify the following commands execute successfully and output no compilation or type-checking errors:
- Type-check command: `npx tsc --noEmit`
- Build command: `npm run build`
- Start the server using production env: `node dist/server.cjs` and verify everything launches successfully.

Provide a detailed handoff.md in your folder detailing the changes, and verification commands and outputs.
