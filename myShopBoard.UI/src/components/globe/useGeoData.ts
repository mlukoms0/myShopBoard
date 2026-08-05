import { useEffect, useState } from "react";

export type Ring = [number, number][];

export interface GeoData {
  /** Every land ring on Earth, as [lng, lat] pairs. Used to rasterise the dot mask. */
  land: Ring[];
  /** US state boundaries, including the outer coastline, as line strings. */
  stateLines: Ring[];
}

export interface GeoState {
  data: GeoData | null;
  error: string | null;
}

/**
 * Loads real geography, lazily.
 *
 * Both files are pulled with dynamic `import()` so Vite emits them as a separate chunk -
 * ~166 KB combined, and only the Overview page needs them, so they must not sit in the
 * initial bundle.
 *
 * Replaces the hand-written coastlines that were here before. Those were about 40 points
 * per continent: fine for proving the projection worked, too coarse to ship, and incapable
 * of expressing state borders at all.
 */
export function useGeoData(): GeoState {
  const [state, setState] = useState<GeoState>({ data: null, error: null });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [topoModule, landTopo, statesTopo] = await Promise.all([
          import("topojson-client"),
          import("world-atlas/land-110m.json"),
          import("us-atlas/states-10m.json"),
        ]);

        if (cancelled) return;

        /* eslint-disable @typescript-eslint/no-explicit-any */
        // topojson-client ships both a CJS dist and an ESM src. Depending on how Vite
        // resolves it, the named exports may sit on the namespace or under `.default` -
        // so unwrap defensively rather than assuming one shape.
        const topo: any = (topoModule as any).default ?? topoModule;
        const landJson: any = (landTopo as any).default ?? landTopo;
        const statesJson: any = (statesTopo as any).default ?? statesTopo;

        if (typeof topo?.feature !== "function" || typeof topo?.mesh !== "function") {
          throw new Error("topojson-client did not expose feature()/mesh()");
        }
        if (!landJson?.objects?.land) throw new Error("land-110m.json has no `land` object");
        if (!statesJson?.objects?.states) throw new Error("states-10m.json has no `states` object");

        // TopoJSON stores shared borders once as "arcs" and stitches them on demand, which
        // is why these files are a fraction of the equivalent GeoJSON. feature() and mesh()
        // do the stitching. mesh() with no filter returns every border ONCE, so shared edges
        // are not drawn twice.
        const landFeature: any = topo.feature(landJson, landJson.objects.land);
        const stateMesh: any = topo.mesh(statesJson, statesJson.objects.states);
        /* eslint-enable @typescript-eslint/no-explicit-any */

        // Both `land` and `states` are GeometryCollections, so feature() hands back a
        // FeatureCollection - NOT a Feature. Normalising here rather than reaching for
        // `.geometry` means this keeps working whichever shape a given atlas file produces.
        const land = extractRings(landFeature);
        const stateLines = extractRings(stateMesh);

        if (land.length === 0) throw new Error("no land rings were extracted");

        setState({ data: { land, stateLines }, error: null });
      } catch (err) {
        if (cancelled) return;
        // Loud on purpose. The previous version swallowed this and the globe just rendered
        // as an empty sphere with no clue why.
        console.error("[FleetGlobe] failed to load geography", err);
        setState({ data: null, error: err instanceof Error ? err.message : String(err) });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/**
 * Normalises ANY GeoJSON shape down to a flat list of coordinate rings.
 *
 * Handles FeatureCollection, Feature, GeometryCollection and bare geometries, because which
 * one you get depends on whether the source TopoJSON object was a GeometryCollection or a
 * single geometry - and that varies between atlas files.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
function extractRings(input: any): Ring[] {
  if (!input || typeof input !== "object") return [];

  if (input.type === "FeatureCollection" && Array.isArray(input.features)) {
    return input.features.flatMap((f: any) => extractRings(f));
  }

  if (input.type === "GeometryCollection" && Array.isArray(input.geometries)) {
    return input.geometries.flatMap((g: any) => extractRings(g));
  }

  if (input.type === "Feature") return extractRings(input.geometry);

  if (input.coordinates) return collectRings(input);

  return [];
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Flattens one GeoJSON geometry's coordinates into rings, so the renderer does not have to
 * care whether it was a Polygon, a MultiPolygon or a MultiLineString.
 */
function collectRings(geometry: { type: string; coordinates: unknown }): Ring[] {
  const rings: Ring[] = [];

  const walk = (node: unknown, depth: number) => {
    if (!Array.isArray(node)) return;

    // A ring is an array of [lng, lat] pairs - detected by its first element being a pair
    // of numbers rather than another array.
    const first = node[0];
    if (Array.isArray(first) && typeof first[0] === "number" && typeof first[1] === "number") {
      rings.push(node as Ring);
      return;
    }

    if (depth > 4) return;
    for (const child of node) walk(child, depth + 1);
  };

  walk(geometry.coordinates, 0);
  return rings;
}
