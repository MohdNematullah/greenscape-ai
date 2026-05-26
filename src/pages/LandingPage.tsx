import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Leaf,
  Zap,
  Clock,
  Users,
  FileText,
  DollarSign,
  CheckSquare,
  MessageSquare,
  ArrowRight,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Star,
  ChevronRight,
  Timer,
  BarChart3,
  Sparkles,
} from "lucide-react";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 font-sans overflow-x-hidden">

      {/* ─── NAV ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-100 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-green-600 flex items-center justify-center shrink-0">
              <Leaf className="size-4 text-white" />
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tight whitespace-nowrap">Greenscape AI</span>
          </div>
          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="text-zinc-600 dark:text-zinc-400">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
              <Link to="/signup">Get Started Free <ArrowRight className="size-3.5 ml-1.5" /></Link>
            </Button>
          </div>
          {/* Mobile nav */}
          <div className="flex sm:hidden items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="text-zinc-600 dark:text-zinc-400 px-2 text-xs">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="bg-green-600 hover:bg-green-700 text-white shadow-sm px-3 text-xs">
              <Link to="/signup">Start Free <ArrowRight className="size-3 ml-1" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative pt-14 sm:pt-16 overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-50 via-emerald-50/60 to-white dark:from-green-950/40 dark:via-zinc-950 dark:to-zinc-950" />
        {/* Radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[400px] sm:h-[500px] bg-green-400/10 dark:bg-green-500/10 rounded-full blur-3xl" />
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(#000 1px, transparent 1px), linear-gradient(to right, #000 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-14 sm:pb-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-green-100 dark:bg-green-900/50 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 text-xs sm:text-sm font-medium mb-6 sm:mb-8">
              <Sparkles className="size-3.5 shrink-0" />
              <span>Built exclusively for Greenscape · Phoenix, AZ</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-5 sm:mb-6">
              Close{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-500 to-green-500">
                  more deals
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full opacity-60" />
              </span>
              {" "}in less time.{" "}
              <br className="hidden sm:block" />
              Every day.
            </h1>

            <p className="text-lg sm:text-xl lg:text-2xl text-zinc-600 dark:text-zinc-400 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed font-light px-2">
              AI-powered OS built for Greenscape that cuts your quote cycle from{" "}
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">6 days to 1</span>,
              eliminates post-sign chaos, and turns every client into a referral machine.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 px-4 sm:px-0">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto text-base px-8 py-6 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all"
              >
                <Link to="/signup">
                  Start for free <ArrowRight className="size-5 ml-2" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-base px-8 py-6 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <Link to="/login">Sign in to your account</Link>
              </Button>
            </div>

            {/* Live Stats Bar */}
            <div className="inline-flex flex-wrap justify-center gap-x-6 sm:gap-x-10 gap-y-4 px-5 sm:px-8 py-4 sm:py-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm">
              {[
                { value: "150+", label: "Projects / Year", color: "text-green-600" },
                { value: "$28K", label: "Avg Contract", color: "text-emerald-600" },
                { value: "$4.2M", label: "Annual Revenue", color: "text-teal-600" },
                { value: "38%", label: "Gross Margin", color: "text-green-700" },
              ].map((s) => (
                <div key={s.label} className="text-center min-w-[70px]">
                  <div className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUST BAR ─── */}
      <section className="border-y border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 py-4 sm:py-5">
        {/* Desktop: single row */}
        <div className="hidden sm:flex max-w-6xl mx-auto px-6 items-center justify-center gap-x-3 text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
          <div className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-green-500" />Real-time Convex database</div>
          <span className="text-zinc-300 dark:text-zinc-600">•</span>
          <div className="flex items-center gap-1.5"><Shield className="size-4 text-green-500" />Email-secured login</div>
          <span className="text-zinc-300 dark:text-zinc-600">•</span>
          <div className="flex items-center gap-1.5"><Zap className="size-4 text-green-500" />AI proposals in 60 seconds</div>
          <span className="text-zinc-300 dark:text-zinc-600">•</span>
          <div className="flex items-center gap-1.5"><Timer className="size-4 text-green-500" />Quote target: 1–2 days</div>
          <span className="text-zinc-300 dark:text-zinc-600">•</span>
          <div className="flex items-center gap-1.5"><Star className="size-4 text-green-500" />Built from 2 discovery sessions</div>
        </div>
        {/* Mobile: wrapped grid */}
        <div className="flex sm:hidden flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 text-xs text-zinc-500 dark:text-zinc-400">
          {[
            { icon: CheckCircle2, text: "Real-time database" },
            { icon: Shield, text: "Secured login" },
            { icon: Zap, text: "AI proposals in 60s" },
            { icon: Timer, text: "Quotes in 1–2 days" },
            { icon: Star, text: "2 discovery sessions" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-1">
              <item.icon className="size-3.5 text-green-500 shrink-0" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PROBLEM ─── */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-semibold uppercase tracking-wide mb-5">
            <AlertTriangle className="size-3.5" />
            The problem
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">You're leaving revenue on the table.</h2>
          <p className="text-base sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto px-2">4 bottlenecks costing Greenscape $1M+ in lost revenue every year.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
          {[
            {
              icon: Clock,
              tag: "Priority #1",
              problem: "6–9 day quote cycle",
              stat: "35–40% of leads lost to faster competitors",
              detail:
                "Qualified leads call 3 companies. The first to quote wins. Your best leads — $28K avg — are walking to whoever responds first.",
              loss: "$1M+/yr exposure",
            },
            {
              icon: Users,
              tag: "Priority #2",
              problem: "Post-sign limbo",
              stat: "8–12 projects stuck at any given time",
              detail:
                "Anna's manually chasing HOA docs, permits, and design sign-offs. Each delay costs cash flow and client confidence.",
              loss: "$224K–$336K delayed",
            },
            {
              icon: CheckSquare,
              tag: "Priority #3",
              problem: "5–10 daily approval pings",
              stat: "Owner interrupted every 45 minutes",
              detail:
                "Change orders, refunds, add-on pricing — without a rule book, the owner becomes the bottleneck on every small decision.",
              loss: "2–3 hrs/day lost",
            },
            {
              icon: MessageSquare,
              tag: "Priority #4",
              problem: "Only 30% get project updates",
              stat: "Referral rate suppressed by silence",
              detail:
                "Clients who get proactive updates refer neighbors. The other 70% go dark, wonder what's happening, and don't recommend you.",
              loss: "$784K closed-lost pipeline",
            },
          ].map((item) => (
            <div
              key={item.problem}
              className="group p-5 sm:p-7 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-red-100 dark:hover:border-red-900/50 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="size-9 sm:size-10 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                  <item.icon className="size-4 sm:size-5 text-red-500" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-red-400 dark:text-red-500 uppercase tracking-wide">{item.tag}</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-1 text-zinc-900 dark:text-zinc-100 capitalize">{item.problem}</h3>
              <p className="text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 mb-2 sm:mb-3">{item.stat}</p>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3 sm:mb-4">{item.detail}</p>
              <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-[10px] sm:text-xs font-semibold">
                <AlertTriangle className="size-3" />
                {item.loss}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SOLUTION ─── */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900/50 dark:to-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 dark:bg-green-950/40 border border-green-100 dark:border-green-900 text-green-600 dark:text-green-400 text-xs font-semibold uppercase tracking-wide mb-5">
              <CheckCircle2 className="size-3.5" />
              The solution
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              One OS. Every bottleneck solved.
            </h2>
            <p className="text-base sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto px-2">Every workflow on rails — you just review and approve.</p>
          </div>

          {/* Solution pairs — problem left, solution right */}
          <div className="space-y-4 sm:space-y-5 max-w-5xl mx-auto">
            {[
              {
                before: { label: "Before", heading: "6-day quote scramble", icon: Clock, desc: "Call the lead, schedule a site walk, dictate notes, build a proposal from scratch. Days pass." },
                after: { label: "After", heading: "AI proposal in 60 seconds", icon: Zap, desc: "Site walk notes → AI generates full scope with 55+ Phoenix pricing items. Review, approve, send. Same day." },
                win: "Save 35–40% of $28K leads",
              },
              {
                before: { label: "Before", heading: "Post-sign chaos", icon: AlertTriangle, desc: "Texts, emails, calls — chasing HOA docs, permits, crew schedules. Projects sit for 4–6 weeks." },
                after: { label: "After", heading: "Auto-advancing checklist", icon: CheckSquare, desc: "Deposit → HOA → Permits → Design sign-off → Crew scheduled. Every step tracked, overdue alerts fire at 14 days." },
                win: "Cut 4–6 week delays to 2",
              },
              {
                before: { label: "Before", heading: "Owner = bottleneck", icon: Users, desc: "The team pings you 5–10 times a day for change orders, refunds, pricing add-ons. No rule book, no system." },
                after: { label: "After", heading: "Structured approval queue", icon: Shield, desc: "Team submits a change order or add-on with all context. One-tap approve or deny. Done." },
                win: "2–3 hrs/day back",
              },
              {
                before: { label: "Before", heading: "Silent client syndrome", icon: MessageSquare, desc: "Only 30% get a Loom update. The other 70% are wondering what's happening and not referring anyone." },
                after: { label: "After", heading: "AI-powered personal updates", icon: TrendingUp, desc: "Welcome, progress, halfway, completion — AI writes each update in a warm, personal tone. Copy, send, earn referrals." },
                win: "2–3x referral rate",
              },
            ].map((pair, i) => (
              <div key={i} className="grid md:grid-cols-2 gap-3">
                {/* Before */}
                <div className="p-4 sm:p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 opacity-80">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <span className="px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-400 uppercase tracking-wide">{pair.before.label}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="size-8 sm:size-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                      <pair.before.icon className="size-4 text-zinc-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm sm:text-base text-zinc-700 dark:text-zinc-300 mb-1">{pair.before.heading}</p>
                      <p className="text-xs sm:text-sm text-zinc-400 dark:text-zinc-500 leading-relaxed">{pair.before.desc}</p>
                    </div>
                  </div>
                </div>
                {/* After */}
                <div className="p-4 sm:p-6 rounded-2xl border border-green-100 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/20 relative">
                  <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400 uppercase tracking-wide">{pair.after.label}</span>
                    <div className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-green-600 text-white text-[10px] sm:text-xs font-bold">{pair.win}</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="size-8 sm:size-9 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center shrink-0 mt-0.5">
                      <pair.after.icon className="size-4 text-green-700 dark:text-green-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 mb-1">{pair.after.heading}</p>
                      <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{pair.after.desc}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID ─── */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">Every module. Built for Greenscape.</h2>
          <p className="text-base sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto px-2">6 tools pre-loaded with Phoenix-market pricing and your exact workflows.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[
            {
              icon: Zap,
              title: "AI Lead Qualification",
              desc: "Auto-scores every inbound lead: budget $8K+, homeowner status, project scope. Save 4–6 unqualified calls/week.",
              badge: "Saves 3 hrs/wk",
              color: "bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400",
              border: "hover:border-violet-100 dark:hover:border-violet-900",
            },
            {
              icon: FileText,
              title: "AI Proposal Generator",
              desc: "Site walk notes become a full-scope proposal with line items in 60 seconds. 55+ real Phoenix-market pricing items, 10 categories.",
              badge: "6 days → same day",
              color: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
              border: "hover:border-blue-100 dark:hover:border-blue-900",
            },
            {
              icon: DollarSign,
              title: "Pricing Database",
              desc: "55 line items across hardscape, fire features, water features, outdoor kitchens, artificial turf, and more — at real market rates.",
              badge: "Always up to date",
              color: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
              border: "hover:border-amber-100 dark:hover:border-amber-900",
            },
            {
              icon: CheckSquare,
              title: "Post-Sign Checklist",
              desc: "9-step checklist: deposit → HOA → permits → design sign-off → crew assigned. Auto-advances phases, fires alerts at 14 days overdue.",
              badge: "4 weeks → 2 weeks",
              color: "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400",
              border: "hover:border-green-100 dark:hover:border-green-900",
            },
            {
              icon: Shield,
              title: "Approval Queue",
              desc: "Team submits change orders, add-ons, refunds with full context and urgency level. One-tap approve/deny with notes. No more pings.",
              badge: "Cuts 5–10 daily pings",
              color: "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400",
              border: "hover:border-rose-100 dark:hover:border-rose-900",
            },
            {
              icon: MessageSquare,
              title: "Client Update Engine",
              desc: "AI writes warm, personal updates for every milestone: welcome, progress, halfway, delay, completion. Copy, paste, send, earn referrals.",
              badge: "2–3x more referrals",
              color: "bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400",
              border: "hover:border-teal-100 dark:hover:border-teal-900",
            },
          ].map((f) => (
            <div
              key={f.title}
              className={`group p-5 sm:p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 ${f.border} hover:shadow-md transition-all`}
            >
              <div className="flex items-start justify-between mb-4 sm:mb-5 gap-2">
                <div className={`size-9 sm:size-10 rounded-xl ${f.color.split(" ").slice(0, 2).join(" ")} flex items-center justify-center shrink-0`}>
                  <f.icon className={`size-4 sm:size-5 ${f.color.split(" ").slice(2).join(" ")}`} />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-green-100 dark:border-green-900 whitespace-nowrap">
                  {f.badge}
                </span>
              </div>
              <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 mb-2">{f.title}</h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── ROI SECTION ─── */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-green-900 via-emerald-900 to-green-800 text-white relative overflow-hidden">
        {/* Decorative blur */}
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-green-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-emerald-400/10 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-green-200 text-xs font-semibold uppercase tracking-wide mb-5">
              <BarChart3 className="size-3.5" />
              The ROI
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 px-2">What fixing these 4 bottlenecks is worth</h2>
            <p className="text-green-200 text-base sm:text-lg">Conservative estimates based on your actual numbers</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-12">
            {[
              { metric: "$392K+", label: "Recovered from lead losses", sub: "Saving just 25% of lost leads" },
              { metric: "$280K", label: "Unlocked from post-sign limbo", sub: "10 projects × $28K, 2wks faster" },
              { metric: "$784K", label: "Closed-lost reactivation", sub: "1,400 leads × 2% re-close rate" },
              { metric: "38%", label: "Margin protected", sub: "No more discount-close pressure" },
            ].map((r) => (
              <div key={r.label} className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm text-center">
                <div className="text-xl sm:text-3xl font-extrabold text-white mb-1">{r.metric}</div>
                <div className="text-[10px] sm:text-sm font-semibold text-green-200 mb-1 leading-tight">{r.label}</div>
                <div className="text-[9px] sm:text-xs text-green-300/70 leading-tight">{r.sub}</div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-green-100 mb-6 sm:mb-8 text-base sm:text-lg font-light max-w-xl mx-auto px-4">
              "I just want stuff that runs and I can look at it and approve things." — Greenscape Owner
            </p>
            <Button
              asChild
              size="lg"
              className="bg-white text-green-800 hover:bg-green-50 font-bold text-sm sm:text-base px-8 sm:px-10 py-5 sm:py-6 shadow-lg shadow-green-900/30"
            >
              <Link to="/signup">
                Launch Greenscape AI <ChevronRight className="size-5 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-16 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">From chaos to clarity in 3 steps</h2>
          <p className="text-base sm:text-lg text-zinc-500 dark:text-zinc-400">No migration, no training, no nonsense.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-8 sm:gap-8">
          {[
            {
              step: "01",
              title: "Sign up & seed data",
              desc: "Create your account. Your 55-item Phoenix pricing database is pre-loaded. Add your first lead in under 2 minutes.",
              icon: ArrowRight,
            },
            {
              step: "02",
              title: "Run your first site walk",
              desc: "Take notes on your phone. Paste them into the AI Proposal Generator. Review the full scope with line items. Send same day.",
              icon: FileText,
            },
            {
              step: "03",
              title: "Watch the system run",
              desc: "Projects advance automatically. Approvals queue up for one-tap decisions. Updates go out in your voice. You just review.",
              icon: CheckCircle2,
            },
          ].map((step) => (
            <div key={step.step} className="text-center">
              <div className="text-5xl sm:text-6xl font-black text-zinc-100 dark:text-zinc-800 mb-3 sm:mb-4 leading-none">{step.step}</div>
              <div className="size-11 sm:size-12 rounded-2xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <step.icon className="size-5 text-green-700 dark:text-green-400" />
              </div>
              <h3 className="font-bold text-base sm:text-lg mb-2">{step.title}</h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center px-5 sm:px-8 py-12 sm:py-16 rounded-3xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 border border-green-100 dark:border-green-900 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-green-300/20 rounded-full blur-3xl" />
          <div className="relative">
            <div className="size-14 sm:size-16 rounded-2xl bg-green-600 flex items-center justify-center mx-auto mb-5 sm:mb-6 shadow-lg shadow-green-500/30">
              <Leaf className="size-7 sm:size-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-4 px-2">
              Stop losing $1M/year to slow systems
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg mb-6 sm:mb-8 max-w-xl mx-auto px-2">
              Greenscape AI is ready. Your pricing is loaded. The workflows match how you already run jobs.
              Sign up and run your first AI proposal today.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base px-8 sm:px-10 py-5 sm:py-6 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all"
            >
              <Link to="/signup">
                Start for free <ArrowRight className="size-5 ml-2" />
              </Link>
            </Button>
            <p className="text-xs sm:text-sm text-zinc-400 dark:text-zinc-500 mt-4 sm:mt-5">
              No credit card. No setup fee. Just sign up and go.
            </p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-zinc-100 dark:border-zinc-800 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center gap-4 text-sm text-zinc-400">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-green-600 flex items-center justify-center">
              <Leaf className="size-3.5 text-white" />
            </div>
            <span className="font-semibold text-zinc-600 dark:text-zinc-400">Greenscape AI</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-zinc-400 dark:text-zinc-500">
            <span>Built for Greenscape · Phoenix, AZ</span>
            <span className="hidden sm:inline">·</span>
            <Link to="/login" className="hover:text-green-600 transition-colors">Sign In</Link>
            <Link to="/signup" className="hover:text-green-600 transition-colors">Get Started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
