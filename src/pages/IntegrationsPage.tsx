/**
 * Integrations Page — GHL, Slack, and Email setup + Slack notification center.
 * Renders even if the Convex query hasn't loaded yet (graceful loading).
 */
import { useQuery, useAction } from "convex/react";
import { useState } from "react";
import {
  Plug,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Zap,
  Bell,
  Mail,
  Users,
  ArrowDownToLine,
  ArrowUpFromLine,
  Copy,
  Info,
  Hash,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ configured }: { configured: boolean }) {
  return configured ? (
    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-900">
      <CheckCircle2 className="size-3.5" /> Connected
    </span>
  ) : (
    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
      <XCircle className="size-3.5" /> Not configured
    </span>
  );
}

// ─── Env Var Row ──────────────────────────────────────────────────────────────

function EnvRow({ name, isSet, hint }: { name: string; isSet: boolean; hint: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-zinc-800 last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded shrink-0">{name}</code>
        <span className="text-xs text-muted-foreground truncate">{hint}</span>
      </div>
      {isSet ? (
        <span className="flex items-center gap-1 text-xs text-green-600 font-medium shrink-0"><CheckCircle2 className="size-3.5" /> Set</span>
      ) : (
        <span className="flex items-center gap-1 text-xs text-amber-600 font-medium shrink-0"><XCircle className="size-3.5" /> Missing</span>
      )}
    </div>
  );
}

// ─── Step ─────────────────────────────────────────────────────────────────────

