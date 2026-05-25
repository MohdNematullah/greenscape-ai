import { useMutation, useQuery, useAction } from "convex/react";
import { useState } from "react";
import {
  Users,
  Plus,
  Search,
  Sparkles,
  ChevronDown,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Home,
  Building,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const SOURCE_OPTIONS = [
  { value: "meta_ad", label: "Meta Ad" },
  { value: "google_lsa", label: "Google LSA" },
  { value: "referral", label: "Referral" },
  { value: "website", label: "Website" },
  { value: "manual", label: "Manual" },
];

const PROJECT_TYPES = [
  { value: "patio", label: "Patio" },
  { value: "pergola", label: "Pergola / Shade" },
  { value: "fire_pit", label: "Fire Pit / Fireplace" },
  { value: "outdoor_kitchen", label: "Outdoor Kitchen" },
  { value: "retaining_wall", label: "Retaining Wall" },
  { value: "full_outdoor_living", label: "Full Outdoor Living" },
  { value: "artificial_turf", label: "Artificial Turf" },
  { value: "water_feature", label: "Water Feature" },
  { value: "landscape_design", label: "Landscape Design" },
  { value: "lighting", label: "Landscape Lighting" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "disqualified", label: "Disqualified" },
  { value: "site_walk_booked", label: "Site Walk Booked" },
  { value: "site_walk_done", label: "Site Walk Done" },
  { value: "proposal_sent", label: "Proposal Sent" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "closed_lost", label: "Closed-Lost" },
];

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-sky-100 text-sky-800",
  qualified: "bg-green-100 text-green-800",
  disqualified: "bg-red-100 text-red-800",
  site_walk_booked: "bg-amber-100 text-amber-800",
  site_walk_done: "bg-orange-100 text-orange-800",
  proposal_sent: "bg-purple-100 text-purple-800",
  won: "bg-emerald-100 text-emerald-800",
  lost: "bg-gray-100 text-gray-800",
  closed_lost: "bg-gray-100 text-gray-600",
};

