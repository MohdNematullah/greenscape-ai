/**
 * Settings Page — Configure API keys for integrations directly from the app.
 */
import { useMutation, useQuery } from "convex/react";
import { useState, useEffect } from "react";
import { Settings, Save, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SETTING_KEYS = [
  { key: "RESEND_API_KEY", label: "Resend API Key", placeholder: "re_...", hint: "resend.com → API Keys" },
  { key: "FROM_EMAIL", label: "From Email", placeholder: "onboarding@resend.dev", hint: "Sender email address" },
  { key: "GHL_API_KEY", label: "GHL API Key", placeholder: "Your GHL API key", hint: "GHL → Settings → API Keys" },
  { key: "GHL_LOCATION_ID", label: "GHL Location ID", placeholder: "Sub-account ID", hint: "GHL → Settings → Business Info" },
  { key: "SLACK_WEBHOOK_URL", label: "Slack Webhook URL", placeholder: "https://hooks.slack.com/services/...", hint: "Slack → Incoming Webhooks" },
];

export function SettingsPage() {
  const settings = useQuery(api.settings.getMultiple, { keys: SETTING_KEYS.map((s) => s.key) });
  const setSetting = useMutation(api.settings.set);
  const [values, setValues] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      const initial: Record<string, string> = {};
      for (const k of SETTING_KEYS) {
        initial[k.key] = settings[k.key] || "";
      }
      setValues(initial);
    }
  }, [settings]);

  const handleSave = async (key: string) => {
    setSaving(key);
    try {
      await setSetting({ key, value: values[key] || "" });
      toast.success(`${key} saved!`);
    } catch {
      toast.error(`Failed to save ${key}`);
    } finally {
      setSaving(null);
    }
  };

  const handleSaveAll = async () => {
    setSaving("all");
    try {
      for (const k of SETTING_KEYS) {
        if (values[k.key] !== (settings?.[k.key] || "")) {
          await setSetting({ key: k.key, value: values[k.key] || "" });
        }
      }
      toast.success("All settings saved!");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-900 to-black p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <Settings className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-zinc-400 text-sm">Configure API keys and integrations</p>
            </div>
          </div>
          <Button
            onClick={handleSaveAll}
            disabled={saving === "all"}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {saving === "all" ? <><div className="size-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : <><Save className="size-4 mr-2" /> Save All</>}
          </Button>
        </div>
      </div>

      {/* Settings Cards */}
      <div className="space-y-3">
        {SETTING_KEYS.map(({ key, label, placeholder, hint }) => {
          const isSecret = key.includes("KEY") || key.includes("WEBHOOK");
          const show = showKeys[key] || false;
          const currentVal = values[key] || "";
          const savedVal = settings?.[key] || "";
          const hasChanged = currentVal !== savedVal;
          const isConfigured = !!savedVal;

          return (
            <Card key={key} className="border-0 shadow-sm bg-white dark:bg-zinc-900">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-bold">{label}</Label>
                    {isConfigured && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle2 className="size-3" /> Set
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{hint}</span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={isSecret && !show ? "password" : "text"}
                      value={currentVal}
                      onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="pr-10 font-mono text-sm"
                    />
                    {isSecret && (
                      <button
                        type="button"
                        onClick={() => setShowKeys((s) => ({ ...s, [key]: !show }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    )}
                  </div>
                  <Button
                    onClick={() => handleSave(key)}
                    disabled={!hasChanged || saving === key}
                    variant={hasChanged ? "default" : "outline"}
                    size="sm"
                    className={hasChanged ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                  >
                    {saving === key ? "..." : "Save"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
