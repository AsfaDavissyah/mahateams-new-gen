"use client";

import { useState } from "react";
import { User, Mail, ShieldAlert, KeyRound, Loader2, Save, Calendar, Phone, Home, ShieldCheck, Lock, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { updateMoodAction, updateProfileAction, updateUserPinAction } from "./actions";
import { MOODS } from "@/lib/moods";
import { getSecurityPinError } from "@/lib/security-pin";
import { cn } from "@/lib/utils";

type UserProfile = {
  name: string;
  email: string;
  username: string | null;
  role?: string;
  birthDate: Date | null;
  phoneNumber: string | null;
  address: string | null;
  currentMood: string;
  moodNote: string | null;
  isPinSet?: boolean;
};

type Props = {
  initialUser: UserProfile;
};

export function ProfileSettingsClient({ initialUser }: Props) {
  const [loading, setLoading] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [moodLoading, setMoodLoading] = useState(false);
  const [selectedMood, setSelectedMood] = useState(initialUser.currentMood || "NEUTRAL");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    try {
      await updateProfileAction(formData);
      toast.success("Your profile was updated successfully!");
      const form = event.target as HTMLFormElement;
      const newPwdInput = form.elements.namedItem("newPassword") as HTMLInputElement;
      const confirmPwdInput = form.elements.namedItem("confirmNewPassword") as HTMLInputElement;
      if (newPwdInput) newPwdInput.value = "";
      if (confirmPwdInput) confirmPwdInput.value = "";
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePinSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newPin = String(formData.get("newPin") ?? "");
    const confirmNewPin = String(formData.get("confirmNewPin") ?? "");
    const pinError = getSecurityPinError(newPin);

    if (pinError) {
      toast.error(pinError);
      return;
    }

    if (newPin !== confirmNewPin) {
      toast.error("PIN confirmation does not match.");
      return;
    }

    setPinLoading(true);
    try {
      await updateUserPinAction(formData);
      toast.success("Security PIN updated successfully!");
      const form = event.target as HTMLFormElement;
      form.reset();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update PIN.");
    } finally {
      setPinLoading(false);
    }
  }

  async function handleMoodSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMoodLoading(true);

    const formData = new FormData(event.currentTarget);
    try {
      await updateMoodAction(formData);
      toast.success("Daily mood updated successfully.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update mood.");
    } finally {
      setMoodLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* ─── 1. My Profile Card ─────────────────────────────────────────── */}
      <Card id="section-profile" className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-none rounded-2xl overflow-hidden scroll-mt-28">
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-50">
            <User className="size-5 text-blue-600 dark:text-blue-400" />
            My Profile & Account Details
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Update your personal details, contact information, and Kolega account password.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col gap-6 w-full">
              <div id="field-personal-info" className="grid grid-cols-1 md:grid-cols-2 gap-5 scroll-mt-28">
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="profile-name" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                    <Input
                      id="profile-name"
                      name="name"
                      defaultValue={initialUser.name}
                      className="pl-9 text-sm"
                      placeholder="Full Name"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="profile-email" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                    <Input
                      id="profile-email"
                      name="email"
                      type="email"
                      defaultValue={initialUser.email}
                      className="pl-9 text-sm"
                      placeholder="email@kolega.com"
                      required
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="profile-username" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Username
                  </Label>
                  <div className="relative">
                    <ShieldAlert className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                    <Input
                      id="profile-username"
                      name="username"
                      defaultValue={initialUser.username ?? ""}
                      className="pl-9 text-sm"
                      placeholder="username (optional)"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    Use lowercase letters, numbers, periods, or underscores.
                  </p>
                </div>

                {/* Phone Number */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="profile-phone" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                    <Input
                      id="profile-phone"
                      name="phoneNumber"
                      type="tel"
                      placeholder="e.g. 08123456789"
                      defaultValue={initialUser.phoneNumber ?? ""}
                      className="pl-9 text-sm"
                    />
                  </div>
                </div>

                {/* Birth Date */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="profile-birthdate" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Birth Date
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                    <Input
                      id="profile-birthdate"
                      name="birthDate"
                      type="date"
                      defaultValue={initialUser.birthDate ? new Date(initialUser.birthDate).toISOString().split("T")[0] : ""}
                      className="pl-9 text-sm"
                    />
                  </div>
                </div>

                {/* Residential Address */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <Label htmlFor="profile-address" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Residential Address
                  </Label>
                  <div className="relative">
                    <Home className="absolute left-3 top-3 size-4 text-zinc-400" />
                    <Textarea
                      id="profile-address"
                      name="address"
                      placeholder="Current residential address"
                      defaultValue={initialUser.address ?? ""}
                      className="pl-9 pt-2.5 text-sm min-h-[70px]"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-zinc-100 dark:bg-zinc-800/80 my-1" />

              {/* Password Fields */}
              <div id="field-password" className="grid grid-cols-1 md:grid-cols-2 gap-5 scroll-mt-28">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="profile-new-password" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    New Password
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                    <Input
                      id="profile-new-password"
                      name="newPassword"
                      type="password"
                      placeholder="Leave blank to keep current password"
                      className="pl-9 text-sm"
                      minLength={6}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500">Minimum 6 characters.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="profile-confirm-password" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                    <Input
                      id="profile-confirm-password"
                      name="confirmNewPassword"
                      type="password"
                      className="pl-9 text-sm"
                      placeholder="Re-type your new password"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/30 px-6 py-4 flex justify-end">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto font-semibold cursor-pointer">
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="mr-2 size-4" />
                  Save Profile Changes
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* ─── 2. Security PIN Card ───────────────────────────────────────── */}
      <Card id="section-security" className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-none rounded-2xl overflow-hidden scroll-mt-28">
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-50">
                <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
                QR Attendance Security PIN
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Set a private 6-digit PIN for QR sign-in when no account session is active.
              </CardDescription>
            </div>
            <span
              className={cn(
                "text-xs px-3 py-1 rounded-full font-bold border self-start sm:self-auto",
                initialUser.isPinSet
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                  : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
              )}
            >
              {initialUser.isPinSet ? "Personal PIN Active" : "PIN Setup Required"}
            </span>
          </div>
        </CardHeader>
        <form onSubmit={handlePinSubmit}>
          <CardContent className="pt-6 space-y-6">
            <div id="field-qr-pin" className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full scroll-mt-28">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pin-current-verification" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Current Password or PIN
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                  <Input
                    id="pin-current-verification"
                    name="currentVerification"
                    type="password"
                    placeholder="Current password or PIN"
                    className="pl-9 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pin-new" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  New 6-Digit PIN
                </Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                  <Input
                    id="pin-new"
                    name="newPin"
                    type="password"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    placeholder="Enter 6-digit PIN"
                    title="Use 6 digits without repeated or sequential patterns."
                    className="pl-9 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pin-confirm" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Confirm New PIN
                </Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                  <Input
                    id="pin-confirm"
                    name="confirmNewPin"
                    type="password"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    placeholder="Re-enter 6-digit PIN"
                    className="pl-9 text-sm"
                    required
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/30 px-6 py-4 flex justify-end">
            <Button type="submit" disabled={pinLoading} className="w-full sm:w-auto font-semibold cursor-pointer">
              {pinLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving PIN...
                </>
              ) : (
                <>
                  <Save className="mr-2 size-4" />
                  Save New Security PIN
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* ─── 3. Daily Mood Card (non SUPER_ADMIN) ───────────────────────── */}
      {initialUser.role !== "SUPER_ADMIN" && (
        <Card id="section-mood" className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-none rounded-2xl overflow-hidden scroll-mt-28">
          <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-50">
              <Smile className="size-5 text-indigo-600 dark:text-indigo-400" />
              Daily Mood Status
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Share how you are feeling today with your team members and mentors.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleMoodSubmit}>
            <CardContent className="pt-6 space-y-6">
              <div className="flex flex-col gap-4 max-w-xl">
                <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50/40 dark:bg-zinc-950/20">
                  <Label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Your Mood Today</Label>
                  <input type="hidden" name="currentMood" value={selectedMood} />
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {MOODS.map((m) => {
                      const isSelected = selectedMood === m.key;
                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => setSelectedMood(m.key)}
                          className={cn(
                            "flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer",
                            isSelected
                              ? `${m.bgColor} ${m.borderColor} ring-2 ring-indigo-500 scale-[1.03] shadow-xs`
                              : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                          )}
                        >
                          <span className="text-2xl mb-1">{m.emoji}</span>
                          <span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="profile-mood-note" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Mood Note
                  </Label>
                  <Input
                    id="profile-mood-note"
                    name="moodNote"
                    placeholder="Write a brief description of what you are feeling or working on..."
                    defaultValue={initialUser.moodNote ?? ""}
                    className="text-sm"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/30 px-6 py-4 flex justify-end">
              <Button type="submit" disabled={moodLoading} className="w-full sm:w-auto font-semibold cursor-pointer">
                {moodLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 size-4" />
                    Save Daily Mood
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  );
}
