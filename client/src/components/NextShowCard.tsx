import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { ShowCountdown } from "@/components/ShowCountdown";
import { ShowCover } from "@/components/ShowCover";
import { trackOutboundClick } from "@/lib/outbound";
import { EBAY_LIVE_URL, withEbayTracking } from "@/lib/site";
import { formatShowDate, formatShowTime, getUpcomingShows, type ScheduledShow } from "@/lib/showSchedule";

interface NextShowCardProps {
  shows: ScheduledShow[];
  heading?: string;
  emptyText?: string;
  embedded?: boolean;
}

export function NextShowCard({ shows, heading = "Next show", emptyText = "Live six nights a week", embedded = false }: NextShowCardProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const show = getUpcomingShows(shows, now)[0];
  const empty = <div className={`no-show-line${embedded ? " top-next-empty" : ""}`}><p className="eyebrow empty-show-heading">{heading}</p>{emptyText}</div>;

  if (!show) {
    if (embedded) return <div className="top-next-show">{empty}</div>;
    return <section className="next-show-section"><div className="site-frame">{empty}</div></section>;
  }

  const card = <article className={`next-show-card${embedded ? " next-show-card-compact" : ""}`}>
    {embedded && <ShowCover show={show} className="next-show-cover" />}
    <div className="next-show-content">
      <p className="eyebrow">{heading}</p>
      <h2 id={embedded ? undefined : "next-show-title"}>{show.title}</h2>
      <p className="show-when">{formatShowDate(show)} · {formatShowTime(show)} Sydney ({show.timeZoneName})</p>
      <ShowCountdown show={show} />
      <div className="next-show-actions"><a className="button button-secondary" href={withEbayTracking(show.ebayShowLink || EBAY_LIVE_URL)} target="_blank" rel="noreferrer" onClick={() => trackOutboundClick("ebay")}>Set a reminder <ArrowUpRight size={16} aria-hidden="true" /></a></div>
      {embedded && <a className="see-all-shows" href="#shows">See all shows</a>}
    </div>
  </article>;

  if (embedded) return <div className="top-next-show">{card}</div>;
  return <section className="next-show-section" aria-labelledby="next-show-title"><div className="site-frame">{card}</div></section>;
}
