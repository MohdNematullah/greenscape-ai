/**
 * Integrations Page — GHL, Slack, and Email integration management.
 */
import { useQuery, useAction } from "convex/react";
import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Zap,
  ArrowDownToLine,
  Bell,
  Mail,
  Shield,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function IntegrationsPage() {
  let status: { ghl: { configured: boolean; hasApiKey: boolean; hasLocationId: boolean; hasPipelineId: boolean }; slack: { configured: boolean; hasWebhook: boolean }; email: { configured: boolean; hasApiKey: boolean; hasFromEmail: boolean } } | undefined;
  try { status = useQuery(api.integrations.getIntegrationStatus, {}); } catch { /* page renders even without query */ }

  let testGHL: ((args: Record<string, never>) => Promise<{ success: boolean; message: string }>) | null = null;
  let importGHL: ((args: { limit?: number }) => Promise<{ success: boolean; imported: number; skipped: number; error?: string }>) | null = null;
  try { testGHL = useAction(api.integrations.testGHLConnection); } catch { /* skip */ }
  try { importGHL = useAction(api.integrations.importGHLContacts); } catch { /* skip */ }

  const [testingGHL, setTestingGHL] = useState(false);
  const [importing, setImporting] = useState(false);

  const ghlOk = status?.ghl.configured ?? false;
  const slackOk = status?.slack.configured ?? false;
  const emailOk = status?.email.configured ?? false;
  const totalConnected = [ghlOk, slackOk, emailOk].filter(Boolean).length;

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
      if (result.success) toast.success(`Imported ${result.imported} contacts`, { description: `${result.skipped} skipped` });
      else toast.error(result.error || "Import failed");
    } catch { toast.error("Import failed"); } finally { setImporting(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 p-8 text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full translate-y-1/3 -translate-x-1/3" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-1">
            <div className="size-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <Globe className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Command Center</h1>
              <p className="text-slate-400 text-sm">Connect, automate, and monitor your business tools</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-sm">
              <Shield className="size-3.5 text-emerald-400" />
              <span className="font-medium">{totalConnected}/3</span>
              <span className="text-slate-400">connected</span>
            </div>
            {[
              { label: "GHL", ok: ghlOk, color: "orange" },
              { label: "Slack", ok: slackOk, color: "purple" },
              { label: "Email", ok: emailOk, color: "blue" },
            ].map(({ label, ok }) => (
              <span key={label} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${ok ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-slate-500"}`}>
                {ok ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />} {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="grid gap-4">

        {/* ── GHL Card ── */}
        <Card className="border-0 shadow-md bg-white dark:bg-zinc-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-200/50 dark:shadow-orange-900/30">
                  <Zap className="size-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">GoHighLevel</h2>
                  <p className="text-xs text-muted-foreground">CRM sync, lead import, pipeline tracking</p>
                </div>
              </div>
              {ghlOk ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                  <CheckCircle2 className="size-3.5" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700">
                  <XCircle className="size-3.5" /> Not connected
                </span>
              )}
            </div>

            {!ghlOk ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Connect your GHL account to automatically sync contacts, track your pipeline, and import leads into Greenscape AI.
                </p>
                <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 p-4">
                  <p className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-3">Setup (Convex Dashboard → Environment Variables):</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-white dark:bg-zinc-800 px-2 py-1 rounded font-mono border min-w-[140px]">GHL_API_KEY</code>
                      <span className="text-xs text-muted-foreground">GHL → Settings → API Keys</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-white dark:bg-zinc-800 px-2 py-1 rounded font-mono border min-w-[140px]">GHL_LOCATION_ID</code>
                      <span className="text-xs text-muted-foreground">GHL → Settings → Business Info</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 p-4">
                  <p className="text-sm text-green-800 dark:text-green-300">
                    GHL is connected and syncing. Contacts auto-import, and your pipeline stays in sync.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleTestGHL} disabled={testingGHL} variant="outline" size="sm" className="border-orange-200 text-orange-700 dark:border-orange-800 dark:text-orange-400">
                    {testingGHL ? <><RefreshCw className="size-4 mr-1.5 animate-spin" /> Testing...</> : <><RefreshCw className="size-4 mr-1.5" /> Test Connection</>}
                  </Button>
                  <Button onClick={handleImportGHL} disabled={importing} size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                    {importing ? <><RefreshCw className="size-4 mr-1.5 animate-spin" /> Importing...</> : <><ArrowDownToLine className="size-4 mr-1.5" /> Import Contacts</>}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Slack Card ── */}
        <Card className="border-0 shadow-md bg-white dark:bg-zinc-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-200/50 dark:shadow-purple-900/30">
                  <Bell className="size-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Slack Notifications</h2>
                  <p className="text-xs text-muted-foreground">Team alerts for leads, proposals, and project updates</p>
                </div>
              </div>
              {slackOk ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                  <CheckCircle2 className="size-3.5" /> Active
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700">
                  <XCircle className="size-3.5" /> Inactive
                </span>
              )}
            </div>
            <div className="mt-4">
              {slackOk ? (
                <div className="rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/30 p-4">
                  <p className="text-sm text-purple-800 dark:text-purple-300 font-medium mb-2">Notifications are live for:</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {["New lead received", "Lead qualified", "Proposal created", "Proposal approved", "Proposal sent", "Project started", "Project completed", "Daily digest"].map((n) => (
                      <span key={n} className="flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-400">
                        <CheckCircle2 className="size-3 text-purple-500" /> {n}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 p-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Add a Slack Incoming Webhook to get real-time team notifications.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-white dark:bg-zinc-800 px-2 py-1 rounded font-mono border">SLACK_WEBHOOK_URL</code>
                    <span className="text-xs text-muted-foreground">Slack → Incoming Webhooks</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Email Card ── */}
        <Card className="border-0 shadow-md bg-white dark:bg-zinc-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-200/50 dark:shadow-blue-900/30">
                  <Mail className="size-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Email (Resend)</h2>
                  <p className="text-xs text-muted-foreground">Send proposals and client updates via email</p>
                </div>
              </div>
              {emailOk ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                  <CheckCircle2 className="size-3.5" /> Configured
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700">
                  <XCircle className="size-3.5" /> Not configured
                </span>
              )}
            </div>
            <div className="mt-4">
              {emailOk ? (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Email is ready. Proposals and client updates can be sent with one click from their respective pages.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 p-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Add your Resend API key to enable email sending.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-white dark:bg-zinc-800 px-2 py-1 rounded font-mono border min-w-[140px]">RESEND_API_KEY</code>
                      <span className="text-xs text-muted-foreground">resend.com → API Keys</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-white dark:bg-zinc-800 px-2 py-1 rounded font-mono border min-w-[140px]">FROM_EMAIL</code>
                      <span className="text-xs text-muted-foreground">onboarding@resend.dev (free)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
