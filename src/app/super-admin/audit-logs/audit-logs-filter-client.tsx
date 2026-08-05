"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Archive, User, Search, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type ActorItem = {
  id: string;
  name: string;
  email: string;
};

type Props = {
  actors: ActorItem[];
  entities: string[];
  initialActorId: string;
  initialEntity: string;
  initialSearch: string;
};

export function AuditLogsFilterClient({
  actors,
  entities,
  initialActorId,
  initialEntity,
  initialSearch,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [actorId, setActorId] = useState(initialActorId);
  const [entity, setEntity] = useState(initialEntity);
  const [search, setSearch] = useState(initialSearch);

  const updateParams = (newActorId: string, newEntity: string, newSearch: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newActorId) params.set("actorId", newActorId);
    else params.delete("actorId");

    if (newEntity) params.set("entity", newEntity);
    else params.delete("entity");

    if (newSearch) params.set("search", newSearch);
    else params.delete("search");

    router.push(`/super-admin/audit-logs?${params.toString()}`);
  };

  // Live search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== initialSearch) {
        updateParams(actorId, entity, search);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const hasActiveFilters = Boolean(actorId || entity || search);

  const handleReset = () => {
    setActorId("");
    setEntity("");
    setSearch("");
    updateParams("", "", "");
  };

  return (
    <Card className="shadow-none border border-zinc-200 dark:border-zinc-800">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-4">
          <div className="grid gap-4 sm:grid-cols-3 flex-1">
            {/* Actor Filter */}
            <div className="grid gap-1.5">
              <label htmlFor="actor-select" className="text-xs font-semibold flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                <User className="size-3.5 text-zinc-500" />
                Actor
              </label>
              <select
                id="actor-select"
                value={actorId}
                onChange={(e) => {
                  setActorId(e.target.value);
                  updateParams(e.target.value, entity, search);
                }}
                className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 px-3 text-xs focus:outline-none"
              >
                <option value="">All Actors</option>
                {actors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Entity Filter */}
            <div className="grid gap-1.5">
              <label htmlFor="entity-select" className="text-xs font-semibold flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                <Archive className="size-3.5 text-zinc-500" />
                Entity
              </label>
              <select
                id="entity-select"
                value={entity}
                onChange={(e) => {
                  setEntity(e.target.value);
                  updateParams(actorId, e.target.value, search);
                }}
                className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 px-3 text-xs focus:outline-none"
              >
                <option value="">All Entities</option>
                {entities.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>

            {/* Live Search Input */}
            <div className="grid gap-1.5">
              <label htmlFor="search-input" className="text-xs font-semibold flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                <Search className="size-3.5 text-zinc-500" />
                Search Action
              </label>
              <div className="relative">
                <Input
                  id="search-input"
                  placeholder="Action..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pr-8 text-xs"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      updateParams(actorId, entity, "");
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-9 px-3 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1.5 cursor-pointer self-end"
            >
              <RotateCcw className="size-3.5" />
              Reset Filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
