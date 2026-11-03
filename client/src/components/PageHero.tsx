import { type ReactNode } from "react";
import { EbayAction } from "@/components/SiteShell";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  image?: ReactNode;
  action?: ReactNode;
  actionLabel?: string;
  showAction?: boolean;
  className?: string;
}

export function PageHero({ eyebrow, title, children, image, action, actionLabel = "Check us out on eBay Live", showAction = true, className = "" }: PageHeroProps) {
  return (
    <section className={`page-hero ${className}`}>
      <div className="site-frame page-hero-grid">
        <div className="page-hero-copy">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1>{title}</h1>
          {children && <div className="page-hero-body">{children}</div>}
          {showAction && <div className="page-hero-action">{action ?? <EbayAction label={actionLabel} />}</div>}
        </div>
        {image && <div className="page-hero-image">{image}</div>}
      </div>
    </section>
  );
}
