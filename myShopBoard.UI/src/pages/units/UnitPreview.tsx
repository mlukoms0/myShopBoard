import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, MousePointerClick, Trash2, Wrench } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabPanel } from "@/components/ui/tabs";
import { formatDate, formatMeter } from "@/lib/format";
import { assetService, type AssetResponse } from "@/services/assets";

const TABS = [
  { id: "general", label: "General" },
  { id: "issues", label: "Issues" },
  { id: "service", label: "Service History" },
];

/**
 * Detail panel beside the unit table.
 *
 * The table carries only enough to find a unit - number, type, status, yard. Everything
 * else lives here, so the table stays scannable at 200 units instead of turning into a
 * horizontally scrolling spreadsheet.
 */
export function UnitPreview({
  unit,
  onDeleted,
}: {
  unit: AssetResponse | null;
  onDeleted: () => void;
}) {
  const [tab, setTab] = useState("general");
  const [confirming, setConfirming] = useState(false);
  const queryClient = useQueryClient();

  // Drop the confirm state when the selection changes, or the next unit opens armed.
  useEffect(() => {
    setConfirming(false);
  }, [unit?.id]);

  const archive = useMutation({
    mutationFn: (id: number) => assetService.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["fleet-map"] });
      onDeleted();
    },
  });

  if (!unit) {
    return (
      <aside className="flex min-h-[320px] flex-col items-center justify-center rounded-lg bg-card p-6 text-center shadow-soft">
        <MousePointerClick className="mb-3 h-7 w-7 text-muted-foreground/50" />
        <p className="text-sm font-semibold">No unit selected</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Pick a row to see its details, meters and service history.
        </p>
      </aside>
    );
  }

  return (
    <aside className="flex flex-col overflow-hidden rounded-lg bg-card shadow-soft">
      <header className="px-4 pb-3 pt-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="truncate text-xl font-bold tracking-tight">{unit.unitNumber}</h2>
          <span className="shrink-0 text-xs text-muted-foreground">{unit.assetTypeName}</span>
        </div>
        <div className="mt-1.5">
          <StatusBadge name={unit.statusName} colorHex={unit.statusColorHex} />
        </div>
      </header>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <TabPanel active={tab === "general"}>
          <Section title="Identification">
            <Field label="VIN" value={unit.vin} mono />
            <Field label="Licence plate" value={unit.licensePlate} />
            <Field label="Registration" value={unit.registrationNumber} />
          </Section>

          <Section title="Specification">
            <Field label="Year" value={unit.year != null ? String(unit.year) : null} />
            <Field label="Make" value={unit.make} />
            <Field label="Model" value={unit.model} />
            <Field label="Colour" value={unit.color} />
          </Section>

          <Section title="Meters">
            <Field
              label="Primary"
              value={unit.currentPrimaryMeter != null
                ? formatMeter(unit.currentPrimaryMeter, unit.primaryMeterUnit)
                : null}
            />
            <Field
              label="Secondary"
              value={unit.currentSecondaryMeter != null
                ? formatMeter(unit.currentSecondaryMeter, unit.secondaryMeterUnit)
                : null}
            />
            {/*
              A meter reading with no date is untrustworthy: every service-due calculation
              hangs off it, and a six-month-old odometer silently makes PM look on schedule.
            */}
            <Field label="Last read" value={unit.currentMeterAsOfUtc ? formatDate(unit.currentMeterAsOfUtc) : null} />
          </Section>

          <Section title="Assignment">
            <Field label="Yard" value={`${unit.yardName} (${unit.yardCode})`} />
            <Field label="In service" value={unit.inServiceDate ? formatDate(unit.inServiceDate) : null} />
            <Field label="Acquired" value={unit.dateAcquiredUtc ? formatDate(unit.dateAcquiredUtc) : null} />
            <Field
              label="Out of service"
              value={unit.outOfServiceDate ? formatDate(unit.outOfServiceDate) : null}
            />
          </Section>

          <Section title="Compliance" last>
            <Field label="DOT expires" value={unit.dotExpiresAtUtc ? formatDate(unit.dotExpiresAtUtc) : null} />
            <Field
              label="Registration expires"
              value={unit.registrationExpiresAtUtc ? formatDate(unit.registrationExpiresAtUtc) : null}
            />
            <Field
              label="Insurance expires"
              value={unit.insuranceExpiresAtUtc ? formatDate(unit.insuranceExpiresAtUtc) : null}
            />
          </Section>
        </TabPanel>

        <TabPanel active={tab === "issues"}>
          <div className="space-y-3">
            <div className="flex min-h-[120px] flex-col items-center justify-center rounded-md border border-dashed bg-muted/40 px-4 text-center">
              <ClipboardList className="mb-2 h-6 w-6 text-muted-foreground/60" />
              <p className="text-xs font-semibold text-muted-foreground">No open issues</p>
              <p className="mt-1 max-w-[30ch] text-[11px] leading-snug text-muted-foreground/80">
                Needs the Issues table — defects, fault codes and their resolution.
              </p>
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Planned sources
              </p>
              <ul className="space-y-1.5">
                <IssueSourcePreview
                  source="Telematics"
                  body="Fault codes and DVIR defects pulled from Samsara, TruckX or Motive. Heavy-duty codes are SPN + FMI + OC, not a single OBD-II string."
                />
                <IssueSourcePreview
                  source="Reported internally"
                  body="Raised by a driver or mechanic from the unit's QR page, or auto-created from a failed inspection item."
                />
              </ul>
            </div>
          </div>
        </TabPanel>

        <TabPanel active={tab === "service"}>
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-md border border-dashed bg-muted/40 px-4 text-center">
            <Wrench className="mb-2 h-6 w-6 text-muted-foreground/60" />
            <p className="text-xs font-semibold text-muted-foreground">No service history yet</p>
            <p className="mt-1 max-w-[30ch] text-[11px] leading-snug text-muted-foreground/80">
              Needs the ServiceEntries and ServiceEntryLineItems tables — nothing records
              completed work against a unit yet.
            </p>
          </div>
        </TabPanel>
      </div>

      <footer className="shrink-0 border-t p-3">
        {archive.isError && (
          <p className="mb-2 text-[11px] text-destructive">{(archive.error as Error).message}</p>
        )}

        {confirming ? (
          <div className="space-y-2">
            <p className="text-[11px] leading-snug text-muted-foreground">
              Delete <span className="font-semibold text-foreground">{unit.unitNumber}</span>? It is
              archived, not erased — service records are retained for DOT compliance.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" className="flex-1" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="danger"
                className="flex-1"
                disabled={archive.isPending}
                onClick={() => archive.mutate(unit.id)}
              >
                {archive.isPending ? "Deleting…" : "Confirm"}
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="ghost" className="w-full" onClick={() => setConfirming(true)}>
            <Trash2 className="h-3.5 w-3.5" />
            Delete unit
          </Button>
        )}
      </footer>
    </aside>
  );
}

/** Ghost card showing the shape an issue will take, and where it will come from. */
function IssueSourcePreview({ source, body }: { source: string; body: string }) {
  return (
    <li className="rounded-md border border-dashed p-2.5 opacity-70">
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
        <span className="text-[11px] font-semibold">{source}</span>
      </div>
      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{body}</p>
    </li>
  );
}

function Section({
  title,
  children,
  last = false,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <section className={last ? "" : "mb-4 border-b pb-4"}>
      <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <dl className="space-y-1.5">{children}</dl>
    </section>
  );
}

/**
 * A value that is genuinely absent renders as an em dash rather than an empty gap, so a
 * missing VIN reads as missing rather than as a rendering glitch.
 */
function Field({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd
        className={`min-w-0 truncate text-right text-xs font-semibold ${
          mono ? "font-mono text-[11px]" : ""
        } ${value ? "" : "text-muted-foreground/60"}`}
      >
        {value || "—"}
      </dd>
    </div>
  );
}
