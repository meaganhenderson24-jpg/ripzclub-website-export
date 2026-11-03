export const EBAY_LIVE_URL = "https://www.ebay.com.au/ebaylive/sellers/uyrpxfoktc2?utm_source=ripzclub-site";
export const DISCORD_URL = "https://discord.gg/cJ6FZQpD5P";
export const INSTAGRAM_URL = "https://www.instagram.com/ripz.club/";
export const FACEBOOK_URL = "https://www.facebook.com/ripz.club";
export const TIKTOK_URL = "https://www.tiktok.com/@ripz.club";

export const TYSON_LOGO = "/assets/tyson-logo.webp";
export const TYSON_MARK = "/assets/tyson-mark.webp";
export const TYSON_WORDMARK = "/assets/tyson-wordmark.webp";
export const TYSON_FAVICON = "/assets/tyson-favicon.png";
export const WHEEL_IMAGE = "/assets/mystery-wheel.jpg";
export const LUCKY_LEE_IMAGE = "/assets/lucky-lee.jpg";

export const ENABLE_SANTAS_SURPRISE_BOX_MENU = false;
export const ENABLE_SANTAS_SURPRISE_BOX_PROMO = true;

export function withEbayTracking(href: string) {
  try {
    const url = new URL(href);
    if (url.hostname.endsWith("ebay.com.au")) url.searchParams.set("utm_source", "ripzclub-site");
    return url.toString();
  } catch {
    return href;
  }
}

export const motionAssets = {
  wheel: { src: "/assets/ripzclub-wheel-clean.mp4", poster: "/assets/ripzclub-wheel-clean-poster.jpg" },
  timer: { src: "/assets/ripzclub-timer.mp4", poster: "/assets/ripzclub-timer-poster.jpg" },
  snow: { src: "/assets/ripzclub-snow.mp4", poster: "/assets/ripzclub-snow-poster.jpg" },
  kennel: { src: "/assets/ripzclub-tyson-kennel.mp4", poster: "/assets/ripzclub-tyson-kennel-poster.jpg" },
} as const;

export const navItems = [
  { href: "/#shows", label: "Shows", anchor: true },
  { href: "/how-it-works", label: "How it works", anchor: false },
  { href: "/meet-lee", label: "Meet Lee", anchor: false },
  { href: "/faqs", label: "FAQs", anchor: false },
  { href: "/community", label: "Community", anchor: false },
] as const;

export const socialLinks = [
  { label: "Discord", href: DISCORD_URL, destination: "discord" },
  { label: "Instagram", href: INSTAGRAM_URL, destination: "instagram" },
  { label: "Facebook", href: FACEBOOK_URL, destination: "facebook" },
  { label: "TikTok", href: TIKTOK_URL, destination: "tiktok" },
] as const;

