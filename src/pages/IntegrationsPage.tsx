/**
 * Integrations Page — Simple GHL API key connection.
 * Slack is connected behind the scenes to this workspace.
 * Email is auto-configured.
 */
import { useQuery, useAction } from "convex/react";
import { useState } from "react";
import {
  Plug,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Zap,
  ArrowDownToLine,
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
      <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Plug className="size-5" /> Integrations
        </h1>
        <p className="text-violet-100 text-sm mt-1">Connect your tools to Greenscape AI</p>
        <div className="flex gap-2 mt-3">
          {[
            { label: "GHL", ok: ghlOk },
            { label: "Slack", ok: slackOk },
            { label: "Email", ok: emailOk },
          ].map(({ label, ok }) => (
            <span key={label} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${ok ? "bg-white/20 text-white" : "bg-black/20 text-white/60"}`}>
              {ok ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />} {label}
            </span>
          ))}
        </div>
      </div>

      {/* GHL Card */}
      <Card className="border-0 shadow-md bg-white dark:bg-zinc-900">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow">
                <Zap className="size-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">GoHighLevel CRM</h2>
                <p className="text-xs text-muted-foreground">Sync contacts and pipeline</p>
              </div>
            </div>
            {ghlOk ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                <CheckCircle2 className="size-3.5" /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                <XCircle className="size-3.5" /> Not connected
              </span>
            )}
          </div>

          {!ghlOk ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add your GHL API key to connect. Go to <span className="font-medium text-foreground">GHL → Settings → API Keys</span> to get yours.
              </p>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-4">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">Add these to Vercel → Settings → Environment Variables:</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-white dark:bg-zinc-800 px-2 py-1 rounded font-mono border">GHL_API_KEY</code>
                    <span className="text-xs text-muted-foreground">Your API key</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-white dark:bg-zinc-800 px-2 py-1 rounded font-mono border">GHL_LOCATION_ID</code>
                    <span className="text-xs text-muted-foreground">Sub-account ID</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 p-4">
                <p className="text-sm text-green-800 dark:text-green-300">
                  GHL is connected. Your contacts will sync automatically. You can also import manually below.
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleTestGHL} disabled={testingGHL} variant="outline" size="sm" className="border-orange-200 text-orange-700">
                  {testingGHL ? <><RefreshCw className="size-4 mr-1 animate-spin" /> Testing...</> : "Test Connection"}
                </Button>
                <Button onClick={handleImportGHL} disabled={importing} size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                  {importing ? <><RefreshCw className="size-4 mr-1 animate-spin" /> Importing...</> : <><ArrowDownToLine className="size-4 mr-1" /> Import Contacts</>}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
