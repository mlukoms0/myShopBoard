import { useEffect, useMemo, useRef, useState } from "react";
import type { MapStateResponse, MapUnitResponse } from "@/services/fleetMap";
import { HOME_VIEW } from "./geography";
import { useGeoData, type Ring } from "./useGeoData";

interface View {
  lam0: number;
  phi0: number;
  scale: number;
}

/** Degrees between land dots. 1.8 gives ~6,000 points - trivial for canvas. */
const DOT_STEP = 1.8;

/**
 * Where the sphere's centre sits inside the container, as fractions of its size.
 * Pushed right and slightly high so the globe bleeds off the right edge and the bottom,
 * leaving the populated northern hemisphere in view.
 */
const CENTRE_X_RATIO = 0.5;
const CENTRE_Y_RATIO = 0.46;

/**
 * Sphere radius as a fraction of the container's short side.
 * Above ~0.5 the globe is larger than the box and deliberately overflows - which is the
 * point: a fully contained sphere reads as a diagram, a cropped one reads as scenery.
 */
const HOME_SCALE_RATIO = 0.86;

/**
 * How far a drag may move the view, in screen pixels, before it stops.
 *
 * Deliberately a nudge rather than free rotation: you can shift the framing to see a
 * neighbouring state, but you cannot spin the Earth away and lose the composition. Because
 * the budget is in pixels and converted to degrees at the current scale, the drag covers the
 * same physical distance at every zoom level.
 */
const MAX_PAN_PX = 150;

/**
 * How far the wheel may zoom, as multiples of the framed scale.
 * A nudge, not a zoom tool - enough to lean in on a cluster, not enough to lose the framing.
 */
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.8;

/** Resolution of the offscreen land mask. 1440x720 is 0.25 degrees per pixel. */
const MASK_W = 1440;
const MASK_H = 720;

/** What a hovered marker reports up so the tooltip can render outside the SVG. */
export interface HoverInfo {
  x: number;
  y: number;
  title: string;
  color: string;
  lines: string[];
}

/**
 * Dotted orthographic globe with real geography.
 *
 * Orthographic is the projection a camera at infinite distance sees: curved limb,
 * foreshortening toward the edges, far hemisphere never computed. It is a PROJECTION, not a
 * 3D scene - so this is canvas and SVG, with no WebGL and no idle animation loop.
 *
 * Canvas draws the ~6,000 land dots and the state borders; SVG draws the markers on top.
 * Dots on canvas because re-rendering thousands of DOM nodes per frame stutters. Markers in
 * SVG because each needs hover, focus and its own colour - free in the DOM, painful on canvas.
 */
