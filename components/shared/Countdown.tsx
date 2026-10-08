"use client";

import { useEffect, useState } from "react";

export function Countdown({
  targetDate,
  timezone = "UTC",
}: {
  targetDate?: string | Date | null;
  timezone?: string;
}) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  } | null>(null);

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();

    const update = () => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds, expired: false });
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!targetDate) {
    return <span className="text-neutral-500">No deadline set</span>;
  }

  if (!timeLeft) {
    return <span className="text-neutral-500">Calculating...</span>;
  }

  if (timeLeft.expired) {
    return <span className="font-semibold text-red-500">Submission Closed</span>;
  }

  return (
    <div className="flex items-center gap-2 text-sm font-mono bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-md">
      <span>Time Remaining ({timezone}):</span>
      <span className="font-bold">
        {String(timeLeft.hours).padStart(2, "0")}h {String(timeLeft.minutes).padStart(2, "0")}m{" "}
        {String(timeLeft.seconds).padStart(2, "0")}s
      </span>
    </div>
  );
}