export const copy = {
  home: {
    heroTitle: "Twenty seconds on the clock. One spin up for grabs.",
    heroSubline: "Ripz Club runs live auctions on eBay live, with hundreds of prizes up for grabs every night. You bid for the next spin, watch it land in real time, and see what comes up. There are great prizes on offer, including some worth thousands.",
    underButtons: "Free to watch. You need to be 18 or over to bid.",
    cards: [
      { title: "The 20 seconds", body: "We set the clock and the bids start flying. Whoever's on top when it hits zero gets the next spin. It's a good kind of nervous." },
      { title: "The spin", body: "We hit the button and the wheel starts turning. Everyone holds their breath until it lands. There are hundreds of prizes up for grabs every night, and some are the kind you screenshot and send to your mates." },
      { title: "The room", body: "Say hi in the chat, bid when you feel like it, or just watch for a while. Your seat's always saved. We're on six nights a week." },
    ],
    newHereTitle: "New here?",
    newHereBody: "Live shopping is a brand new way to shop, and it's only just arriving in Australia. You watch a live show, see exactly what you're getting, chat with other people in the room, and bid as things happen. Part show, part community, and a lot easier than it looks. How it works covers it in three minutes.",
    closing: "Come and see what's on the wheel tonight.",
  },
  howItWorks: {
    title: "New to live shopping? It's easier than it looks.",
    intro: "Live shopping is new, it's fun, and it's easier than it looks. Here's how a night works from start to finish.",
    steps: [
      "Follow the show. Tap the button below to go straight to the Ripz Club store on eBay Live, then hit follow. You'll be notified when our next show is coming up.",
      "Watch for a bit. No pressure. Say hi in the chat and see how it feels.",
      "Bid for the next spin. We set a 20 second timer and everyone bids for the next spin. Bids start at $1 and go up in as little as 1 cent. When the timer ends, the top bidder's saved card is charged through eBay and the spin is theirs.",
      "Watch the wheel. Once the payment goes through, we spin the wheel live. There are hundreds of prizes up for grabs every night, and nobody knows what's coming, Lee included. Whatever it lands on is yours. It can be worth more or less than your bid, and that's the thrill. Once a prize is won, it comes off the wheel, so you can always see what's left.",
      "We pack it up and send it. We post everything you win within 48 hours of the stream. Postage follows the eBay listing.",
    ],
    sections: [
      { title: "What's on the wheel", body: "Mostly sealed retail product, with the occasional graded card. There are big prizes in the mix, and some are worth $1,000." },
      { title: "Sometimes: rip and ship nights", body: "Now and then Lee runs a rip and ship night. You buy packs and he opens them live for you, or sends them sealed. The wheel is the main event, but these go down well too." },
      { title: "Safe and simple", body: "Everything runs through eBay, so you never pay anyone outside it and there are no dodgy links." },
      { title: "Set your limit first", body: "Decide what you're happy to spend before the first bid and stick to it. Bidding moves fast, and it's easy to get swept up. If it ever stops being fun, close the app. Lee will also step in if he thinks someone's had a few too many." },
      { title: "For the watchers", body: "You never have to bid. Plenty of people come just for the chat. Stay as long as you like." },
    ],
    practicalTitle: "Before you bid: the practical bits",
    practicalLead: "Three things people want to know, answered plainly.",
    practical: [
      { question: "When does it get posted?", answer: "We post within 48 hours of the stream." },
      { question: "What does postage cost?", answer: "It runs through eBay, so postage follows the eBay listing. Where it's free in Australia the listing says so, and otherwise eBay works it out at checkout before you pay." },
      { question: "What if something's wrong?", answer: "There are no returns if you change your mind. If something isn't as described, your rights under the Australian Consumer Law apply, so tell us and we'll sort it." },
    ],
  },
  meetLee: {
    title: "Meet Lucky Lee.",
    body: [
      "Lee's been in the TCG world for several years. It started the way a lot of these stories do: with his son and a love of Pokémon. A few cards turned into a few more, and those turned into a proper business across retail, grading and slabs.",
      "These days he's the one behind the mic and the wheel. He's fair with everyone, quick with a joke, and just as happy to chat cards with someone who's only popped in to watch as with the person about to bid. If it feels like talking to a mate who happens to know his stuff, that's about right.",
    ],
    tyson: "That's Tyson, Lee's French bulldog, the face on the logo and the unofficial mascot of Ripz Club. He doesn't say much, but he's always around, and he's got strong opinions about snacks.",
    numbersTitle: "By the numbers",
    numbers: [
      { value: "23K", label: "items sold" },
      { value: "100%", label: "positive feedback" },
      { value: "1,000", label: "followers on eBay" },
    ],
    asOf: "As of 28 October 2026, from the eBay store page (RipzClub TCG).",
  },
  faqs: [
    {
      title: "The basics",
      items: [
        { question: "What is Ripz Club?", answer: "A live show on eBay Live, hosted by Lucky Lee. You bid for spins on a wheel loaded with hundreds of prizes, and the wheel decides what you get." },
        { question: "What is eBay Live?", answer: "The live video side of eBay, where sellers stream and you can chat, bid and buy in real time." },
        { question: "Do I have to buy anything?", answer: "No. It's free to watch and free to chat. Plenty of people just come for the company." },
      ],
    },
    {
      title: "Bidding and the wheel",
      items: [
        { question: "How does bidding work?", answer: "Lee sets a 20 second timer and everyone bids for the next spin. Bids start at $1 and go up in as little as 1 cent. Whoever's on top when the timer ends is charged through eBay and gets the spin. Then it all starts again." },
        { question: "Who decides what I win?", answer: "The wheel does. It's a Wheel of Names wheel, shown live on screen the whole time, so you can watch it spin. Nobody picks the result, Lee included." },
        { question: "Can I see what's left on the wheel?", answer: "Yes. Every prize comes off the wheel once it's won, so what you see on screen is what's still in play." },
        { question: "Will I win something worth more than I bid?", answer: "It can go either way. The wheel lands where it lands, so a prize can be worth more or less than your bid. Set a limit before you start." },
        { question: "What can I win?", answer: "Mostly sealed retail product, with the occasional graded card. Some prizes are worth $1,000." },
        { question: "Do you open the prizes on camera?", answer: "Not for the wheel. Prizes arrive sealed. Lee has also run a rip and ship night, where you buy packs and he opens them live for you. It went down well, so follow along to catch the next one." },
      ],
    },
    {
      title: "Payment and postage",
      items: [
        { question: "How old do I need to be?", answer: "You need to be 18 or over to bid on eBay Live." },
        { question: "How do I pay?", answer: "Through eBay. You need a card saved on your eBay account to bid, and the top bidder's card is charged when the timer ends." },
        { question: "When does my prize ship, and what does postage cost?", answer: "We post within 48 hours of the stream. Postage follows the eBay listing: where it's free in Australia the listing says so, and otherwise eBay works it out at checkout before you pay." },
        { question: "What if something arrives damaged or wrong?", answer: "There are no returns if you change your mind. If something isn't as described, your rights under the Australian Consumer Law apply, so tell us and we'll sort it." },
      ],
    },
    {
      title: "Play it sensibly",
      items: [
        { question: "How much should I spend?", answer: "Only what you're happy to spend. Set a limit before you start and stick to it." },
        { question: "How do I know when you're live?", answer: "Follow us on eBay Live and you'll get a nudge when the show starts. Join the Discord and you'll see it there too.", hasDiscordLink: true },
      ],
    },
  ],
  community: {
    title: "The show ends. The Discord doesn't.",
    body: "Come for the wheel, stay for the chat. The Discord is where regulars swap pulls, catch up on the night and find out when Lee's next live.",
    sensible: "Bidding moves fast. Set a limit before you start, and only spend what you're happy to spend. 18+ to bid.",
  },
  footer: "Ripz Club is independent and not affiliated with, or endorsed by, the makers of the products featured. Card values mentioned are reference prices, not valuations or financial advice.",
} as const;
