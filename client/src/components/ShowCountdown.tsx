import { useEffect, useState } from "react";
import type { ScheduledShow } from "@/lib/showSchedule";

function units(target: number, current: number) {
  const remaining = Math.max(0, target - current);
  const seconds = Math.floor(remaining / 1000);
  return [
    { value: Math.floor(seconds / 86_400), label: "Days" },
    { value: Math.floor((seconds % 86_400) / 3_600), label: "Hours" },
    { value: Math.floor((seconds % 3_600) / 60), label: "Minutes" },
    { value: seconds % 60, label: "Seconds" },
  ];
}

export function ShowCountdown({ show }: { show: ScheduledShow }) {
  const [current, setCurrent] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setCurrent(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  return <div className="show-countdown" aria-label="Time until next show">
    {units(show.startAt.getTime(), current).map(unit => <div key={unit.label}><strong>{String(unit.value).padStart(2, "0")}</strong><span>{unit.label}</span></div>)}
  </div>;
}
