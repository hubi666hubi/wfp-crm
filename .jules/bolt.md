## 2025-06-22 - Memoization of Dependency Graph in Dashboard
**Learning:** Instantiating complex classes like DependencyManager and calling their layout methods (getLayeredLayout) on every render is a significant bottleneck in React components with many sub-components.
**Action:** Always memoize graph-related computations and class instances that depend on state using useMemo.
## 2025-06-22 - Server-side Firestore Filtering
**Learning:** Client-side filtering of large Firestore collections in `onSnapshot` listeners is a major performance and security anti-pattern. It wastes bandwidth and blocks the main thread with O(N) iterations.
**Action:** Always use `query()` with `where()` clauses to push filtering to the server. This reduces client-side memory pressure and ensures only relevant data is transmitted.
