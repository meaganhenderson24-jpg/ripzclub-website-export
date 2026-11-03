import { PackageOpen } from "lucide-react";
import { EbayAction } from "@/components/SiteShell";
import { NextShowCard } from "@/components/NextShowCard";
import { RouteMeta } from "@/components/RouteMeta";
import { santaShows } from "@/lib/showSchedule";
import { TYSON_MARK } from "@/lib/site";

const boxContents = [
  "1 x Pokemon Elite Trainer Box",
  "1 x Pokemon Bundle / Tin",
  "1 x Pokemon Plushie",
  "1 x Pokemon Xmas Tree Ornament",
];

const tiers = [
  { title: "Elite", note: "Pack shot to confirm" },
  { title: "Master", note: "Master prizes are all ETBs" },
  { title: "Ultra", note: "Pack shot to confirm" },
  { title: "Great", note: "Pack shot to confirm" },
];

export default function SantasSurpriseBox() {
  return <main className="santa-page">
    <RouteMeta title="Santa's Surprise Box | Ripz Club" description="Private Santa's Surprise Box template for Ripz Club." noIndex />
    <section className="santa-hero-section">
      <div className="site-frame">
        <div className="santa-hero">
          <div className="santa-hero-copy">
            <p className="eyebrow santa-eyebrow">Santa's Surprise Box</p>
            <h1>Santa's Surprise Box</h1>
            <p className="santa-price">$499</p>
            <p className="santa-status">Sold on eBay only. 18+ to bid.</p>
            <EbayAction label="Get yours on eBay Live" />
          </div>
          <aside className="santa-contents-card">
            <img src={TYSON_MARK} alt="" />
            <h2>Each box contains</h2>
            <ul>{boxContents.map(item => <li key={item}>{item}</li>)}</ul>
          </aside>
        </div>
      </div>
    </section>

    <NextShowCard shows={santaShows} heading="Next Santa show" emptyText="Date to confirm" />

    <section className="santa-tiers-section">
      <div className="site-frame">
        <div className="section-title-row"><div><p className="eyebrow santa-eyebrow">Tier details</p><h2>Four tiers</h2></div></div>
        <div className="santa-tier-grid">{tiers.map(tier => <article className="santa-tier-card" key={tier.title}>
          <h3>{tier.title}</h3>
          <div className="santa-shot-placeholder"><PackageOpen size={32} aria-hidden="true" /><span>{tier.note}</span></div>
        </article>)}</div>
      </div>
    </section>
  </main>;
}
