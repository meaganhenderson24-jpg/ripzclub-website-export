import { useEffect } from "react";

interface RouteMetaProps {
  title: string;
  description: string;
  noIndex?: boolean;
}

function setMeta(selector: string, content: string) {
  const meta = document.querySelector(selector);
  if (meta) meta.setAttribute("content", content);
}

export function RouteMeta({ title, description, noIndex = true }: RouteMetaProps) {
  useEffect(() => {
    document.title = title;
    setMeta('meta[name="description"]', description);
    setMeta('meta[name="robots"]', noIndex ? "noindex, nofollow" : "index, follow");
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
  }, [description, noIndex, title]);

  return null;
}
