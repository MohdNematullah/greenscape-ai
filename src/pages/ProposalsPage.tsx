import { useMutation, useQuery, useAction } from "convex/react";
import { useState } from "react";
import {
  FileText,
  Sparkles,
  ChevronDown,
  Send,
  CheckCircle,
  Pencil,
  Trash2,
  Clock,
  AlertTriangle,
  Eye,
  DollarSign,
  Zap,
  ClipboardList,
  Mail,
  Copy,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { renderMarkdown, stripMarkdown } from "@/lib/renderMarkdown";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusConfig: Record<string, { bg: string; label: string; icon: string }> = {
  draft: { bg: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", label: "Draft", icon: "📝" },
  review: { bg: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300", label: "In Review", icon: "👀" },
  approved: { bg: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300", label: "Approved", icon: "✅" },
  sent: { bg: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300", label: "Sent", icon: "📧" },
  signed: { bg: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300", label: "Signed", icon: "🎉" },
  rejected: { bg: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300", label: "Rejected", icon: "❌" },
};

export function ProposalsPage() {
  const proposals = useQuery(api.proposals.list, {});
  const leads = useQuery(api.leads.list, {});
  const pricingItems = useQuery(api.pricingItems.list, {});
  const createProposal = useMutation(api.proposals.create);
  const approveProposal = useMutation(api.proposals.approve);
  const markSent = useMutation(api.proposals.markSent);
  const markSigned = useMutation(api.proposals.markSigned);
  const removeProposal = useMutation(api.proposals.remove);
  const generateProposal = useAction(api.ai.generateProposal);
  const sendEmail = useAction(api.integrations.sendCustomerEmail);

  const [showCreate, setShowCreate] = useState(false);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [emailDialog, setEmailDialog] = useState<string | null>(null);
  const [emailTo, setEmailTo] = useState("");

  // Form
  const [selectedLead, setSelectedLead] = useState("");
  const [siteWalkNotes, setSiteWalkNotes] = useState("");
  const [siteWalkDate, setSiteWalkDate] = useState("");
  const [projectType, setProjectType] = useState("");
  const [features, setFeatures] = useState("");
  const [budgetRange, setBudgetRange] = useState("");

  const qualifiedLeads = leads?.filter((l) =>
    ["qualified", "site_walk_booked", "site_walk_done", "contacted"].includes(l.status)
  );

  const handleGenerate = async () => {
    if (!selectedLead || !siteWalkNotes.trim()) {
      toast.error("Select a lead and enter site walk notes");
      return;
    }
    const lead = leads?.find((l) => l._id === selectedLead);
    if (!lead) return;

    setGenerating(true);
    try {
      const pricingRef = pricingItems
        ?.map((p) => `${p.itemName} (${p.category}): $${p.finalPrice}/${p.unit}`)
        .join("\n") || "";

      const result = await generateProposal({
        clientName: lead.name,
        projectType: projectType || lead.projectType || "outdoor living",
        siteWalkNotes: siteWalkNotes.trim(),
        features: features || undefined,
        budget: budgetRange || lead.budget || undefined,
        pricingData: pricingRef,
      });

      await createProposal({
        leadId: lead._id as Id<"leads">,
        clientName: lead.name,
        projectType: projectType || lead.projectType || "outdoor living",
        siteWalkNotes: siteWalkNotes.trim(),
        siteWalkDate: siteWalkDate || undefined,
        scopeJson: result.scopeJson,
        lineItemsJson: result.lineItemsJson,
        totalAmount: result.estimatedTotal || undefined,
        proposalContent: result.proposalContent,
        needsRender: (result.estimatedTotal || 0) > 30000,
      });

      toast.success("Proposal generated!", { description: `${lead.name} — ready for review` });
      setShowCreate(false);
      setSelectedLead(""); setSiteWalkNotes(""); setSiteWalkDate("");
      setProjectType(""); setFeatures(""); setBudgetRange("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate proposal");
    } finally {
      setGenerating(false);
    }
  };

  const handleSendEmail = async (proposalId: string) => {
    const proposal = proposals?.find((p) => p._id === proposalId);
    if (!proposal || !emailTo.trim()) {
      toast.error("Enter a valid email address");
      return;
    }
    setSendingEmail(proposalId);
    try {
      const result = await sendEmail({
        to: emailTo.trim(),
        clientName: proposal.clientName,
        subject: `Greenscape Proposal — ${proposal.projectType.replace(/_/g, " ")}`,
        content: stripMarkdown(proposal.proposalContent || ""),
        updateType: "proposal",
      });
      if (result.success) {
        await markSent({ id: proposal._id });
        toast.success("Proposal sent via email!", { description: `Sent to ${emailTo}` });
        setEmailDialog(null);
        setEmailTo("");
      } else {
        toast.error(result.error || "Failed to send email");
      }
    } catch {
      toast.error("Failed to send email — check email configuration");
    } finally {
      setSendingEmail(null);
    }
  };

  const copyProposal = (content: string) => {
    navigator.clipboard.writeText(stripMarkdown(content));
    toast.success("Copied to clipboard!");
  };

  const previewProposal = proposals?.find((p) => p._id === showPreview);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="size-6" />
              <h1 className="text-3xl font-bold">Proposals</h1>
            </div>
            <p className="text-blue-100 text-lg">
              Site walk → AI scope → line items → send. Target: under 2 days.
            </p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="bg-white text-indigo-700 hover:bg-blue-50 font-bold shadow-lg px-6 py-5 text-base">
                <Sparkles className="size-5 mr-2" /> AI Proposal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white rounded-t-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-white text-xl">
                    <Sparkles className="size-5" /> AI Proposal Generator
                  </DialogTitle>
                </DialogHeader>
                <p className="text-blue-100 mt-2 text-sm">
                  Paste site walk notes → AI builds a full proposal with line items
                </p>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-indigo-600">1. Select Lead</Label>
                  <Select value={selectedLead} onValueChange={setSelectedLead}>
                    <SelectTrigger className="h-12"><SelectValue placeholder="Choose a qualified lead..." /></SelectTrigger>
                    <SelectContent>
                      {qualifiedLeads?.map((lead) => (
                        <SelectItem key={lead._id} value={lead._id}>
                          {lead.name} — {lead.projectType || "General"} {lead.budget ? `($${lead.budget})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-indigo-600">2. Project Details</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Site Walk Date</Label>
                      <Input type="date" value={siteWalkDate} onChange={(e) => setSiteWalkDate(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Project Type</Label>
                      <Input placeholder="e.g. Patio + Fire Pit" value={projectType} onChange={(e) => setProjectType(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Budget Range</Label>
                      <Input placeholder="$25,000 - $35,000" value={budgetRange} onChange={(e) => setBudgetRange(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-indigo-600">3. Site Walk Notes</Label>
                  <Textarea
                    placeholder="Paste site walk notes — measurements, features, client preferences, grade/slope, access issues..."
                    value={siteWalkNotes}
                    onChange={(e) => setSiteWalkNotes(e.target.value)}
                    rows={6}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Additional Features (optional)</Label>
                  <Input placeholder="Lighting, irrigation, drainage, etc." value={features} onChange={(e) => setFeatures(e.target.value)} />
                </div>
                <Button onClick={handleGenerate} disabled={generating} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-6 text-base font-bold" size="lg">
                  {generating ? (
                    <><div className="size-5 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating... (30-60s)</>
                  ) : (
                    <><Sparkles className="size-5 mr-2" /> Generate Proposal</>
                  )}
                </Button>
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><ClipboardList className="size-3" /> Auto-priced from {pricingItems?.length || 55} items</span>
                  <span className="flex items-center gap-1"><DollarSign className="size-3" /> Phoenix market rates</span>
                  <span className="flex items-center gap-1"><Zap className="size-3" /> ~60 seconds</span>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Proposal Cards */}
      <div className="space-y-3">
        {proposals?.map((proposal) => {
          const cfg = statusConfig[proposal.status] || statusConfig.draft;
          return (
            <Card key={proposal._id} className="hover:shadow-md transition-all border-0 bg-white dark:bg-zinc-900">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-bold text-lg">{proposal.clientName}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                      {proposal.needsRender && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${proposal.renderStatus === "done" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          🎨 Render: {proposal.renderStatus || "pending"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>🏗️ {proposal.projectType.replace(/_/g, " ")}</span>
                      {proposal.totalAmount && (
                        <span className="font-bold text-green-600 text-base">
                          ${proposal.totalAmount.toLocaleString()}
                        </span>
                      )}
                      {proposal.daysToGenerate && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
                          <Clock className="size-3" /> {proposal.daysToGenerate}d cycle
                        </span>
                      )}
                      {proposal.totalAmount && proposal.totalAmount > 30000 && !proposal.needsRender && (
                        <span className="flex items-center gap-1 text-amber-600 text-xs">
                          <AlertTriangle className="size-3" /> $30K+ — needs render
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {proposal.proposalContent && (
                      <>
                        <Button size="sm" variant="outline" className="text-indigo-600 border-indigo-200"
                          onClick={() => setShowPreview(proposal._id)}>
                          <Eye className="size-4 mr-1" /> Preview
                        </Button>
                        <Button size="sm" variant="outline" className="text-green-600 border-green-200"
                          onClick={() => { setEmailDialog(proposal._id); setEmailTo(""); }}>
                          <Mail className="size-4 mr-1" /> Send
                        </Button>
                      </>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost"><ChevronDown className="size-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {proposal.status === "draft" && (
                          <DropdownMenuItem onClick={() => { approveProposal({ id: proposal._id, approvedBy: "Owner" }); toast.success("Approved"); }}>
                            <CheckCircle className="size-4 mr-1" /> Approve
                          </DropdownMenuItem>
                        )}
                        {["draft", "approved"].includes(proposal.status) && (
                          <DropdownMenuItem onClick={() => { markSent({ id: proposal._id }); toast.success("Marked sent"); }}>
                            <Send className="size-4 mr-1" /> Mark Sent
                          </DropdownMenuItem>
                        )}
                        {proposal.status === "sent" && (
                          <DropdownMenuItem onClick={() => { markSigned({ id: proposal._id }); toast.success("🎉 Signed!"); }}>
                            <Pencil className="size-4 mr-1" /> Mark Signed
                          </DropdownMenuItem>
                        )}
                        {proposal.proposalContent && (
                          <DropdownMenuItem onClick={() => copyProposal(proposal.proposalContent!)}>
                            <Copy className="size-4 mr-1" /> Copy Text
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive" onClick={() => { removeProposal({ id: proposal._id }); toast.success("Deleted"); }}>
                          <Trash2 className="size-4 mr-1" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {proposals?.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="size-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-semibold">No proposals yet</p>
            <p className="text-sm mt-1">Use the AI Proposal Generator to create your first one</p>
          </div>
        )}
      </div>

      {/* ── Proposal Preview Dialog ─────────────────────────────────── */}
      <Dialog open={!!showPreview} onOpenChange={() => setShowPreview(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          {previewProposal && (
            <>
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white rounded-t-lg">
                <DialogHeader>
                  <DialogTitle className="text-white text-xl flex items-center gap-3">
                    <FileText className="size-5" /> Proposal: {previewProposal.clientName}
                  </DialogTitle>
                </DialogHeader>
                <div className="flex items-center gap-4 mt-3 text-sm text-green-100">
                  <span>🏗️ {previewProposal.projectType.replace(/_/g, " ")}</span>
                  {previewProposal.totalAmount && (
                    <span className="font-bold text-white text-lg bg-white/20 px-3 py-0.5 rounded-full">
                      ${previewProposal.totalAmount.toLocaleString()}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 capitalize">
                    {previewProposal.status}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Line items table */}
                {previewProposal.lineItemsJson && previewProposal.lineItemsJson !== "[]" && (
                  <div>
                    <h4 className="font-bold text-lg flex items-center gap-2 mb-3">
                      <DollarSign className="size-5 text-green-600" /> Line Items
                    </h4>
                    <div className="border rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-zinc-800">
                          <tr>
                            <th className="text-left p-3 font-semibold">Item</th>
                            <th className="text-right p-3 font-semibold">Qty</th>
                            <th className="text-right p-3 font-semibold">Unit Price</th>
                            <th className="text-right p-3 font-semibold">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            try {
                              return JSON.parse(previewProposal.lineItemsJson).map(
                                (item: { item: string; qty: number; unitPrice: number; total: number; unit: string }, i: number) => (
                                  <tr key={i} className="border-t">
                                    <td className="p-3 font-medium">{item.item}</td>
                                    <td className="text-right p-3 text-muted-foreground">{item.qty} {item.unit}</td>
                                    <td className="text-right p-3 text-muted-foreground">${item.unitPrice?.toLocaleString()}</td>
                                    <td className="text-right p-3 font-bold text-green-600">${item.total?.toLocaleString()}</td>
                                  </tr>
                                )
                              );
                            } catch { return null; }
                          })()}
                        </tbody>
                        {previewProposal.totalAmount && (
                          <tfoot>
                            <tr className="bg-green-50 dark:bg-green-950/20 border-t-2 border-green-200">
                              <td colSpan={3} className="p-3 text-right font-bold text-lg">Total Investment</td>
                              <td className="p-3 text-right font-extrabold text-lg text-green-700">${previewProposal.totalAmount.toLocaleString()}</td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                )}

                {/* Full proposal content — clean rendered */}
                {previewProposal.proposalContent && (
                  <div>
                    <h4 className="font-bold text-lg flex items-center gap-2 mb-3">
                      <FileText className="size-5 text-indigo-600" /> Full Proposal
                    </h4>
                    <div className="border rounded-xl p-8 bg-white dark:bg-zinc-900 text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(previewProposal.proposalContent) }}
                    />
                  </div>
                )}

                {/* Action buttons in preview */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => { setEmailDialog(previewProposal._id); setEmailTo(""); setShowPreview(null); }}>
                    <Mail className="size-4 mr-2" /> Send via Email
                  </Button>
                  <Button variant="outline" onClick={() => copyProposal(previewProposal.proposalContent || "")}>
                    <Copy className="size-4 mr-2" /> Copy Text
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Email Send Dialog ───────────────────────────────────────── */}
      <Dialog open={!!emailDialog} onOpenChange={() => setEmailDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="size-5 text-green-600" /> Send Proposal via Email
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Client Email</Label>
              <Input
                type="email"
                placeholder="client@email.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                className="mt-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              The proposal will be sent as a branded Greenscape email with the full scope, line items, and next steps.
            </p>
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                disabled={!emailTo.trim() || sendingEmail === emailDialog}
                onClick={() => emailDialog && handleSendEmail(emailDialog)}
              >
                {sendingEmail === emailDialog ? (
                  <><div className="size-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                ) : (
                  <><Send className="size-4 mr-2" /> Send Proposal</>
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
