"use client";

import React, { useMemo, useState, useTransition } from "react";
import { Plus, Search, Check, X, Milestone, ArrowUpDown, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { createPlacementAction, updatePlacementAction, updatePlacementStatusAction } from "./actions";

type Placement = {
  id: string;
  userId: string;
  user: { name: string; email: string };
  studioId: string;
  studio: { id: string; name: string };
  startDate: Date;
  endDate: Date | null;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  reason: string | null;
  createdAt: Date;
};

type ExtendedUser = {
  id: string;
  name: string;
  email: string;
  defaultStudioId?: string | null;
  defaultStudio?: { id: string; name: string } | null;
  placements?: Array<{ studioId: string; studio: { name: string } }>;
};

type Props = {
  initialPlacements: Placement[];
  users: ExtendedUser[];
  studios: Array<{ id: string; name: string }>;
};

const statusLabel: Record<string, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const statusColor: Record<string, string> = {
  ACTIVE: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
  COMPLETED: "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900",
  CANCELLED: "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900",
};

export function PlacementsClient({ initialPlacements, users, studios }: Props) {
  const [placements, setPlacements] = useState<Placement[]>(initialPlacements);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState<"ALL" | "ACTIVE" | "COMPLETED" | "CANCELLED">("ALL");
  const [isPending, startTransition] = useTransition();

  // Sorting State
  const [sortField, setSortField] = useState<string>("userName");
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Add Dialog State
  const [addOpen, setAddOpen] = useState(false);
  const [addHomeStudioFilter, setAddHomeStudioFilter] = useState("ALL");
  const [addUserId, setAddUserId] = useState("");
  const [addStudioId, setAddStudioId] = useState("");
  const [addStartDate, setAddStartDate] = useState("");
  const [addEndDate, setAddEndDate] = useState("");
  const [addReason, setAddReason] = useState("");
  const [addError, setAddError] = useState("");

  // Edit Dialog State
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [editUserName, setEditUserName] = useState("");
  const [editUserHomeStudioId, setEditUserHomeStudioId] = useState("");
  const [editStudioId, setEditStudioId] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editError, setEditError] = useState("");

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const selectedAddUser = useMemo(() => {
    return users.find((u) => u.id === addUserId) ?? null;
  }, [users, addUserId]);

  const filteredUsersForAdd = useMemo(() => {
    if (addHomeStudioFilter === "ALL") return users;
    return users.filter((u) => u.defaultStudioId === addHomeStudioFilter);
  }, [users, addHomeStudioFilter]);

  const userOptions = useMemo(() => {
    return filteredUsersForAdd.map((u) => {
      const activePl = u.placements?.[0];
      const homeStudio = u.defaultStudio?.name ?? "No studio";
      const label = activePl
        ? `${u.name} (${homeStudio}) — Placed at ${activePl.studio.name}`
        : `${u.name} — ${homeStudio}`;
      return {
        value: u.id,
        label,
      };
    });
  }, [filteredUsersForAdd]);

  const sortedAndFilteredPlacements = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let result = placements;

    if (statusTab !== "ALL") {
      result = result.filter((p) => p.status === statusTab);
    }

    if (q) {
      result = result.filter((p) => p.user.name.toLowerCase().includes(q) || p.studio.name.toLowerCase().includes(q));
    }

    return [...result].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      if (sortField === "userName") {
        aVal = a.user.name.toLowerCase();
        bVal = b.user.name.toLowerCase();
      } else if (sortField === "studio") {
        aVal = a.studio.name.toLowerCase();
        bVal = b.studio.name.toLowerCase();
      } else if (sortField === "startDate") {
        aVal = new Date(a.startDate).getTime();
        bVal = new Date(b.startDate).getTime();
      } else if (sortField === "endDate") {
        aVal = a.endDate ? new Date(a.endDate).getTime() : Infinity;
        bVal = a.endDate ? new Date(a.endDate).getTime() : Infinity;
      } else if (sortField === "status") {
        aVal = a.status;
        bVal = b.status;
      }

      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [searchQuery, statusTab, placements, sortField, sortAsc]);

  function formatDate(dVal: Date | string | null) {
    if (!dVal) return "-";
    const d = new Date(dVal);
    return new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(d);
  }

  function formatDateForInput(dVal: Date | string | null) {
    if (!dVal) return "";
    const d = new Date(dVal);
    return d.toISOString().split("T")[0];
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUserId || !addStudioId || !addStartDate) {
      setAddError("Please fill in all required fields.");
      return;
    }
    setAddError("");

    startTransition(async () => {
      const res = await createPlacementAction({
        userId: addUserId,
        studioId: addStudioId,
        startDate: addStartDate,
        endDate: addEndDate || null,
        reason: addReason || null,
      });

      if (res.success && res.placement) {
        const newPl = {
          ...res.placement,
          startDate: new Date(res.placement.startDate),
          endDate: res.placement.endDate ? new Date(res.placement.endDate) : null,
          createdAt: new Date(res.placement.createdAt),
        } as Placement;

        setPlacements([newPl, ...placements]);
        setAddOpen(false);
        setAddUserId("");
        setAddStudioId("");
        setAddStartDate("");
        setAddEndDate("");
        setAddReason("");
      } else {
        setAddError(res.error || "Failed to create placement.");
      }
    });
  };

  const openEditModal = (p: Placement) => {
    const matchedUser = users.find((u) => u.id === p.userId);
    setEditId(p.id);
    setEditUserName(p.user.name);
    setEditUserHomeStudioId(matchedUser?.defaultStudioId ?? "");
    setEditStudioId(p.studioId);
    setEditStartDate(formatDateForInput(p.startDate));
    setEditEndDate(formatDateForInput(p.endDate));
    setEditReason(p.reason || "");
    setEditError("");
    setEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId || !editStudioId || !editStartDate) {
      setEditError("Please fill in all required fields.");
      return;
    }
    setEditError("");

    startTransition(async () => {
      const res = await updatePlacementAction(editId, {
        userId: "",
        studioId: editStudioId,
        startDate: editStartDate,
        endDate: editEndDate || null,
        reason: editReason || null,
      });

      if (res.success && res.placement) {
        const updated = {
          ...res.placement,
          startDate: new Date(res.placement.startDate),
          endDate: res.placement.endDate ? new Date(res.placement.endDate) : null,
          createdAt: new Date(res.placement.createdAt),
        } as Placement;

        setPlacements(placements.map((p) => (p.id === editId ? updated : p)));
        setEditOpen(false);
      } else {
        setEditError(res.error || "Failed to update placement.");
      }
    });
  };

  const handleUpdateStatus = (id: string, status: "COMPLETED" | "CANCELLED") => {
    if (!confirm(`Are you sure you want to mark this placement as ${statusLabel[status]}?`)) {
      return;
    }

    startTransition(async () => {
      const res = await updatePlacementStatusAction(id, status);
      if (res.success && res.placement) {
        const updated = {
          ...res.placement,
          startDate: new Date(res.placement.startDate),
          endDate: res.placement.endDate ? new Date(res.placement.endDate) : null,
          createdAt: new Date(res.placement.createdAt),
        } as Placement;

        setPlacements(placements.map((p) => (p.id === id ? updated : p)));
      } else {
        alert(res.error || "Failed to update placement status.");
      }
    });
  };

  return (
    <div className="grid gap-6 min-w-0 w-full max-w-full">
      <Tabs value={statusTab} onValueChange={(val) => setStatusTab(val as typeof statusTab)} className="w-full min-w-0 max-w-full space-y-3">
        <div className="flex flex-col gap-3 min-w-0 w-full">
          {/* Row 1: Status Tabs Navigation */}
          <div className="w-full overflow-x-auto pb-1 sm:pb-0">
            <TabsList className="bg-zinc-100 dark:bg-zinc-800/80 p-1 h-9 justify-start max-w-full inline-flex">
              <TabsTrigger value="ALL" className="text-xs px-3 font-semibold cursor-pointer">All Statuses</TabsTrigger>
              <TabsTrigger value="ACTIVE" className="text-xs px-3 font-semibold cursor-pointer">Active</TabsTrigger>
              <TabsTrigger value="COMPLETED" className="text-xs px-3 font-semibold cursor-pointer">Completed</TabsTrigger>
              <TabsTrigger value="CANCELLED" className="text-xs px-3 font-semibold cursor-pointer">Cancelled</TabsTrigger>
            </TabsList>
          </div>

          {/* Row 2: Search input and Add Placement button below tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 min-w-0 w-full">
            <div className="relative flex-1 max-w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member or studio..."
                className="pl-9 pr-8 h-9 text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <Button onClick={() => setAddOpen(true)} size="sm" className="h-9 text-xs shrink-0 cursor-pointer">
              <Plus className="size-4 mr-1.5" />
              Add Placement
            </Button>
          </div>
        </div>
      </Tabs>

      <Card className="shadow-none rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 min-w-0 w-full max-w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-zinc-900 dark:text-zinc-50 flex items-center gap-2 text-base font-bold">
            <Milestone className="size-5 text-blue-600 dark:text-blue-400" />
            Staff/Intern Placement List ({sortedAndFilteredPlacements.length})
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Temporary physical studio assignment history for member WFO GPS presence validation.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto min-w-0 w-full max-w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort("userName")} className="cursor-pointer select-none hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                    <div className="flex items-center gap-1.5">
                      Member <ArrowUpDown className="size-3.5 text-zinc-400" />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("studio")} className="cursor-pointer select-none hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                    <div className="flex items-center gap-1.5">
                      Assigned Placement Studio <ArrowUpDown className="size-3.5 text-zinc-400" />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("startDate")} className="cursor-pointer select-none hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                    <div className="flex items-center gap-1.5">
                      Start Date <ArrowUpDown className="size-3.5 text-zinc-400" />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("endDate")} className="cursor-pointer select-none hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                    <div className="flex items-center gap-1.5">
                      End Date <ArrowUpDown className="size-3.5 text-zinc-400" />
                    </div>
                  </TableHead>
                  <TableHead>Notes / Reason</TableHead>
                  <TableHead onClick={() => handleSort("status")} className="cursor-pointer select-none hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                    <div className="flex items-center gap-1.5">
                      Status <ArrowUpDown className="size-3.5 text-zinc-400" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredPlacements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-zinc-500 text-sm">
                      No placement data found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedAndFilteredPlacements.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">{p.user.name}</span>
                          <span className="text-[10px] text-zinc-500">{p.user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-xs text-zinc-800 dark:text-zinc-200">
                        {p.studio.name}
                      </TableCell>
                      <TableCell className="text-xs font-mono">{formatDate(p.startDate)}</TableCell>
                      <TableCell className="text-xs font-mono">
                        {p.endDate ? formatDate(p.endDate) : (
                          <span className="text-zinc-400 italic text-[11px]">Ongoing</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs" title={p.reason || "-"}>
                        {p.reason || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[10px] shadow-none font-semibold", statusColor[p.status])}>
                          {statusLabel[p.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {p.status === "ACTIVE" ? (
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isPending}
                              onClick={() => openEditModal(p)}
                              className="text-[11px] h-8 px-2 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer shadow-none"
                            >
                              <Pencil className="size-3 mr-1 text-zinc-500" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleUpdateStatus(p.id, "COMPLETED")}
                              className="text-[11px] h-8 px-2 border-zinc-200 dark:border-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-600 cursor-pointer shadow-none"
                            >
                              <Check className="size-3 mr-1" />
                              Complete
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleUpdateStatus(p.id, "CANCELLED")}
                              className="text-[11px] h-8 px-2 border-zinc-200 dark:border-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-650 cursor-pointer shadow-none"
                            >
                              <X className="size-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400 italic font-mono">{statusLabel[p.status]}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Placement Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Member Placement</DialogTitle>
            <DialogDescription>Assign a member to another branch studio for a specific period.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="filter-home-studio" className="text-xs font-medium text-zinc-500">Filter by Member's Home Studio</Label>
              <select
                id="filter-home-studio"
                className="h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 px-2.5 text-xs outline-none"
                value={addHomeStudioFilter}
                onChange={(e) => {
                  setAddHomeStudioFilter(e.target.value);
                  setAddUserId("");
                }}
              >
                <option value="ALL">All Home Studios</option>
                {studios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5">
              <Label>Member *</Label>
              <Combobox
                options={userOptions}
                value={addUserId}
                onChange={setAddUserId}
                placeholder="Select Member"
                searchPlaceholder="Search member name..."
              />
              {selectedAddUser?.defaultStudio && (
                <p className="text-[11px] text-zinc-500">
                  Home Studio: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedAddUser.defaultStudio.name}</span>
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="add-studio">Target Placement Studio *</Label>
              <select
                id="add-studio"
                className="h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 px-2.5 text-sm outline-none"
                value={addStudioId}
                onChange={(e) => setAddStudioId(e.target.value)}
                required
              >
                <option value="">Select Branch Studio</option>
                {studios.map((s) => {
                  const isSameAsHome = selectedAddUser?.defaultStudioId === s.id;
                  return (
                    <option key={s.id} value={s.id} disabled={isSameAsHome}>
                      {s.name} {isSameAsHome ? "(Member's Home Studio)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="add-start">Start Date *</Label>
                <Input
                  id="add-start"
                  type="date"
                  value={addStartDate}
                  onChange={(e) => setAddStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="add-end">End Date (Optional)</Label>
                <Input
                  id="add-end"
                  type="date"
                  value={addEndDate}
                  onChange={(e) => setAddEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="add-reason">Notes / Reason for Placement</Label>
              <Input
                id="add-reason"
                placeholder="e.g. Assigned to Bandung project"
                value={addReason}
                onChange={(e) => setAddReason(e.target.value)}
              />
            </div>

            {addError && (
              <p className="text-xs text-red-650 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded p-2.5 font-medium">
                {addError}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Placement"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Placement Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Active Placement</DialogTitle>
            <DialogDescription>Update target studio, dates, or placement reason for {editUserName}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid gap-1.5">
              <Label>Member</Label>
              <Input value={editUserName} disabled className="bg-zinc-100 dark:bg-zinc-900 text-zinc-500" />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-studio">Target Placement Studio *</Label>
              <select
                id="edit-studio"
                className="h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 px-2.5 text-sm outline-none"
                value={editStudioId}
                onChange={(e) => setEditStudioId(e.target.value)}
                required
              >
                <option value="">Select Branch Studio</option>
                {studios.map((s) => {
                  const isSameAsHome = editUserHomeStudioId === s.id;
                  return (
                    <option key={s.id} value={s.id} disabled={isSameAsHome}>
                      {s.name} {isSameAsHome ? "(Member's Home Studio)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-start">Start Date *</Label>
                <Input
                  id="edit-start"
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit-end">End Date (Optional)</Label>
                <Input
                  id="edit-end"
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-reason">Notes / Reason for Placement</Label>
              <Input
                id="edit-reason"
                placeholder="e.g. Assigned to Bandung project"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
              />
            </div>

            {editError && (
              <p className="text-xs text-red-650 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded p-2.5 font-medium">
                {editError}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Updating..." : "Update Placement"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
