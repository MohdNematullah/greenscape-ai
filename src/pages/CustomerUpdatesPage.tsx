import { useMutation, useQuery, useAction } from "convex/react";
import { useState, useCallback } from "react";
import {
  MessageSquare,
  Sparkles,
  Trash2,
  Send,
  Check,
  Copy,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Plus,
  Pencil,
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

// ─── Section Types for Movable Blocks ────────────────────────────────────────

interface ContentSection {
  id: string;
  label: string;
  emoji: string;
  content: string;
}

const SECTION_TEMPLATES: Record<string, { label: string; emoji: string; placeholder: string }> = {
  greeting: { label: "Greeting", emoji: "👋", placeholder: "Hi [Client Name]," },
  progress: { label: "Progress Update", emoji: "🔨", placeholder: "What was done this week..." },
  milestone: { label: "Milestone", emoji: "🎯", placeholder: "Major milestone achieved..." },
  next_steps: { label: "Next Steps", emoji: "📋", placeholder: "Coming up next..." },
  timeline: { label: "Timeline", emoji: "📅", placeholder: "Expected timeline..." },
  note: { label: "Personal Note", emoji: "💬", placeholder: "A warm personal touch..." },
  signoff: { label: "Sign-Off", emoji: "✍️", placeholder: "— The Greenscape Team" },
};

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

/** Parse generated text into sections by splitting on double-newlines or sentence boundaries */
function parseContentIntoSections(text: string): ContentSection[] {
  const clean = stripMarkdown(text).trim();
  const paragraphs = clean.split(/\n\n+/).filter((p) => p.trim().length > 0);

  if (paragraphs.length <= 1) {
    // Single block — split by sentences into greeting, body, signoff
    const sentences = clean.split(/(?<=\.)\s+/);
    const sections: ContentSection[] = [];

    if (sentences.length >= 1) {
      sections.push({
        id: generateId(),
        label: "Greeting",
        emoji: "👋",
        content: sentences[0],
      });
    }
    if (sentences.length >= 3) {
      sections.push({
        id: generateId(),
        label: "Progress Update",
        emoji: "🔨",
        content: sentences.slice(1, -1).join(" "),
      });
      sections.push({
        id: generateId(),
        label: "Sign-Off",
        emoji: "✍️",
        content: sentences[sentences.length - 1],
      });
    } else if (sentences.length === 2) {
      sections.push({
        id: generateId(),
        label: "Progress Update",
        emoji: "🔨",
        content: sentences[1],
      });
    }
    return sections.length > 0 ? sections : [{ id: generateId(), label: "Content", emoji: "📝", content: clean }];
  }

  // Multiple paragraphs — label them smartly
  return paragraphs.map((p, i) => {
    const lower = p.toLowerCase();
    let label = "Content";
    let emoji = "📝";

    if (i === 0 && (lower.startsWith("hi ") || lower.startsWith("hello ") || lower.startsWith("dear "))) {
      label = "Greeting"; emoji = "👋";
    } else if (i === paragraphs.length - 1 && (lower.includes("greenscape") || lower.includes("team") || lower.startsWith("—") || lower.startsWith("best"))) {
      label = "Sign-Off"; emoji = "✍️";
    } else if (lower.includes("milestone") || lower.includes("completed") || lower.includes("finished")) {
      label = "Milestone"; emoji = "🎯";
    } else if (lower.includes("next") || lower.includes("coming up") || lower.includes("plan")) {
      label = "Next Steps"; emoji = "📋";
    } else if (lower.includes("timeline") || lower.includes("schedule") || lower.includes("week")) {
      label = "Timeline"; emoji = "📅";
    } else {
      label = "Progress Update"; emoji = "🔨";
    }
    return { id: generateId(), label, emoji, content: p.trim() };
  });
}

function sectionsToContent(sections: ContentSection[]): string {
  return sections.map((s) => s.content).join("\n\n");
}

// ─── Movable Section Editor Component ────────────────────────────────────────

function SectionEditor({
  sections,
  onChange,
}: {
  sections: ContentSection[];
  onChange: (sections: ContentSection[]) => void;
}) {
  const moveUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      const next = [...sections];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      onChange(next);
    },
    [sections, onChange]
  );

  const moveDown = useCallback(
    (index: number) => {
      if (index >= sections.length - 1) return;
      const next = [...sections];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      onChange(next);
    },
    [sections, onChange]
  );

  const updateContent = useCallback(
    (index: number, content: string) => {
      const next = [...sections];
      next[index] = { ...next[index], content };
      onChange(next);
    },
    [sections, onChange]
  );

  const removeSection = useCallback(
    (index: number) => {
      onChange(sections.filter((_, i) => i !== index));
    },
    [sections, onChange]
  );

  const addSection = useCallback(
    (type: string) => {
      const tmpl = SECTION_TEMPLATES[type];
      if (!tmpl) return;
      onChange([
        ...sections,
        { id: generateId(), label: tmpl.label, emoji: tmpl.emoji, content: "" },
      ]);
    },
    [sections, onChange]
  );

  return (
    <div className="space-y-2">
      {sections.map((section, i) => (
        <div
          key={section.id}
          className="group relative rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 overflow-hidden transition-all hover:border-teal-300 dark:hover:border-teal-600"
        >
          {/* Section Header */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-zinc-800 border-b border-gray-100 dark:border-zinc-700">
            <GripVertical className="size-3.5 text-gray-400 shrink-0" />
            <span className="text-sm">{section.emoji}</span>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 flex-1">
              {section.label}
            </span>

            {/* Move Buttons */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => moveUp(i)}
                disabled={i === 0}
                className="p-1 rounded hover:bg-teal-100 dark:hover:bg-teal-900/40 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                title="Move up"
              >
                <ChevronUp className="size-3.5 text-teal-600" />
              </button>
              <button
                onClick={() => moveDown(i)}
                disabled={i === sections.length - 1}
                className="p-1 rounded hover:bg-teal-100 dark:hover:bg-teal-900/40 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                title="Move down"
              >
                <ChevronDown className="size-3.5 text-teal-600" />
              </button>
              <button
                onClick={() => removeSection(i)}
                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors ml-1"
                title="Remove section"
              >
                <Trash2 className="size-3 text-red-400" />
              </button>
            </div>
          </div>

          {/* Section Content */}
          <textarea
            value={section.content}
            onChange={(e) => updateContent(i, e.target.value)}
            rows={Math.max(2, Math.ceil(section.content.length / 60))}
            className="w-full px-3 py-2 text-sm bg-transparent border-0 resize-none focus:outline-none focus:ring-0 text-gray-700 dark:text-gray-300 placeholder:text-gray-400"
            placeholder={SECTION_TEMPLATES[section.label.toLowerCase().replace(/\s+/g, "_")]?.placeholder || "Write content..."}
          />
        </div>
      ))}

      {/* Add Section Button */}
      <div className="flex items-center gap-2 pt-1">
        <Select onValueChange={addSection}>
          <SelectTrigger className="h-8 text-xs w-48 border-dashed">
            <Plus className="size-3 mr-1" />
            <SelectValue placeholder="Add section..." />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SECTION_TEMPLATES).map(([key, tmpl]) => (
              <SelectItem key={key} value={key}>
                {tmpl.emoji} {tmpl.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ─── Live Preview ────────────────────────────────────────────────────────────

function UpdatePreview({ sections, clientName }: { sections: ContentSection[]; clientName: string }) {
  const content = sectionsToContent(sections);
  if (!content.trim()) return null;

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="bg-green-600 px-4 py-2 text-white text-xs font-bold flex items-center gap-2">
        🌿 Greenscape Update — {clientName}
      </div>
      <div className="p-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-zinc-800/50">
        {content}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

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

  // Section-based content
  const [sections, setSections] = useState<ContentSection[]>([]);

  const activeProjects = projects?.filter((p) => p.status === "active");

  const getClientEmail = (clientName: string, leadId?: string): string | undefined => {
    if (leadId) {
      const lead = leads?.find((l) => l._id === leadId);
      if (lead?.email) return lead.email;
    }
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
      const parsed = parseContentIntoSections(result.content);
      setSections(parsed);
      toast.success("Generated! Rearrange sections as needed.");
    } catch {
      toast.error("Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    const project = projects?.find((p) => p._id === selectedProject);
    const content = sectionsToContent(sections);
    if (!project || !content.trim()) return;
    try {
      await createUpdate({
        projectId: project._id,
        clientName: project.clientName,
        updateType,
        content: content.trim(),
      });
      toast.success("Update saved!");
      setShowCreate(false);
      setSelectedProject("");
      setProgressDetails("");
      setSections([]);
    } catch {
      toast.error("Failed to save");
    }
  };

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
        <Dialog
          open={showCreate}
          onOpenChange={(open) => {
            setShowCreate(open);
            if (!open) {
              setSections([]);
              setProgressDetails("");
              setSelectedProject("");
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold">
              <Sparkles className="size-4 mr-1" /> Generate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                <Sparkles className="size-4 inline mr-1" /> Generate Client Update
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Project & Type Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Project</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeProjects?.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.clientName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium">Type</Label>
                  <Select value={updateType} onValueChange={setUpdateType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(UPDATE_TYPES).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v.emoji} {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes Input */}
              <div>
                <Label className="text-xs font-medium">What happened?</Label>
                <Textarea
                  placeholder="Quick notes — AI turns them into a warm client message"
                  value={progressDetails}
                  onChange={(e) => setProgressDetails(e.target.value)}
                  rows={3}
                />
              </div>

              <Button onClick={handleGenerate} disabled={generating} className="w-full">
                {generating ? (
                  <><div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> Generating...</>
                ) : (
                  <><Sparkles className="size-4 mr-1" /> Generate with AI</>
                )}
              </Button>

              {/* Section Editor — appears after generation */}
              {sections.length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2">
                    <Pencil className="size-3.5 text-teal-600" />
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      Arrange Sections — drag up/down to reorder
                    </span>
                  </div>

                  <SectionEditor sections={sections} onChange={setSections} />

                  {/* Live Preview */}
                  <div className="pt-2">
                    <Label className="text-xs font-medium mb-2 block text-gray-500">Preview</Label>
                    <UpdatePreview
                      sections={sections}
                      clientName={projects?.find((p) => p._id === selectedProject)?.clientName || "Client"}
                    />
                  </div>

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
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-muted-foreground">
                        {t.label}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(update._creationTime).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {stripMarkdown(update.content)}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {update.sentVia ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 px-2 py-1 bg-green-50 dark:bg-green-950/30 rounded-full">
                        <Check className="size-3" /> Sent
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white h-8"
                        disabled={sendingEmail === update._id}
                        onClick={() => handleSendEmail(update._id)}
                      >
                        {sendingEmail === update._id ? (
                          <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send className="size-3.5 mr-1" /> Send
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        navigator.clipboard.writeText(stripMarkdown(update.content));
                        toast.success("Copied");
                      }}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive"
                      onClick={() => {
                        removeUpdate({ id: update._id });
                        toast.success("Removed");
                      }}
                    >
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
