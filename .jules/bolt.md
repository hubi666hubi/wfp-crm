## 2025-06-22 - Memoization of Dependency Graph in Dashboard
**Learning:** Instantiating complex classes like DependencyManager and calling their layout methods (getLayeredLayout) on every render is a significant bottleneck in React components with many sub-components.
**Action:** Always memoize graph-related computations and class instances that depend on state using useMemo.
## 2025-06-22 - Server-side Firestore Filtering
**Learning:** Client-side filtering of large Firestore collections in `onSnapshot` listeners is a major performance and security anti-pattern. It wastes bandwidth and blocks the main thread with O(N) iterations.
**Action:** Always use `query()` with `where()` clauses to push filtering to the server. This reduces client-side memory pressure and ensures only relevant data is transmitted.
## 2025-06-22 - Layout Re-render Decoupling
**Learning:** Frequent state updates (e.g., high-frequency timers like 45ms for military-style countdowns) in a top-level Layout component trigger full-tree re-renders, impacting interaction latency on complex sidebars.
**Action:** Extract high-frequency timers into leaf components to isolate the render boundary.

## 2025-06-22 - O(N) Kanban Partitioning
**Learning:** Mapping over columns and filtering a large dataset for each column creates O(Columns * Leads) complexity. While manageable for small sets, it scales poorly.
**Action:** Use a single-pass O(N) grouping in useMemo to provide O(1) lookup during the render loop for Kanban columns.
## 2025-06-22 - Architectural Simplification: Unified Source of Truth
**Learning:** Redundant "Poll-and-Sync" cycles (e.g., polling an API and then writing each result to Firestore) create O(N) network and database bottlenecks.
**Action:** Always favor a single source of truth and direct real-time listeners (`onSnapshot`). If a backend service manages data, let the frontend consume that collection directly rather than proxying it through manual sync loops.

## 2025-06-22 - Efficient State Initialization
**Learning:** Calling `setState` inside `useEffect` with values available at component mount time triggers an unnecessary second render and can cause ESLint errors.
**Action:** Use functional state initializers `useState(() => ...)` to read from slow sources like `localStorage` once during mount.
## 2025-06-22 - Global Component Memoization
**Learning:** In a complex dashboard with many interconnected parts, a single state change at the top level can trigger 50+ component re-renders.
**Action:** Systematically apply `React.memo` to leaf dashboard widgets to ensure they only re-render when their specific slice of state changes.

## 2025-06-22 - State vs LocalStorage
**Learning:** Reading from `localStorage` in `useMemo` or the render body is synchronous I/O and surprisingly slow in high-frequency render loops.
**Action:** Lift `localStorage` reads into state initializers or dedicated effects.
