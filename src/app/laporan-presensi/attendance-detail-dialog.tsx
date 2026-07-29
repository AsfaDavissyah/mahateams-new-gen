"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMood } from "@/lib/moods";
import {
  Calendar,
  MapPin,
  FileText,
  ShieldCheck,
  Building,
  Mail,
  Clock,
  AlertCircle,
  BarChart3,
  History,
  User,
  CheckCircle2,
  Briefcase,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type DetailRecord = {
  id: string;
  attendanceDate: string;
  workMode: string;
  status: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  lateMinutes: number;
  earlyCheckoutMinutes?: number;
  locationValidationStatus?: string;
  distanceMeters?: number | null;
  checkInLatitude?: number | null;
  checkInLongitude?: number | null;
  checkOutLatitude?: number | null;
  checkOutLongitude?: number | null;
  isManualCorrection?: boolean;
  mood?: string | null;
  moodNote?: string | null;
  createdAt?: string;
  updatedAt?: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    memberStatus?: string;
    currentMood?: string | null;
    defaultStudio?: { name: string } | null;
    workDayBalance?: number;
    annualLeaveBalance?: number;
    notes?: string | null;
    internProfile?: {
      program: string;
      institution: string;
      startDate: string;
      endDate: string;
      mentorName?: string | null;
    } | null;
  };
  createdBy?: { name: string } | null;
  ownerStudio: {
    name: string;
  };
  locationStudio?: {
    name: string;
  } | null;
  wfhPlan?: string | null;
  wfhReport?: string | null;
  statsRecap?: {
    total: number;
    onTime: number;
    late: number;
    sick: number;
    permission: number;
    alpha: number;
    wfh: number;
  };
  recentHistory?: Array<{
    id: string;
    attendanceDate: string;
    workMode: string;
    status: string;
    checkInAt: string | null;
    checkOutAt: string | null;
    lateMinutes?: number;
  }>;
};

type Props = {
  record: DetailRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statusColor: Record<string, string>;
  statusLabel: Record<string, string>;
};

function formatDate(dateVal: string | Date) {
  if (!dateVal) return "-";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(dateVal));
}

function formatTime(dateVal: string | Date | null | undefined) {
  if (!dateVal) return "-";
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(dateVal));
}

function formatTimestamp(dateVal?: string | Date | null) {
  if (!dateVal) return "-";
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(dateVal));
}

function formatLocationValidation(status: string) {
  if (status === "INSIDE_RADIUS") return "Inside Studio Radius";
  if (status === "OUTSIDE_RADIUS") return "Outside Studio Radius";
  if (status === "NOT_REQUIRED") return "Location Not Required";
  return "Unavailable / Pending";
}