export function FleetGlobe({
  states,
  selectedStateCode,
  selectedYardId,
  onSelectState,
  onSelectYard,
}: {
  states: MapStateResponse[];
  selectedStateCode: string | null;
  selectedYardId: number | null;
  onSelectState: (code: string) => void;
  onSelectYard: (yardId: number) => void;
}) {
  const { data: geo, error: geoError } = useGeoData();
  const [view, setView] = useState<View>(HOME_VIEW);
  const [size, setSize] = useState({ w: 720, h: 460 });
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [panning, setPanning] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useRef<number | null>(null);
  const dragRef = useRef<{ x: number; y: number; captured: boolean } | null>(null);
  /** Set during a drag so the pointerup does not also fire a marker's click. */
  const didDragRef = useRef(false);
  /** The framed view that the pan and zoom budgets are measured against. */
  const anchorRef = useRef({ lam0: HOME_VIEW.lam0, phi0: HOME_VIEW.phi0, scale: HOME_VIEW.scale });

  const cx = size.w * CENTRE_X_RATIO;
  const cy = size.h * CENTRE_Y_RATIO;

  const selectedState = useMemo(
    () => states.find((s) => s.stateCode === selectedStateCode) ?? null,
    [states, selectedStateCode],
  );

  const selectedYard = useMemo(
    () => selectedState?.yards.find((y) => y.yardId === selectedYardId) ?? null,
    [selectedState, selectedYardId],
  );

  /**
   * Which grid points fall on land.
   *
   * Rasterises every coastline into an offscreen equirectangular bitmap once, then samples
   * it per grid point. Ray-casting ~6,000 points against thousands of real coastline rings
   * would be far too slow; a bitmap lookup is O(1) each and pixel-accurate.
   *
   * Runs once when the geography loads - never during panning or zoom.
   */
  const landDots = useMemo<Ring>(() => {
    if (!geo) return [];

    const mask = document.createElement("canvas");
    mask.width = MASK_W;
    mask.height = MASK_H;

    const mctx = mask.getContext("2d", { willReadFrequently: true });
    if (!mctx) return [];

    mctx.fillStyle = "#000";
    for (const ring of geo.land) {
      mctx.beginPath();
      for (let i = 0; i < ring.length; i++) {
        const [lng, lat] = ring[i];
        const x = ((lng + 180) / 360) * MASK_W;
        const y = ((90 - lat) / 180) * MASK_H;
        if (i === 0) mctx.moveTo(x, y);
        else mctx.lineTo(x, y);
      }
      mctx.closePath();
      mctx.fill();
    }

    const pixels = mctx.getImageData(0, 0, MASK_W, MASK_H).data;
    const dots: Ring = [];

    for (let lat = -84; lat <= 84; lat += DOT_STEP) {
      for (let lng = -180; lng < 180; lng += DOT_STEP) {
        const x = Math.floor(((lng + 180) / 360) * MASK_W);
        const y = Math.floor(((90 - lat) / 180) * MASK_H);
        if (pixels[(y * MASK_W + x) * 4 + 3] > 128) dots.push([lng, lat]);
      }
    }

    return dots;
  }, [geo]);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ w: width, h: height });
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /**
   * Wheel zoom, bounded to a window around the framed scale.
   *
   * Registered manually with `passive: false` because React attaches wheel handlers as
   * passive at the root, which makes preventDefault() a no-op - and without it the page
   * scrolls out from under you while you are zooming.
   */
  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setHover(null);

      setView((v) => {
        const anchor = anchorRef.current.scale;
        // Exponential so each notch feels the same regardless of current zoom.
        const next = v.scale * Math.exp(-e.deltaY * 0.0015);
        return { ...v, scale: Math.max(anchor * MIN_ZOOM, Math.min(anchor * MAX_ZOOM, next)) };
      });
    };

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, []);

  // Fly whenever the selection changes. The target derives from props, so the breadcrumb
  // and browser back animate exactly like a click does.
  useEffect(() => {
    setHover(null); // a tooltip left hanging mid-flight points at nothing

    let target: View;
    const baseScale = Math.min(size.w, size.h) * HOME_SCALE_RATIO;

    if (selectedYard?.latitude != null && selectedYard.longitude != null) {
      target = { lam0: Number(selectedYard.longitude), phi0: Number(selectedYard.latitude), scale: baseScale * 26 };
    } else if (selectedState) {
      target = { lam0: Number(selectedState.longitude), phi0: Number(selectedState.latitude), scale: baseScale * 5.5 };
    } else {
      target = { ...HOME_VIEW, scale: baseScale };
    }

    // Re-anchor: every new framing gets its own pan and zoom allowance.
    anchorRef.current = { lam0: target.lam0, phi0: target.phi0, scale: target.scale };

    if (frame.current) cancelAnimationFrame(frame.current);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setView(target);
      return;
    }

    let from: View | null = null;
    const start = performance.now();
    const DURATION = 850;
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const step = (now: number) => {
      setView((current) => {
        if (!from) from = current;
        const t = Math.min(1, (now - start) / DURATION);
        const e = ease(t);
        return {
          lam0: from.lam0 + (target.lam0 - from.lam0) * e,
          phi0: from.phi0 + (target.phi0 - from.phi0) * e,
          // Geometric on scale, so the zoom reads as linear rather than crawling then lurching.
          scale: from.scale * Math.pow(target.scale / from.scale, e),
        };
      });
      if (now - start < DURATION) frame.current = requestAnimationFrame(step);
      else frame.current = null;
    };

    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [selectedState, selectedYard, size.w, size.h]);

  function project(lng: number, lat: number): { x: number; y: number } | null {
    const l = ((lng - view.lam0) * Math.PI) / 180;
    const p = (lat * Math.PI) / 180;
    const p0 = (view.phi0 * Math.PI) / 180;
    const cosC = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
    if (cosC < 0) return null;
    return {
      x: cx + view.scale * Math.cos(p) * Math.sin(l),
      y: cy - view.scale * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l)),
    };
  }

  // Paint. Colours come from the theme's CSS variables so the globe follows light/dark.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);

    const styles = getComputedStyle(wrap);
    const muted = styles.getPropertyValue("--muted-foreground").trim() || "216 10% 52%";
    const primary = styles.getPropertyValue("--primary").trim() || "227 100% 56%";

    // Faint sphere body. Without it the dots float with no mass; a low-contrast wash, not a
    // visible disc that would fight the cards beside it.
    if (view.scale < size.w * 3) {
      const sphere = ctx.createRadialGradient(
        cx - view.scale * 0.3, cy - view.scale * 0.35, view.scale * 0.1,
        cx, cy, view.scale,
      );
      sphere.addColorStop(0, `hsl(${primary} / 0.07)`);
      sphere.addColorStop(0.65, `hsl(${primary} / 0.04)`);
      sphere.addColorStop(1, `hsl(${muted} / 0.06)`);

      ctx.beginPath();
      ctx.arc(cx, cy, view.scale, 0, Math.PI * 2);
      ctx.fillStyle = sphere;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, view.scale, 0, Math.PI * 2);
      ctx.strokeStyle = `hsl(${muted} / 0.18)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Land dots.
    const r = Math.max(1.05, Math.min(2.8, view.scale / 250));
    ctx.fillStyle = `hsl(${muted} / 0.62)`;

    for (const [lng, lat] of landDots) {
      const pt = project(lng, lat);
      if (!pt) continue;
      if (pt.x < -20 || pt.x > size.w + 20 || pt.y < -20 || pt.y > size.h + 20) continue;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // State borders, always visible. They previously faded in only when zoomed, which meant
    // they never showed at the default view where they do most of their work.
    if (geo) {
      const strength = Math.min(0.5, 0.24 + Math.max(0, view.scale - 450) / 3200);
      ctx.strokeStyle = `hsl(${muted} / ${strength.toFixed(3)})`;
      ctx.lineWidth = view.scale > 1200 ? 1.2 : 0.8;
      ctx.beginPath();

      for (const line of geo.stateLines) {
        let pen = false;
        for (const [lng, lat] of line) {
          const pt = project(lng, lat);
          if (!pt) { pen = false; continue; }
          if (pen) ctx.lineTo(pt.x, pt.y);
          else ctx.moveTo(pt.x, pt.y);
          pen = true;
        }
      }

      ctx.stroke();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, size, landDots, geo]);

  // Which markers to draw: states -> yards -> units, one level at a time.
  const level: "states" | "yards" | "units" = selectedYard ? "units" : selectedState ? "yards" : "states";

  /** Swallows a click that was really the end of a drag. */
  const guard = (fn: () => void) => () => {
    if (!didDragRef.current) fn();
  };

  const centre = { x: cx, y: cy };

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        style={{ width: size.w, height: size.h }}
        className="absolute inset-0"
        aria-hidden="true"
      />

      {geoError && (
        <div className="absolute inset-x-0 top-1/2 mx-auto max-w-xs -translate-y-1/2 rounded-lg border border-destructive/30 bg-card p-3 text-center shadow-soft">
          <p className="text-xs font-semibold text-destructive">Map data failed to load</p>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{geoError}</p>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
            If you just installed the atlas packages, restart the Vite dev server.
          </p>
        </div>
      )}

      <svg
        viewBox={`0 0 ${size.w} ${size.h}`}
        className={`absolute inset-0 h-full w-full touch-none ${panning ? "cursor-grabbing" : "cursor-grab"}`}
        role="img"
        aria-label="Fleet locations"
        onMouseLeave={() => setHover(null)}
        onPointerDown={(e) => {
          // NOTE: pointer capture is deliberately NOT taken here.
          // Capturing on pointerdown redirects the matching pointerup to this SVG, so the
          // browser fires `click` on the SVG rather than on the marker that was pressed -
          // which silently broke every pin. Capture is taken lazily below, only once the
          // pointer has actually moved far enough to count as a drag.
          dragRef.current = { x: e.clientX, y: e.clientY, captured: false };
          didDragRef.current = false;
        }}
        onPointerMove={(e) => {
          const drag = dragRef.current;
          if (!drag) return;

          if (!drag.captured) {
            const movedBy = Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y);
            if (movedBy <= 3) return; // still a click, not a drag - leave the view alone

            drag.captured = true;
            didDragRef.current = true;
            setPanning(true);
            setHover(null);
            e.currentTarget.setPointerCapture(e.pointerId);

            // Restart the delta from here so the view does not jump by the threshold.
            drag.x = e.clientX;
            drag.y = e.clientY;
            return;
          }

          const dx = e.clientX - drag.x;
          const dy = e.clientY - drag.y;
          drag.x = e.clientX;
          drag.y = e.clientY;

          setView((v) => {
            // Pixels to degrees: one radian of rotation spans `scale` pixels at the centre of
            // an orthographic projection. Dividing by scale keeps the drag 1:1 at any zoom.
            const perPixel = 180 / (Math.PI * v.scale);
            const budget = MAX_PAN_PX * perPixel;
            const anchor = anchorRef.current;

            const clamp = (value: number, mid: number) =>
              Math.max(mid - budget, Math.min(mid + budget, value));

            return {
              ...v,
              lam0: clamp(v.lam0 - dx * perPixel, anchor.lam0),
              phi0: Math.max(-85, Math.min(85, clamp(v.phi0 + dy * perPixel, anchor.phi0))),
            };
          });
        }}
        onPointerUp={(e) => {
          const drag = dragRef.current;
          dragRef.current = null;
          setPanning(false);
          if (drag?.captured && e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
        }}
        onPointerCancel={() => {
          dragRef.current = null;
          setPanning(false);
        }}
      >
        {level === "states" &&
          states.map((state) => (
            <Marker
              key={state.stateCode}
              point={project(Number(state.longitude), Number(state.latitude))}
              centre={centre}
              color={state.downCount > 0 ? "#DC2626" : "#16A34A"}
              label={`${state.stateName}, ${state.unitCount} units`}
              hover={{
                title: state.stateName,
                color: state.downCount > 0 ? "#DC2626" : "#16A34A",
                lines: [
                  `${state.unitCount} units · ${state.yards.length} yard${state.yards.length === 1 ? "" : "s"}`,
                  `${state.availableCount} available · ${state.downCount} down`,
                ],
              }}
              onHover={setHover}
              onSelect={guard(() => onSelectState(state.stateCode))}
            />
          ))}

        {/* Other states stay on the map while you are zoomed in, dimmed - so panning to a
            neighbour and clicking it actually switches states. */}
        {level !== "states" &&
          states
            .filter((s) => s.stateCode !== selectedStateCode)
            .map((state) => (
              <Marker
                key={state.stateCode}
                point={project(Number(state.longitude), Number(state.latitude))}
                centre={centre}
                dim
                color={state.downCount > 0 ? "#DC2626" : "#16A34A"}
                label={`${state.stateName}, ${state.unitCount} units`}
                hover={{
                  title: state.stateName,
                  color: state.downCount > 0 ? "#DC2626" : "#16A34A",
                  lines: [`${state.unitCount} units`, "Click to switch state"],
                }}
                onHover={setHover}
                onSelect={guard(() => onSelectState(state.stateCode))}
              />
            ))}

        {level === "yards" && selectedState &&
          selectedState.yards.map((yard) => (
            <Marker
              key={yard.yardId}
              point={yard.latitude != null && yard.longitude != null
                ? project(Number(yard.longitude), Number(yard.latitude))
                : null}
              centre={centre}
              color={yard.downCount > 0 ? "#DC2626" : "#16A34A"}
              label={`${yard.yardName}, ${yard.unitCount} units`}
              hover={{
                title: yard.yardName,
                color: yard.downCount > 0 ? "#DC2626" : "#16A34A",
                lines: [
                  yard.city ? `${yard.yardCode} · ${yard.city}` : yard.yardCode,
                  `${yard.unitCount} units`,
                  `${yard.availableCount} available · ${yard.downCount} down`,
                ],
              }}
              onHover={setHover}
              onSelect={guard(() => onSelectYard(yard.yardId))}
            />
          ))}

        {level === "units" && selectedYard &&
          selectedYard.units.map((unit) => (
            <Marker
              key={unit.assetId}
              point={unit.latitude != null && unit.longitude != null
                ? project(Number(unit.longitude), Number(unit.latitude))
                : null}
              centre={centre}
              // Straight from the AssetStatuses table, so the palette here always matches
              // the status chips everywhere else in the app.
              color={unit.statusColorHex}
              label={`${unit.unitNumber}, ${unit.statusName}`}
              hover={{
                title: unit.unitNumber,
                color: unit.statusColorHex,
                lines: unitTooltipLines(unit),
              }}
              onHover={setHover}
            />
          ))}
      </svg>

      {hover && <MarkerTooltip info={hover} containerWidth={size.w} />}
    </div>
  );
}

/* ---------- tooltip ---------- */

function unitTooltipLines(unit: MapUnitResponse): string[] {
  const lines = [unit.statusName, unit.assetTypeName];

  if (unit.latitude != null && unit.longitude != null) {
    lines.push(`${Number(unit.latitude).toFixed(4)}, ${Number(unit.longitude).toFixed(4)}`);
  } else {
    lines.push("No position recorded");
  }

  // Say plainly where the position came from. "Hand-seeded" must never be mistaken for a
  // live GPS fix, and a stale telematics timestamp is exactly what someone needs to see.
  const source =
    unit.locationSource === "manual" ? "Hand-seeded" : (unit.locationSource ?? "Unknown source");
  const when = unit.locationRecordedAtUtc
    ? new Date(unit.locationRecordedAtUtc).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "no timestamp";

  lines.push(`${source} · ${when}`);
  return lines;
}

function MarkerTooltip({ info, containerWidth }: { info: HoverInfo; containerWidth: number }) {
  // Clamp so a marker near the edge does not push the tooltip out of the container.
  const left = Math.min(Math.max(info.x, 100), containerWidth - 100);

  return (
    <div
      className="pointer-events-none absolute z-20 w-max max-w-[230px] -translate-x-1/2 -translate-y-full rounded-lg border bg-card px-3 py-2 shadow-soft-lg"
      style={{ left, top: info.y - 10 }}
      role="tooltip"
    >
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: info.color }} />
        <span className="text-xs font-bold">{info.title}</span>
      </div>
      {info.lines.map((line) => (
        <p key={line} className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
          {line}
        </p>
      ))}
    </div>
  );
}

/* ---------- markers ---------- */

/** How far the marker stands off the surface, as a fraction of the sphere radius. */
const STALK_RADIAL = 0.085;

/** Minimum on-screen lift, so a marker near the disc centre still reads as standing up. */
const STALK_MIN_LIFT = 11;

/** Radius of the ball on the end. */
const BALL_R = 4.2;

/**
 * A stalk with a ball on the end, standing off the globe's surface.
 *
 * The direction is genuinely radial: in an orthographic projection, projecting the same
 * coordinate at a larger radius simply scales its offset from the disc centre, so the vector
 * from surface point to elevated point always points straight out from the sphere - with
 * correct foreshortening for free. Markers near the limb lean outward and read long; markers
 * facing the camera point at you and read short.
 *
 * A purely radial offset collapses to zero length at the exact centre of the disc, which
 * looks broken, so a small constant lift is blended in. That is the one deliberate cheat.
 *
 * No text label: at state level the abbreviation duplicated the table beside it, and at unit
 * level a dozen labels would collide. The tooltip carries the detail.
 */
function Marker({
  point,
  centre,
  color,
  label,
  hover,
  onHover,
  onSelect,
  dim = false,
}: {
  point: { x: number; y: number } | null;
  centre: { x: number; y: number };
  color: string;
  label: string;
  hover: Omit<HoverInfo, "x" | "y">;
  onHover: (info: HoverInfo | null) => void;
  onSelect?: () => void;
  /** Context markers - other states while you are zoomed into one. */
  dim?: boolean;
}) {
  if (!point) return null;

  const dx = point.x - centre.x;
  const dy = point.y - centre.y;
  const dist = Math.hypot(dx, dy);

  const ux = dist > 0.001 ? dx / dist : 0;
  const uy = dist > 0.001 ? dy / dist : 0;
  const radial = dist * STALK_RADIAL;

  const tip = {
    x: point.x + ux * radial,
    y: point.y + uy * radial - STALK_MIN_LIFT,
  };

  const report = () => onHover({ ...hover, x: tip.x, y: tip.y - BALL_R });

  return (
    <g
      className={onSelect ? "cursor-pointer" : "cursor-default"}
      tabIndex={0}
      role={onSelect ? "button" : "img"}
      aria-label={label}
      opacity={dim ? 0.45 : 1}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (onSelect && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onSelect(); }
      }}
      onMouseEnter={report}
      onFocus={report}
      onBlur={() => onHover(null)}
    >
      {/* Invisible hit area over the ball - it is only ~8px across. */}
      <circle cx={tip.x} cy={tip.y} r={14} fill="transparent" />

      {/* Contact point on the surface. */}
      <circle cx={point.x} cy={point.y} r={1.6} fill={color} opacity={0.85} />

      <line
        x1={point.x}
        y1={point.y}
        x2={tip.x}
        y2={tip.y}
        stroke={color}
        strokeWidth={dim ? 1.1 : 1.5}
        strokeLinecap="round"
        opacity={0.9}
      />

      <circle cx={tip.x} cy={tip.y} r={BALL_R} fill={color} stroke="#FFFFFF" strokeWidth={1.4} />

      {/* Off-centre highlight - what makes a flat disc read as a sphere. */}
      <circle
        cx={tip.x - BALL_R * 0.32}
        cy={tip.y - BALL_R * 0.34}
        r={BALL_R * 0.34}
        fill="#FFFFFF"
        opacity={0.55}
      />
    </g>
  );
}
