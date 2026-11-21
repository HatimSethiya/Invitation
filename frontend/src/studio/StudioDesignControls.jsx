import {
  DEFAULT_STUDIO_DESIGN,
  STUDIO_BACKGROUND_OPTIONS,
  STUDIO_FONT_OPTIONS,
  STUDIO_PALETTE_OPTIONS,
  STUDIO_SECTION_OPTIONS,
  normalizeStudioDesign,
} from "./studioDesignOptions";
import "./StudioDesignControls.css";

/**
 * Phase 5 customization is intentionally declarative: only preset IDs and
 * boolean visibility flags are allowed. Existing legacy cards are untouched.
 */
function StudioDesignControls({ value, onChange }) {
  const design = normalizeStudioDesign(value);

  const updateChoice = (key, selection) => {
    onChange({ ...design, [key]: selection });
  };

  const updateVisibility = (key, visible) => {
    onChange({
      ...design,
      sections: {
        ...design.sections,
        [key]: visible,
      },
    });
  };

  return (
    <div className="studio-design-controls">
      <label className="studio-design-select">
        Font style
        <select
          value={design.font}
          onChange={(event) => updateChoice("font", event.target.value)}
        >
          {STUDIO_FONT_OPTIONS.map((option) => (
            <option value={option.id} key={option.id}>{option.label}</option>
          ))}
        </select>
      </label>

      <fieldset className="studio-design-choice-group">
        <legend>Color palette</legend>
        <div className="studio-design-palette-grid">
          {STUDIO_PALETTE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`studio-design-palette${design.palette === option.id ? " is-selected" : ""}`}
              onClick={() => updateChoice("palette", option.id)}
              aria-pressed={design.palette === option.id}
              title={option.label}
            >
              <span
                className="studio-design-palette-swatch"
                style={{ backgroundColor: option.swatch }}
                aria-hidden="true"
              />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="studio-design-choice-group">
        <legend>Background finish</legend>
        <div className="studio-design-background-grid">
          {STUDIO_BACKGROUND_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`studio-design-background studio-design-background-${option.id}${design.background === option.id ? " is-selected" : ""}`}
              onClick={() => updateChoice("background", option.id)}
              aria-pressed={design.background === option.id}
            >
              <span className="studio-design-background-mark" aria-hidden="true">✦</span>
              <strong>{option.label}</strong>
              <small>{option.description}</small>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="studio-design-choice-group">
        <legend>Show / hide card sections</legend>
        <p className="studio-design-help">
          Hidden sections keep their details saved. Switch them back on anytime.
        </p>
        <div className="studio-design-section-list">
          {STUDIO_SECTION_OPTIONS.map(({ id, label }) => (
            <label className="studio-design-section-toggle" key={id}>
              <span>{label}</span>
              <input
                type="checkbox"
                checked={design.sections[id]}
                onChange={(event) => updateVisibility(id, event.target.checked)}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <button
        className="studio-design-reset"
        type="button"
        onClick={() => onChange(normalizeStudioDesign(DEFAULT_STUDIO_DESIGN))}
      >
        Reset design to template defaults
      </button>
    </div>
  );
}

export default StudioDesignControls;
