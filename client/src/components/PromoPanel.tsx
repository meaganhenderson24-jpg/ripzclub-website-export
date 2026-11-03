import { Link } from "wouter";
import promo from "@/content/home-promo.json";
import { ENABLE_SANTAS_SURPRISE_BOX_PROMO } from "@/lib/site";

export function PromoPanel() {
  if (!ENABLE_SANTAS_SURPRISE_BOX_PROMO) return <article className="home-promo-panel"><img className="home-promo-image" src={promo.wheel.image} alt={promo.wheel.imageAlt} /></article>;

  return <Link href="/santas-surprise-box" className="home-promo-panel home-promo-link" aria-label="See Santa's Surprise Box"><img className="home-promo-image" src={promo.santa.image} alt={promo.santa.imageAlt} /><span className="home-promo-action santa-promo-action">{promo.santa.buttonLabel}</span></Link>;
}
