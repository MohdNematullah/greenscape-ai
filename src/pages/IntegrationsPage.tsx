/**
 * Integrations Page — Slack and Email integration management.
 * GHL integration lives in backend only.
 */
import { useQuery, useAction, useMutation } from "convex/react";
import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Bell,
  Mail,
  Shield,
  Globe,
  Link2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function IntegrationsPage() {
  let status: {
    ghl: { configured: boolean; hasApiKey: boolean; hasLocationId: boolean; hasPipelineId: boolean };
    slack: { configured: boolean; hasWebhook: boolean };
    email: { configured: boolean; hasApiKey: boolean; hasFromEmail: boolean };
  } | undefined;
  try {
    status = useQuery(api.integrations.getIntegrationStatus, {});
  } catch {
    /* page renders even without query */
  }

  let testSlack: ((args: { webhookUrl?: string }) => Promise<boolean>) | null = null;
  try { testSlack = useAction(api.integrations.testSlackConnection); } catch { /* skip */ }

  const setSetting = useMutation(api.settings.set);

  const [testingSlack, setTestingSlack] = useState(false);
  const [savingSlack, setSavingSlack] = useState(false);
  const [slackUrl, setSlackUrl] = useState("");

  const slackOk = status?.slack.configured ?? false;
  const emailOk = status?.email.configured ?? false;
  const totalConnected = [slackOk, emailOk].filter(Boolean).length;

  const handleConnectSlack = async () => {
    if (!slackUrl.trim()) {
      toast.error("Enter your Slack webhook URL");
      return;
    }
    if (!slackUrl.startsWith("https://hooks.slack.com/")) {
      toast.error("Invalid URL — must start with https://hooks.slack.com/");
      return;
    }
    setSavingSlack(true);
    try {
      await setSetting({ key: "SLACK_WEBHOOK_URL", value: slackUrl.trim() });
      toast.success("Slack webhook saved!");
      setSlackUrl("");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSavingSlack(false);
    }
  };

  const handleTestSlack = async () => {
    if (!testSlack) return;
    setTestingSlack(true);
    try {
      const ok = await testSlack({});
      if (ok) toast.success("Slack test message sent! Check your channel.");
      else toast.error("Failed — check your webhook URL");
    } catch {
      toast.error("Test failed");
    } finally {
      setTestingSlack(false);
    }
  };

  const handleDisconnectSlack = async () => {
    try {
      await setSetting({ key: "SLACK_WEBHOOK_URL", value: "" });
      toast.success("Slack disconnected");
    } catch {
      toast.error("Failed");
    }
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
              <h1 className="text-2xl font-bold">Integrations</h1>
              <p className="text-slate-400 text-sm">Connect your tools and automate your workflow</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-sm">
              <Shield className="size-3.5 text-emerald-400" />
              <span className="font-medium">{totalConnected}/2</span>
              <span className="text-slate-400">connected</span>
            </div>
            {[
              { label: "Slack", ok: slackOk },
              { label: "Email", ok: emailOk },
            ].map(({ label, ok }) => (
              <span
                key={label}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  ok ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-slate-500"
                }`}
              >
                {ok ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />} {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="grid gap-4">

        {/* ── Slack Card ── */}
        <Card className="border-0 shadow-md bg-white dark:bg-zinc-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-200/50 dark:shadow-purple-900/30">
                  <Bell className="size-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Slack</h2>
                  <p className="text-xs text-muted-foreground">Real-time team alerts for every business event</p>
                </div>
              </div>
              {slackOk ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                  <CheckCircle2 className="size-3.5" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700">
                  <XCircle className="size-3.5" /> Not connected
                </span>
              )}
            </div>

            {slackOk ? (
              <div className="space-y-4">
                {/* Connected State */}
                <div className="rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/30 p-4">
                  <p className="text-sm text-purple-800 dark:text-purple-300 font-medium mb-3">Notifications are live for:</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      "New lead received",
                      "Lead qualified",
                      "Proposal created",
                      "Proposal approved",
                      "Proposal sent",
                      "Project milestone",
                      "Email sent to client",
                      "Daily pipeline digest",
                    ].map((n) => (
                      <span key={n} className="flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-400">
                        <CheckCircle2 className="size-3 text-purple-500" /> {n}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleTestSlack}
                    disabled={testingSlack}
                    variant="outline"
                    size="sm"
                    className="border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-400"
                  >
                    {testingSlack ? (
                      <><RefreshCw className="size-4 mr-1.5 animate-spin" /> Testing...</>
                    ) : (
                      <><RefreshCw className="size-4 mr-1.5" /> Send Test Message</>
                    )}
                  </Button>
                  <Button
                    onClick={handleDisconnectSlack}
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    <XCircle className="size-4 mr-1.5" /> Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Setup Instructions */}
                <div className="rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/30 p-4 space-y-3">
                  <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">How to get your Webhook URL:</p>
                  <ol className="text-xs text-purple-700 dark:text-purple-400 space-y-1.5 list-decimal list-inside">
                    <li>Go to <a href="https://api.slack.com/apps" target="_blank" rel="noreferrer" className="underline font-medium">api.slack.com/apps</a> → Create New App → From Scratch</li>
                    <li>Click <strong>Incoming Webhooks</strong> → Toggle ON</li>
                    <li>Click <strong>Add New Webhook to Workspace</strong> → pick your channel</li>
                    <li>Copy the Webhook URL and paste below</li>
                  </ol>
                </div>

                {/* Webhook URL Input */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      type="url"
                      placeholder="https://hooks.slack.com/services/T.../B.../xxx"
                      value={slackUrl}
                      onChange={(e) => setSlackUrl(e.target.value)}
                      className="pl-9 font-mono text-xs"
                    />
                  </div>
                  <Button
                    onClick={handleConnectSlack}
                    disabled={savingSlack || !slackUrl.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                  >
                    {savingSlack ? (
                      <><RefreshCw className="size-4 mr-1.5 animate-spin" /> Saving...</>
                    ) : (
                      <><Link2 className="size-4 mr-1.5" /> Connect</>
                    )}
                  </Button>
                </div>

                {/* What you'll get */}
                <div className="rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 p-4">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Once connected, your team gets notified for:</p>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      "🔵 New leads",
                      "🟢 Qualified leads",
                      "📋 Proposals",
                      "🎉 Signed deals",
                      "⚡ Approval requests",
                      "🎯 Milestones",
                      "📧 Emails sent",
                      "☀️ Daily digest",
                    ].map((n) => (
                      <span key={n} className="text-xs text-gray-500 dark:text-gray-500">{n}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Email Card ── */}
        <Card className="border-0 shadow-md bg-white dark:bg-zinc-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
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
            {emailOk ? (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 p-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Email is ready. Proposals and client updates can be sent with one click from their pages.
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
                <p className="text-xs text-muted-foreground mt-3">
                  <ExternalLink className="size-3 inline mr-1" />
                  Or configure in the <a href="/settings" className="underline font-medium">Settings page</a>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
