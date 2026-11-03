import {
  ArrowUpRight,
  Facebook,
  Instagram,
  Menu,
  Music2,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "wouter";
import { trackOutboundClick, type OutboundDestination } from "@/lib/outbound";
import {
  copy,
  DISCORD_URL,
  EBAY_LIVE_URL,
  ENABLE_SANTAS_SURPRISE_BOX_MENU,
  navItems,
  socialLinks,
  TYSON_LOGO,
  TYSON_MARK,
  TYSON_WORDMARK,
  withEbayTracking,
} from "@/lib/site";

interface ExternalActionProps {
  href: string;
  destination: OutboundDestination;
  children: ReactNode;
  compact?: boolean;
  tone?: "primary" | "secondary" | "outline";
}

function ExternalAction({ href, destination, children, compact = false, tone = "primary" }: ExternalActionProps) {
  return <a className={`button button-${tone}${compact ? " button-compact" : ""}`} href={href} target="_blank" rel="noreferrer" onClick={() => trackOutboundClick(destination)}>{children} <ArrowUpRight size={compact ? 14 : 16} aria-hidden="true" /></a>;
}

function EbayAction({ compact = false, label = "Check us out on eBay Live", href = EBAY_LIVE_URL }: { compact?: boolean; label?: string; href?: string }) {
  return <ExternalAction href={withEbayTracking(href)} destination="ebay" compact={compact}>{label}</ExternalAction>;
}

function DiscordAction({ compact = false, label = "Join the Ripz Club community on Discord" }: { compact?: boolean; label?: string }) {
  return <ExternalAction href={DISCORD_URL} destination="discord" compact={compact} tone="secondary">{label}</ExternalAction>;
}

function DiscordLogo({ size = 18 }: { size?: number }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="currentColor"><path d="M19.54 4.94A16.1 16.1 0 0 0 15.54 3.7l-.5 1.02a14.4 14.4 0 0 0-6.08 0l-.5-1.02a16.1 16.1 0 0 0-4 1.24C1.93 8.7 1.26 12.37 1.6 16a16.3 16.3 0 0 0 4.9 2.48l1.2-1.62a9.3 9.3 0 0 1-1.9-.92l.46-.36c3.66 1.7 7.82 1.7 11.44 0l.46.36c-.6.36-1.23.67-1.9.92l1.2 1.62A16.3 16.3 0 0 0 22.4 16c.4-4.2-.68-7.84-2.86-11.06ZM8.43 13.78c-1.1 0-2-1.02-2-2.27s.88-2.28 2-2.28 2 1.02 2 2.28-.9 2.27-2 2.27Zm7.14 0c-1.1 0-2-1.02-2-2.27s.88-1.02 2-2.28-.9 2.27-2 2.27Z" /></svg>;
}

function TikTokLogo({ size = 18 }: { size?: number }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="currentColor"><path d="M16.7 3c.3 2.2 1.55 3.55 3.7 3.7v3.16c-1.5.15-2.82-.34-3.65-.94v6.04a5.9 5.9 0 1 1-5.12-5.86v3.1a2.8 2.8 0 1 0 1.95 2.67V3h3.12Z" /></svg>;
}

export function SocialLogo({ label, size = 18 }: { label: string; size?: number }) {
  if (label === "Instagram") return <Instagram size={size} aria-hidden="true" />;
  if (label === "Facebook") return <Facebook size={size} aria-hidden="true" />;
  if (label === "TikTok") return <TikTokLogo size={size} />;
  if (label === "Discord") return <DiscordLogo size={size} />;
  return <Music2 size={size} aria-hidden="true" />;
}

function Brand({ footer = false }: { footer?: boolean }) {
  return <Link href="/" className={`brand ${footer ? "brand-footer" : ""}`} aria-label="Ripz Club home"><img className="brand-mark" src={footer ? TYSON_LOGO : TYSON_MARK} alt="" /><img className="brand-wordmark" src={TYSON_WORDMARK} alt="" aria-hidden="true" /></Link>;
}

function SocialIcon({ label, href, destination }: { label: string; href: string; destination: OutboundDestination }) {
  return <a className="social-icon" aria-label={label} href={href} target="_blank" rel="noreferrer" onClick={() => trackOutboundClick(destination)}><SocialLogo label={label} /></a>;
}

function SantaMenuLink({ onClick }: { onClick?: () => void }) {
  return <Link href="/santas-surprise-box" className="nav-link santa-nav-link" onClick={onClick}><span className="santa-lights" aria-hidden="true"><i /><i /><i /><i /><i /></span><span className="santa-bauble santa-bauble-left" aria-hidden="true" /><span className="santa-bauble santa-bauble-right" aria-hidden="true" />Santa's Surprise Box</Link>;
}

function NavigationLinks({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  return <>{navItems.map(item => item.anchor
    ? <a key={item.href} href={item.href} className={mobile ? "mobile-nav-link" : "nav-link"} onClick={onNavigate}>{item.label}</a>
    : <Link key={item.href} href={item.href} className={mobile ? "mobile-nav-link" : "nav-link"} onClick={onNavigate}>{item.label}</Link>)}
    {ENABLE_SANTAS_SURPRISE_BOX_MENU && <SantaMenuLink onClick={onNavigate} />}</>;
}

export function SiteShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-frame header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Primary navigation"><NavigationLinks /></nav>
          <div className="header-actions"><EbayAction compact /><button className="menu-toggle" type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen(open => !open)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button></div>
        </div>
        {menuOpen && <div className="mobile-menu"><div className="site-frame mobile-menu-inner"><nav aria-label="Mobile navigation"><NavigationLinks mobile onNavigate={closeMenu} /></nav><div className="mobile-menu-actions"><EbayAction /><DiscordAction /></div></div></div>}
      </header>
      {children}
      <section className="safety-band" aria-label="Safety information"><div className="site-frame safety-band-inner"><p>Play it sensibly</p><p>{copy.community.sensible}</p></div></section>
      <footer className="site-footer">
        <div className="site-frame footer-grid">
          <div className="footer-brand-block"><Brand footer /><p>{copy.footer}</p></div>
          <div className="footer-links"><div className="social-icons">{socialLinks.map(link => <SocialIcon key={link.label} {...link} />)}</div></div>
          <div className="footer-links footer-legal"><Link href="/privacy">Privacy policy</Link></div>
        </div>
      </footer>
      <div className="mobile-live-bar"><EbayAction /></div>
    </div>
  );
}

export { DiscordAction, EbayAction };
