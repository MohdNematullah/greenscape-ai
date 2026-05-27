import { useMutation, useQuery, useAction } from "convex/react";
import { useState } from "react";
import {
  MessageSquare,
  Sparkles,
  Trash2,
  Copy,
  Send,
  Mail,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  halfway: { label: "Halfway", emoji: "📐" },
  delay: { label: "Delay", emoji: "⏰" },
  completion: { label: "Completion", emoji: "🎉" },
};

export function CustomerUpdatesPage() {
  const updates = useQuery(api.customerUpdates.list, {});
  const projects = useQuery(api.projects.list, {});
  const createUpdate = useMutation(api.customerUpdates.create);
  const removeUpdate = useMutation(api.customerUpdates.remove);
  const markSent = useMutation(api.customerUpdates.markSent);
  const generateUpdate = useAction(api.ai.generateCustomerUpdate);
  const sendEmail = useAction(api.integrations.sendCustomerEmail);

  const [showCreate, setShowCreate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [emailDialog, setEmailDialog] = useState<string | null>(null);
  const [emailTo, setEmailTo] = useState("");

  // Form
  const [selectedProject, setSelectedProject] = useState("");
  const [updateType, setUpdateType] = useState("progress");
  const [progressDetails, setProgressDetails] = useState("");
  const [milestone, setMilestone] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");

  const activeProjects = projects?.filter((p) => p.status === "active");

  const handleGenerate = async () => {
    const project = projects?.find((p) => p._id === selectedProject);
    if (!project || !progressDetails.trim()) {
      toast.error("Select a project and enter progress details");
      return;
    }
    setGenerating(true);
    try {
      const result = await generateUpdate({
        clientName: project.clientName,
        projectType: project.projectType,
        progressDetails: progressDetails.trim(),
        updateType,
        milestone: milestone || undefined,
      });
      // Clean the generated content of any markdown artifacts
      setGeneratedContent(stripMarkdown(result.content));
      toast.success("Update generated! Review and send.");
    } catch {
      toast.error("Failed to generate update");
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
        milestone: milestone || undefined,
      });
      toast.success("Update saved!");
      setShowCreate(false);
      setSelectedProject(""); setProgressDetails(""); setGeneratedContent(""); setMilestone("");
    } catch {
      toast.error("Failed to save update");
    }
  };

  const handleSendEmail = async (updateId: string) => {
    const update = updates?.find((u) => u._id === updateId);
    if (!update || !emailTo.trim()) {
      toast.error("Enter a valid email address");
      return;
    }
    setSendingEmail(updateId);
    try {
      const result = await sendEmail({
        to: emailTo.trim(),
        clientName: update.clientName,
        subject: `Greenscape Project Update — ${UPDATE_TYPES[update.updateType]?.label || update.updateType}`,
        content: stripMarkdown(update.content),
        updateType: update.updateType,
      });
      if (result.success) {
        await markSent({ id: update._id as never, sentVia: "email" });
        toast.success("Email sent!", { description: `Sent to ${update.clientName}` });
        setEmailDialog(null);
        setEmailTo("");
      } else {
        toast.error(result.error || "Failed to send");
      }
    } catch {
      toast.error("Failed to send email");
    } finally {
      setSendingEmail(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(stripMarkdown(text));
    toast.success("Copied!");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-green-600 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="size-6" />
              <h1 className="text-3xl font-bold">Client Updates</h1>
            </div>
            <p className="text-teal-100 text-lg">
              Keep clients informed — the #1 driver of referrals
            </p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold shadow-lg px-6 py-5 text-base">
                <Sparkles className="size-4 mr-2" /> Generate Update
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="size-5" /> Generate Client Update
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Project</Label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger><SelectValue placeholder="Select project..." /></SelectTrigger>
                      <SelectContent>
                        {activeProjects?.map((p) => (
                          <SelectItem key={p._id} value={p._id}>
                            {p.clientName} — {p.projectType}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Update Type</Label>
                    <Select value={updateType} onValueChange={setUpdateType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(UPDATE_TYPES).map(([key, val]) => (
                          <SelectItem key={key} value={key}>{val.emoji} {val.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(updateType === "milestone" || updateType === "halfway") && (
                  <div>
                    <Label>Milestone</Label>
                    <Input placeholder="e.g. Patio pavers fully laid, fire pit framed..."
                      value={milestone} onChange={(e) => setMilestone(e.target.value)} />
                  </div>
                )}

                <div>
                  <Label>Progress Details</Label>
                  <Textarea
                    placeholder="What's been done, what's next. The AI will turn these notes into a warm, personal client message."
                    value={progressDetails}
                    onChange={(e) => setProgressDetails(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button onClick={handleGenerate} disabled={generating} className="w-full">
                  <Sparkles className="size-4 mr-2" /> {generating ? "Generating..." : "Generate Message"}
                </Button>

                {generatedContent && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Generated Message</Label>
                    {/* Clean preview — looks like an email */}
                    <div className="rounded-xl border overflow-hidden">
                      <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-3 flex items-center gap-2">
                        <span className="text-white text-lg">🌿</span>
                        <div>
                          <p className="text-white text-sm font-bold">Greenscape</p>
                          <p className="text-green-100 text-xs">Project Update</p>
                        </div>
                      </div>
                      <div className="p-5 bg-white dark:bg-zinc-900 text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {generatedContent}
                      </div>
                    </div>
                    <Textarea
                      value={generatedContent}
                      onChange={(e) => setGeneratedContent(e.target.value)}
                      rows={5}
                      className="font-mono text-xs"
                      placeholder="Edit the message..."
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSave} className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700">
                        <Send className="size-4 mr-2" /> Save Update
                      </Button>
                      <Button variant="outline" onClick={() => copyToClipboard(generatedContent)}>
                        <Copy className="size-4 mr-1" /> Copy
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Updates List */}
      <div className="space-y-3">
        {updates?.map((update) => {
          const typeInfo = UPDATE_TYPES[update.updateType] || { label: update.updateType, emoji: "📝" };
          return (
            <Card key={update._id} className="border-0 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{typeInfo.emoji}</span>
                      <h3 className="font-semibold">{update.clientName}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-muted-foreground">
                        {typeInfo.label}
                      </span>
                      {update.milestone && (
                        <span className="text-xs text-muted-foreground">🎯 {update.milestone}</span>
                      )}
                    </div>

                    {/* Email-style preview */}
                    <div className="rounded-lg border overflow-hidden">
                      <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 flex items-center gap-2">
                        <span className="text-white">🌿</span>
                        <span className="text-white text-xs font-bold">Greenscape Update</span>
                        <span className="text-green-100 text-xs ml-auto">{typeInfo.label}</span>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {stripMarkdown(update.content)}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(update._creationTime).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-1.5 shrink-0 flex-col sm:flex-row">
                    {update.sentVia ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 px-2 py-1 bg-green-50 dark:bg-green-950/30 rounded-full whitespace-nowrap">
                        <Check className="size-3" /> Sent via {update.sentVia}
                      </span>
                    ) : (
                      <Button size="sm" variant="outline" className="text-green-600 border-green-200"
                        onClick={() => { setEmailDialog(update._id); setEmailTo(""); }}>
                        <Mail className="size-4 mr-1" /> Email
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(update.content)}>
                      <Copy className="size-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive"
                      onClick={() => { removeUpdate({ id: update._id }); toast.success("Removed"); }}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {updates?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="size-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No client updates yet</p>
            <p className="text-sm">Generate a personal update to keep clients informed and drive referrals</p>
          </div>
        )}
      </div>

      {/* ── Email Send Dialog ───────────────────────────────────────── */}
      <Dialog open={!!emailDialog} onOpenChange={() => setEmailDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="size-5 text-green-600" /> Send Update via Email
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Client Email</Label>
              <Input type="email" placeholder="client@email.com"
                value={emailTo} onChange={(e) => setEmailTo(e.target.value)} className="mt-1" />
            </div>
            <p className="text-xs text-muted-foreground">
              The update will be sent as a branded Greenscape email with your project update message.
            </p>
            <div className="flex gap-2">
              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                disabled={!emailTo.trim() || sendingEmail === emailDialog}
                onClick={() => emailDialog && handleSendEmail(emailDialog)}>
                {sendingEmail === emailDialog ? (
                  <><div className="size-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                ) : (
                  <><Send className="size-4 mr-2" /> Send Email</>
                )}
              </Button>
              <Button variant="outline" onClick={() => setEmailDialog(null)}>
                <X className="size-4 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
