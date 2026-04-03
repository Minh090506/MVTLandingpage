# /ckm:play — Example Workflows for Marketers

Real usage scenarios for marketers using Claude Code with ClaudeKit Marketing.

## 1. Launch a Product on Product Hunt

```
You: /ckm:play create "My SaaS Launch" --template product-hunt-launch

Claude: Template: Product Hunt Launch Playbook (10 steps, 4 stages)
        Please provide:
        - Product name? → "TaskFlow"
        - Product URL? → "https://taskflow.app"
        - One-liner? → "AI task management for remote teams"
        - Target audience? → "remote team leads managing 5-20 people"
        - Launch date? → "2026-04-15"

        ✅ Playbook created: my-saas-launch
        Goals: 500 upvotes, 1000 visits, 50 trials, 200 emails
        → Run /ckm:play next my-saas-launch to begin

You: /ckm:play next my-saas-launch

Claude: 📊 Goal Progress:
          ph_upvotes      0/500 (0%) - flat
          launch_visits   0/1000 (0%) - flat

        ⚡ Smart Suggestions:
          1. [HIGH] Competitor Launch Analysis → ph_upvotes gap
          2. [HIGH] Audience Pain Mining → launch_visits gap

        ▶ Ready (parallel):
          → Competitor Launch Analysis
          → Audience Pain Mining

        Run both in parallel? [Y/n]

You: Y

Claude: [Activates researcher agent × 2]
        [Runs /ckm:competitor for PH launch patterns]
        [Runs /ckm:persona for audience pain points]
        ...
        ✅ 2 steps completed. Outputs:
          - research/competitor-ph-analysis.md
          - research/audience-pain-map.md

        → Next ready: Tagline & Positioning Variants
```

## 2. Run an SEO Content Engine

```
You: /ckm:play create "Q2 Content Push" --template content-engine

Claude: [Gathers inputs: site URL, target keywords, content goals]
        ✅ Playbook created: q2-content-push (10 steps, 4 stages)
        Goals: 5000 organic traffic, 30 keywords top 10

You: /ckm:play goals set q2-content-push organic_traffic 5000 ga4
You: /ckm:play goals pull

Claude: Pulling GA4 metrics... ✅ organic_traffic: 1,200 (current)
        Pulling GSC metrics... ✅ keywords_top10: 8 (current)

        Goal Progress:
          organic_traffic   1200/5000 (24%) ↗ trending up
          keywords_top10    8/30 (27%) ↗ trending up

You: /ckm:play next q2-content-push

Claude: ⚡ Smart Suggestions:
          1. [HIGH] Keyword Research → organic_traffic gap is biggest lever
          2. [HIGH] Content Audit → keywords_top10 needs boost

        ▶ Ready (parallel):
          → Keyword Research (mine GSC gaps + competitor keywords)
          → Content Audit (analyze existing content performance)

You: run both

Claude: [Activates seo-specialist for /ckm:seo/keywords]
        [Activates analytics-analyst for /ckm:analyze]
        ...
        ✅ Found 47 keyword gaps, 12 declining articles to refresh
        → Next ready: Topic Clusters
```

## 3. Sprint a 2-Week Campaign

```
You: /ckm:play create "Black Friday 2026" --template campaign-sprint

Claude: [Gathers: campaign name, offer, audience, budget]
        ✅ Created: black-friday-2026 (9 steps, 2 weeks)

You: /ckm:play next

Claude: ▶ Ready: Market & Competitive Analysis
        Strategy: "Analyze what competitors ran last Black Friday.
                   Focus on offer structure, not creative — offers
                   drive 80% of BF revenue."
        AI execution: "Crawl competitor BF landing pages, extract
                       offer mechanics, discount tiers, urgency
                       elements, bundle strategies."
        Your decision: "Pick which offer structure fits your margins
                        and inventory."

        Execute? [Y/n]

You: Y

Claude: [Runs /ckm:competitor with BF context]
        ✅ Market analysis complete
        → Next: Audience Segmentation & Targeting
```

## 4. Check What's Blocked

```
You: /ckm:play blocked my-saas-launch

Claude: ⛔ Blocked Steps:

        Teaser Content Campaign
          Waiting for: "Tagline & Positioning Variants" (pending)
          → Run /ckm:play next my-saas-launch to complete it

        Launch Kit Assembly
          Waiting for: "Teaser Content Campaign" (blocked)
          Chain: tagline-variants → teaser-content → launch-kit

        Landing Page Optimization
          Waiting for: "Tagline & Positioning Variants" (pending)
          → Can run parallel with Launch Kit once taglines done
```

## 5. Track Goals Over Time

```
You: /ckm:play goals q2-content-push

Claude: Goal Progress:
          organic_traffic   2800/5000 (56%) ↗ trending up
          keywords_top10    18/30 (60%) ↗ trending up
          content_velocity  6/8 (75%) → flat
          avg_time_on_page  145/180 (81%) ↗ trending up

        ⚡ Smart Suggestions:
          1. [MED] Repurpose Content → content_velocity flat, needs boost
          2. [LOW] SEO Optimization → keywords on track but can accelerate

You: /ckm:play goals pull

Claude: Pulling GA4... ✅ organic_traffic: 3,100 (+300 since last pull)
        Pulling GSC... ✅ keywords_top10: 21 (+3)
        SendGrid... ⚠️ SENDGRID_API_KEY not set, skipped
        Stripe... ⚠️ STRIPE_SECRET_KEY not set, skipped
```

## 6. Capture Learnings

```
You: /ckm:play learn my-saas-launch

Claude: What feedback do you have about the outputs so far?

You: The teaser posts were too salesy. Our audience responds better
     to behind-the-scenes content showing the building process,
     not polished marketing copy.

Claude: Learning captured:

        📝 [tone] BTS content > polished marketing copy
           Source: my-saas-launch / teaser-content
           Example: "Show building process, raw screenshots,
                     real struggles — not polished marketing speak"

        This will be injected into future content generation steps.
        (3/30 learnings saved)
```

## 7. Approve a Quality Gate

```
You: /ckm:play status my-saas-launch

Claude: ...
        ⏸️ Teaser Content Campaign — gate-pending (brand-review)
        ...

You: /ckm:play gate my-saas-launch teaser-content approve

Claude: ✅ Gate "brand-review" approved for Teaser Content Campaign
        Step marked completed.

        Unblocked:
          → Launch Kit Assembly (now ready)
```

## 8. Browse and Pick Templates

```
You: /ckm:play templates

Claude: Available Templates:

        product-hunt-launch (v1.0.0)
          Product Hunt Launch Playbook
          4 stages, 10 steps | advanced | 3 weeks
          tags: launch, product-hunt, growth

        content-engine (v1.0.0)
          SEO Content Engine
          4 stages, 10 steps | intermediate | 30 days
          tags: seo, content, organic

        campaign-sprint (v1.0.0)
          2-Week Campaign Sprint
          4 stages, 9 steps | intermediate | 2 weeks
          tags: campaign, sprint, growth

        saas-launch (v1.0.0)
          SaaS Go-to-Market Launch
          4 stages, 11 steps | advanced | 60 days
          tags: saas, gtm, demand-gen

You: /ckm:play create "Spring Launch" --template saas-launch
```

## 9. Reset and Iterate

```
You: /ckm:play reset my-saas-launch landing-page

Claude: Reset "Landing Page Optimization" to pending.
        Downstream marked stale:
          ⚠️ Launch Day Orchestration (was completed, now stale)

        Output files preserved — clean up manually if needed.
        → Run /ckm:play next my-saas-launch to re-run
```
