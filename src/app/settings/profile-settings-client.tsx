"use client";

import { useState } from "react";
import { User, Mail, ShieldAlert, KeyRound, Loader2, Save, Calendar, Phone, Home, ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { updateMoodAction, updateProfileAction, updateUserPinAction } from "./actions";
import { MOODS } from "@/lib/moods";
import { BackgroundSettingsCard } from "./background-settings-card";
import { getSecurityPinError } from "@/lib/security-pin";

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
      // Clear password fields
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
    <div className="space-y-4">
      {/* ─── Profile Details Card ───────────────────────────────────────── */}
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <User className="size-5 text-blue-700" />
            My Profile
          </CardTitle>
          <CardDescription>
            Update your personal details and change your Kolega account password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="profile-name" className="text-zinc-700 dark:text-zinc-300">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                  <Input
                    id="profile-name"
                    name="name"
                    defaultValue={initialUser.name}
                    className="pl-9"
                    placeholder="Full Name"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="profile-username" className="text-zinc-700 dark:text-zinc-300">Username</Label>
                <div className="relative">
                  <ShieldAlert className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                  <Input
                    id="profile-username"
                    name="username"
                    defaultValue={initialUser.username ?? ""}
                    className="pl-9"
                    placeholder="username (optional)"
                  />
                </div>
                <p className="text-[11px] text-zinc-400">
                  Use lowercase letters, numbers, periods, or underscores.
                </p>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="profile-email" className="text-zinc-700 dark:text-zinc-300">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                  <Input
                    id="profile-email"
                    name="email"
                    type="email"
                    defaultValue={initialUser.email}
                    className="pl-9"
                    placeholder="email@kolega.com"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="profile-birthdate" className="text-zinc-700 dark:text-zinc-300">Birth Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                  <Input
                    id="profile-birthdate"
                    name="birthDate"
                    type="date"
                    defaultValue={initialUser.birthDate ? new Date(initialUser.birthDate).toISOString().split("T")[0] : ""}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="profile-phone" className="text-zinc-700 dark:text-zinc-300">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                  <Input
                    id="profile-phone"
                    name="phoneNumber"
                    type="tel"
                    placeholder="Example: 08123456789"
                    defaultValue={initialUser.phoneNumber ?? ""}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="profile-address" className="text-zinc-700 dark:text-zinc-300">Residential Address</Label>
                <div className="relative">
                  <Home className="absolute left-3 top-3 size-4 text-zinc-400" />
                  <Textarea
                    id="profile-address"
                    name="address"
                    placeholder="Current residential address"
                    defaultValue={initialUser.address ?? ""}
                    className="pl-9 pt-2.5"
                    rows={3}
                  />
                </div>
              </div>

              <hr className="border-zinc-100 dark:border-zinc-800 my-2" />

              <div className="grid gap-1.5">
                <Label htmlFor="profile-new-password" className="text-zinc-700 dark:text-zinc-300">New Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                  <Input
                    id="profile-new-password"
                    name="newPassword"
                    type="password"
                    placeholder="Leave blank if you do not want to change"
                    className="pl-9"
                    minLength={6}
                  />
                </div>
                <p className="text-[11px] text-zinc-400">Minimum 6 characters.</p>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="profile-confirm-password" className="text-zinc-700 dark:text-zinc-300">Confirm New Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                  <Input
                    id="profile-confirm-password"
                    name="confirmNewPassword"
                    type="password"
                    className="pl-9"
                    placeholder="Re-type your new password"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ─── Security PIN Card ───────────────────────────────────────────── */}
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
              <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
              QR Attendance Security PIN
            </CardTitle>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                initialUser.isPinSet
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                  : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
              }`}
            >
              {initialUser.isPinSet ? "Personal PIN Active" : "PIN Setup Required"}
            </span>
          </div>
          <CardDescription>
            Set a private 6-digit PIN for QR sign-in when no account session is active.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePinSubmit} className="space-y-4 max-w-xl">
            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="pin-current-verification" className="text-zinc-700 dark:text-zinc-300">
                  Current Password or PIN
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                  <Input
                    id="pin-current-verification"
                    name="currentVerification"
                    type="password"
                    placeholder="Enter your current password or PIN"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="pin-new" className="text-zinc-700 dark:text-zinc-300">
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
                      placeholder="Example: 482905"
                      title="Use 6 digits without repeated or sequential patterns."
                      className="pl-9 text-center font-bold tracking-widest"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="pin-confirm" className="text-zinc-700 dark:text-zinc-300">
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
                      placeholder="Re-enter your 6-digit PIN"
                      className="pl-9 text-center font-bold tracking-widest"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={pinLoading} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              {pinLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving PIN...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save New PIN
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ─── Daily Mood Card ───────────────────────────────────────────── */}
      {initialUser.role !== "SUPER_ADMIN" && (
        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
              <User className="size-5 text-emerald-700" />
              Daily Mood
            </CardTitle>
            <CardDescription>
              Update your mood and a short note without changing your profile data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleMoodSubmit} className="space-y-5 max-w-xl">
              <div className="grid gap-2 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/30 dark:bg-zinc-900/10">
                <Label className="text-zinc-800 dark:text-zinc-200 font-semibold">Your Mood Today</Label>
                <input type="hidden" name="currentMood" value={selectedMood} />
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {MOODS.map((m) => {
                    const isSelected = selectedMood === m.key;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setSelectedMood(m.key)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                          isSelected
                            ? `${m.bgColor} ${m.borderColor} ring-2 ring-blue-500 scale-[1.03] shadow-sm`
                            : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                        }`}
                      >
                        <span className="text-2xl mb-1">{m.emoji}</span>
                        <span className="text-[10px] font-bold text-zinc-950 dark:text-zinc-50">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="profile-mood-note" className="text-zinc-700 dark:text-zinc-300">Mood Note</Label>
                <Input
                  id="profile-mood-note"
                  name="moodNote"
                  placeholder="Write a brief description of what you are doing or feeling..."
                  defaultValue={initialUser.moodNote ?? ""}
                />
              </div>

              <Button type="submit" disabled={moodLoading} className="w-full sm:w-auto">
                {moodLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Mood
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <BackgroundSettingsCard />
    </div>
  );
}
