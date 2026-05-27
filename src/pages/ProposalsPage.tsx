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
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { renderMarkdown } from "@/lib/renderMarkdown";
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

const statusColors: Record<string, string> = {
  draft: "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 dark:from-gray-800 dark:to-gray-700 dark:text-gray-300",
  review: "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 dark:from-amber-900/50 dark:to-orange-900/50 dark:text-amber-300",
  approved: "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 dark:from-blue-900/50 dark:to-cyan-900/50 dark:text-blue-300",
  sent: "bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 dark:from-purple-900/50 dark:to-violet-900/50 dark:text-purple-300",
  signed: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/50 dark:to-emerald-900/50 dark:text-green-300",
  rejected: "bg-gradient-to-r from-red-100 to-rose-100 text-red-800 dark:from-red-900/50 dark:to-rose-900/50 dark:text-red-300",
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

  const [showCreate, setShowCreate] = useState(false);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

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

      toast.success("Proposal generated! 🚀", {
        description: `${lead.name} — ready for review`,
      });
      setShowCreate(false);
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate proposal");
    } finally {
      setGenerating(false);
    }
  };

  const resetForm = () => {
    setSelectedLead(""); setSiteWalkNotes(""); setSiteWalkDate("");
    setProjectType(""); setFeatures(""); setBudgetRange("");
  };

  const previewProposal = proposals?.find((p) => p._id === showPreview);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
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
                <Sparkles className="size-5 mr-2" />
                AI Proposal Generator
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
              {/* Generator Header */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white rounded-t-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-white text-xl">
                    <div className="p-2 rounded-xl bg-white/20">
                      <Sparkles className="size-5" />
                    </div>
                    AI Proposal Generator
                  </DialogTitle>
                </DialogHeader>
                <p className="text-blue-100 mt-2 text-sm">
                  Paste site walk notes → AI builds a full proposal with line items in ~60 seconds
                </p>
              </div>

              <div className="p-6 space-y-5">
                {/* Step 1: Lead Selection */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    <span className="size-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center text-xs">1</span>
                    Select Lead
                  </div>
                  <Select value={selectedLead} onValueChange={setSelectedLead}>
                    <SelectTrigger className="h-12 border-2 border-indigo-100 dark:border-indigo-900 focus:border-indigo-400"><SelectValue placeholder="Choose a qualified lead..." /></SelectTrigger>
                    <SelectContent>
                      {qualifiedLeads?.map((lead) => (
                        <SelectItem key={lead._id} value={lead._id}>
                          {lead.name} — {lead.projectType || "General"} {lead.budget ? `($${lead.budget})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Step 2: Project Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    <span className="size-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center text-xs">2</span>
                    Project Details
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Site Walk Date</Label>
                      <Input type="date" value={siteWalkDate} onChange={(e) => setSiteWalkDate(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Project Type</Label>
                      <Input placeholder="e.g. Patio + Fire Pit" value={projectType} onChange={(e) => setProjectType(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Budget Range</Label>
                      <Input placeholder="$25,000 - $35,000" value={budgetRange} onChange={(e) => setBudgetRange(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Step 3: Site Walk Notes */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    <span className="size-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center text-xs">3</span>
                    Site Walk Notes
                  </div>
                  <Textarea
                    placeholder="Paste the site walk notes here. Include measurements, features discussed, client preferences, existing conditions, grade/slope, access issues, etc.

Example: '40x20 backyard, wants travertine patio with built-in fire pit, 6ft seat wall along east side, 8 pathway lights, remove existing grass, slight grade (2%) needs drainage solution, client prefers warm tones, HOA requires earth tones only...'"
                    value={siteWalkNotes}
                    onChange={(e) => setSiteWalkNotes(e.target.value)}
                    rows={8}
                    className="font-mono text-sm border-2 border-indigo-100 dark:border-indigo-900 focus:border-indigo-400"
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Zap className="size-3 text-amber-500" />
                    The more detail you include, the more accurate the AI proposal will be
                  </p>
                </div>

                {/* Step 4: Additional Features */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    <span className="size-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center text-xs">4</span>
                    Additional Features (optional)
                  </div>
                  <Input placeholder="Lighting, irrigation, drainage, accent boulders, etc." value={features} onChange={(e) => setFeatures(e.target.value)} />
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 hover:from-indigo-700 hover:via-blue-700 hover:to-violet-700 text-white shadow-lg py-6 text-base font-bold"
                  size="lg"
                >
                  {generating ? (
                    <>
                      <div className="size-5 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating proposal... (30-60s)
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-5 mr-2" />
                      Generate Proposal with AI
                    </>
                  )}
                </Button>

                {/* Info badges */}
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

      {/* Proposal List */}
      <div className="space-y-3">
        {proposals?.map((proposal) => (
          <Card key={proposal._id} className="hover:shadow-md transition-all duration-300 border-0 bg-gradient-to-r from-white to-gray-50/50 dark:from-zinc-900 dark:to-zinc-800/50 hover:scale-[1.005]">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-bold text-lg">{proposal.clientName}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColors[proposal.status]}`}>
                      {proposal.status}
                    </span>
                    {proposal.needsRender && (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        proposal.renderStatus === "done"
                          ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 dark:from-green-900/50 dark:to-emerald-900/50"
                          : "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 dark:from-yellow-900/50 dark:to-amber-900/50"
                      }`}>
                        🎨 Render: {proposal.renderStatus || "pending"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">🏗️ {proposal.projectType}</span>
                    {proposal.totalAmount && (
                      <span className="font-bold text-green-600 dark:text-green-400 text-base">
                        ${proposal.totalAmount.toLocaleString()}
                      </span>
                    )}
                    {proposal.daysToGenerate && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs font-medium">
                        <Clock className="size-3" />
                        {proposal.daysToGenerate}d cycle
                      </span>
                    )}
                    {proposal.totalAmount && proposal.totalAmount > 30000 && !proposal.needsRender && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <AlertTriangle className="size-3" />
                        $30K+ — needs design render
                      </span>
                    )}
                  </div>
                  {proposal.siteWalkNotes && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-1 bg-muted/30 px-3 py-1.5 rounded-lg">
                      📝 {proposal.siteWalkNotes.slice(0, 150)}...
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {proposal.proposalContent && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
                      onClick={() => setShowPreview(proposal._id)}
                    >
                      <Eye className="size-4 mr-1" />
                      Preview
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost"><ChevronDown className="size-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {proposal.status === "draft" && (
                        <DropdownMenuItem onClick={() => {
                          approveProposal({ id: proposal._id, approvedBy: "Owner" });
                          toast.success("Proposal approved");
                        }}>
                          <CheckCircle className="size-4 mr-1" />Approve
                        </DropdownMenuItem>
                      )}
                      {(proposal.status === "draft" || proposal.status === "approved") && (
                        <DropdownMenuItem onClick={() => {
                          markSent({ id: proposal._id });
                          toast.success("Marked as sent");
                        }}>
                          <Send className="size-4 mr-1" />Mark Sent
                        </DropdownMenuItem>
                      )}
                      {proposal.status === "sent" && (
                        <DropdownMenuItem onClick={() => {
                          markSigned({ id: proposal._id });
                          toast.success("🎉 Proposal signed!");
                        }}>
                          <Pencil className="size-4 mr-1" />Mark Signed
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          removeProposal({ id: proposal._id });
                          toast.success("Proposal removed");
                        }}
                      >
                        <Trash2 className="size-4 mr-1" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {proposals?.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="size-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/30 flex items-center justify-center">
              <FileText className="size-10 text-indigo-400" />
            </div>
            <p className="text-lg font-semibold">No proposals yet</p>
            <p className="text-sm mt-1">Use the AI Proposal Generator to create your first one from site walk notes</p>
          </div>
        )}
      </div>

      {/* Proposal Preview Dialog */}
      <Dialog open={!!showPreview} onOpenChange={() => setShowPreview(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          {previewProposal && (
            <>
              {/* Preview Header */}
              <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-6 text-white rounded-t-lg">
                <DialogHeader>
                  <DialogTitle className="text-white text-xl flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/20">
                      <FileText className="size-5" />
                    </div>
                    Proposal: {previewProposal.clientName}
                  </DialogTitle>
                </DialogHeader>
                <div className="flex items-center gap-4 mt-3 text-sm text-green-100">
                  <span className="flex items-center gap-1">🏗️ {previewProposal.projectType}</span>
                  {previewProposal.totalAmount && (
                    <span className="font-bold text-white text-lg bg-white/20 px-3 py-0.5 rounded-full">
                      ${previewProposal.totalAmount.toLocaleString()}
                    </span>
                  )}
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 capitalize`}>
                    {previewProposal.status}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Line items table */}
                {previewProposal.lineItemsJson && previewProposal.lineItemsJson !== "[]" && (
                  <div>
                    <h4 className="font-bold text-lg flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                        <DollarSign className="size-4 text-white" />
                      </div>
                      Line Items
                    </h4>
                    <div className="border rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-sm">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-zinc-800 dark:to-zinc-700">
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
                              const items = JSON.parse(previewProposal.lineItemsJson);
                              return items.map((item: { item: string; qty: number; unitPrice: number; total: number; unit: string }, i: number) => (
                                <tr key={i} className="border-t hover:bg-gradient-to-r hover:from-green-50/50 hover:to-emerald-50/50 dark:hover:from-green-950/20 dark:hover:to-emerald-950/20 transition-colors">
                                  <td className="p-3 font-medium">{item.item}</td>
                                  <td className="text-right p-3 text-muted-foreground">{item.qty} {item.unit}</td>
                                  <td className="text-right p-3 text-muted-foreground">${item.unitPrice?.toLocaleString()}</td>
                                  <td className="text-right p-3 font-bold text-green-600 dark:text-green-400">${item.total?.toLocaleString()}</td>
                                </tr>
                              ));
                            } catch { return null; }
                          })()}
                        </tbody>
                        {previewProposal.totalAmount && (
                          <tfoot>
                            <tr className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-t-2 border-green-200 dark:border-green-800">
                              <td colSpan={3} className="p-3 text-right font-bold text-lg">Total Investment</td>
                              <td className="p-3 text-right font-extrabold text-lg text-green-700 dark:text-green-400">${previewProposal.totalAmount.toLocaleString()}</td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                )}
                {/* Full proposal content */}
                {previewProposal.proposalContent && (
                  <div>
                    <h4 className="font-bold text-lg flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
                        <FileText className="size-4 text-white" />
                      </div>
                      Full Proposal
                    </h4>
                    <div className="border rounded-xl p-8 bg-gradient-to-br from-white to-gray-50/50 dark:from-zinc-900 dark:to-zinc-800/50 shadow-inner text-sm leading-relaxed">
                      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(previewProposal.proposalContent) }} />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
