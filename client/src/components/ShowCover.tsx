import { TYSON_MARK, WHEEL_IMAGE } from "@/lib/site";
import { formatShowDate, formatShowTime, type ScheduledShow } from "@/lib/showSchedule";

export function ShowCover({ show, className = "" }: { show: ScheduledShow; className?: string }) {
  const alt = `Ripz Club show cover for ${formatShowDate(show)} at ${formatShowTime(show)}`;
  if (show.coverImage) return <img className={`show-cover-image ${className}`} src={show.coverImage} alt={alt} />;
  return <div className={`show-cover-placeholder ${className}`} role="img" aria-label={`${alt}. Cover image placeholder`}><img className="show-cover-wheel" src={WHEEL_IMAGE} alt="" /><img className="show-cover-tyson" src={TYSON_MARK} alt="" /><span>Cover image to come</span></div>;
}
