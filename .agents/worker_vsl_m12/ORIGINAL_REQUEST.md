## 2026-07-07T07:57:12Z
Implement Milestone 1 and Milestone 2 for the VslGenerator page:
1. Extract subcomponents from c:\Users\brend\Desktop\XX2\src\pages\VslGenerator.tsx into c:\Users\brend\Desktop\XX2\src\components\vsl\. Follow the file layout suggested by the Explorer.
2. Apply React performance and memory optimizations:
   - Wrap the extracted subcomponents and list cards in React.memo.
   - Wrap event handlers passed to child components in useCallback.
   - Wrap derived/computed state lists in useMemo.
   - Ensure all useEffect hooks have proper cleanup functions (cancel timeouts, intervals, SpeechSynthesis playback, etc.).
   - Use AbortController for fetch/async actions in the component to prevent memory leaks on unmount.
