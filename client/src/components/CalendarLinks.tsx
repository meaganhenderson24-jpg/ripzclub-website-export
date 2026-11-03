import { CalendarDays, Download } from "lucide-react";
import {
  downloadCalendarFile,
  googleCalendarUrl,
  outlookCalendarUrl,
  type ScheduledShow,
} from "@/lib/showSchedule";

export function CalendarLinks({ show, id }: { show: ScheduledShow; id?: string }) {
  return <div className="calendar-links" id={id} aria-label="Add to calendar">
    <span><CalendarDays size={15} aria-hidden="true" /> Add to calendar</span>
    <a href={googleCalendarUrl(show)} target="_blank" rel="noreferrer">Google</a>
    <a href={outlookCalendarUrl(show)} target="_blank" rel="noreferrer">Outlook</a>
    <button type="button" onClick={() => downloadCalendarFile(show)}><Download size={14} aria-hidden="true" /> Download .ics</button>
  </div>;
}
