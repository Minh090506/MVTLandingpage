# ClaudeKit Marketing - Introduction Walkthrough Video Script

**Duration:** ~7 minutes
**Target:** Indie hackers, small marketing teams, SMB marketing managers
**Tone:** Confident, practical, demo-driven

---

## SCENE 1: HOOK (0:00 - 0:30)

### Visual
- Split screen: Left side shows 10 marketing tool logos (Mailchimp, Hootsuite, SEMrush, HubSpot, etc.)
- Right side: Single Claude Code terminal

### Narration
> "You're juggling 10 different marketing tools. Mailchimp for emails. Hootsuite for social. SEMrush for SEO. HubSpot for campaigns. What if you could replace all of them with AI agents that actually work together?"
>
> "This is ClaudeKit Marketing - 32 AI agents, 119 commands, one unified system. Let me show you how it works."

### On-Screen Text
```
ClaudeKit Marketing
32 AI Agents | 119 Commands | 1 System
```

---

## SCENE 2: AI AGENT ORCHESTRATION (0:30 - 2:00)

### Visual
- Terminal showing agent activation
- Diagram of Hormozi funnel (TOFU → MOFU → BOFU)

### Narration
> "ClaudeKit Marketing is built on 32 specialized AI agents organized by the Hormozi funnel framework."
>
> "At the top of funnel, you have agents for attraction - SEO specialists, lead qualifiers, researchers. Middle funnel handles engagement - email wizards, content creators, funnel architects. Bottom funnel focuses on growth - upsell maximizers, continuity specialists."

### Demo Action
```bash
# Show agent list
claude "list all marketing agents"

# Demo agent chain
claude "create a landing page for our new product launch"
```

### On-Screen Text
```
TOFU: Attraction Specialist, SEO Specialist, Lead Qualifier
MOFU: Email Wizard, Content Creator, Funnel Architect
BOFU: Upsell Maximizer, Continuity Specialist
```

### Narration (continued)
> "Watch what happens when I ask for a landing page. The attraction specialist analyzes competitors. The copywriter crafts headlines. The content creator builds the page. They hand off work to each other automatically - like a real marketing team."

---

## SCENE 3: SLASH COMMANDS (2:00 - 3:00)

### Visual
- Terminal showing command typing with autocomplete
- Quick cuts between different command outputs

### Narration
> "Every agent is accessible through intuitive slash commands. Type forward-slash content, and you get options."

### Demo Action
```bash
# Show command variants
/content/good      # Best quality, thorough
/content/fast      # Quick draft
/content/cro       # Conversion optimized

# Campaign commands
/campaign          # Full campaign orchestration
/campaign/email    # Email-specific campaign
/campaign/analyze  # Performance analysis

# SEO commands
/seo/audit         # Full site audit
/seo/keywords      # Keyword research
```

### Narration (continued)
> "Notice the variants - 'good' for thorough work, 'fast' for quick drafts, 'cro' for conversion optimization. Same pattern across all 119 commands. You learn one, you know them all."

### On-Screen Text
```
/content/good  → Best quality
/content/fast  → Quick draft
/content/cro   → Conversion optimized
```

---

## SCENE 4: MARKETING DASHBOARD (3:00 - 4:30)

### Visual
- Browser showing dashboard UI
- Click through different sections

### Narration
> "For those who prefer a visual interface, ClaudeKit Marketing includes a full-stack dashboard built with Vue 3."

### Demo Action
1. **Campaign Kanban** - Drag cards between columns
2. **Content Library** - Filter by type, status
3. **Asset Gallery** - Browse images with metadata
4. **Brand Center** - Show design system

### Narration (continued)
> "The campaign Kanban lets you drag and drop tasks between stages. Content library organizes everything by type and status. Asset gallery keeps your visuals organized. And the brand center - this is where your entire design system lives."

### On-Screen Text
```
Dashboard Features:
✓ Campaign Kanban (drag & drop)
✓ Content Library (filter & search)
✓ Asset Gallery (metadata)
✓ Brand Center (design system)
```

### Technical Callout
> "And it's fast - 62 kilobytes gzipped, 88% test coverage, production ready out of the box."

