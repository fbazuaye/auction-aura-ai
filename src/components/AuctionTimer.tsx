import { useEffect, useState } from "react";

interface AuctionTimerProps {
  endsAt: Date;
  compact?: boolean;
}

const AuctionTimer = ({ endsAt, compact = false }: AuctionTimerProps) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = endsAt.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("ENDED");
        setIsUrgent(false);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      setIsUrgent(diff < 60000);

      if (h > 0) {
        setTimeLeft(`${h}h ${m}m ${s}s`);
      } else if (m > 0) {
        setTimeLeft(`${m}m ${s}s`);
      } else {
        setTimeLeft(`${s}s`);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (compact) {
    return (
      <span className={`font-display font-bold tabular-nums ${isUrgent ? "text-accent" : "text-muted-foreground"}`}>
        {timeLeft}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 font-display font-bold tabular-nums text-sm ${isUrgent ? "text-accent" : "text-muted-foreground"}`}>
      <div className={`w-2 h-2 rounded-full ${isUrgent ? "bg-accent animate-pulse-live" : "bg-muted-foreground"}`} />
      {timeLeft}
    </div>
  );
};

export default AuctionTimer;
