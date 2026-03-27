import Link from "next/link";
import { Search } from "lucide-react";

import { Badge } from "@/components/shared/Badge";
import type { AccountsListData } from "@/lib/types";

export function AccountsFilters({
  filters,
  options,
}: Pick<AccountsListData, "filters" | "options">) {
  return (
    <form className="grid gap-3 rounded-[28px] border border-border bg-panel p-4 shadow-[var(--shadow-sm)] lg:grid-cols-[1.5fr_repeat(4,0.9fr)_0.8fr]">
      <label className="relative flex items-center">
        <Search className="pointer-events-none absolute left-4 size-4 text-muted-foreground" />
        <input
          type="search"
          name="q"
          defaultValue={filters.q}
          placeholder="Search account or domain"
          className="h-11 w-full rounded-2xl border border-border bg-panel-muted pl-11 pr-4 text-sm text-foreground outline-none focus:border-accent"
        />
      </label>

      <SelectField name="segment" defaultValue={filters.segment} options={options.segments} label="Segment" />
      <SelectField
        name="geography"
        defaultValue={filters.geography}
        options={options.geographies}
        label="Geography"
      />
      <SelectField name="owner" defaultValue={filters.owner} options={options.owners} label="Owner" />
      <SelectField name="stage" defaultValue={filters.stage} options={options.stages} label="Stage" />
      <SelectField
        name="scoreBucket"
        defaultValue={filters.scoreBucket}
        label="Score bucket"
        options={[
          { value: "hot", label: "Hot" },
          { value: "warm", label: "Warm" },
          { value: "cold", label: "Cold" },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 lg:col-span-full">
        <div className="flex flex-wrap gap-2">
          {filters.segment ? <Badge tone="neutral">{filters.segment.replaceAll("_", " ")}</Badge> : null}
          {filters.geography ? <Badge tone="neutral">{filters.geography.replaceAll("_", " ")}</Badge> : null}
          {filters.stage ? <Badge tone="neutral">{filters.stage.replaceAll("_", " ")}</Badge> : null}
          {filters.scoreBucket ? <Badge tone="accent">{filters.scoreBucket}</Badge> : null}
        </div>
        <div className="flex gap-2">
          <Link
            href="/accounts"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-border px-4 text-sm font-medium text-muted-foreground hover:bg-panel-muted hover:text-foreground"
          >
            Clear
          </Link>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-white hover:opacity-92"
          >
            Apply filters
          </button>
        </div>
      </div>
    </form>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: { label: string; value: string }[];
}) {
  return (
    <label className="space-y-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="h-11 w-full rounded-2xl border border-border bg-panel-muted px-3 text-sm text-foreground outline-none focus:border-accent"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
