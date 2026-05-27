/**
 * Integrations Page — Configure GHL, Slack, and Email integrations.
 * Shows connection status, setup instructions, and action buttons.
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
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ configured }: { configured: boolean }) {
  return configured ? (
    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 dark:from-green-950/40 dark:to-emerald-950/40 dark:text-green-400 border border-green-200 dark:border-green-900">
      <CheckCircle2 className="size-3.5" /> Connected
    </span>
  ) : (
    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 dark:from-gray-800 dark:to-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
      <XCircle className="size-3.5" /> Not configured
    </span>
  );
}

// ─── Env Var Row ──────────────────────────────────────────────────────────────

function EnvRow({ name, set, description }: { name: string; set: boolean; description: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-zinc-800 last:border-0">
      <div className="flex items-center gap-2">
        <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-foreground">{name}</code>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      {set ? (
        <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle2 className="size-3.5" />Set</span>
      ) : (
        <span className="flex items-center gap-1 text-xs text-amber-600 font-medium"><XCircle className="size-3.5" />Missing</span>
      )}
    </div>
  );
}

// ─── Step Instruction ─────────────────────────────────────────────────────────

function Step({ n, text, code }: { n: number; text: string; code?: string }) {
  const copyCode = () => {
    if (code) { navigator.clipboard.writeText(code); toast.success("Copied!"); }
  };
  return (
    <div className="flex gap-3">
      <span className="size-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
        {n}
      </span>
      <div className="flex-1">
        <p className="text-sm text-gray-700 dark:text-gray-300">{text}</p>
        {code && (
          <div className="mt-1.5 flex items-center gap-2">
            <code className="text-xs bg-gray-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg font-mono text-gray-800 dark:text-gray-300 flex-1 break-all">
              {code}
            </code>
            <Button size="sm" variant="ghost" className="h-7 px-2 shrink-0" onClick={copyCode}>
              <Copy className="size-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function IntegrationsPage() {
  const status = useQuery(api.ghl.getIntegrationStatus, {});
  const testSlack = useAction(api.integrations.testSlackConnection);
  const testGHL = useAction(api.ghl.testConnection);
  const importGHL = useAction(api.ghl.importGHLContacts);
  const pushTest = useAction(api.integrations.sendDailyDigest);

  const [testingSlack, setTestingSlack] = useState(false);
  const [testingGHL, setTestingGHL] = useState(false);
  const [importing, setImporting] = useState(false);
  const [sendingDigest, setSendingDigest] = useState(false);

  const handleTestSlack = async () => {
    setTestingSlack(true);
    try {
      const ok = await testSlack({});
      if (ok) toast.success("✅ Slack notification sent! Check your channel.");
      else toast.error("Slack test failed — check SLACK_WEBHOOK_URL");
    } catch { toast.error("Test failed"); } finally { setTestingSlack(false); }
  };

  const handleTestGHL = async () => {
    setTestingGHL(true);
    try {
      const result = await testGHL({});
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    } catch { toast.error("Test failed"); } finally { setTestingGHL(false); }
  };

  const handleImportGHL = async () => {
    setImporting(true);
    try {
      const result = await importGHL({ limit: 50 });
      if (result.success) {
        toast.success(`Imported ${result.imported} contacts`, {
          description: `${result.skipped} duplicates skipped`,
        });
      } else {
        toast.error(result.error || "Import failed");
      }
    } catch { toast.error("Import failed"); } finally { setImporting(false); }
  };

  const handleSendDigest = async () => {
    setSendingDigest(true);
    try {
      const today = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/Phoenix" });
      const ok = await pushTest({ newLeads: 3, qualifiedLeads: 2, openProposals: 4, activeProjects: 7, pendingApprovals: 1, pipelineValue: 186000, todayDate: today });
      if (ok) toast.success("Daily digest sent to Slack!");
      else toast.error("Digest send failed");
    } catch { toast.error("Failed"); } finally { setSendingDigest(false); }
  };

  // Webhook URL (Convex deployment URL)
  const convexSiteUrl = "https://proficient-canary-549.convex.site";
  const webhookUrl = `${convexSiteUrl}/api/ghl/webhook`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <Plug className="size-6" />
            <h1 className="text-3xl font-bold">Integrations</h1>
          </div>
          <p className="text-violet-100 text-lg max-w-xl">
            Connect GoHighLevel CRM, Slack notifications, and email to make Greenscape AI your central command center.
          </p>
          {/* Quick status pills */}
          <div className="flex gap-3 mt-4 flex-wrap">
            {status && [
              { label: "GHL", ok: status.ghl.configured },
              { label: "Slack", ok: status.slack.configured },
              { label: "Email", ok: status.email.configured },
            ].map(({ label, ok }) => (
              <span key={label} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border ${ok ? "bg-white/20 border-white/30 text-white" : "bg-black/20 border-white/20 text-white/60"}`}>
                {ok ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />} {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── GHL Card ──────────────────────────────────────────────────── */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-white to-orange-50/30 dark:from-zinc-900 dark:to-orange-950/10">
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
              <StatusBadge configured={status?.ghl.configured ?? false} />
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Env var status */}
            <div className="rounded-xl border bg-muted/20 p-3 space-y-0.5">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Environment Variables</p>
              <EnvRow name="GHL_API_KEY" set={status?.ghl.hasApiKey ?? false} description="API key from GHL settings" />
              <EnvRow name="GHL_LOCATION_ID" set={status?.ghl.hasLocationId ?? false} description="Your sub-account/location ID" />
              <EnvRow name="GHL_PIPELINE_ID" set={status?.ghl.hasPipelineId ?? false} description="(Optional) Sales pipeline ID" />
            </div>

            {/* Setup Steps */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Info className="size-3.5" /> Setup Steps
              </p>
              <Step n={1} text='Go to GHL → Settings → API Keys → Create key with "Contacts + Opportunities + Pipelines" permissions' />
              <Step n={2} text="Copy your API key and add it to your Vercel environment variables as GHL_API_KEY" />
              <Step n={3} text="Find your Location ID in GHL → Settings → Business Info (sub-account ID)" />
              <Step n={4} text="For webhook sync: Go to GHL → Settings → Integrations → Webhooks → add this URL" code={webhookUrl} />
              <Step n={5} text='Select events: "Contact Created", "Contact Updated", "Opportunity Status Changed"' />
            </div>

            {/* What you get */}
            <div className="rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 p-3">
              <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-2">What this unlocks:</p>
              <ul className="space-y-1 text-xs text-orange-800 dark:text-orange-300">
                <li className="flex items-center gap-1.5"><ArrowDownToLine className="size-3 shrink-0" /> GHL contacts auto-import as leads here</li>
                <li className="flex items-center gap-1.5"><ArrowUpFromLine className="size-3 shrink-0" /> Qualified leads push back to GHL CRM</li>
                <li className="flex items-center gap-1.5"><Zap className="size-3 shrink-0" /> Proposals create GHL opportunities automatically</li>
                <li className="flex items-center gap-1.5"><Users className="size-3 shrink-0" /> Both systems stay in sync — no double entry</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleTestGHL}
                disabled={testingGHL || !status?.ghl.configured}
                variant="outline"
                size="sm"
                className="flex-1 border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400"
              >
                {testingGHL ? <><RefreshCw className="size-4 mr-1 animate-spin" />Testing...</> : "Test Connection"}
              </Button>
              <Button
                onClick={handleImportGHL}
                disabled={importing || !status?.ghl.configured}
                size="sm"
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
              >
                {importing ? <><RefreshCw className="size-4 mr-1 animate-spin" />Importing...</> : <><ArrowDownToLine className="size-4 mr-1" />Import GHL Contacts</>}
              </Button>
            </div>

            {!status?.ghl.configured && (
              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                <XCircle className="size-3.5 text-amber-500" />
                Add GHL_API_KEY + GHL_LOCATION_ID to environment variables to enable
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── Slack Card ────────────────────────────────────────────────── */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-white to-purple-50/30 dark:from-zinc-900 dark:to-purple-950/10">
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
              <StatusBadge configured={status?.slack.configured ?? false} />
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Env var status */}
            <div className="rounded-xl border bg-muted/20 p-3 space-y-0.5">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Environment Variables</p>
              <EnvRow name="SLACK_WEBHOOK_URL" set={status?.slack.hasWebhook ?? false} description="Incoming webhook URL from Slack" />
            </div>

            {/* Setup Steps */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Info className="size-3.5" /> Setup Steps
              </p>
              <Step n={1} text="Go to api.slack.com/apps → Create New App → From Scratch" />
              <Step n={2} text='Name it "Greenscape AI", select your Greenscape Slack workspace' />
              <Step n={3} text='Go to "Incoming Webhooks" → Activate → "Add New Webhook to Workspace"' />
              <Step n={4} text="Select the #greenscape-leads or #general channel → Allow" />
              <Step n={5} text="Copy the Webhook URL and add as SLACK_WEBHOOK_URL in Vercel env vars" />
            </div>

            {/* What you get */}
            <div className="rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 p-3">
              <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-2">Notifications you'll receive:</p>
              <ul className="space-y-1 text-xs text-purple-800 dark:text-purple-300">
                <li className="flex items-center gap-1.5">🟢 Qualified lead alerts with score + next step</li>
                <li className="flex items-center gap-1.5">📋 Proposal approved / client signed</li>
                <li className="flex items-center gap-1.5">⚠️ Approval requests with urgency level</li>
                <li className="flex items-center gap-1.5">🏗️ Project milestone updates</li>
                <li className="flex items-center gap-1.5">☀️ Daily morning pipeline digest</li>
                <li className="flex items-center gap-1.5">🔄 GHL sync confirmations</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleTestSlack}
                disabled={testingSlack || !status?.slack.configured}
                variant="outline"
                size="sm"
                className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400"
              >
                {testingSlack ? <><RefreshCw className="size-4 mr-1 animate-spin" />Testing...</> : "Send Test Message"}
              </Button>
              <Button
                onClick={handleSendDigest}
                disabled={sendingDigest || !status?.slack.configured}
                size="sm"
                className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white"
              >
                {sendingDigest ? <><RefreshCw className="size-4 mr-1 animate-spin" />Sending...</> : <><Bell className="size-4 mr-1" />Send Daily Digest</>}
              </Button>
            </div>

            {!status?.slack.configured && (
              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                <XCircle className="size-3.5 text-amber-500" />
                Add SLACK_WEBHOOK_URL to environment variables to enable
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── Email Card ────────────────────────────────────────────────── */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-white to-blue-50/30 dark:from-zinc-900 dark:to-blue-950/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-sm">
                  <Mail className="size-5 text-white" />
                </div>
                <div>
                  <div className="text-lg">Email (Resend)</div>
                  <div className="text-xs text-muted-foreground font-normal">Branded customer update emails</div>
                </div>
              </CardTitle>
              <StatusBadge configured={status?.email.configured ?? false} />
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Env var status */}
            <div className="rounded-xl border bg-muted/20 p-3 space-y-0.5">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Environment Variables</p>
              <EnvRow name="RESEND_API_KEY" set={status?.email.hasApiKey ?? false} description="API key from resend.com" />
              <EnvRow name="FROM_EMAIL" set={status?.email.hasFromEmail ?? false} description='e.g. updates@greenscape.com (optional)' />
            </div>

            {/* Setup Steps */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Info className="size-3.5" /> Setup Steps
              </p>
              <Step n={1} text="Go to resend.com → Sign up (free tier: 3,000 emails/month)" />
              <Step n={2} text="Create an API key with Send access" />
              <Step n={3} text="Add your sending domain (or use their test domain to start)" />
              <Step n={4} text="Add RESEND_API_KEY to Vercel environment variables" />
              <Step n={5} text='Set FROM_EMAIL to your domain email (e.g. "updates@yourdomain.com")' />
            </div>

            {/* What you get */}
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-3">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">What this unlocks:</p>
              <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-300">
                <li className="flex items-center gap-1.5">📧 Branded HTML emails to clients</li>
                <li className="flex items-center gap-1.5">🔨 Progress & milestone updates with one click</li>
                <li className="flex items-center gap-1.5">🎉 Welcome & completion emails</li>
                <li className="flex items-center gap-1.5">💼 Professional design matching Greenscape brand</li>
              </ul>
            </div>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400"
            >
              <a href="https://resend.com/signup" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4 mr-1.5" /> Create Free Resend Account
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* ── Webhook URL Info Card ─────────────────────────────────────── */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-white to-gray-50/50 dark:from-zinc-900 dark:to-zinc-800/50">
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
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">GHL → Greenscape AI</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-3 py-2 rounded-lg font-mono break-all flex-1 text-green-700 dark:text-green-400">
                  {webhookUrl}
                </code>
                <Button size="sm" variant="ghost" className="h-8 px-2 shrink-0"
                  onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success("Copied!"); }}>
                  <Copy className="size-3.5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Paste this in GHL → Settings → Webhooks. Receives contact events and auto-creates leads.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Health Check</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-3 py-2 rounded-lg font-mono flex-1 text-blue-700 dark:text-blue-400">
                  {convexSiteUrl}/api/health
                </code>
                <Button size="sm" variant="ghost" className="h-8 px-2 shrink-0" asChild>
                  <a href={`${convexSiteUrl}/api/health`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-zinc-800/50 border p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Environment Variables Summary</p>
              <p className="text-xs text-muted-foreground">Add these in <strong>Vercel → Project → Settings → Environment Variables</strong>:</p>
              {[
                { key: "GHL_API_KEY", hint: "From GHL → Settings → API Keys" },
                { key: "GHL_LOCATION_ID", hint: "Your GHL sub-account ID" },
                { key: "GHL_PIPELINE_ID", hint: "(Optional) Sales pipeline ID" },
                { key: "SLACK_WEBHOOK_URL", hint: "From api.slack.com/apps → Incoming Webhooks" },
                { key: "RESEND_API_KEY", hint: "From resend.com → API Keys" },
                { key: "FROM_EMAIL", hint: "e.g. updates@yourdomain.com" },
              ].map(({ key, hint }) => (
                <div key={key} className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-white dark:bg-zinc-900 border px-2 py-1 rounded text-xs">{key}</code>
                  <span className="text-xs text-muted-foreground">{hint}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
