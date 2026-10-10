/**
 * VelvetCurtains: Heavy luxury theatre velvet drapery with continuous vertical folds,
 * organic wavy/curved leading edges, uneven fold widths, and non-linear bunching physics.
 */
function VelvetCurtains({ isOpening }) {
  return (
    <div
      className={`theatrical-curtains-stage ${isOpening ? "curtains-parting" : ""}`}
      aria-hidden="true"
    >
      {/* ------------------------------------------------------------------
         LEFT CURTAIN (6 Organic Overlapping Folds with Curved Drape Profile)
         ------------------------------------------------------------------ */}
      <div className="velvet-curtain curtain-left">
        {/* Deep fabric backing base */}
        <div className="curtain-fabric-base" />

        {/* Fold 1: Outer Wall Drape */}
        <div className="curtain-pleat pleat-1">
          <div className="pleat-sheen" />
          <div className="pleat-shadow" />
        </div>

        {/* Fold 2: Deep Shadowed Valley */}
        <div className="curtain-pleat pleat-2 pleat-valley">
          <div className="pleat-shadow" />
        </div>

        {/* Fold 3: Convex Highlight Crest */}
        <div className="curtain-pleat pleat-3 pleat-crest">
          <div className="pleat-sheen" />
        </div>

        {/* Fold 4: Intermediate Shadow Valley */}
        <div className="curtain-pleat pleat-4 pleat-valley">
          <div className="pleat-shadow" />
        </div>

        {/* Fold 5: Forward Highlight Pleat */}
        <div className="curtain-pleat pleat-5 pleat-crest">
          <div className="pleat-sheen" />
        </div>

        {/* Fold 6: Master Leading Edge with Organic Wavy Silhouette & Warm Rim Light */}
        <div className="curtain-pleat pleat-6 pleat-leading-edge">
          <div className="pleat-sheen" />
          <div className="leading-edge-light-rim" />
        </div>
      </div>

      {/* ------------------------------------------------------------------
         RIGHT CURTAIN (6 Organic Overlapping Folds with Curved Drape Profile)
         ------------------------------------------------------------------ */}
      <div className="velvet-curtain curtain-right">
        {/* Deep fabric backing base */}
        <div className="curtain-fabric-base" />

        {/* Fold 1: Outer Wall Drape */}
        <div className="curtain-pleat pleat-1">
          <div className="pleat-sheen" />
          <div className="pleat-shadow" />
        </div>

        {/* Fold 2: Deep Shadowed Valley */}
        <div className="curtain-pleat pleat-2 pleat-valley">
          <div className="pleat-shadow" />
        </div>

        {/* Fold 3: Convex Highlight Crest */}
        <div className="curtain-pleat pleat-3 pleat-crest">
          <div className="pleat-sheen" />
        </div>

        {/* Fold 4: Intermediate Shadow Valley */}
        <div className="curtain-pleat pleat-4 pleat-valley">
          <div className="pleat-shadow" />
        </div>

        {/* Fold 5: Forward Highlight Pleat */}
        <div className="curtain-pleat pleat-5 pleat-crest">
          <div className="pleat-sheen" />
        </div>

        {/* Fold 6: Master Leading Edge with Organic Wavy Silhouette & Warm Rim Light */}
        <div className="curtain-pleat pleat-6 pleat-leading-edge">
          <div className="pleat-sheen" />
          <div className="leading-edge-light-rim" />
        </div>
      </div>

      {/* Top Valance / Pelmet Shadow */}
      <div className="stage-top-drape-shadow" />
    </div>
  );
}

export default VelvetCurtains;
