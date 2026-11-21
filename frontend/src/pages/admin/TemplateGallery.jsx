import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { STUDIO_CATEGORIES, STUDIO_TEMPLATES, filterStudioTemplates } from "../../studio/templateCatalog";
import StudioInvitationPreview from "../../studio/StudioInvitationPreview";
import {
  GALLERY_COLORS,
  GALLERY_DESIGNS,
  GALLERY_STYLES,
  filterGalleryDesigns,
} from "../../studio/galleryDesigns";
import "./TemplateGallery.css";

const formatLabel = (entries, value) =>
  entries.find((entry) => entry.id === value)?.name || value;

function DesignPreview({ design, enlarged = false }) {
  return (
    <div
      className={`theme-preview-card theme-preview-${design.id} template-gallery-artwork${enlarged ? " template-gallery-artwork-large" : ""}`}
      role="img"
      aria-label={`${design.name} design sample with placeholder couple names`}
    >
      <span className="theme-preview-ornament" aria-hidden="true">✦</span>
      <span className="theme-preview-kicker">Wedding Invitation</span>
      <strong>
        Ayaan <em>Weds</em> Sara
      </strong>
      <span className="theme-preview-footer">Your Wedding Day</span>
    </div>
  );
}

function TemplateGallery() {
  const [params, setParams] = useSearchParams();
  const [previewDesign, setPreviewDesign] = useState(null);
  const closePreviewRef = useRef(null);

  const rawCategory = params.get("category") || "all";
  const category = STUDIO_CATEGORIES.some((entry) => entry.id === rawCategory)
    ? rawCategory
    : "all";
  const search = params.get("q") || "";
  const rawStyle = params.get("style") || "all";
  const style = GALLERY_STYLES.some((entry) => entry.id === rawStyle) ? rawStyle : "all";
  const rawColor = params.get("color") || "all";
  const color = GALLERY_COLORS.some((entry) => entry.id === rawColor) ? rawColor : "all";
  const hasFilters = category !== "all" || Boolean(search) || style !== "all" || color !== "all";

  const results = useMemo(() => {
    const newLayouts = filterStudioTemplates({ category, search, style, color })
      .map((template) => ({ ...template, kind: "studio" }));
    const existingThemes = filterGalleryDesigns({ category, search, style, color })
      .map((design) => ({ ...design, kind: "existing" }));

    return [...newLayouts, ...existingThemes];
  }, [category, search, style, color]);

  const updateFilter = (name, value) => {
    const next = new URLSearchParams(params);
    if (!value || value === "all") next.delete(name);
    else next.set(name, value);
    setParams(next, { replace: true });
  };

  const resetFilters = () => setParams({}, { replace: true });

  useEffect(() => {
    if (!previewDesign) return undefined;

    const previousFocus = document.activeElement;
    closePreviewRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") setPreviewDesign(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus?.();
    };
  }, [previewDesign]);

  return (
    <main className="wedding-studio-page studio-template-gallery">
      <div className="wedding-studio-shell">
        <nav className="wedding-studio-nav" aria-label="Template Gallery navigation">
          <Link to="/admin/studio" className="wedding-studio-brand">
            <span className="wedding-studio-brand-mark" aria-hidden="true">✦</span>
            <span>
              <strong>Wedding Studio</strong>
              <small>Invitation Design Atelier</small>
            </span>
          </Link>
          <div className="wedding-studio-nav-actions">
            <Link to="/admin/studio" className="wedding-studio-nav-link">Studio Home</Link>
            <Link to="/admin/dashboard" className="wedding-studio-nav-create">My Cards</Link>
          </div>
        </nav>

        <header className="template-gallery-header">
          <span className="wedding-studio-kicker">THE DESIGN COLLECTION</span>
          <h1>Find the invitation <em>you love.</em></h1>
          <p>
            Discover original wedding layouts for every celebration, plus
            existing color themes you can already customize in the current builder.
          </p>
          <div className="template-gallery-notice">
            <span aria-hidden="true">✧</span>
            You can now personalize new community layouts and save private,
            password-protected drafts. Publishing is not enabled for these new
            layouts yet. Existing Bohra themes still use the original builder.
          </div>
        </header>

        <section className="template-gallery-collections" aria-label="Filter by wedding tradition">
          <div className="template-gallery-section-title">
            <h2>Choose a collection</h2>
            <p>Browse original designs by tradition and discover your favorite look.</p>
          </div>
          <div className="template-gallery-category-tabs">
            <button
              type="button"
              className={`template-gallery-category-tab${category === "all" ? " is-active" : ""}`}
              aria-pressed={category === "all"}
              onClick={() => updateFilter("category", "all")}
            >
              <span aria-hidden="true">✧</span> All Designs
              <small>{GALLERY_DESIGNS.length + STUDIO_TEMPLATES.length}</small>
            </button>
            {STUDIO_CATEGORIES.map((entry) => {
              const count = GALLERY_DESIGNS.filter((design) => design.categoryId === entry.id).length
                + STUDIO_TEMPLATES.filter((template) => template.categoryId === entry.id).length;
              return (
                <button
                  type="button"
                  key={entry.id}
                  className={`template-gallery-category-tab${category === entry.id ? " is-active" : ""}`}
                  aria-pressed={category === entry.id}
                  onClick={() => updateFilter("category", entry.id)}
                >
                  <span aria-hidden="true">{entry.symbol}</span>
                  {entry.name}
                  <small>{count}</small>
                </button>
              );
            })}
          </div>
        </section>

        <section className="template-gallery-library" aria-labelledby="template-gallery-library-title">
          <div className="template-gallery-section-title">
            <div>
              <span className="wedding-studio-kicker">PERSONALIZE YOUR STYLE</span>
              <h2 id="template-gallery-library-title">Invitation Design Library</h2>
            </div>
            <span className="template-gallery-result-count" aria-live="polite">
              {results.length} {results.length === 1 ? "design" : "designs"} shown
            </span>
          </div>

          <div className="template-gallery-filter-bar">
            <label className="template-gallery-search">
              <span>Search designs</span>
              <input
                type="search"
                placeholder="Search by name, style or color"
                value={search}
                onChange={(event) => updateFilter("q", event.target.value)}
              />
            </label>
            <label>
              <span>Style</span>
              <select value={style} onChange={(event) => updateFilter("style", event.target.value)}>
                <option value="all">All Styles</option>
                {GALLERY_STYLES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label>
              <span>Color</span>
              <select value={color} onChange={(event) => updateFilter("color", event.target.value)}>
                <option value="all">All Colors</option>
                {GALLERY_COLORS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            {hasFilters && (
              <button type="button" className="template-gallery-reset" onClick={resetFilters}>
                Clear filters
              </button>
            )}
          </div>

          {results.length ? (
            <div className="template-gallery-design-grid">
              {results.map((design) => (
                <article className="template-gallery-design-card" key={design.id}>
                  <div className="template-gallery-design-preview">
                    {design.kind === "studio"
                      ? <StudioInvitationPreview template={design} />
                      : <DesignPreview design={design} />}
                    <span className="template-gallery-design-type">
                      {design.kind === "studio" ? "New layout · Preview" : "Existing theme"}
                    </span>
                  </div>
                  <div className="template-gallery-design-details">
                    <div className="template-gallery-design-tags">
                      <span>{formatLabel(GALLERY_STYLES, design.style)}</span>
                      <span>{formatLabel(GALLERY_COLORS, design.color)}</span>
                    </div>
                    <h3>{design.name}</h3>
                    <p>{design.description}</p>
                    <div className="template-gallery-card-actions">
                      {design.kind === "studio" ? (
                        <Link
                          className="template-gallery-use-button"
                          to={`/admin/studio/create/${encodeURIComponent(design.id)}`}
                        >
                          Make My Card <span aria-hidden="true">↗</span>
                        </Link>
                      ) : (
                        <Link
                          className="template-gallery-use-button"
                          to={`/admin/invitations/new?theme=${encodeURIComponent(design.id)}`}
                        >
                          Customize <span aria-hidden="true">↗</span>
                        </Link>
                      )}
                      <button
                        type="button"
                        className="template-gallery-preview-button"
                        onClick={() => setPreviewDesign(design)}
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="template-gallery-empty-state" role="status">
              <span aria-hidden="true">✧</span>
              <h3>No designs match these filters</h3>
              <p>Try another community, color, style or search to discover more designs.</p>
              <button type="button" onClick={resetFilters}>View all existing designs</button>
            </div>
          )}
        </section>

        <footer className="wedding-studio-footer">
          <span>Wedding Studio · Your design, your story</span>
          <Link to="/admin/studio">Back to Studio Home</Link>
        </footer>
      </div>

      {previewDesign && (
        <div
          className="template-gallery-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewDesign(null);
          }}
        >
          <div className="template-gallery-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="gallery-preview-title">
            <div className="template-gallery-dialog-heading">
              <div>
                <span className="wedding-studio-kicker">DESIGN SAMPLE</span>
                <h2 id="gallery-preview-title">{previewDesign.name}</h2>
              </div>
              <button
                type="button"
                className="template-gallery-dialog-close"
                aria-label="Close preview"
                ref={closePreviewRef}
                onClick={() => setPreviewDesign(null)}
              >
                ×
              </button>
            </div>
            {previewDesign.kind === "studio"
              ? <StudioInvitationPreview template={previewDesign} enlarged />
              : <DesignPreview design={previewDesign} enlarged />}
            <p>
              {previewDesign.kind === "studio"
                ? "Original template preview with sample wording and names. Customize it in the new editor and save a secure private draft; publishing will be available in a later phase."
                : "This uses the current builder's color-theme preview, not a full guest invitation. Actual content is personalized in the editor."}
            </p>
            {previewDesign.kind === "existing" ? (
              <Link
                to={`/admin/invitations/new?theme=${encodeURIComponent(previewDesign.id)}`}
                className="template-gallery-use-button"
              >
                Customize This Design <span aria-hidden="true">↗</span>
              </Link>
            ) : (
              <Link
                to={`/admin/studio/create/${encodeURIComponent(previewDesign.id)}`}
                className="template-gallery-use-button"
              >
                Make My Card <span aria-hidden="true">↗</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default TemplateGallery;
