import { useMutation, useQuery, useAction } from "convex/react";
import { useState } from "react";
import {
  MessageSquare,
  Sparkles,
  Trash2,
  Send,
  Check,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { stripMarkdown } from "@/lib/renderMarkdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const UPDATE_TYPES: Record<string, { label: string; emoji: string }> = {
  welcome: { label: "Welcome", emoji: "👋" },
  progress: { label: "Progress", emoji: "🔨" },
  milestone: { label: "Milestone", emoji: "🎯" },
  delay: { label: "Delay", emoji: "⏰" },
  completion: { label: "Completion", emoji: "🎉" },
};

export function CustomerUpdatesPage() {
  const updates = useQuery(api.customerUpdates.list, {});
  const projects = useQuery(api.projects.list, {});
  const leads = useQuery(api.leads.list, {});
  const createUpdate = useMutation(api.customerUpdates.create);
  const removeUpdate = useMutation(api.customerUpdates.remove);
  const markSent = useMutation(api.customerUpdates.markSent);
  const generateUpdate = useAction(api.ai.generateCustomerUpdate);
  const sendEmail = useAction(api.integrations.sendCustomerEmail);

  const [showCreate, setShowCreate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  // Form
  const [selectedProject, setSelectedProject] = useState("");
  const [updateType, setUpdateType] = useState("progress");
  const [progressDetails, setProgressDetails] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");

  const activeProjects = projects?.filter((p) => p.status === "active");

  // Helper: find client email from leads using project's leadId or clientName
  const getClientEmail = (clientName: string, leadId?: string): string | undefined => {
    if (leadId) {
      const lead = leads?.find((l) => l._id === leadId);
      if (lead?.email) return lead.email;
    }
    // Fallback: match by client name
    const lead = leads?.find((l) => l.name === clientName && l.email);
    return lead?.email || undefined;
  };

  const handleGenerate = async () => {
    const project = projects?.find((p) => p._id === selectedProject);
    if (!project || !progressDetails.trim()) {
      toast.error("Select a project and add details");
      return;
    }
    setGenerating(true);
    try {
      const result = await generateUpdate({
        clientName: project.clientName,
        projectType: project.projectType,
        progressDetails: progressDetails.trim(),
        updateType,
      });
      setGeneratedContent(stripMarkdown(result.content));
      toast.success("Generated! Review and save.");
    } catch {
      toast.error("Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    const project = projects?.find((p) => p._id === selectedProject);
    if (!project || !generatedContent.trim()) return;
    try {
      await createUpdate({
        projectId: project._id,
        clientName: project.clientName,
        updateType,
        content: generatedContent.trim(),
      });
      toast.success("Update saved!");
      setShowCreate(false);
      setSelectedProject(""); setProgressDetails(""); setGeneratedContent("");
    } catch {
      toast.error("Failed to save");
    }
  };

  // One-click email — auto-finds client email
  const handleSendEmail = async (updateId: string) => {
    const update = updates?.find((u) => u._id === updateId);
    if (!update) return;

    const project = projects?.find((p) => p._id === update.projectId);
    const clientEmail = getClientEmail(update.clientName, project?.leadId as string | undefined);

    if (!clientEmail) {
      toast.error("No email found for this client. Add an email to the lead first.");
      return;
    }

    setSendingEmail(updateId);
    try {
      const result = await sendEmail({
        to: clientEmail,
        clientName: update.clientName,
        subject: `Greenscape Project Update — ${UPDATE_TYPES[update.updateType]?.label || update.updateType}`,
        content: stripMarkdown(update.content),
        updateType: update.updateType,
      });
      if (result.success) {
        await markSent({ id: update._id as never, sentVia: "email" });
        toast.success("Email sent!", { description: `Sent to ${clientEmail}` });
      } else {
        toast.error(result.error || "Failed to send");
      }
    } catch {
      toast.error("Email not configured — add RESEND_API_KEY");
    } finally {
      setSendingEmail(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 p-6 text-white flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="size-5" /> Client Updates
          </h1>
          <p className="text-teal-100 text-sm mt-1">Keep clients in the loop — drives referrals</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold">
              <Sparkles className="size-4 mr-1" /> Generate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle><Sparkles className="size-4 inline mr-1" /> Generate Update</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Project</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {activeProjects?.map((p) => (
                        <SelectItem key={p._id} value={p._id}>{p.clientName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select value={updateType} onValueChange={setUpdateType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(UPDATE_TYPES).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">What happened?</Label>
                <Textarea
                  placeholder="Quick notes — AI turns them into a warm client message"
                  value={progressDetails}
                  onChange={(e) => setProgressDetails(e.target.value)}
                  rows={3}
                />
              </div>
              <Button onClick={handleGenerate} disabled={generating} className="w-full">
                {generating ? "Generating..." : "Generate"}
              </Button>

              {generatedContent && (
                <div className="space-y-3">
                  <div className="rounded-lg border overflow-hidden">
                    <div className="bg-green-600 px-4 py-2 text-white text-xs font-bold">🌿 Greenscape Update</div>
                    <div className="p-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-zinc-800/50">
                      {generatedContent}
                    </div>
                  </div>
                  <Textarea value={generatedContent} onChange={(e) => setGeneratedContent(e.target.value)} rows={4} className="text-xs" />
                  <Button onClick={handleSave} className="w-full bg-teal-600 hover:bg-teal-700">
                    <Send className="size-4 mr-1" /> Save Update
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Updates List */}
      <div className="space-y-2">
        {updates?.map((update) => {
          const t = UPDATE_TYPES[update.updateType] || { label: update.updateType, emoji: "📝" };
          return (
            <Card key={update._id} className="border-0 bg-white dark:bg-zinc-900 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span>{t.emoji}</span>
                      <span className="font-semibold text-sm">{update.clientName}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-muted-foreground">{t.label}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{new Date(update._creationTime).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{stripMarkdown(update.content)}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {update.sentVia ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 px-2 py-1 bg-green-50 dark:bg-green-950/30 rounded-full">
                        <Check className="size-3" /> Sent
                      </span>
                    ) : (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8"
                        disabled={sendingEmail === update._id}
                        onClick={() => handleSendEmail(update._id)}>
                        {sendingEmail === update._id ? (
                          <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <><Send className="size-3.5 mr-1" /> Send</>
                        )}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { navigator.clipboard.writeText(stripMarkdown(update.content)); toast.success("Copied"); }}>
                      <Copy className="size-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => { removeUpdate({ id: update._id }); toast.success("Removed"); }}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {updates?.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <MessageSquare className="size-10 mx-auto mb-2 opacity-30" />
            <p className="font-medium">No updates yet</p>
            <p className="text-sm">Generate one to keep clients informed</p>
          </div>
        )}
      </div>
    </div>
  );
}
