import { useMutation, useQuery, useAction } from "convex/react";
import { useState } from "react";
import {
  CheckSquare,
  Plus,
  Check,
  X,
  Clock,
  AlertTriangle,
  DollarSign,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
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

const APPROVAL_TYPES = [
  { value: "change_order", label: "Change Order" },
  { value: "add_on", label: "Add-On Pricing" },
  { value: "refund", label: "Refund" },
  { value: "material", label: "Material Approval" },
  { value: "schedule_change", label: "Schedule Change" },
  { value: "pricing", label: "Pricing Question" },
  { value: "other", label: "Other" },
];

const statusIcons: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  pending: { icon: Clock, color: "text-amber-600 bg-amber-50" },
  approved: { icon: Check, color: "text-green-600 bg-green-50" },
  denied: { icon: X, color: "text-red-600 bg-red-50" },
};

export function ApprovalsPage() {
  const approvals = useQuery(api.approvals.list, {});
  const createApproval = useMutation(api.approvals.create);
  const decideApproval = useMutation(api.approvals.decide);
  const notifySlackApproval = useAction(api.integrations.notifyApprovalRequest);

  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [decisionNote, setDecisionNote] = useState("");

  // Form
  const [formType, setFormType] = useState("change_order");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formClient, setFormClient] = useState("");
  const [formRequestedBy, setFormRequestedBy] = useState("Anna");
  const [formUrgency, setFormUrgency] = useState("normal");

  const handleCreate = async () => {
    if (!formTitle.trim() || !formDesc.trim()) {
      toast.error("Title and description required");
      return;
    }
    try {
      await createApproval({
        type: formType,
        title: formTitle.trim(),
        description: formDesc.trim(),
        amount: formAmount ? parseFloat(formAmount) : undefined,
        clientName: formClient.trim() || undefined,
        requestedBy: formRequestedBy,
        urgency: formUrgency,
      });

      // Send Slack notification for new approval request
      try {
        await notifySlackApproval({
          title: formTitle.trim(),
          type: formType,
          requestedBy: formRequestedBy,
          amount: formAmount ? parseFloat(formAmount) : undefined,
          urgency: formUrgency,
          clientName: formClient.trim() || undefined,
        });
      } catch {
        console.log("Slack notification skipped");
      }

      toast.success("Approval request submitted");
      setShowCreate(false);
      setFormTitle(""); setFormDesc(""); setFormAmount(""); setFormClient("");
    } catch {
      toast.error("Failed to create approval");
    }
  };

  const handleDecide = async (id: string, status: "approved" | "denied") => {
    try {
      await decideApproval({
        id: id as never,
        status,
        decision: decisionNote.trim() || undefined,
      });
      toast.success(status === "approved" ? "Approved ✅" : "Denied ❌");
      setDecisionNote("");
    } catch {
      toast.error("Failed to process");
    }
  };

  const filtered = approvals?.filter((a) =>
    statusFilter === "all" ? true : a.status === statusFilter
  );

  const pendingCount = approvals?.filter((a) => a.status === "pending").length ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <CheckSquare className="size-6" />
              <h1 className="text-3xl font-bold">Approvals</h1>
              {pendingCount > 0 && (
                <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {pendingCount} pending
                </span>
              )}
            </div>
            <p className="text-amber-100 text-lg">
              Change orders, add-ons, refunds, material approvals — quick one-tap decisions
            </p>
          </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="bg-white text-orange-700 hover:bg-orange-50 font-bold shadow-lg px-6 py-5 text-base"><Plus className="size-4 mr-2" />New Request</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Approval Request</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={formType} onValueChange={setFormType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {APPROVAL_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Urgency</Label>
                  <Select value={formUrgency} onValueChange={setFormUrgency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Title *</Label><Input placeholder="Customer wants to add accent lighting" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} /></div>
              <div><Label>Description *</Label><Textarea placeholder="Full details of what's being requested..." value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Amount ($)</Label><Input type="number" placeholder="750" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} /></div>
                <div><Label>Client</Label><Input placeholder="Client name" value={formClient} onChange={(e) => setFormClient(e.target.value)} /></div>
              </div>
              <div>
                <Label>Requested By</Label>
                <Select value={formRequestedBy} onValueChange={setFormRequestedBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Anna">Anna (Office Manager)</SelectItem>
                    <SelectItem value="Carlos">Carlos (Designer)</SelectItem>
                    <SelectItem value="Brittany">Brittany (Sales)</SelectItem>
                    <SelectItem value="Andre">Andre (Crew Lead)</SelectItem>
                    <SelectItem value="Tyler">Tyler (Crew Lead)</SelectItem>
                    <SelectItem value="Diego">Diego (Crew Lead)</SelectItem>
                    <SelectItem value="Mateo">Mateo (Crew Lead)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full">Submit Request</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["pending", "approved", "denied", "all"].map((s) => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? "default" : "outline"}
            onClick={() => setStatusFilter(s)}
            className="capitalize"
          >
            {s} {s === "pending" && pendingCount > 0 ? `(${pendingCount})` : ""}
          </Button>
        ))}
      </div>

      {/* Approval Cards */}
      <div className="space-y-3">
        {filtered?.map((approval) => {
          const StatusIcon = statusIcons[approval.status]?.icon || Clock;
          const statusColor = statusIcons[approval.status]?.color || "";
          const urgencyColors: Record<string, string> = {
            urgent: "border-l-4 border-l-red-500",
            normal: "",
            low: "",
          };

          return (
            <Card key={approval._id} className={urgencyColors[approval.urgency] || ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className={`p-1 rounded ${statusColor}`}>
                        <StatusIcon className="size-4" />
                      </div>
                      <h3 className="font-semibold">{approval.title}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted capitalize">
                        {approval.type.replace(/_/g, " ")}
                      </span>
                      {approval.urgency === "urgent" && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                          <AlertTriangle className="size-3" />Urgent
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{approval.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="size-3" />{approval.requestedBy}
                      </span>
                      {approval.amount && (
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <DollarSign className="size-3" />{approval.amount.toLocaleString()}
                        </span>
                      )}
                      {approval.clientName && <span>Client: {approval.clientName}</span>}
                      <span>{new Date(approval._creationTime).toLocaleDateString()}</span>
                    </div>
                    {approval.decision && (
                      <p className="mt-2 text-sm bg-muted/50 p-2 rounded italic">
                        Decision: {approval.decision}
                      </p>
                    )}
                  </div>
                  {approval.status === "pending" && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleDecide(approval._id, "approved")}
                        >
                          <Check className="size-4 mr-1" />Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDecide(approval._id, "denied")}
                        >
                          <X className="size-4 mr-1" />Deny
                        </Button>
                      </div>
                      <Input
                        placeholder="Add note (optional)"
                        className="h-7 text-xs"
                        value={decisionNote}
                        onChange={(e) => setDecisionNote(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <CheckSquare className="size-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">
              {statusFilter === "pending" ? "No pending approvals 🎉" : "No approvals found"}
            </p>
            <p className="text-sm">
              {statusFilter === "pending"
                ? "All clear — nothing to review!"
                : "Switch to a different filter"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