export function LeadsPage() {
  const leads = useQuery(api.leads.list, {});
  const createLead = useMutation(api.leads.create);
  const qualifyMutation = useMutation(api.leads.qualify);
  const updateLead = useMutation(api.leads.update);
  const removeLead = useMutation(api.leads.remove);
  const qualifyAI = useAction(api.ai.qualifyLead);
  const notifySlack = useAction(api.integrations.notifyNewLead);

  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [qualifying, setQualifying] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formSource, setFormSource] = useState("manual");
  const [formProjectType, setFormProjectType] = useState("");
  const [formBudget, setFormBudget] = useState("");
  const [formTimeline, setFormTimeline] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formIsHomeowner, setFormIsHomeowner] = useState<string>("unknown");
  const [formHasHoa, setFormHasHoa] = useState<string>("unknown");

  const resetForm = () => {
    setFormName(""); setFormEmail(""); setFormPhone(""); setFormAddress("");
    setFormSource("manual"); setFormProjectType(""); setFormBudget("");
    setFormTimeline(""); setFormNotes(""); setFormIsHomeowner("unknown");
    setFormHasHoa("unknown");
  };

  const handleCreate = async () => {
    if (!formName.trim()) { toast.error("Name is required"); return; }
    try {
      await createLead({
        name: formName.trim(),
        email: formEmail.trim() || undefined,
        phone: formPhone.trim() || undefined,
        address: formAddress.trim() || undefined,
        source: formSource,
        projectType: formProjectType || undefined,
        budget: formBudget || undefined,
        timeline: formTimeline || undefined,
        notes: formNotes.trim() || undefined,
        isHomeowner: formIsHomeowner === "yes" ? true : formIsHomeowner === "no" ? false : undefined,
        hasHoa: formHasHoa === "yes" ? true : formHasHoa === "no" ? false : undefined,
      });
      toast.success("Lead added successfully");
      resetForm();
      setShowAdd(false);
    } catch {
      toast.error("Failed to add lead");
    }
  };

  const handleQualify = async (leadId: Id<"leads">) => {
    const lead = leads?.find((l) => l._id === leadId);
    if (!lead) return;

    setQualifying(leadId);
    try {
      const result = await qualifyAI({
        name: lead.name,
        projectType: lead.projectType,
        budget: lead.budget,
        timeline: lead.timeline,
        notes: lead.notes,
        source: lead.source,
        isHomeowner: lead.isHomeowner,
        hasHoa: lead.hasHoa,
      });

      await qualifyMutation({
        id: leadId,
        qualified: result.qualified,
        qualificationReason: result.reason,
        qualificationScore: result.score,
        estimatedValue: result.estimatedValue,
        recommendedNextStep: result.recommendedNextStep,
      });

      // Send Slack notification for new qualified/disqualified lead
      try {
        await notifySlack({
          name: lead.name,
          source: lead.source,
          projectType: lead.projectType,
          budget: lead.budget,
          qualified: result.qualified,
          score: result.score,
          estimatedValue: result.estimatedValue,
        });
      } catch {
        // Slack notification is best-effort
        console.log("Slack notification skipped");
      }

      toast.success(
        result.qualified ? "Lead qualified! ✅" : "Lead disqualified ❌",
        { description: result.reason }
      );
    } catch {
      toast.error("AI qualification failed");
    } finally {
      setQualifying(null);
    }
  };

  const filteredLeads = leads?.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery) ||
      lead.address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Users className="size-6" />
              <h1 className="text-3xl font-bold">Leads</h1>
            </div>
            <p className="text-cyan-100 text-lg">
              Qualify leads before they hit your calendar
            </p>
          </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button className="bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-lg px-6 py-5 text-base"><Plus className="size-4 mr-2" />Add Lead</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Name *</Label>
                  <Input placeholder="John Smith" value={formName} onChange={(e) => setFormName(e.target.value)} />
                </div>
                <div>
                  <Label>Source</Label>
                  <Select value={formSource} onValueChange={setFormSource}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SOURCE_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Email</Label>
                  <Input placeholder="john@email.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input placeholder="(555) 123-4567" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Input placeholder="123 Main St, Phoenix AZ" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Project Type</Label>
                  <Select value={formProjectType} onValueChange={setFormProjectType}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {PROJECT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Budget ($)</Label>
                  <Input type="number" placeholder="28000" value={formBudget} onChange={(e) => setFormBudget(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Timeline</Label>
                  <Input placeholder="Spring 2026" value={formTimeline} onChange={(e) => setFormTimeline(e.target.value)} />
                </div>
                <div>
                  <Label>Homeowner?</Label>
                  <Select value={formIsHomeowner} onValueChange={setFormIsHomeowner}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unknown">Unknown</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No (Renter)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>HOA?</Label>
                  <Select value={formHasHoa} onValueChange={setFormHasHoa}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unknown">Unknown</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  placeholder="Project details, special requests, how they found us..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <Button onClick={handleCreate} className="w-full">Add Lead</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lead Cards */}
      <div className="space-y-3">
        {filteredLeads?.map((lead) => (
          <Card key={lead._id} className="hover:shadow-md transition-all duration-300 border-0 bg-gradient-to-r from-white to-blue-50/30 dark:from-zinc-900 dark:to-blue-950/20 hover:scale-[1.003]">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg">{lead.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[lead.status] || "bg-gray-100"}`}>
                      {lead.status.replace(/_/g, " ")}
                    </span>
                    {lead.qualified === true && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        ✅ Qualified {lead.qualificationScore ? `(${lead.qualificationScore})` : ""}
                      </span>
                    )}
                    {lead.qualified === false && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        ❌ Disqualified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground flex-wrap">
                    {lead.email && <span className="flex items-center gap-1"><Mail className="size-3" />{lead.email}</span>}
                    {lead.phone && <span className="flex items-center gap-1"><Phone className="size-3" />{lead.phone}</span>}
                    {lead.budget && <span className="flex items-center gap-1"><DollarSign className="size-3" />{lead.budget}</span>}
                    {lead.address && <span className="flex items-center gap-1"><MapPin className="size-3" />{lead.address}</span>}
                    <span className="flex items-center gap-1">📍 {SOURCE_OPTIONS.find(s => s.value === lead.source)?.label || lead.source}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {lead.projectType && (
                      <span>🏗️ {PROJECT_TYPES.find(t => t.value === lead.projectType)?.label || lead.projectType}</span>
                    )}
                    {lead.isHomeowner === true && <span className="flex items-center gap-0.5"><Home className="size-3" />Homeowner</span>}
                    {lead.isHomeowner === false && <span className="flex items-center gap-0.5"><Building className="size-3" />Renter</span>}
                    {lead.hasHoa && <span>🏘️ HOA</span>}
                    {lead.timeline && <span>📅 {lead.timeline}</span>}
                  </div>
                  {lead.qualificationReason && (
                    <p className="mt-2 text-sm text-muted-foreground border-l-2 border-primary/30 pl-3 italic">
                      {lead.qualificationReason}
                    </p>
                  )}
                  {lead.estimatedValue && lead.estimatedValue !== "Unknown" && (
                    <p className="text-sm font-medium text-green-700 dark:text-green-400 mt-1">
                      Est. Value: {lead.estimatedValue}
                    </p>
                  )}
                  {lead.recommendedNextStep && lead.recommendedNextStep !== "Manual review required" && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      → {lead.recommendedNextStep}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQualify(lead._id)}
                    disabled={qualifying === lead._id}
                  >
                    <Sparkles className="size-4 mr-1" />
                    {qualifying === lead._id ? "Qualifying..." : "AI Qualify"}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost"><ChevronDown className="size-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {["contacted", "site_walk_booked", "site_walk_done", "won", "lost", "closed_lost"].map((s) => (
                        <DropdownMenuItem
                          key={s}
                          onClick={() => updateLead({ id: lead._id, status: s })}
                        >
                          Mark as {s.replace(/_/g, " ")}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          removeLead({ id: lead._id });
                          toast.success("Lead removed");
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

        {filteredLeads?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="size-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No leads found</p>
            <p className="text-sm">Add your first lead or adjust filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
