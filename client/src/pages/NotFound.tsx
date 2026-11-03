import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { RouteMeta } from "@/components/RouteMeta";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <RouteMeta title="Page Not Found | Ripz Club" description="The requested Ripz Club page was not found." />
      <div className="site-frame not-found-inner">
        <p className="eyebrow">404</p>
        <h1>Page not found.</h1>
        <Link href="/" className="button button-primary"><ArrowLeft size={16} /> Go home</Link>
      </div>
    </main>
  );
}
