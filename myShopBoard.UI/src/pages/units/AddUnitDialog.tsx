import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, Download, Plug, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabPanel } from "@/components/ui/tabs";
import {
  assetService,
  type AssetImportResponse,
  type AssetLookups,
  type AssetResponse,
  type CreateAssetRequest,
} from "@/services/assets";

/** Display only. The server owns the real column contract - see AssetImportService. */
const TEMPLATE_COLUMNS = [
  { header: "UnitNumber", required: true },
  { header: "Type", required: true },
  { header: "Status", required: true },
  { header: "Yard", required: true },
  { header: "Vin", required: false },
  { header: "Year", required: false },
  { header: "Make", required: false },
  { header: "Model", required: false },
  { header: "LicensePlate", required: false },
];

const TABS = [
  { id: "manual", label: "Manual" },
  { id: "import", label: "File Import" },
  { id: "integration", label: "Integration" },
];

export function AddUnitDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (unit: AssetResponse) => void;
}) {
  const [tab, setTab] = useState("manual");

  const lookups = useQuery({
    queryKey: ["asset-lookups"],
    queryFn: () => assetService.getLookups(),
    staleTime: 5 * 60_000,
    retry: false,
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 animate-fade-in bg-black/40"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-unit-title"
        className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-card shadow-soft-lg"
      >
        <header className="flex items-center justify-between px-5 pb-2 pt-4">
          <h2 id="add-unit-title" className="text-base font-bold tracking-tight">Add units</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <Tabs tabs={TABS} active={tab} onChange={setTab} className="px-3" />

        {lookups.isError && (
          <p className="m-4 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
            Could not load types, statuses and yards from <code>/api/assets/lookups</code>.
          </p>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <TabPanel active={tab === "manual"}>
            <ManualTab lookups={lookups.data} onCreated={onCreated} onClose={onClose} />
          </TabPanel>

          <TabPanel active={tab === "import"}>
            <ImportTab onDone={onClose} />
          </TabPanel>

          <TabPanel active={tab === "integration"}>
            <IntegrationTab />
          </TabPanel>
        </div>
      </div>
    </div>
  );
}

/* ---------- manual ---------- */

function ManualTab({
  lookups,
  onCreated,
  onClose,
}: {
  lookups: AssetLookups | undefined;
  onCreated: (unit: AssetResponse) => void;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<CreateAssetRequest>({
    unitNumber: "",
    assetTypeId: 0,
    assetStatusId: 0,
    yardId: 0,
    vin: "",
    year: null,
    make: "",
    model: "",
    licensePlate: "",
  });

  useEffect(() => {
    if (!lookups) return;
    setForm((f) => ({
      ...f,
      assetTypeId: f.assetTypeId || (lookups.assetTypes[0]?.id ?? 0),
      assetStatusId: f.assetStatusId || (lookups.assetStatuses[0]?.id ?? 0),
      yardId: f.yardId || (lookups.yards[0]?.id ?? 0),
    }));
  }, [lookups]);

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  const create = useMutation({
    mutationFn: (body: CreateAssetRequest) => assetService.create(body),
    onSuccess: (unit) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["fleet-map"] });
      onCreated(unit);
      onClose();
    },
  });

  const canSubmit =
    form.unitNumber.trim().length > 0 &&
    form.assetTypeId > 0 &&
    form.assetStatusId > 0 &&
    form.yardId > 0 &&
    !create.isPending;

  return (
    <form
      className="space-y-3 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) create.mutate(form);
      }}
    >
      {create.isError && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
          {(create.error as Error).message}
        </p>
      )}

      <Labelled label="Unit number" required>
        <Input
          ref={firstFieldRef}
          value={form.unitNumber}
          maxLength={30}
          placeholder="214"
          onChange={(e) => setForm({ ...form, unitNumber: e.target.value })}
        />
      </Labelled>

      <div className="grid gap-3 sm:grid-cols-3">
        <Labelled label="Type" required>
          <Select value={form.assetTypeId} options={lookups?.assetTypes ?? []} onChange={(id) => setForm({ ...form, assetTypeId: id })} />
        </Labelled>
        <Labelled label="Status" required>
          <Select value={form.assetStatusId} options={lookups?.assetStatuses ?? []} onChange={(id) => setForm({ ...form, assetStatusId: id })} />
        </Labelled>
        <Labelled label="Yard" required>
          <Select value={form.yardId} options={lookups?.yards ?? []} onChange={(id) => setForm({ ...form, yardId: id })} />
        </Labelled>
      </div>

      <Labelled label="VIN">
        <Input
          value={form.vin ?? ""}
          maxLength={17}
          placeholder="Optional — trailers and loaders often have none"
          onChange={(e) => setForm({ ...form, vin: e.target.value })}
        />
      </Labelled>

      <div className="grid gap-3 sm:grid-cols-4">
        <Labelled label="Year">
          <Input
            type="number"
            value={form.year ?? ""}
            onChange={(e) => setForm({ ...form, year: e.target.value ? Number(e.target.value) : null })}
          />
        </Labelled>
        <Labelled label="Make">
          <Input value={form.make ?? ""} onChange={(e) => setForm({ ...form, make: e.target.value })} />
        </Labelled>
        <Labelled label="Model">
          <Input value={form.model ?? ""} onChange={(e) => setForm({ ...form, model: e.target.value })} />
        </Labelled>
        <Labelled label="Plate">
          <Input value={form.licensePlate ?? ""} onChange={(e) => setForm({ ...form, licensePlate: e.target.value })} />
        </Labelled>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={!canSubmit}>
          {create.isPending ? "Saving…" : "Add unit"}
        </Button>
      </div>
    </form>
  );
}