function Step({ n, text, code }: { n: number; text: string; code?: string }) {
  return (
    <div className="flex gap-3">
      <span className="size-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
        {n}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 dark:text-gray-300">{text}</p>
        {code && (
          <div className="mt-1.5 flex items-center gap-2">
            <code className="text-xs bg-gray-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg font-mono break-all flex-1">{code}</code>
            <Button size="sm" variant="ghost" className="h-7 px-2 shrink-0"
              onClick={() => { navigator.clipboard.writeText(code); toast.success("Copied!"); }}>
              <Copy className="size-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Slack Notification Events ────────────────────────────────────────────────

const SLACK_EVENTS = [
  { emoji: "🟢", label: "New Qualified Lead", desc: "Instant alert when a lead scores 70+ with name, source, budget, and recommended action" },
  { emoji: "📋", label: "Proposal Approved", desc: "Notify team when owner approves a proposal — ready to send to client" },
  { emoji: "🎉", label: "Proposal Signed", desc: "Celebration alert when client signs — triggers project onboarding" },
  { emoji: "⚠️", label: "Approval Request", desc: "Change orders, add-ons, refunds — with urgency level and amount" },
  { emoji: "🏗️", label: "Project Milestone", desc: "Deposit paid, HOA approved, crew scheduled, work started, completed" },
  { emoji: "☀️", label: "Daily Pipeline Digest", desc: "Morning brief with new leads, open proposals, active projects, pending approvals" },
  { emoji: "🔄", label: "GHL Sync Complete", desc: "Confirmation when contacts are imported from GoHighLevel" },
  { emoji: "📧", label: "Email Sent", desc: "Confirmation when customer update email is delivered" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export function IntegrationsPage() {
  // Wrap query in try-catch behavior — if it fails, we still render
  let status: { ghl: { configured: boolean; hasApiKey: boolean; hasLocationId: boolean; hasPipelineId: boolean }; slack: { configured: boolean; hasWebhook: boolean }; email: { configured: boolean; hasApiKey: boolean; hasFromEmail: boolean } } | undefined;
  try {
    status = useQuery(api.integrations.getIntegrationStatus, {});
  } catch {
    // Query not available — page still renders
  }

  let testSlack: ((args: Record<string, never>) => Promise<boolean>) | null = null;
  let testGHL: ((args: Record<string, never>) => Promise<{ success: boolean; message: string }>) | null = null;
  let importGHL: ((args: { limit?: number }) => Promise<{ success: boolean; imported: number; skipped: number; error?: string }>) | null = null;
  let pushDigest: ((args: { newLeads: number; qualifiedLeads: number; openProposals: number; activeProjects: number; pendingApprovals: number; pipelineValue?: number; todayDate: string }) => Promise<boolean>) | null = null;

  try { testSlack = useAction(api.integrations.testSlackConnection); } catch { /* skip */ }
  try { testGHL = useAction(api.integrations.testGHLConnection); } catch { /* skip */ }
  try { importGHL = useAction(api.integrations.importGHLContacts); } catch { /* skip */ }
  try { pushDigest = useAction(api.integrations.sendDailyDigest); } catch { /* skip */ }

  const [testingSlack, setTestingSlack] = useState(false);
  const [testingGHL, setTestingGHL] = useState(false);
  const [importing, setImporting] = useState(false);
  const [sendingDigest, setSendingDigest] = useState(false);

  const handleTestSlack = async () => {
    if (!testSlack) return;
    setTestingSlack(true);
    try {
      const ok = await testSlack({});
      if (ok) toast.success("Slack notification sent! Check your channel.");
      else toast.error("Slack test failed — check SLACK_WEBHOOK_URL");
    } catch { toast.error("Test failed"); } finally { setTestingSlack(false); }
  };

  const handleTestGHL = async () => {
    if (!testGHL) return;
    setTestingGHL(true);
    try {
      const result = await testGHL({});
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    } catch { toast.error("Test failed"); } finally { setTestingGHL(false); }
  };

  const handleImportGHL = async () => {
    if (!importGHL) return;
    setImporting(true);
    try {
      const result = await importGHL({ limit: 50 });
      if (result.success) toast.success(`Imported ${result.imported} contacts`, { description: `${result.skipped} duplicates skipped` });
      else toast.error(result.error || "Import failed");
    } catch { toast.error("Import failed"); } finally { setImporting(false); }
  };

  const handleSendDigest = async () => {
    if (!pushDigest) return;
    setSendingDigest(true);
    try {
      const today = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/Phoenix" });
      const ok = await pushDigest({ newLeads: 3, qualifiedLeads: 2, openProposals: 4, activeProjects: 7, pendingApprovals: 1, pipelineValue: 186000, todayDate: today });
      if (ok) toast.success("Daily digest sent to Slack!");
      else toast.error("Digest send failed");
    } catch { toast.error("Failed"); } finally { setSendingDigest(false); }
  };

  const webhookUrl = "https://proficient-canary-549.convex.site/api/ghl/webhook";
  const ghlOk = status?.ghl.configured ?? false;
  const slackOk = status?.slack.configured ?? false;
  const emailOk = status?.email.configured ?? false;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <Plug className="size-6" />
            <h1 className="text-3xl font-bold">Integrations</h1>
          </div>
          <p className="text-violet-100 text-lg max-w-xl">
            Connect GoHighLevel, Slack, and Email to power your central command center.
          </p>
          <div className="flex gap-3 mt-4 flex-wrap">
            {[
              { label: "GHL", ok: ghlOk },
              { label: "Slack", ok: slackOk },
              { label: "Email", ok: emailOk },
            ].map(({ label, ok }) => (
              <span key={label} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border ${ok ? "bg-white/20 border-white/30 text-white" : "bg-black/20 border-white/20 text-white/60"}`}>
                {ok ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />} {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── GHL Card ──────────────────────────────────────────────── */}
        <Card className="border-0 shadow-md bg-white dark:bg-zinc-900">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-sm">
                  <Zap className="size-5 text-white" />
                </div>
                <div>
                  <div className="text-lg">GoHighLevel CRM</div>
                  <div className="text-xs text-muted-foreground font-normal">Contacts, Pipeline, Calendar</div>
                </div>
              </CardTitle>
              <StatusBadge configured={ghlOk} />
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border bg-muted/20 p-3 space-y-0.5">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Environment Variables</p>
              <EnvRow name="GHL_API_KEY" isSet={status?.ghl.hasApiKey ?? false} hint="API key from GHL settings" />
              <EnvRow name="GHL_LOCATION_ID" isSet={status?.ghl.hasLocationId ?? false} hint="Your sub-account/location ID" />
              <EnvRow name="GHL_PIPELINE_ID" isSet={status?.ghl.hasPipelineId ?? false} hint="(Optional) Sales pipeline ID" />
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"><Info className="size-3.5" /> Setup</p>
              <Step n={1} text='Go to GHL → Settings → API Keys → Create key with "Contacts + Opportunities" permissions' />
              <Step n={2} text="Add the API key to your Vercel environment variables as GHL_API_KEY" />
              <Step n={3} text="Find Location ID in GHL → Settings → Business Info" />
              <Step n={4} text="Add webhook URL in GHL → Settings → Webhooks" code={webhookUrl} />
            </div>
            <div className="rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 p-3">
              <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-2">What this unlocks:</p>
              <ul className="space-y-1 text-xs text-orange-800 dark:text-orange-300">
                <li className="flex items-center gap-1.5"><ArrowDownToLine className="size-3 shrink-0" /> GHL contacts auto-import as leads</li>
                <li className="flex items-center gap-1.5"><ArrowUpFromLine className="size-3 shrink-0" /> Qualified leads push back to GHL</li>
                <li className="flex items-center gap-1.5"><Zap className="size-3 shrink-0" /> Proposals create GHL opportunities</li>
                <li className="flex items-center gap-1.5"><Users className="size-3 shrink-0" /> Both systems stay in sync</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleTestGHL} disabled={testingGHL || !ghlOk} variant="outline" size="sm" className="flex-1 border-orange-200 text-orange-700">
                {testingGHL ? <><RefreshCw className="size-4 mr-1 animate-spin" />Testing...</> : "Test Connection"}
              </Button>
              <Button onClick={handleImportGHL} disabled={importing || !ghlOk} size="sm" className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                {importing ? <><RefreshCw className="size-4 mr-1 animate-spin" />Importing...</> : <><ArrowDownToLine className="size-4 mr-1" />Import Contacts</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Slack Card ────────────────────────────────────────────── */}
        <Card className="border-0 shadow-md bg-white dark:bg-zinc-900">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-sm">
                  <Bell className="size-5 text-white" />
                </div>
                <div>
                  <div className="text-lg">Slack Notifications</div>
                  <div className="text-xs text-muted-foreground font-normal">Real-time team alerts</div>
                </div>
              </CardTitle>
              <StatusBadge configured={slackOk} />
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border bg-muted/20 p-3 space-y-0.5">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Environment Variables</p>
              <EnvRow name="SLACK_WEBHOOK_URL" isSet={status?.slack.hasWebhook ?? false} hint="Incoming webhook URL from Slack" />
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"><Info className="size-3.5" /> Setup</p>
              <Step n={1} text="Go to api.slack.com/apps → Create New App → From Scratch" />
              <Step n={2} text='Name it "Greenscape AI", select your workspace' />
              <Step n={3} text='"Incoming Webhooks" → Activate → "Add New Webhook to Workspace"' />
              <Step n={4} text="Select your channel → Allow → Copy the Webhook URL" />
              <Step n={5} text="Add as SLACK_WEBHOOK_URL in Vercel env vars" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleTestSlack} disabled={testingSlack || !slackOk} variant="outline" size="sm" className="flex-1 border-purple-200 text-purple-700">
                {testingSlack ? <><RefreshCw className="size-4 mr-1 animate-spin" />Testing...</> : "Send Test Message"}
              </Button>
              <Button onClick={handleSendDigest} disabled={sendingDigest || !slackOk} size="sm" className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 text-white">
                {sendingDigest ? <><RefreshCw className="size-4 mr-1 animate-spin" />Sending...</> : <><Bell className="size-4 mr-1" />Send Digest</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Email Card ────────────────────────────────────────────── */}
        <Card className="border-0 shadow-md bg-white dark:bg-zinc-900">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-sm">
                  <Mail className="size-5 text-white" />
                </div>
                <div>
                  <div className="text-lg">Email (Resend)</div>
                  <div className="text-xs text-muted-foreground font-normal">Branded customer emails</div>
                </div>
              </CardTitle>
              <StatusBadge configured={emailOk} />
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border bg-muted/20 p-3 space-y-0.5">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Environment Variables</p>
              <EnvRow name="RESEND_API_KEY" isSet={status?.email.hasApiKey ?? false} hint="API key from resend.com" />
              <EnvRow name="FROM_EMAIL" isSet={status?.email.hasFromEmail ?? false} hint="e.g. updates@greenscape.com" />
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"><Info className="size-3.5" /> Setup</p>
              <Step n={1} text="Sign up at resend.com (free: 3,000 emails/month)" />
              <Step n={2} text="Create an API key with Send access" />
              <Step n={3} text="Add your sending domain or use their test domain" />
              <Step n={4} text="Add RESEND_API_KEY + FROM_EMAIL to Vercel env vars" />
            </div>
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-3">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">What this unlocks:</p>
              <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-300">
                <li className="flex items-center gap-1.5">📧 Branded HTML emails to clients</li>
                <li className="flex items-center gap-1.5">🔨 Progress and milestone update emails</li>
                <li className="flex items-center gap-1.5">📋 Send proposals directly via email</li>
                <li className="flex items-center gap-1.5">💼 Professional Greenscape branding</li>
              </ul>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full border-blue-200 text-blue-700">
              <a href="https://resend.com/signup" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4 mr-1.5" /> Create Free Resend Account
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* ── Webhook Info Card ─────────────────────────────────────── */}
        <Card className="border-0 shadow-md bg-white dark:bg-zinc-900">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-gradient-to-br from-gray-500 to-slate-600 flex items-center justify-center shadow-sm">
                <ExternalLink className="size-5 text-white" />
              </div>
              <div>
                <div className="text-lg">Webhook Endpoints</div>
                <div className="text-xs text-muted-foreground font-normal">Public URLs for external services</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">GHL → Greenscape AI</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-3 py-2 rounded-lg font-mono break-all flex-1 text-green-700 dark:text-green-400">{webhookUrl}</code>
                <Button size="sm" variant="ghost" className="h-8 px-2 shrink-0"
                  onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success("Copied!"); }}>
                  <Copy className="size-3.5" />
                </Button>
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-zinc-800/50 border p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">All Env Vars (add to Vercel)</p>
              {[
                { key: "GHL_API_KEY", hint: "From GHL → Settings → API Keys" },
                { key: "GHL_LOCATION_ID", hint: "Your GHL sub-account ID" },
                { key: "SLACK_WEBHOOK_URL", hint: "From api.slack.com → Webhooks" },
                { key: "RESEND_API_KEY", hint: "From resend.com → API Keys" },
                { key: "FROM_EMAIL", hint: "e.g. updates@greenscape.com" },
              ].map(({ key, hint }) => (
                <div key={key} className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-white dark:bg-zinc-900 border px-2 py-1 rounded">{key}</code>
                  <span className="text-xs text-muted-foreground">{hint}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Slack Notification Center (Full Width) ─────────────────── */}
      <Card className="border-0 shadow-md bg-white dark:bg-zinc-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-sm">
              <Hash className="size-5 text-white" />
            </div>
            <div>
              <div className="text-lg">Slack Notification Center</div>
              <div className="text-xs text-muted-foreground font-normal">
                All team notifications sent to your Slack channel
              </div>
            </div>
            {slackOk ? (
              <span className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                <CheckCircle2 className="size-3.5" /> Active
              </span>
            ) : (
              <span className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                <XCircle className="size-3.5" /> Set up Slack first
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SLACK_EVENTS.map((evt) => (
              <div key={evt.label}
                className={`rounded-xl border p-4 transition-all ${slackOk ? "bg-gradient-to-br from-white to-purple-50/30 dark:from-zinc-800 dark:to-purple-950/10 border-purple-100 dark:border-purple-900/30" : "bg-muted/30 opacity-60"}`}>
                <div className="flex items-start gap-2.5">
                  <span className="text-xl mt-0.5">{evt.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{evt.label}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{evt.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {slackOk && (
            <div className="flex gap-3 mt-4 pt-4 border-t">
              <Button onClick={handleTestSlack} disabled={testingSlack} variant="outline" size="sm" className="border-purple-200 text-purple-700">
                {testingSlack ? <><RefreshCw className="size-4 mr-1 animate-spin" /> Testing...</> : <><Send className="size-4 mr-1" /> Send Test Notification</>}
              </Button>
              <Button onClick={handleSendDigest} disabled={sendingDigest} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                {sendingDigest ? <><RefreshCw className="size-4 mr-1 animate-spin" /> Sending...</> : <><Bell className="size-4 mr-1" /> Send Sample Digest</>}
              </Button>
            </div>
          )}
          {!slackOk && (
            <p className="text-sm text-muted-foreground mt-4 pt-4 border-t text-center">
              Add <code className="bg-muted px-1.5 py-0.5 rounded text-xs">SLACK_WEBHOOK_URL</code> to your Vercel environment variables to activate all team notifications.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
