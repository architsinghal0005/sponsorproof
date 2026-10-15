import type { DeliverableType } from "./types.ts";

export interface CampaignExample {
  id: string;
  name: string;
  brand: string;
  category: string;
  deliverableType: DeliverableType;
  description: string;
  brief: string;
  passingScript: {
    label: string;
    description: string;
    content: string;
  };
  flawedScript: {
    label: string;
    description: string;
    content: string;
  };
}

export const CAMPAIGN_EXAMPLES: CampaignExample[] = [
  {
    id: "nordshield-vpn",
    name: "NordShield VPN - YouTube Integration",
    brand: "NordShield Security",
    category: "Cybersecurity & Tech",
    deliverableType: "YOUTUBE_INTEGRATION",
    description:
      "A classic mid-roll YouTube sponsor read (60-90s) with strict security claims and discount codes.",
    brief: `BRAND BRIEF: NordShield VPN Q4 Creator Campaign
Deliverable: 60-90 second mid-roll video integration
Target Audience: Tech enthusiasts, gamers, and privacy-conscious users

MANDATORY TALKING POINTS:
1. Threat Protection: Blocks malicious websites, trackers, and annoying intrusive ads before they load.
2. Global Server Network: Over 6,000 high-speed servers across 60+ countries for seamless 4K streaming.
3. Multi-device support: Protect up to 6 devices simultaneously on one single account (Windows, macOS, iOS, Android).
4. Risk-Free Guarantee: Emphasize the 30-day money-back guarantee with zero risk.

CALL TO ACTION & PROMO DETAILS:
- Discount Code: CREATOR70 (case-sensitive, yields 70% off 2-year plan + 3 extra months free)
- Custom URL: nordshield.com/creator (must state: "Click the link in the top line of the description or scan the QR code")
- Required Hashtags: #NordPartner #OnlinePrivacy

PROHIBITED CLAIMS & WORDS (Strict Brand Safety):
- Do NOT say or claim: "100% unhackable", "completely invisible online", "guaranteed illegal download protection".
- Avoid mentioning competitors: ExpressVPN, Surfshark, CyberGhost.
- Do NOT encourage illegal file sharing or torrenting pirated movies.

MANDATORY DISCLOSURE:
Must display verbal and on-screen disclosure in the first 5 seconds: "Sponsored by NordShield VPN" or "#ad".`,
    passingScript: {
      label: "Compliant Draft (Ready to Post)",
      description: "Fulfills all 4 talking points, exact promo code, money-back guarantee, and FTC disclosure.",
      content: `[00:00 - On-screen banner: Sponsored by NordShield VPN | #ad]
Before we dive into part two of today's build, huge thank you to today's sponsor, NordShield VPN!

Whether you're working from public Wi-Fi at a café or just streaming your favorite shows, keeping your personal data secure is essential. NordShield's Threat Protection feature actively blocks malicious links, trackers, and intrusive ads before they even hit your browser.

They operate over 6,000 high-speed servers in more than 60 countries, meaning you never deal with buffering even on 4K streams. Plus, one single account lets you protect up to 6 devices at the same time—your laptop, phone, tablet, and smart TV.

Best of all, there's zero risk to try it thanks to their 30-day money-back guarantee.

Head over to nordshield.com/creator or click the first link in the description, and be sure to use my promo code CREATOR70 to grab 70% off the 2-year plan plus 3 extra months completely free! #NordPartner #OnlinePrivacy`,
    },
    flawedScript: {
      label: "Flawed Draft (High Risk Violations)",
      description: "Wrong promo code, missing 30-day guarantee, missing hashtags, and contains prohibited '100% unhackable' claim.",
      content: `Alright guys, let's take a quick break to talk about our sponsor today, NordShield.

If you don't want people spying on your browsing history, you definitely need a VPN. Once you turn NordShield on, it makes your computer 100% unhackable no matter what Wi-Fi network you connect to. It's honestly way faster than ExpressVPN which I used to use.

You can connect up to 6 devices which is pretty neat.

Go to nordshield.com/creator and use code CREATOR20 for 20% off your purchase. Link is in the description below!`,
    },
  },
  {
    id: "vitalgreens-daily",
    name: "VitalGreens Daily - TikTok & Reel",
    brand: "VitalGreens Labs",
    category: "Health & Wellness",
    deliverableType: "TIKTOK_REELS",
    description:
      "Short-form vertical video & caption requiring FDA disclaimer and strict anti-medical claim compliance.",
    brief: `BRAND BRIEF: VitalGreens Daily Ultimate Nutrition
Deliverable: 30-45s TikTok/Instagram Reel + Caption
Campaign Theme: Realistic Daily Habit for High Energy

MANDATORY TALKING POINTS:
1. 75 whole-food sourced vitamins, minerals, and dairy-free probiotics in one simple daily scoop.
2. Cold-water mixability: Light, natural citrus flavor that dissolves instantly without clumping.
3. NSF Certified for Sport (clean ingredients, third-party tested, no artificial sweeteners).

CALL TO ACTION & PROMO:
- Exclusive Discount Code: DAILYBOOST (15% off first subscription order + free shaker bottle)
- Custom Bio Link: vitalgreens.com/creator
- Caption Hashtags: #ad #VitalPartner #HealthyHabits

CRITICAL LEGAL & PROHIBITED CLAIMS:
- Never make medical or disease claims. Do NOT say: "cures anxiety", "treats gut disease", "cured my chronic fatigue", "replaces real meals".
- Mandatory FDA Disclaimer must appear in caption:
  "These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease."
- FTC Disclosure: Must include #ad in the first 3 lines of caption before 'more'.`,
    passingScript: {
      label: "Compliant Draft (Pass)",
      description: "Includes FDA disclaimer, #ad upfront, code DAILYBOOST, and no medical cure claims.",
      content: `[Spoken Video Audio]:
My morning routine has changed completely since I started drinking VitalGreens Daily. Instead of taking ten different vitamin bottles, I just do one scoop with cold water before my workout.

It has 75 whole-food sourced vitamins, minerals, and dairy-free probiotics, and honestly it dissolves immediately with a crisp citrus taste—no weird chalky clumps. Plus it's NSF Certified for Sport, so I know there are zero sketchy fillers.

Hit the link in my bio at vitalgreens.com/creator and use code DAILYBOOST for 15% off your first subscription plus a free shaker bottle!

[Caption Text]:
#ad Consistency is everything. 🌿 Starting my mornings with @vitalgreens has been the simplest routine upgrade. One scoop, 75 vitamins & minerals, NSF Certified for Sport.

Get 15% off + a free shaker with code DAILYBOOST at vitalgreens.com/creator (link in bio)! #VitalPartner #HealthyHabits

*These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.`,
    },
    flawedScript: {
      label: "Flawed Draft (Medical Claim Violation)",
      description: "Contains illegal medical cure claim, missing FDA disclaimer, and missing #ad upfront.",
      content: `[Spoken Video Audio]:
You guys asked what fixed my stomach issues—this green powder literally cured my gut inflammation and my chronic fatigue within two days. It completely replaces breakfast and gives you superhuman immunity.

Check the link in my bio to buy it and use code BOOST for a discount!

[Caption Text]:
Drink this everyday to cure low energy and never get sick again!! Link in bio vitalgreens.com/creator #fitness #greens #health`,
    },
  },
  {
    id: "chefsbox-meals",
    name: "ChefsBox - Podcast Mid-roll Read",
    brand: "ChefsBox Gourmet",
    category: "Food & Consumer Goods",
    deliverableType: "PODCAST_READ",
    description:
      "A 60s host-read podcast ad requiring exact free shipping offer, prep time stats, and conversational tone.",
    brief: `BRAND BRIEF: ChefsBox Gourmet Meal Kits (Audio Read)
Deliverable: 60-second host-read mid-roll audio
Placement: Mid-roll (between minute 15 and 45)

MANDATORY TALKING POINTS:
1. 15-Minute Meals: Pre-measured, pre-chopped farm fresh ingredients delivered right to your doorstep.
2. Variety: Over 45 weekly rotating chef-curated recipes covering Keto, Vegetarian, and Calorie-Smart.
3. Flexibility: Skip weeks, change delivery addresses, or cancel anytime directly in their mobile app with zero penalties.
4. Promotional Offer: 50% off your first box PLUS free shipping on your first order.

CALL TO ACTION:
- Promo Code: FREEBOX50
- URL: chefsbox.com/creator
- Explicitly tell listeners: "Go to chefsbox.com/creator and enter code FREEBOX50 to unlock 50% off and free shipping."

PROHIBITED TOPICS:
- Do NOT criticize local grocery stores as "poisonous" or "toxic".
- Do NOT guarantee weight loss results.
- Must mention: "Sponsored by ChefsBox".`,
    passingScript: {
      label: "Compliant Draft (Ready for Air)",
      description: "Mentions 50% off + free shipping, 15-minute meals, flexible cancellation, and code FREEBOX50.",
      content: `This episode of the podcast is sponsored by ChefsBox!

You all know that between recording episodes and editing, my evenings get crazy busy. ChefsBox has been a game changer for dinner in our house. They send pre-portioned, farm-fresh ingredients right to your doorstep, with delicious recipes that take just 15 minutes to cook.

They have over 45 chef-crafted recipes every week—from Keto to Calorie-Smart and hearty family meals. And the best part is the total flexibility: you can pause, skip a week, or switch delivery dates right from their app without any hassle.

Right now, ChefsBox is giving our listeners an amazing deal: go to chefsbox.com/creator and use code FREEBOX50 to get 50% off your first box, PLUS free shipping on that first delivery!

That's code FREEBOX50 at chefsbox.com/creator for 50% off and free shipping. Go check it out!`,
    },
    flawedScript: {
      label: "Flawed Draft (Missing Free Shipping & Wrong Code)",
      description: "Omits mandatory free shipping benefit, uses incorrect promo code, and attacks grocery food.",
      content: `Our sponsor today is ChefsBox.

Honestly, food at normal grocery stores is practically toxic garbage compared to this. ChefsBox gives you fresh ingredients for 15-minute dinners.

They have tons of recipes to pick from and you can cancel anytime.

Use code CHEFS30 to get 30% off your box at chefsbox.com/creator.`,
    },
  },
  {
    id: "codepulse-cloud",
    name: "CodePulse Cloud - Dev Video Short",
    brand: "CodePulse Infrastructure",
    category: "B2B Developer SaaS",
    deliverableType: "YOUTUBE_DEDICATED",
    description:
      "Developer-focused cloud compute sponsor with uptime SLA, free credit codes, and technical accuracy.",
    brief: `BRAND BRIEF: CodePulse Serverless Cloud Platform
Deliverable: Dedicated developer breakdown or sponsored project segment
Target Audience: Full-stack developers, DevOps engineers, and startup founders

MANDATORY TALKING POINTS:
1. Instant Zero-Config Deploy: Push git commit and instant preview branch deployed in under 12 seconds.
2. Enterprise Reliability: 99.99% uptime SLA backed by distributed edge nodes in 35 regions.
3. Cost Efficiency: Pay only for milliseconds of compute used with zero idle cluster fees.
4. Generous Trial: $100 in free cloud infrastructure credits for all new developer signups.

CALL TO ACTION & PROMO:
- Promo Code: DEVCLOUD100
- Custom URL: codepulse.io/creator
- Required Hashtags: #CodePulseSponsor #DevOps #CloudNative
- FTC Disclosure: "Sponsored by CodePulse" clearly stated.

PROHIBITED CLAIMS:
- Do NOT claim that "AWS, GCP or Docker are dead/obsolete".
- Do NOT guarantee 100% infallible bug-free hosting.`,
    passingScript: {
      label: "Compliant Draft (Pass)",
      description: "Highlights 99.99% SLA, zero-config deploy, $100 credit with DEVCLOUD100, and fair tech comparisons.",
      content: `Sponsored by CodePulse.

If you're tired of spending hours configuring Kubernetes YAML files just to get a side project online, you need to check out CodePulse.

With CodePulse, deployments are completely zero-config: just push to your git repo and your preview branch is live at the edge in under 12 seconds. They offer a rock-solid 99.99% uptime SLA across 35 global edge regions, and their pricing is pay-per-millisecond so you never pay for idle instances.

Whether you're migrating existing Docker microservices or spinning up Next.js apps, it makes shipping feel effortless.

Head over to codepulse.io/creator and use code DEVCLOUD100 to get $100 in free cloud credits to build your next project today! #CodePulseSponsor #DevOps #CloudNative`,
    },
    flawedScript: {
      label: "Flawed Draft (Competitor Attack & Missing Credits)",
      description: "Falsely claims AWS is dead, forgets to specify the $100 credit amount, and misses disclosure.",
      content: `Hey devs, check out CodePulse.

AWS is basically dead and obsolete now because CodePulse is a million times faster. You just push code and it hosts everything for free.

Check them out at codepulse.io/creator with code DEVCLOUD.`,
    },
  },
];
