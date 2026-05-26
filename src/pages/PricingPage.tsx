import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import {
  DollarSign,
  Plus,
  Trash2,
  Pencil,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const CATEGORIES = [
  { value: "hardscaping", label: "Hardscaping", emoji: "🧱" },
  { value: "structures", label: "Structures", emoji: "🏗️" },
  { value: "fire_features", label: "Fire Features", emoji: "🔥" },
  { value: "outdoor_kitchen", label: "Outdoor Kitchen", emoji: "🍳" },
  { value: "water_features", label: "Water Features", emoji: "💧" },
  { value: "landscaping", label: "Landscaping", emoji: "🌿" },
  { value: "turf_irrigation", label: "Turf & Irrigation", emoji: "🌱" },
  { value: "lighting", label: "Lighting", emoji: "💡" },
  { value: "general", label: "General / Labor", emoji: "🔧" },
];

export function PricingPage() {
  const pricingItems = useQuery(api.pricingItems.list, {});
  const seedPricing = useMutation(api.pricingItems.seed);
  const createItem = useMutation(api.pricingItems.create);
  const updateItem = useMutation(api.pricingItems.update);
  const removeItem = useMutation(api.pricingItems.remove);

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Form state
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("hardscaping");
  const [formUnit, setFormUnit] = useState("sqft");
  const [formBaseCost, setFormBaseCost] = useState("");
  const [formMarkup, setFormMarkup] = useState("38");
  const [formDesc, setFormDesc] = useState("");

  const handleSeed = async () => {
    try {
      await seedPricing({});
      toast.success("Seeded 55 pricing items across 10 categories! 🌱");
    } catch {
      toast.info("Already seeded");
    }
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast.error("Item name is required"); return; }
    const baseCost = parseFloat(formBaseCost);
    const markup = parseFloat(formMarkup);
    if (isNaN(baseCost) || isNaN(markup)) { toast.error("Invalid numbers"); return; }

    try {
      if (editingId) {
        await updateItem({
          id: editingId as never,
          itemName: formName.trim(),
          category: formCategory,
          unit: formUnit,
          baseCost,
          markup,
          description: formDesc.trim() || undefined,
        });
        toast.success("Item updated");
      } else {
        await createItem({
          itemName: formName.trim(),
          category: formCategory,
          unit: formUnit,
          baseCost,
          markup,
          description: formDesc.trim() || undefined,
        });
        toast.success("Item added");
      }
      setShowAdd(false);
      setEditingId(null);
      resetForm();
    } catch {
      toast.error("Failed to save");
    }
  };

  const startEdit = (item: Record<string, unknown>) => {
    setFormName(item.itemName as string);
    setFormCategory(item.category as string);
    setFormUnit(item.unit as string);
    setFormBaseCost(String(item.baseCost));
    setFormMarkup(String(item.markup));
    setFormDesc((item.description as string) || "");
    setEditingId(item._id as string);
    setShowAdd(true);
  };

  const resetForm = () => {
    setFormName(""); setFormCategory("hardscaping"); setFormUnit("sqft");
    setFormBaseCost(""); setFormMarkup("38"); setFormDesc("");
  };

  const filtered = pricingItems?.filter((item) => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  // Group by category
  const grouped = new Map<string, typeof filtered>();
  filtered?.forEach((item) => {
    const cat = item.category;
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(item);
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="size-6" />
              <h1 className="text-3xl font-bold">Pricing Database</h1>
            </div>
            <p className="text-green-100 text-lg">
              55 Phoenix-market items — feeds into AI proposal generation
            </p>
          </div>
        <div className="flex gap-2">
          {(!pricingItems || pricingItems.length === 0) && (
            <Button variant="outline" onClick={handleSeed}>
              <Sparkles className="size-4 mr-2" />Seed Database
            </Button>
          )}
          <Dialog open={showAdd} onOpenChange={(open) => { setShowAdd(open); if (!open) { setEditingId(null); resetForm(); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="size-4 mr-2" />Add Item</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit" : "Add"} Pricing Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div><Label>Item Name *</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Category</Label>
                    <Select value={formCategory} onValueChange={setFormCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Select value={formUnit} onValueChange={setFormUnit}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sqft">sq ft</SelectItem>
                        <SelectItem value="linear_ft">linear ft</SelectItem>
                        <SelectItem value="each">each</SelectItem>
                        <SelectItem value="zone">zone</SelectItem>
                        <SelectItem value="yard">yard</SelectItem>
                        <SelectItem value="project">project</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Base Cost ($)</Label><Input type="number" value={formBaseCost} onChange={(e) => setFormBaseCost(e.target.value)} /></div>
                  <div><Label>Markup (%)</Label><Input type="number" value={formMarkup} onChange={(e) => setFormMarkup(e.target.value)} /></div>
                </div>
                <div><Label>Description</Label><Input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} /></div>
                <Button onClick={handleSave} className="w-full">{editingId ? "Update" : "Add"} Item</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        {pricingItems?.length ?? 0} items across {new Set(pricingItems?.map((i) => i.category)).size} categories
      </div>

      {/* Items by category */}
      {Array.from(grouped.entries()).map(([category, items]) => {
        const catInfo = CATEGORIES.find((c) => c.value === category);
        return (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                {catInfo?.emoji} {catInfo?.label || category}
                <span className="text-sm font-normal text-muted-foreground">({items?.length} items)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4">Item</th>
                      <th className="text-right py-2 px-2">Base Cost</th>
                      <th className="text-right py-2 px-2">Markup</th>
                      <th className="text-right py-2 px-2 font-bold">Final Price</th>
                      <th className="text-center py-2 px-2">Unit</th>
                      <th className="text-right py-2 pl-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items?.map((item) => (
                      <tr key={item._id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-2 pr-4">
                          <p className="font-medium">{item.itemName}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          )}
                        </td>
                        <td className="text-right py-2 px-2">${item.baseCost.toLocaleString()}</td>
                        <td className="text-right py-2 px-2">{item.markup}%</td>
                        <td className="text-right py-2 px-2 font-bold text-green-700 dark:text-green-400">
                          ${item.finalPrice.toLocaleString()}
                        </td>
                        <td className="text-center py-2 px-2 text-muted-foreground">{item.unit}</td>
                        <td className="text-right py-2 pl-2">
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => startEdit(item)}>
                              <Pencil className="size-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => { removeItem({ id: item._id }); toast.success("Removed"); }}
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {pricingItems?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <DollarSign className="size-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Pricing database is empty</p>
          <p className="text-sm mb-4">Seed it with 55 real Phoenix-market landscaping items</p>
          <Button onClick={handleSeed}>
            <Sparkles className="size-4 mr-2" />Seed Database
          </Button>
        </div>
      )}
    </div>
  );
}