/* ---------- file import ---------- */

function ImportTab({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<AssetImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const committed = preview?.committed ?? false;

  const template = useMutation({
    mutationFn: () => assetService.downloadImportTemplate(),
    onSuccess: (blob) => saveBlob(blob, "myshopboard-units-template.xlsx"),
    onError: (err: Error) => setError(err.message),
  });

  const upload = useMutation({
    mutationFn: ({ f, commit }: { f: File; commit: boolean }) => assetService.importFile(f, commit),
    onSuccess: (response) => {
      setPreview(response);
      if (response.committed) {
        queryClient.invalidateQueries({ queryKey: ["assets"] });
        queryClient.invalidateQueries({ queryKey: ["fleet-map"] });
      }
    },
    onError: (err: Error) => {
      setPreview(null);
      setError(err.message);
    },
  });

  function handleFile(next: File) {
    setError(null);
    setPreview(null);
    setFile(next);
    upload.mutate({ f: next, commit: false });
  }

  return (
    <div className="space-y-4 p-5">
      <section>
        <h3 className="text-sm font-bold">1 · Download the template</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Excel workbook with the expected columns, an example row, and a Reference sheet
          listing every valid type, status and yard.
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {TEMPLATE_COLUMNS.map((column) => (
            <span key={column.header} className="rounded border bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium">
              {column.header}
              {column.required && <span className="ml-0.5 text-destructive">*</span>}
            </span>
          ))}
        </div>

        <Button size="sm" variant="secondary" className="mt-3" disabled={template.isPending} onClick={() => template.mutate()}>
          <Download className="h-3.5 w-3.5" />
          {template.isPending ? "Preparing…" : "Download template"}
        </Button>
      </section>

      <section className="border-t pt-4">
        <h3 className="text-sm font-bold">2 · Upload the completed file</h3>

        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const dropped = e.dataTransfer.files[0];
            if (dropped) handleFile(dropped);
          }}
          className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
            dragging ? "border-primary bg-accent" : "hover:bg-muted/50"
          }`}
        >
          <input
            type="file"
            accept=".xlsx,.csv"
            className="sr-only"
            onChange={(e) => {
              const chosen = e.target.files?.[0];
              if (chosen) handleFile(chosen);
            }}
          />
          <Upload className="mb-1.5 h-5 w-5 text-muted-foreground" />
          <span className="text-xs font-semibold">
            {file?.name ?? "Drop a file here, or click to choose"}
          </span>
          <span className="mt-0.5 text-[11px] text-muted-foreground">.xlsx or .csv · up to 5 MB</span>
        </label>

        {upload.isPending && !committed && (
          <p className="mt-2 text-xs text-muted-foreground">Checking the file…</p>
        )}

        {error && (
          <p className="mt-2 flex items-start gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}
      </section>

      {preview && (
        <section className="border-t pt-4">
          <h3 className="text-sm font-bold">
            {committed
              ? `Imported ${preview.importedRows} of ${preview.totalRows}`
              : `3 · Review — ${preview.validRows} ready`}
            {!committed && preview.totalRows - preview.validRows > 0 && (
              <span className="text-destructive"> · {preview.totalRows - preview.validRows} with errors</span>
            )}
          </h3>

          <div className="mt-2 max-h-48 overflow-y-auto rounded-md border">
            <table className="w-full text-xs">
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.rowNumber} className="border-b last:border-b-0">
                    <td className="w-10 px-2 py-1.5 text-muted-foreground">{row.rowNumber}</td>
                    <td className="px-2 py-1.5 font-semibold">{row.unitNumber}</td>
                    <td className="px-2 py-1.5">
                      {row.errors.length > 0 ? (
                        <span className="text-destructive">{row.errors.join("; ")}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <Check className="h-3 w-3" />
                          {row.imported ? "Imported" : "Ready"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex justify-end gap-2">
            {committed ? (
              <Button onClick={onDone}>Done</Button>
            ) : (
              <>
                <Button variant="secondary" onClick={() => { setPreview(null); setFile(null); }}>
                  Clear
                </Button>
                <Button
                  disabled={preview.validRows === 0 || upload.isPending || !file}
                  onClick={() => file && upload.mutate({ f: file, commit: true })}
                >
                  {upload.isPending
                    ? "Importing…"
                    : `Import ${preview.validRows} unit${preview.validRows === 1 ? "" : "s"}`}
                </Button>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/* ---------- integration ---------- */

function IntegrationTab() {
  return (
    <div className="space-y-4 p-5">
      <div className="flex items-start gap-3 rounded-lg border border-dashed p-4">
        <Plug className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div>
          <h3 className="text-sm font-bold">Telematics import</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Pull the vehicle list from a provider, match it against existing units, and keep
            positions live afterwards. Not built yet.
          </p>
        </div>
      </div>

      <ol className="space-y-2.5">
        <ScaffoldStep n={1} title="Connect a provider" body="Samsara, TruckX, Motive or Geotab. Needs an API key stored in Secret Manager, never in the database." />
        <ScaffoldStep n={2} title="Match to existing units" body="Match on VIN first, then unit number. Every match is shown for confirmation before anything is written — an unattended overwrite on a fleet list is not recoverable." />
        <ScaffoldStep n={3} title="Choose per field" body="Skip, create, or overwrite. Overwrite must be opt-in per field, not a blanket toggle." />
        <ScaffoldStep n={4} title="Keep positions live" body="Writes the provider id to AssetLocations.ExternalRef and switches Source from 'manual'. The table and index for this already exist." />
      </ol>

      <p className="rounded-md bg-muted/60 p-2.5 text-[11px] leading-snug text-muted-foreground">
        The schema is already shaped for this: <code>AssetLocations</code> carries a{" "}
        <code>Source</code> discriminator and an indexed <code>ExternalRef</code>, so a poller
        upserts the same rows with no migration.
      </p>
    </div>
  );
}

function ScaffoldStep({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
        {n}
      </span>
      <div>
        <p className="text-xs font-semibold">{title}</p>
        <p className="text-[11px] leading-snug text-muted-foreground">{body}</p>
      </div>
    </li>
  );
}

/* ---------- shared ---------- */

function Labelled({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </span>
      {children}
    </label>
  );
}

function Select({
  value,
  options,
  onChange,
}: {
  value: number;
  options: { id: number; name: string }[];
  onChange: (id: number) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="flex h-10 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {options.length === 0 && <option value={0}>—</option>}
      {options.map((option) => (
        <option key={option.id} value={option.id}>{option.name}</option>
      ))}
    </select>
  );
}
