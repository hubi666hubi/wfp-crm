## 2025-06-22 - Memoization of Dependency Graph in Dashboard
**Learning:** Instantiating complex classes like DependencyManager and calling their layout methods (getLayeredLayout) on every render is a significant bottleneck in React components with many sub-components.
**Action:** Always memoize graph-related computations and class instances that depend on state using useMemo.
