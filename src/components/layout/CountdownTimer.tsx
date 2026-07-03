import { useState, useEffect } from "react";

export function CountdownTimer() {
  const [countdownText, setCountdownText] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const target = new Date();
      target.setHours(23, 59, 59, 999);
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdownText("00:00:00:00");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      const ms = Math.floor((diff % 1000) / 10);

      const res = `${hours.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}:${ms
        .toString()
        .padStart(2, "0")}`;
      setCountdownText(res);
    }, 45); // Refresh every 45ms for smooth military feel
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="text-white font-mono font-black text-xs bg-rose-950/30 border border-rose-950/50 px-2 py-0.5 rounded-md min-w-[100px] text-center">
      {countdownText}
    </span>
  );
}
