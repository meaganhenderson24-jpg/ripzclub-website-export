import { ArrowRight, MessageCircle } from "lucide-react";
import { Link } from "wouter";
import { DiscordAction, EbayAction } from "@/components/SiteShell";
import { MotionVideo } from "@/components/MotionVideo";
import { Reveal } from "@/components/Reveal";
import { RouteMeta } from "@/components/RouteMeta";
import { NextShowCard } from "@/components/NextShowCard";
import { PromoPanel } from "@/components/PromoPanel";
import { WeeklyShows } from "@/components/WeeklyShows";
import { copy, motionAssets, TYSON_MARK } from "@/lib/site";
import { useShowFeed } from "@/lib/showSchedule";

export default function Home() {
  const shows = useShowFeed();
  return (
    <main>
      <RouteMeta title="Ripz Club | eBay Live" description="Lucky Lee runs live auctions on eBay Live, with hundreds of prizes up for grabs every night." />
      <section className="home-top-section"><div className="site-frame home-top-grid"><PromoPanel /><NextShowCard shows={shows} embedded /></div></section>
      <section className="home-hero home-hero-alive"><div className="site-frame home-hero-grid"><div className="home-hero-copy"><h1>{copy.home.heroTitle}</h1><p className="hero-intro">{copy.home.heroSubline}</p><div className="hero-actions"><EbayAction /><DiscordAction /></div><p className="hero-under-actions">{copy.home.underButtons}</p></div><div className="hero-wheel-stage"><MotionVideo eager className="wheel-motion-cropped" {...motionAssets.wheel} label="Decorative animated wheel" /></div></div></section>
      <section className="section-pad story-section"><div className="site-frame story-card-grid">{copy.home.cards.map((card, index) => <Reveal key={card.title} className="story-card-wrap"><article className="story-card"><div className="story-visual" aria-hidden="true">{index === 0 && <MotionVideo {...motionAssets.timer} label="Decorative 20 second timer" />}{index === 1 && <MotionVideo className="wheel-motion-cropped" {...motionAssets.wheel} label="Decorative wheel" />}{index === 2 && <div className="chat-visual"><MessageCircle size={62} /><img src={TYSON_MARK} alt="" /></div>}</div><h2>{card.title}</h2><p>{card.body}</p></article></Reveal>)}</div></section>
      <WeeklyShows shows={shows} />
      <section className="pack-strip-section" aria-label="Pack photo placeholders"><div className="site-frame"><div className="pack-strip-heading"><h2>On the wheel</h2><p>Pack photos to come</p></div><div className="pack-placeholder-rail"><div className="pack-placeholder-track">{Array.from({ length: 12 }, (_, index) => <div className="pack-placeholder" key={index} role="img" aria-label="Pack photo placeholder"><img src={TYSON_MARK} alt="" /><span>Pack photo placeholder</span></div>)}</div></div></div></section>
      <section className="new-here-section"><div className="site-frame new-here-inner"><div><h2>{copy.home.newHereTitle}</h2><p>{copy.home.newHereBody}</p></div><Link href="/how-it-works" className="button button-secondary">How it works <ArrowRight size={16} aria-hidden="true" /></Link></div></section>
      <section className="closing-band"><div className="site-frame closing-band-inner"><h2>{copy.home.closing}</h2><EbayAction /></div></section>
    </main>
  );
}
