import { useState } from 'react';

export function useClipboard(timeout = 2000) {
  const [hasCopied, setHasCopied] = useState(false);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), timeout);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  return { hasCopied, copy };
}