export function AttendanceDetailDialog({
  record,
  open,
  onOpenChange,
  statusColor,
  statusLabel,
}: Props) {
  const hasCheckIn = typeof record?.checkInLatitude === "number" && typeof record?.checkInLongitude === "number";
  const hasCheckOut = typeof record?.checkOutLatitude === "number" && typeof record?.checkOutLongitude === "number";

  const [activeMapTab, setActiveMapTab] = useState<"in" | "out">("in");
  const [prevRecordId, setPrevRecordId] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);

  const [detailScope, setDetailScope] = useState<"MONTH" | "ALL">("MONTH");
  const [detailMonth, setDetailMonth] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  });

  const detailMonthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const value = `${y}-${m}`;
      const label = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(d);
      options.push({ value, label });
    }
    return options;
  }, []);

  if (record && record.id !== prevRecordId) {
    setPrevRecordId(record.id);
    setActiveMapTab(hasCheckIn ? "in" : "out");
    setHistoryPage(1);
  }

  if (!record) return null;

  const mood = getMood(record.mood || record.user.currentMood);

  const hasTodayInfo = Boolean(
    record.checkInAt ||
    record.checkOutAt ||
    record.wfhPlan ||
    record.wfhReport ||
    record.locationStudio ||
    record.isManualCorrection ||
    record.locationValidationStatus
  );

  const allRecords = record.recentHistory && record.recentHistory.length > 0
    ? record.recentHistory
    : [
        {
          id: record.id,
          attendanceDate: record.attendanceDate,
          workMode: record.workMode,
          status: record.status,
          checkInAt: record.checkInAt,
          checkOutAt: record.checkOutAt,
          lateMinutes: record.lateMinutes,
        },
      ];

  const getDateString = (dateVal: string | Date | unknown): string => {
    if (!dateVal) return "";
    if (typeof dateVal === "string") return dateVal;
    if (dateVal instanceof Date) return dateVal.toISOString();
    return String(dateVal);
  };

  const filteredHistoryRecords = detailScope === "ALL"
    ? allRecords
    : allRecords.filter((r) => getDateString(r.attendanceDate).startsWith(detailMonth));

  const historyRecords = filteredHistoryRecords;
  const historyPageSize = 5;

  const detailStats = {
    total: historyRecords.length,
    onTime: historyRecords.filter((r) => r.checkInAt !== null && (!r.lateMinutes || r.lateMinutes === 0)).length,
    late: historyRecords.filter((r) => r.lateMinutes !== undefined && r.lateMinutes > 0).length,
    sick: historyRecords.filter((r) => r.status === "SICK").length,
    permission: historyRecords.filter((r) => r.status === "PERMISSION" || r.status === "DISPENSATION" || r.status === "LEAVE").length,
    alpha: historyRecords.filter((r) => r.status === "ALPHA").length,
    wfh: historyRecords.filter((r) => r.workMode === "WFH").length,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 sm:max-w-3xl font-sans">
        <DialogHeader className="border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <User className="size-5 text-indigo-600 dark:text-indigo-400" />
            User & Attendance Details
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Unified view of user profile, today's attendance status, statistical recap, and latest activity logs.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-2 text-sm">
          {/* ========================================================
              SECTION 1: PROFILE
             ======================================================== */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/60 p-5 shadow-sm dark:shadow-lg">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                {/* Mood Avatar */}
                <div
                  className={`flex size-16 shrink-0 items-center justify-center rounded-2xl border-2 shadow-inner text-3xl select-none ${mood.bgColor} ${mood.borderColor}`}
                  title={mood.label}
                >
                  {mood.emoji}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{record.user.name}</h3>
                    <Badge variant="outline" className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">
                      Mood: {mood.label}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-650 dark:text-zinc-400">
                    <span className="inline-flex items-center gap-1"><Mail className="size-3.5 text-zinc-400 dark:text-zinc-500" /> {record.user.email}</span>
                    <span className="inline-flex items-center gap-1"><Building className="size-3.5 text-zinc-400 dark:text-zinc-500" /> Home: {record.user.defaultStudio?.name || record.ownerStudio.name}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge className="border-blue-500/30 bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[10px] font-semibold uppercase">
                      {record.user.role}
                    </Badge>
                    {record.user.memberStatus && (
                      <Badge className="border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-300 text-[10px] font-semibold uppercase">
                        {record.user.memberStatus}
                      </Badge>
                    )}
                    <Badge className="border-zinc-500/30 bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 text-[10px] font-semibold uppercase">
                      {record.workMode}
                    </Badge>
                    <Badge className={`text-[10px] font-semibold uppercase ${statusColor[record.status]}`}>
                      {statusLabel[record.status] ?? record.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              SECTION 2: TODAY INFO STATUS + TAB (Only if today data exists)
             ======================================================== */}
          {hasTodayInfo && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Calendar className="size-4 text-indigo-600 dark:text-indigo-400" />
                Today's Info Status & Logs
              </h4>
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg">
                  <TabsTrigger value="summary" className="text-xs font-semibold py-1.5 cursor-pointer">
                    Summary & Journal
                  </TabsTrigger>
                  <TabsTrigger value="location" className="text-xs font-semibold py-1.5 cursor-pointer">
                    Location & Geofence
                  </TabsTrigger>
                  <TabsTrigger value="logs" className="text-xs font-semibold py-1.5 cursor-pointer">
                    Audit Logs
                  </TabsTrigger>
                </TabsList>

                {/* Summary Tab */}
                <TabsContent value="summary" className="space-y-4 pt-3">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {/* Check-in */}
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10 p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
                      <div className="flex items-center justify-between text-zinc-400 dark:text-zinc-500">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Check-in</span>
                        <Clock className="size-4 text-emerald-600 dark:text-emerald-500" />
                      </div>
                      <span className="mt-2 block text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {formatTime(record.checkInAt)}
                      </span>
                    </div>
                    
                    {/* Check-out */}
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10 p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
                      <div className="flex items-center justify-between text-zinc-400 dark:text-zinc-500">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Check-out</span>
                        <Clock className="size-4 text-blue-600 dark:text-blue-500" />
                      </div>
                      <span className="mt-2 block text-xl font-bold text-blue-600 dark:text-blue-400">
                        {formatTime(record.checkOutAt)}
                      </span>
                    </div>

                    {/* Late Minutes */}
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10 p-4 flex flex-col justify-between shadow-sm relative overflow-hidden col-span-2 sm:col-span-1">
                      <div className="flex items-center justify-between text-zinc-400 dark:text-zinc-500">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Punctuality Status</span>
                        <AlertCircle className="size-4 text-amber-600 dark:text-amber-500" />
                      </div>
                      <div className="mt-2">
                        {record.lateMinutes > 0 ? (
                          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                            Late by {record.lateMinutes} mins
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            On Time
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Morning Work Plan & Evening Journal */}
                  {(record.wfhPlan || record.wfhReport) && (
                    <div className="space-y-3 pt-2">
                      {record.wfhPlan && (
                        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/40 p-4 space-y-1.5">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                            <FileText className="size-3.5 text-blue-600" />
                            Morning Work Plan (WFH/WFO Plan)
                          </p>
                          <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                            {record.wfhPlan}
                          </p>
                        </div>
                      )}

                      {record.wfhReport && (
                        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/40 p-4 space-y-1.5">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                            <FileText className="size-3.5 text-emerald-600" />
                            Evening Work Journal / Accomplishments
                          </p>
                          <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                            {record.wfhReport}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Location Tab */}
                <TabsContent value="location" className="space-y-4 pt-3">
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-4 shadow-sm">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-xs text-zinc-400 block font-medium">Recorded Studio</span>
                        <span className="font-semibold text-zinc-850 dark:text-zinc-200 mt-1 block">
                          {record.locationStudio?.name || record.ownerStudio.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-400 block font-medium">Validation Status</span>
                        <div className="mt-1">
                          <Badge
                            variant="outline"
                            className={
                              record.locationValidationStatus === "OUTSIDE_RADIUS"
                                ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300 font-semibold"
                                : record.locationValidationStatus === "INSIDE_RADIUS"
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300 font-semibold"
                                : "font-semibold"
                            }
                          >
                            {formatLocationValidation(record.locationValidationStatus || "")}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-400 block font-medium">Distance to Studio</span>
                        <span className="font-semibold text-zinc-850 dark:text-zinc-200 mt-1 block">
                          {typeof record.distanceMeters === "number"
                            ? `${Math.round(record.distanceMeters)} meters`
                            : "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-400 block font-medium">GPS Coordinates (In / Out)</span>
                        <div className="text-xs text-zinc-650 dark:text-zinc-450 font-mono mt-1 space-y-1">
                          <p className="flex items-center gap-1.5">
                            <span className="w-8 font-semibold text-zinc-400">In:</span>
                            {record.checkInLatitude && record.checkInLongitude
                              ? `${record.checkInLatitude.toFixed(5)}, ${record.checkInLongitude.toFixed(5)}`
                              : "N/A"}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <span className="w-8 font-semibold text-zinc-400">Out:</span>
                            {record.checkOutLatitude && record.checkOutLongitude
                              ? `${record.checkOutLatitude.toFixed(5)}, ${record.checkOutLongitude.toFixed(5)}`
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {(hasCheckIn || hasCheckOut) && (
                      <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                          <MapPin className="size-4 text-emerald-600" />
                          Location Map Visualization
                        </p>

                        {hasCheckIn && hasCheckOut && (
                          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg w-fit">
                            <button
                              type="button"
                              onClick={() => setActiveMapTab("in")}
                              className={cn(
                                "px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer",
                                activeMapTab === "in"
                                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm"
                                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                              )}
                            >
                              Check-in Map
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveMapTab("out")}
                              className={cn(
                                "px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer",
                                activeMapTab === "out"
                                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm"
                                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                              )}
                            >
                              Check-out Map
                            </button>
                          </div>
                        )}

                        {(() => {
                          const showInMap = activeMapTab === "in" && hasCheckIn;
                          const lat = showInMap ? record.checkInLatitude : record.checkOutLatitude;
                          const lng = showInMap ? record.checkInLongitude : record.checkOutLongitude;

                          if (lat === null || lat === undefined || lng === null || lng === undefined) return null;

                          return (
                            <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm bg-zinc-50 dark:bg-zinc-950">
                              <iframe
                                src={`https://maps.google.com/maps?q=${lat},${lng}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                                width="100%"
                                height="240"
                                style={{ border: 0 }}
                                className="w-full block"
                                allowFullScreen={true}
                                loading="lazy"
                              />
                              <div className="px-3 py-2 bg-zinc-50/80 dark:bg-zinc-900/60 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                                <span>Showing {showInMap ? "Check-in" : "Check-out"} Coordinates: {lat.toFixed(6)}, {lng.toFixed(6)}</span>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                                >
                                  Open in Google Maps
                                </a>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Audit Logs Tab */}
                <TabsContent value="logs" className="space-y-4 pt-3">
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-4 shadow-sm">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 border-b pb-2">
                      <ShieldCheck className="size-4 text-violet-600" />
                      Correction & Audit Logs
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-xs text-zinc-400 block font-medium">Manual Correction</span>
                        <div className="mt-1">
                          <Badge variant={record.isManualCorrection ? "secondary" : "outline"} className="text-[10px] font-semibold">
                            {record.isManualCorrection ? "Yes (Corrected)" : "No (Normal)"}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-400 block font-medium">Created By</span>
                        <span className="font-semibold text-zinc-850 dark:text-zinc-200 mt-1 block">
                          {record.createdBy?.name || "System"}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-400 block font-medium">Created At</span>
                        <span className="text-zinc-700 dark:text-zinc-300 mt-1 block">
                          {formatTimestamp(record.createdAt)}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-400 block font-medium">Updated At</span>
                        <span className="text-zinc-700 dark:text-zinc-300 mt-1 block">
                          {formatTimestamp(record.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* ========================================================
              SECTION 3: RECAP STATISTIC ATTENDANCE (From roles-client.tsx)
             ======================================================== */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/40 p-4 space-y-4 shadow-xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200/60 dark:border-zinc-800/60 pb-3">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <BarChart3 className="size-4 text-indigo-600 dark:text-indigo-400" />
                  Recap Statistic Attendance
                </h4>
                <Badge variant="outline" className="border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[10px] px-2 py-0.5 font-semibold">
                  {detailScope === "MONTH" ? (
                    detailMonth ? new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(Number(detailMonth.split("-")[0]), Number(detailMonth.split("-")[1]) - 1, 1)) : "Monthly"
                  ) : "All Time"}
                </Badge>
              </div>

              {/* Month / Scope Filter Controls */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-0.5 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setDetailScope("MONTH")}
                    className={`h-7 px-2.5 text-xs font-semibold rounded-md transition-all duration-150 cursor-pointer ${
                      detailScope === "MONTH"
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-xs border border-zinc-200/50 dark:border-zinc-700"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailScope("ALL")}
                    className={`h-7 px-2.5 text-xs font-semibold rounded-md transition-all duration-150 cursor-pointer ${
                      detailScope === "ALL"
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-xs border border-zinc-200/50 dark:border-zinc-700"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    All Time
                  </button>
                </div>

                {detailScope === "MONTH" && (
                  <select
                    value={detailMonth}
                    onChange={(e) => setDetailMonth(e.target.value)}
                    className="h-7 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 py-0 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium"
                  >
                    {detailMonthOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Total Attendance</p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-0.5">
                    {detailStats.total} <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">days</span>
                  </p>
                </div>
                <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                  <Calendar className="size-4" />
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Workday Balance</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-0.5">
                    {typeof record.user.workDayBalance === "number"
                      ? (record.user.workDayBalance > 0 ? `+${record.user.workDayBalance} Days` : `${record.user.workDayBalance} Days`)
                      : "0 Days"}
                  </p>
                </div>
                <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-4" />
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Annual Leave Balance</p>
                  <p className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                    {record.user.memberStatus === "TEAM" ? `${record.user.annualLeaveBalance ?? 12} Days` : "-"}
                  </p>
                </div>
                <div className="flex size-9 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400">
                  <Briefcase className="size-4" />
                </div>
              </div>
            </div>

            {/* Horizontal Stacked Bar Chart */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">Attendance Status Ratio</span>
                <span>{detailStats.total} Total Records</span>
              </div>

              <div className="h-7 w-full rounded-full bg-zinc-100 dark:bg-zinc-950 p-1 border border-zinc-200 dark:border-zinc-800/90 flex overflow-hidden shadow-inner gap-0.5">
                {detailStats.total === 0 ? (
                  <div className="w-full h-full rounded-full bg-zinc-200/50 dark:bg-zinc-800/40 flex items-center justify-center text-[11px] text-zinc-400 dark:text-zinc-500 font-medium italic">
                    No attendance data accumulated for this period
                  </div>
                ) : (
                  <>
                    {detailStats.onTime > 0 && (
                      <HoverCard>
                        <HoverCardTrigger
                          render={
                            <div
                              style={{ width: `${(detailStats.onTime / detailStats.total) * 100}%` }}
                              className="h-full bg-emerald-500 hover:bg-emerald-400 transition-all duration-200 rounded-l-full first:rounded-l-full last:rounded-r-full relative cursor-pointer"
                            />
                          }
                        />
                        <HoverCardContent side="top" align="center" className="w-auto px-3 py-1.5 text-xs font-sans">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">On Time:</span> {detailStats.onTime} days ({((detailStats.onTime / detailStats.total) * 100).toFixed(1)}%)
                        </HoverCardContent>
                      </HoverCard>
                    )}
                    {detailStats.late > 0 && (
                      <HoverCard>
                        <HoverCardTrigger
                          render={
                            <div
                              style={{ width: `${(detailStats.late / detailStats.total) * 100}%` }}
                              className="h-full bg-orange-500 hover:bg-orange-400 transition-all duration-200 first:rounded-l-full last:rounded-r-full relative cursor-pointer"
                            />
                          }
                        />
                        <HoverCardContent side="top" align="center" className="w-auto px-3 py-1.5 text-xs font-sans">
                          <span className="font-semibold text-orange-600 dark:text-orange-400">Late:</span> {detailStats.late} days ({((detailStats.late / detailStats.total) * 100).toFixed(1)}%)
                        </HoverCardContent>
                      </HoverCard>
                    )}
                    {detailStats.sick > 0 && (
                      <HoverCard>
                        <HoverCardTrigger
                          render={
                            <div
                              style={{ width: `${(detailStats.sick / detailStats.total) * 100}%` }}
                              className="h-full bg-purple-500 hover:bg-purple-400 transition-all duration-200 first:rounded-l-full last:rounded-r-full relative cursor-pointer"
                            />
                          }
                        />
                        <HoverCardContent side="top" align="center" className="w-auto px-3 py-1.5 text-xs font-sans">
                          <span className="font-semibold text-purple-600 dark:text-purple-400">Sick:</span> {detailStats.sick} days ({((detailStats.sick / detailStats.total) * 100).toFixed(1)}%)
                        </HoverCardContent>
                      </HoverCard>
                    )}
                    {detailStats.permission > 0 && (
                      <HoverCard>
                        <HoverCardTrigger
                          render={
                            <div
                              style={{ width: `${(detailStats.permission / detailStats.total) * 100}%` }}
                              className="h-full bg-amber-400 hover:bg-amber-300 transition-all duration-200 first:rounded-l-full last:rounded-r-full relative cursor-pointer"
                            />
                          }
                        />
                        <HoverCardContent side="top" align="center" className="w-auto px-3 py-1.5 text-xs font-sans">
                          <span className="font-semibold text-amber-600 dark:text-amber-400">Permission:</span> {detailStats.permission} days ({((detailStats.permission / detailStats.total) * 100).toFixed(1)}%)
                        </HoverCardContent>
                      </HoverCard>
                    )}
                    {detailStats.alpha > 0 && (
                      <HoverCard>
                        <HoverCardTrigger
                          render={
                            <div
                              style={{ width: `${(detailStats.alpha / detailStats.total) * 100}%` }}
                              className="h-full bg-red-500 hover:bg-red-400 transition-all duration-200 first:rounded-l-full last:rounded-r-full relative cursor-pointer"
                            />
                          }
                        />
                        <HoverCardContent side="top" align="center" className="w-auto px-3 py-1.5 text-xs font-sans">
                          <span className="font-semibold text-red-600 dark:text-red-400">Alpha:</span> {detailStats.alpha} days ({((detailStats.alpha / detailStats.total) * 100).toFixed(1)}%)
                        </HoverCardContent>
                      </HoverCard>
                    )}
                    {detailStats.wfh > 0 && (
                      <HoverCard>
                        <HoverCardTrigger
                          render={
                            <div
                              style={{ width: `${(detailStats.wfh / detailStats.total) * 100}%` }}
                              className="h-full bg-sky-500 hover:bg-sky-400 transition-all duration-200 rounded-r-full first:rounded-l-full last:rounded-r-full relative cursor-pointer"
                            />
                          }
                        />
                        <HoverCardContent side="top" align="center" className="w-auto px-3 py-1.5 text-xs font-sans">
                          <span className="font-semibold text-sky-600 dark:text-sky-400">WFH:</span> {detailStats.wfh} days ({((detailStats.wfh / detailStats.total) * 100).toFixed(1)}%)
                        </HoverCardContent>
                      </HoverCard>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Legend Grid Items */}
            <div className="pt-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {[
                  { label: "Total", count: detailStats.total, colorBg: "bg-blue-500", textColor: "text-blue-600 dark:text-blue-400" },
                  { label: "On Time", count: detailStats.onTime, colorBg: "bg-emerald-500", textColor: "text-emerald-600 dark:text-emerald-400" },
                  { label: "Late", count: detailStats.late, colorBg: "bg-orange-500", textColor: "text-orange-600 dark:text-orange-400" },
                  { label: "Sick", count: detailStats.sick, colorBg: "bg-purple-500", textColor: "text-purple-600 dark:text-purple-400" },
                  { label: "Permission", count: detailStats.permission, colorBg: "bg-amber-400", textColor: "text-amber-600 dark:text-amber-400" },
                  { label: "Alpha", count: detailStats.alpha, colorBg: "bg-red-500", textColor: "text-red-600 dark:text-red-400" },
                  { label: "WFH", count: detailStats.wfh, colorBg: "bg-sky-500", textColor: "text-sky-600 dark:text-sky-400" },
                ].map((item) => {
                  const pct = detailStats.total > 0 && item.label !== "Total" ? ((item.count / detailStats.total) * 100).toFixed(0) : null;
                  return (
                    <HoverCard key={item.label}>
                      <HoverCardTrigger
                        render={
                          <div
                            className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-2 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer hover:scale-[1.03]"
                          >
                            <span className={`size-2.5 rounded-full ${item.colorBg} shrink-0 shadow-sm`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 truncate">{item.label}</p>
                              <div className="flex items-baseline gap-1 mt-0.5">
                                <span className={`text-xs font-bold ${item.textColor}`}>{item.count}</span>
                                {pct !== null && (
                                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium">({pct}%)</span>
                                )}
                              </div>
                            </div>
                          </div>
                        }
                      />
                      <HoverCardContent side="top" align="center" className="w-auto px-3 py-1.5 text-xs font-sans">
                        <span className="font-semibold">{item.label}:</span> {item.count} {item.count === 1 ? "day" : "days"} {pct !== null ? `(${pct}% of total)` : ""}
                      </HoverCardContent>
                    </HoverCard>
                  );
                })}
              </div>
            </div>

            {record.user.internProfile && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 mt-2">
                <h4 className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Intern Profile</h4>
                <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                  <span>Program: <b className="text-zinc-900 dark:text-zinc-100">{record.user.internProfile.program}</b></span>
                  <span>Institution: <b className="text-zinc-900 dark:text-zinc-100">{record.user.internProfile.institution}</b></span>
                  <span>Period: <b className="text-zinc-900 dark:text-zinc-100">{formatDate(record.user.internProfile.startDate)} - {formatDate(record.user.internProfile.endDate)}</b></span>
                  <span>Mentor: <b className="text-zinc-900 dark:text-zinc-100">{record.user.internProfile.mentorName || "No mentor assigned"}</b></span>
                </div>
              </div>
            )}

            {record.user.notes && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 mt-2">
                <h4 className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Admin Notes</h4>
                <p className="mt-2 text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                  {record.user.notes}
                </p>
              </div>
            )}
          </div>

          {/* ========================================================
              SECTION 4: HISTORY (LATEST) ATTENDANCE (From roles-client.tsx)
             ======================================================== */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-2.5">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <History className="size-4 text-indigo-600 dark:text-indigo-400" />
                  Latest Attendance History
                </h4>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Latest attendance records for this user.</p>
              </div>
            </div>

            {historyRecords.length === 0 ? (
              <div className="py-6 text-center text-zinc-400 dark:text-zinc-500 text-xs">
                No attendance records found.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
                        <TableHead className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Date</TableHead>
                        <TableHead className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Times</TableHead>
                        <TableHead className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyRecords
                        .slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize)
                        .map((item) => (
                          <TableRow key={item.id} className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/60">
                            <TableCell className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                              {formatDate(item.attendanceDate)}
                            </TableCell>
                            <TableCell className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                              {formatTime(item.checkInAt)} - {formatTime(item.checkOutAt)}
                            </TableCell>
                            <TableCell>
                              <Badge className={`text-[10px] font-semibold uppercase ${statusColor[item.status] ?? "bg-zinc-100 text-zinc-800"}`}>
                                {statusLabel[item.status] ?? item.status.replace("_", " ")}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>

                {historyRecords.length > historyPageSize && (
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Showing {(historyPage - 1) * historyPageSize + 1} to {Math.min(historyPage * historyPageSize, historyRecords.length)} of {historyRecords.length} records
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={historyPage <= 1}
                        onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                        className="h-7 px-2.5 text-xs cursor-pointer"
                      >
                        <ChevronLeft className="size-3.5 mr-1" /> Prev
                      </Button>
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 px-1">
                        {historyPage} / {Math.ceil(historyRecords.length / historyPageSize)}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={historyPage >= Math.ceil(historyRecords.length / historyPageSize)}
                        onClick={() => setHistoryPage((p) => p + 1)}
                        className="h-7 px-2.5 text-xs cursor-pointer"
                      >
                        Next <ChevronRight className="size-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end border-t border-zinc-200 dark:border-zinc-800/80 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 px-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
