import { normalizeStudioDesign } from "./studioDesignOptions";
import "./StudioInvitationPreview.css";
import "./StudioInvitationCustomization.css";

function CoupleNames({ names, vertical = false }) {
  return (
    <div className={`studio-invite-names${vertical ? " studio-invite-names-stacked" : ""}`}>
      <span>{names[0]}</span>
      <span className="studio-invite-ampersand">&amp;</span>
      <span>{names[1]}</span>
    </div>
  );
}

/**
 * The same isolated React layouts power gallery samples and the live editor.
 * Phase 4 details never touch PublicInvitation or legacy invitation CSS.
 * Public sharing remains intentionally unavailable until Phase 6.
 */
function StudioInvitationPreview({ template, enlarged = false, details = null }) {
  if (!template?.sample) return null;

  const design = normalizeStudioDesign(details?.design);
  const { sections } = design;
  const primaryEvent = details?.events?.find(
    (event) => event.title || event.date || event.time || event.venue
  );
  const sample = details ? {
    ...template.sample,
    names: [
      details.partner1?.trim() || "First Partner",
      details.partner2?.trim() || "Second Partner",
    ],
    heading: sections.heading ? (details.heading?.trim() || "") : "",
    ceremony: primaryEvent?.title?.trim() || template.sample.ceremony,
    detail: sections.family ? (details.familyLine?.trim() || "") : "",
  } : template.sample;

  const dateValue = primaryEvent?.date || details?.weddingDate;
  const dateLabel = dateValue
    ? new Date(`${dateValue}T12:00:00`).toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Wedding date to be confirmed";
  const placeLabel = primaryEvent?.venue?.trim() || details?.venue?.name?.trim()
    || "Venue to be confirmed";

  const hasRibbon = Boolean(details && (
    sections.dateVenue || (sections.message && details.message?.trim())
  ));

  const classes = [
    "studio-invite-preview",
    `studio-invite-${template.layout}`,
    enlarged ? "studio-invite-expanded" : "",
    details ? "studio-invite-has-details" : "",
    `studio-invite-font-${design.font}`,
    `studio-invite-palette-${design.palette}`,
    `studio-invite-bg-${design.background}`,
    hasRibbon ? "studio-invite-has-info" : "",
  ].filter(Boolean).join(" ");

  let content;

  switch (template.layout) {
    case "fatemi":
      content = (
        <div className="studio-invite-fatemi-frame">
          <div className="studio-invite-fatemi-calligraphy" lang="ar" dir="rtl">
            بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
          </div>
          <span className="studio-invite-filigree" aria-hidden="true">✦ ❧ ✦</span>
          {sample.heading && <span className="studio-invite-overline">{sample.heading}</span>}
          <CoupleNames names={sample.names} vertical />
          {sample.detail && <p>{sample.detail}</p>}
          <div className="studio-invite-fatemi-programme">
            <span aria-hidden="true">✧</span>
            {sample.ceremony}
            <span aria-hidden="true">✧</span>
          </div>
          <span className="studio-invite-footline">An invitation of love &amp; blessings</span>
        </div>
      );
      break;
    case "emerald":
      content = (
        <div className="studio-invite-emerald-arch">
          <div className="studio-invite-emerald-orbit" aria-hidden="true">☾</div>
          {sample.heading && <span className="studio-invite-overline">{sample.heading}</span>}
          <p className="studio-invite-emerald-blessing">بِسْمِ اللّٰهِ</p>
          <CoupleNames names={sample.names} vertical />
          <span className="studio-invite-star-rule" aria-hidden="true">✧ ─ ✧</span>
          {sample.detail && <p>{sample.detail}</p>}
          <span className="studio-invite-footline">{sample.ceremony}</span>
        </div>
      );
      break;
    case "mandap":
      content = (
        <div className="studio-invite-mandap-sheet">
          {sample.heading && <span className="studio-invite-mandap-welcome">{sample.heading}</span>}
          <div className="studio-invite-mandap-scene" aria-hidden="true">
            <span className="studio-invite-mandap-bunting">✿ ❃ ✿ ❃ ✿</span>
            <div className="studio-invite-mandap-roof" />
            <div className="studio-invite-mandap-pillars"><i /><span>✦</span><i /></div>
          </div>
          <span className="studio-invite-overline">{sample.ceremony}</span>
          <CoupleNames names={sample.names} vertical />
          {sample.detail && <p>{sample.detail}</p>}
          <span className="studio-invite-footline">Celebrate with us</span>
        </div>
      );
      break;
    case "lotus":
      content = (
        <div className="studio-invite-lotus-sheet">
          <div className="studio-invite-lotus-blooms" aria-hidden="true"><span>❀</span><span>✿</span><span>❀</span></div>
          {sample.heading && <span className="studio-invite-overline">{sample.heading}</span>}
          <div className="studio-invite-lotus-medallion" aria-hidden="true">❁</div>
          <h3>{sample.ceremony}</h3>
          <CoupleNames names={sample.names} />
          <span className="studio-invite-lotus-underline" aria-hidden="true">❦</span>
          {sample.detail && <p>{sample.detail}</p>}
          <span className="studio-invite-footline">A beautiful beginning</span>
        </div>
      );
      break;
    case "jain":
      content = (
        <div className="studio-invite-jain-sheet">
          <div className="studio-invite-jain-topline"><span>✧</span><span>✧</span></div>
          <div className="studio-invite-jain-medallion" aria-hidden="true">❁</div>
          {sample.heading && <span className="studio-invite-overline">{sample.heading}</span>}
          <h3>{sample.ceremony}</h3>
          <CoupleNames names={sample.names} vertical />
          {sample.detail && <p>{sample.detail}</p>}
          <div className="studio-invite-jain-bottomline" aria-hidden="true">— ✦ —</div>
        </div>
      );
      break;
    case "anand":
      content = (
        <div className="studio-invite-anand-sheet">
          <div className="studio-invite-anand-header">
            <span className="studio-invite-anand-symbol" lang="pa" aria-label="Ik Onkar">ੴ</span>
            {sample.heading && <span className="studio-invite-overline">{sample.heading}</span>}
          </div>
          <div className="studio-invite-anand-lines" aria-hidden="true">✧ · ✧</div>
          <div className="studio-invite-anand-content">
            {sample.detail && <p>{sample.detail}</p>}
            <CoupleNames names={sample.names} vertical />
            <span className="studio-invite-footline">{sample.ceremony}</span>
          </div>
          <div className="studio-invite-anand-footer" aria-hidden="true">✦ ✦ ✦</div>
        </div>
      );
      break;
    case "chapel":
      content = (
        <div className="studio-invite-chapel-sheet">
          <div className="studio-invite-chapel-flowers" aria-hidden="true">❀ ❧ ❀</div>
          <div className="studio-invite-chapel-window">
            <span className="studio-invite-chapel-cross" aria-hidden="true">✝</span>
            {sample.heading && <span className="studio-invite-overline">{sample.heading}</span>}
            <CoupleNames names={sample.names} vertical />
            {sample.detail && <p>{sample.detail}</p>}
            <span className="studio-invite-footline">{sample.ceremony}</span>
          </div>
        </div>
      );
      break;
    case "bandhani":
      content = (
        <div className="studio-invite-bandhani-sheet">
          <div className="studio-invite-bandhani-dots" aria-hidden="true">◆ · ◆ · ◆</div>
          <div className="studio-invite-bandhani-emblem" aria-hidden="true">✿</div>
          {sample.heading && <span className="studio-invite-overline">{sample.heading}</span>}
          <CoupleNames names={sample.names} vertical />
          <span className="studio-invite-bandhani-rule" aria-hidden="true">✦ ✧ ✦</span>
          {sample.detail && <p>{sample.detail}</p>}
          <span className="studio-invite-footline">{sample.ceremony}</span>
        </div>
      );
      break;
    case "kolam":
      content = (
        <div className="studio-invite-kolam-sheet">
          <div className="studio-invite-kolam-temple" aria-hidden="true">
            <span>✦</span><i /><i /><i /><i />
          </div>
          {sample.heading && <span className="studio-invite-overline">{sample.heading}</span>}
          <div className="studio-invite-kolam-motif" aria-hidden="true">❖</div>
          <CoupleNames names={sample.names} vertical />
          {sample.detail && <p>{sample.detail}</p>}
          <span className="studio-invite-kolam-ceremony">{sample.ceremony}</span>
          <div className="studio-invite-kolam-footer" aria-hidden="true">❁ ❖ ❁</div>
        </div>
      );
      break;
    case "jharokha":
      content = (
        <div className="studio-invite-jharokha-sheet">
          <div className="studio-invite-jharokha-arch">
            <div className="studio-invite-jharokha-crown" aria-hidden="true">✥</div>
            {sample.heading && <span className="studio-invite-overline">{sample.heading}</span>}
            <CoupleNames names={sample.names} vertical />
            {sample.detail && <p>{sample.detail}</p>}
            <span className="studio-invite-footline">{sample.ceremony}</span>
          </div>
          <div className="studio-invite-jharokha-base" aria-hidden="true">❧ ◆ ❧</div>
        </div>
      );
      break;
    case "editorial":
      content = (
        <div className="studio-invite-editorial-sheet">
          <div className="studio-invite-editorial-top">
            <span>THE INVITATION</span><span>NO. 001</span>
          </div>
          {sample.heading && <span className="studio-invite-editorial-label">{sample.heading}</span>}
          <CoupleNames names={sample.names} vertical />
          <div className="studio-invite-editorial-bottom">
            <span>{sample.ceremony}</span>
            {sample.detail && <span>{sample.detail}</span>}
          </div>
        </div>
      );
      break;
    case "glass":
      content = (
        <div className="studio-invite-glass-panel">
          <div className="studio-invite-glass-stars" aria-hidden="true">✦ · ✧ · ✦</div>
          <div className="studio-invite-glass-orbit" aria-hidden="true">◇</div>
          {sample.heading && <span className="studio-invite-overline">{sample.heading}</span>}
          <CoupleNames names={sample.names} vertical />
          <span className="studio-invite-glass-divider" aria-hidden="true">✧</span>
          {sample.detail && <p>{sample.detail}</p>}
          <span className="studio-invite-footline">{sample.ceremony}</span>
        </div>
      );
      break;
    default:
      return null;
  }

  return (
    <div
      className={classes}
      role="img"
      aria-label={`${template.name}: ${details ? "preview of" : "sample"} ${sample.names[0]} and ${sample.names[1]} invitation`}
    >
      {content}
      {hasRibbon && (
        <div className="studio-invite-detail-ribbon">
          {sections.dateVenue && (
            <>
              <span>{dateLabel}</span>
              <span>{placeLabel}</span>
              {primaryEvent?.time && <span>{primaryEvent.time}</span>}
            </>
          )}
          {sections.message && details.message?.trim() && (
            <span className="studio-invite-detail-message">{details.message.trim()}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default StudioInvitationPreview;