---

## SCENE 5: BRAND CONSISTENCY (4:30 - 5:30)

### Visual
- Show brand-guidelines.md file
- Then show content output matching those guidelines

### Narration
> "Here's the magic - brand consistency automation. Every piece of content matches your brand voice automatically."

### Demo Action
```bash
# Show brand guidelines file
cat docs/brand-guidelines.md

# Generate content
/content/good "write a product announcement email"

# Output shows brand voice applied
```

### Narration (continued)
> "Your brand guidelines live in a simple markdown file. Voice, tone, messaging, colors - all defined here. When any agent generates content, hooks automatically inject these guidelines into the prompt. The email wizard knows your voice. The copywriter knows your tone. The social manager knows your hashtag style."

### On-Screen Text
```
docs/brand-guidelines.md
        ↓
inject-brand-context.cjs (hook)
        ↓
Every agent output = On-brand
```

### Narration (continued)
> "No more editing AI outputs to sound like your brand. It's automatic."

---

## SCENE 6: MCP INTEGRATIONS (5:30 - 6:30)

### Visual
- Show 8 integration logos
- Dashboard pulling real data

### Narration
> "ClaudeKit Marketing connects to your actual marketing stack through 8 MCP integrations."

### Demo Action
```bash
# Show MCP status
claude "check marketing integrations"

# Pull real analytics
claude "show GA4 traffic for last 7 days"

# Check SEO rankings
claude "get Search Console rankings for 'marketing automation'"
```

### On-Screen Text
```
MCP Integrations:
• Google Analytics 4 - Traffic & conversions
• Google Ads - Campaign performance
• Google Search Console - SEO rankings
• SendGrid / Resend - Email delivery
• Discord / Slack - Team notifications
• ReviewWeb - SEO intelligence
```

### Narration (continued)
> "GA4 for traffic. Search Console for rankings. SendGrid for email delivery. Discord and Slack for team updates. This isn't just content generation - it's real marketing operations, connected to real data."

---

## SCENE 7: CALL TO ACTION (6:30 - 7:00)

### Visual
- Terminal showing installation command
- Website URL

### Narration
> "ClaudeKit Marketing. 32 agents. 119 commands. One system that replaces your entire marketing stack."

### Demo Action
```bash
# Installation
ck new --kit marketing

# Or manual
git clone https://github.com/claudekit/claudekit-marketing .claude
```

### Narration (continued)
> "Get started in 30 seconds. One command, and you have a complete AI marketing team."
>
> "ClaudeKit Marketing - available now at claudekit.cc"

### On-Screen Text
```
claudekit.cc

ck new --kit marketing

$99 standalone | $149 with Engineer Kit
```

---

## B-ROLL SUGGESTIONS

| Timestamp | B-Roll |
|-----------|--------|
| 0:00-0:30 | Quick cuts of marketing tool dashboards, frustrated marketer |
| 0:30-2:00 | Funnel diagram animation, agent icons flowing |
| 2:00-3:00 | Terminal typing, command autocomplete |
| 3:00-4:30 | Dashboard UI, mouse clicks, drag operations |
| 4:30-5:30 | Markdown file, hook execution, before/after content |
| 5:30-6:30 | Integration logos, real analytics dashboards |
| 6:30-7:00 | Installation, website, pricing |

---

## KEY MESSAGES TO EMPHASIZE

1. **Replacement, not addition** - "Replace 10 tools with 1 system"
2. **Real orchestration** - "Agents hand off work like a real team"
3. **Instant productivity** - "Type a command, get results"
4. **Visual option** - "Dashboard for non-technical users"
5. **Brand automation** - "Every output matches your brand, automatically"
6. **Real connections** - "Connected to your actual marketing data"

---

## RECORDING NOTES

- **Screen resolution:** 1920x1080 minimum, 4K preferred
- **Terminal font size:** 18px+ for readability
- **Pause after commands:** 2 seconds to show output
- **Dashboard clicks:** Slow, deliberate mouse movements
- **Voiceover pace:** Moderate, clear enunciation
- **Background music:** Upbeat but not distracting

---

*Script version: 1.0*
*Last updated: 2026-01-06*
