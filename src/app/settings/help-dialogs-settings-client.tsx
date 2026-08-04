"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HelpCircle, FileText, CheckCircle, Info, Loader2, Clock3, BookOpen, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { updateHelpRulesAction } from "./actions";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

type Rules = {
  rules_wfo: string;
  rules_leave_sick: string;
  rules_correction: string;
  rules_wfh_plan: string;
  rules_wfh_report: string;
};

export function HelpDialogsSettingsClient({ initialRules }: { initialRules: Rules }) {
  const [rules, setRules] = useState<Rules>(initialRules);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateHelpRulesAction(rules);
      toast.success("Help popup dialog rules updated successfully!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update rules.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: keyof Rules, val: string) => {
    setRules((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <Card id="section-help-rules" className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-none rounded-2xl overflow-hidden scroll-mt-28">
      <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-50">
          <BookOpen className="size-5 text-blue-600 dark:text-blue-400" />
          Help Rules Popups Configuration
        </CardTitle>
        <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Configure help popup rich text content shown across WFO, WFH, and leave requests.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSave}>
        <CardContent className="pt-6 space-y-6">
          <div className="rounded-xl bg-blue-50/50 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-900/50 p-4 text-xs leading-relaxed text-blue-800 dark:text-blue-300 flex gap-2.5 items-start">
            <Info className="size-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <p className="font-semibold">Rich Text Editor Enabled</p>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                Use the toolbar to format rules with headings, bold, italic, underline, bullets, or numbers. Previews on the right update in real-time.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* WFO Rules */}
            <div id="sub-wfo-rules" className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-950/20 grid gap-5 lg:grid-cols-2 scroll-mt-28 shadow-xs">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
                  <Clock3 className="size-4 text-blue-600" />
                  WFO Check-in & Check-out Rules
                </label>
                <RichTextEditor
                  value={rules.rules_wfo}
                  onChange={(val) => handleChange("rules_wfo", val)}
                  placeholder="Enter rules content for WFO Check-in/out popup..."
                />
              </div>
              <div className="space-y-2 flex flex-col">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Live Preview: WFO Rules Popup</span>
                <div
                  className="rules-rich-editor flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 min-h-[170px]"
                  dangerouslySetInnerHTML={{ __html: rules.rules_wfo || "<i>No rules content</i>" }}
                />
              </div>
            </div>

            {/* Leave & Sick Rules */}
            <div id="sub-leave-rules" className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-950/20 grid gap-5 lg:grid-cols-2 scroll-mt-28 shadow-xs">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
                  <HelpCircle className="size-4 text-violet-600" />
                  Leave & Sick Request Rules
                </label>
                <RichTextEditor
                  value={rules.rules_leave_sick}
                  onChange={(val) => handleChange("rules_leave_sick", val)}
                  placeholder="Enter rules content for Leave & Sick Request popup..."
                />
              </div>
              <div className="space-y-2 flex flex-col">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Live Preview: Leave & Sick Rules Popup</span>
                <div
                  className="rules-rich-editor flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 min-h-[170px]"
                  dangerouslySetInnerHTML={{ __html: rules.rules_leave_sick || "<i>No rules content</i>" }}
                />
              </div>
            </div>

            {/* Correction Rules */}
            <div id="sub-correction-rules" className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-950/20 grid gap-5 lg:grid-cols-2 scroll-mt-28 shadow-xs">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
                  <FileText className="size-4 text-emerald-600" />
                  Attendance Correction Rules
                </label>
                <RichTextEditor
                  value={rules.rules_correction}
                  onChange={(val) => handleChange("rules_correction", val)}
                  placeholder="Enter rules content for Attendance Correction popup..."
                />
              </div>
              <div className="space-y-2 flex flex-col">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Live Preview: Correction Rules Popup</span>
                <div
                  className="rules-rich-editor flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 min-h-[170px]"
                  dangerouslySetInnerHTML={{ __html: rules.rules_correction || "<i>No rules content</i>" }}
                />
              </div>
            </div>

            {/* WFH Work Plan Rules */}
            <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-950/20 grid gap-5 lg:grid-cols-2 shadow-xs">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
                  <CheckCircle className="size-4 text-amber-600" />
                  WFH Work Plan Rules
                </label>
                <RichTextEditor
                  value={rules.rules_wfh_plan}
                  onChange={(val) => handleChange("rules_wfh_plan", val)}
                  placeholder="Enter rules content for WFH Work Plan popup..."
                />
              </div>
              <div className="space-y-2 flex flex-col">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Live Preview: WFH Plan Rules Popup</span>
                <div
                  className="rules-rich-editor flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 min-h-[100px]"
                  dangerouslySetInnerHTML={{ __html: rules.rules_wfh_plan || "<i>No rules content</i>" }}
                />
              </div>
            </div>

            {/* WFH Work Report Rules */}
            <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-950/20 grid gap-5 lg:grid-cols-2 shadow-xs">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
                  <CheckCircle className="size-4 text-emerald-600" />
                  WFH Work Report Rules
                </label>
                <RichTextEditor
                  value={rules.rules_wfh_report}
                  onChange={(val) => handleChange("rules_wfh_report", val)}
                  placeholder="Enter rules content for WFH Work Report popup..."
                />
              </div>
              <div className="space-y-2 flex flex-col">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Live Preview: WFH Report Rules Popup</span>
                <div
                  className="rules-rich-editor flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 min-h-[100px]"
                  dangerouslySetInnerHTML={{ __html: rules.rules_wfh_report || "<i>No rules content</i>" }}
                />
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/30 px-6 py-4 flex justify-end">
          <Button type="submit" disabled={loading} className="w-full sm:w-auto font-semibold">
            {loading ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
            Save Help Dialog Rules
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
