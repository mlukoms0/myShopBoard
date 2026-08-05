/**
 * Continental view.
 *
 * phi0 38 puts the viewer almost directly over the lower 48, so North America faces us
 * square-on instead of being foreshortened toward the limb - that is what makes it read
 * large. The trade-off is that South America falls further away underneath, which is fine
 * because the sphere is scaled to bleed off the container anyway.
 *
 * `scale` is recomputed from the container size at runtime; this value is only a fallback.
 */
export const HOME_VIEW = { lam0: -96, phi0: 38, scale: 190 };

/**
 * Coastlines and state borders now come from real TopoJSON via useGeoData - see that file.
 * The hand-written continent outlines that used to live here were about 40 points each:
 * fine for proving the projection worked, too coarse to ship, and incapable of expressing
 * state boundaries at all.
 */
