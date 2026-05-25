import { useMutation, useQuery, useAction } from "convex/react";
import { useState } from "react";
import {
  FolderKanban,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  User,
  MapPin,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const CREW_LEADS = [
  { value: "andre", label: "Andre (Hardscape)" },
  { value: "tyler", label: "Tyler (Hardscape)" },
  { value: "diego", label: "Diego (Hardscape)" },
  { value: "mateo", label: "Mateo (Landscape)" },
];

const PHASES: Record<string, { label: string; color: string }> = {
  onboarding: { label: "Onboarding", color: "text-blue-600 bg-blue-50" },
  pre_construction: { label: "Pre-Construction", color: "text-amber-600 bg-amber-50" },
  in_progress: { label: "In Progress", color: "text-green-600 bg-green-50" },
  final_walkthrough: { label: "Final Walkthrough", color: "text-purple-600 bg-purple-50" },
  completed: { label: "Completed", color: "text-gray-600 bg-gray-50" },
};

interface ChecklistItem {
  field: string;
  label: string;
  required?: boolean;
  condition?: (p: Record<string, unknown>) => boolean;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  { field: "depositInvoiceSent", label: "Deposit invoice sent (50%)" },
  { field: "depositPaid", label: "Deposit paid" },
  { field: "welcomePacketSent", label: "Welcome packet sent" },
  { field: "hoaSubmitted", label: "HOA package submitted", condition: (p) => p.hoaRequired === true },
  { field: "hoaApproved", label: "HOA approved", condition: (p) => p.hoaRequired === true },
  { field: "permitPulled", label: "Permits pulled", condition: (p) => p.permitRequired !== false },
  { field: "permitApproved", label: "Permits approved", condition: (p) => p.permitRequired !== false },
  { field: "finalDesignApproved", label: "Final design sign-off" },
  { field: "crewScheduled", label: "Crew assigned & scheduled" },
];

export function ProjectsPage() {
  const projects = useQuery(api.projects.list, {});
  const createProject = useMutation(api.projects.create);
  const updateChecklist = useMutation(api.projects.updateChecklist);
  const updateStatus = useMutation(api.projects.updateStatus);
  const generateUpdate = useAction(api.ai.generateCustomerUpdate);
  const createCustomerUpdate = useMutation(api.customerUpdates.create);

  const [showCreate, setShowCreate] = useState(false);
  const [showUpdate, setShowUpdate] = useState<string | null>(null);
  const [updatingProject, setUpdatingProject] = useState<string | null>(null);
  const [updateProgress, setUpdateProgress] = useState("");
  const [updateType, setUpdateType] = useState("progress");

  // Form
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formHoa, setFormHoa] = useState("no");
  const [formPermit, setFormPermit] = useState("yes");
  const [formCrewLead, setFormCrewLead] = useState("");

  const handleCreate = async () => {
    if (!formName.trim() || !formType.trim()) {
      toast.error("Client name and project type are required");
      return;
    }
    try {
      await createProject({
        clientName: formName.trim(),
        projectType: formType.trim(),
        address: formAddress.trim() || undefined,
        totalAmount: formAmount ? parseFloat(formAmount) : undefined,
        hoaRequired: formHoa === "yes",
        permitRequired: formPermit !== "no",
        crewLead: formCrewLead || undefined,
      });
      toast.success("Project created");
      setShowCreate(false);
      setFormName(""); setFormType(""); setFormAddress("");
      setFormAmount(""); setFormHoa("no"); setFormPermit("yes"); setFormCrewLead("");
    } catch {
      toast.error("Failed to create project");
    }
  };

  const handleGenerateUpdate = async (projectId: string) => {
    const project = projects?.find((p) => p._id === projectId);
    if (!project || !updateProgress.trim()) {
      toast.error("Enter progress details");
      return;
    }

    setUpdatingProject(projectId);
    try {
      const result = await generateUpdate({
        clientName: project.clientName,
        projectType: project.projectType,
        progressDetails: updateProgress,
        updateType,
      });

      await createCustomerUpdate({
        projectId: project._id,
        clientName: project.clientName,
        updateType,
        content: result.content,
      });

      toast.success("Customer update generated! 📨");
      setShowUpdate(null);
      setUpdateProgress("");
    } catch {
      toast.error("Failed to generate update");
    } finally {
      setUpdatingProject(null);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getProgress = (project: any) => {
    const items = CHECKLIST_ITEMS.filter((item) => !item.condition || item.condition(project));
    const done = items.filter((item) => project[item.field] === true).length;
    return { done, total: items.length, percent: items.length > 0 ? Math.round((done / items.length) * 100) : 0 };
  };

  // Sort: active first, then by phase
  const phaseOrder = ["onboarding", "pre_construction", "in_progress", "final_walkthrough", "completed"];
  const sortedProjects = projects?.sort((a, b) => {
    if (a.status !== b.status) return a.status === "active" ? -1 : 1;
    return phaseOrder.indexOf(a.phase) - phaseOrder.indexOf(b.phase);
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FolderKanban className="size-6" />
              <h1 className="text-3xl font-bold">Projects</h1>
            </div>
            <p className="text-purple-100 text-lg">
              Post-sign checklist — deposit, HOA, permits, design, crew. Target: 2 weeks to start.
            </p>
          </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="bg-white text-purple-700 hover:bg-purple-50 font-bold shadow-lg px-6 py-5 text-base"><Plus className="size-4 mr-2" />New Project</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Client Name *</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} /></div>
                <div><Label>Project Type *</Label><Input placeholder="Patio + Fire Pit" value={formType} onChange={(e) => setFormType(e.target.value)} /></div>
              </div>
              <div><Label>Address</Label><Input value={formAddress} onChange={(e) => setFormAddress(e.target.value)} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Amount ($)</Label><Input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} /></div>
                <div>
                  <Label>HOA Required?</Label>
                  <Select value={formHoa} onValueChange={setFormHoa}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Permits?</Label>
                  <Select value={formPermit} onValueChange={setFormPermit}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Crew Lead</Label>
                <Select value={formCrewLead} onValueChange={setFormCrewLead}>
                  <SelectTrigger><SelectValue placeholder="Assign later..." /></SelectTrigger>
                  <SelectContent>
                    {CREW_LEADS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full">Create Project</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      </div>

      {/* Project Cards */}
      <div className="space-y-4">
        {sortedProjects?.map((project) => {
          const progress = getProgress(project);
          const phase = PHASES[project.phase] || PHASES.onboarding;
          const isLimbo = project.status === "active" && (project.phase === "onboarding" || project.phase === "pre_construction");
          const daysSinceSigned = project.signedDate
            ? Math.ceil((Date.now() - new Date(project.signedDate).getTime()) / (1000 * 60 * 60 * 24))
            : null;
          const isOverdue = daysSinceSigned && daysSinceSigned > 14 && isLimbo;

          return (
            <Card key={project._id} className={isOverdue ? "border-red-300 dark:border-red-800" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 flex-wrap">
                      {project.clientName}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${phase.color}`}>
                        {phase.label}
                      </span>
                      {isOverdue && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                          <AlertTriangle className="size-3" />
                          {daysSinceSigned}d since signed (target: 14d)
                        </span>
                      )}
                      {isLimbo && !isOverdue && daysSinceSigned && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 flex items-center gap-1">
                          <Clock className="size-3" />
                          Day {daysSinceSigned}
                        </span>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span>🏗️ {project.projectType}</span>
                      {project.totalAmount && <span>${project.totalAmount.toLocaleString()}</span>}
                      {project.crewLead && (
                        <span className="flex items-center gap-1">
                          <User className="size-3" />
                          {CREW_LEADS.find((c) => c.value === project.crewLead)?.label || project.crewLead}
                        </span>
                      )}
                      {project.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />{project.address}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={showUpdate === project._id} onOpenChange={(open) => setShowUpdate(open ? project._id : null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="size-4 mr-1" />
                          Client Update
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="size-5" />
                            Generate Client Update
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Update Type</Label>
                            <Select value={updateType} onValueChange={setUpdateType}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="welcome">Welcome / Kickoff</SelectItem>
                                <SelectItem value="progress">Progress Update</SelectItem>
                                <SelectItem value="milestone">Milestone Reached</SelectItem>
                                <SelectItem value="halfway">Halfway Point</SelectItem>
                                <SelectItem value="delay">Delay Notification</SelectItem>
                                <SelectItem value="completion">Project Complete</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Progress Details</Label>
                            <Textarea
                              placeholder="Describe what's been completed and what's next..."
                              value={updateProgress}
                              onChange={(e) => setUpdateProgress(e.target.value)}
                              rows={4}
                            />
                          </div>
                          <Button
                            onClick={() => handleGenerateUpdate(project._id)}
                            disabled={updatingProject === project._id}
                            className="w-full"
                          >
                            <Sparkles className="size-4 mr-2" />
                            {updatingProject === project._id ? "Generating..." : "Generate Update"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Select
                      value={project.phase}
                      onValueChange={(phase) => updateStatus({ id: project._id, phase })}
                    >
                      <SelectTrigger className="w-auto h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PHASES).map(([key, val]) => (
                          <SelectItem key={key} value={key}>{val.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Onboarding Progress</span>
                    <span className="font-medium">{progress.done}/{progress.total} ({progress.percent}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        progress.percent === 100 ? "bg-green-500" : isOverdue ? "bg-red-500" : "bg-primary"
                      }`}
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                </div>

                {/* Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {CHECKLIST_ITEMS.filter((item) => !item.condition || item.condition(project as Record<string, unknown>)).map((item) => {
                    const checked = (project as Record<string, unknown>)[item.field] === true;
                    return (
                      <button
                        key={item.field}
                        onClick={() => updateChecklist({ id: project._id, field: item.field, value: !checked })}
                        className={`flex items-center gap-2 text-sm p-2 rounded-lg transition-colors text-left ${
                          checked
                            ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400"
                            : "bg-muted/50 hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {checked ? (
                          <CheckCircle2 className="size-4 text-green-600 shrink-0" />
                        ) : (
                          <Circle className="size-4 shrink-0" />
                        )}
                        <span className={checked ? "line-through" : ""}>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Crew Lead Assignment */}
                {!project.crewLead && project.status === "active" && (
                  <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950 rounded-lg text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <AlertTriangle className="size-4" />
                    No crew lead assigned.
                    <Select onValueChange={(val) => updateStatus({ id: project._id, crewLead: val })}>
                      <SelectTrigger className="h-7 w-auto text-xs ml-auto"><SelectValue placeholder="Assign..." /></SelectTrigger>
                      <SelectContent>
                        {CREW_LEADS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {projects?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FolderKanban className="size-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No active projects</p>
            <p className="text-sm">Projects are created when proposals are signed</p>
          </div>
        )}
      </div>
    </div>
  );
}
