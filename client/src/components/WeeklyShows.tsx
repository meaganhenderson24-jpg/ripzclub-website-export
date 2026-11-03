import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { CalendarLinks } from "@/components/CalendarLinks";
import { ShowCover } from "@/components/ShowCover";
import { trackOutboundClick } from "@/lib/outbound";
import { EBAY_LIVE_URL, withEbayTracking } from "@/lib/site";
import { formatShowDate, formatShowTime, getThisWeeksShows, type ScheduledShow } from "@/lib/showSchedule";

export function WeeklyShows({ shows: sourceShows }: { shows: ScheduledShow[] }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const shows = getThisWeeksShows(sourceShows, now);

  if (shows.length === 0) return <section id="shows" className="weekly-shows-section weekly-shows-empty" aria-label="Shows"><div className="site-frame"><div className="no-show-line">Live six nights a week</div></div></section>;

  return <section id="shows" className="weekly-shows-section" aria-labelledby="weekly-shows-title">
    <div className="site-frame">
      <div className="weekly-heading"><div><p className="eyebrow">Sydney time</p><h2 id="weekly-shows-title">This week's shows</h2></div></div>
      <div className="weekly-show-grid">{shows.map((show, index) => {
        const upNext = index === 0;
        return <article className={`weekly-show-card${upNext ? " up-next" : ""}`} key={`${show.date}-${show.startTime}-${show.title}`}>
          <ShowCover show={show} />
          <div className="weekly-show-card-copy">
            <p className="weekly-show-date">{formatShowDate(show)} · {formatShowTime(show)} Sydney ({show.timeZoneName})</p>
            {upNext && <p className="show-status">Up next</p>}
            <h3>{show.title}</h3>
            {show.note && <p className="show-note">{show.note}</p>}
            <><a className="button button-primary button-small" href={withEbayTracking(show.ebayShowLink || EBAY_LIVE_URL)} target="_blank" rel="noreferrer" onClick={() => trackOutboundClick("ebay")}>Set a reminder <ArrowUpRight size={14} aria-hidden="true" /></a><CalendarLinks show={show} /></>
          </div>
        </article>;
      })}</div>
    </div>
  </section>;
}
