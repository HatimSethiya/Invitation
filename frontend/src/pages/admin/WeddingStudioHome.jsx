import { Link } from "react-router-dom";
import { STUDIO_CATEGORIES, STUDIO_TEMPLATES, listStudioTemplates } from "../../studio/templateCatalog";
import { GALLERY_DESIGNS } from "../../studio/galleryDesigns";
import "./WeddingStudioHome.css";

const studioSteps = [
  {
    number: "01",
    title: "Discover your style",
    description: "Browse wedding traditions and find a design that feels right.",
  },
  {
    number: "02",
    title: "Make it yours",
    description: "Personalize your names, celebrations, colors and details.",
  },
  {
    number: "03",
    title: "Preview & share",
    description: "See your invitation and publish when it is ready.",
  },
];

function WeddingStudioHome() {
  const existingDesignCount = GALLERY_DESIGNS.length;
  const studioPreviewCount = STUDIO_TEMPLATES.length;

  return (
    <main className="wedding-studio-page">
      <div className="wedding-studio-shell">
        <nav className="wedding-studio-nav" aria-label="Wedding Studio navigation">
          <Link to="/admin/studio" className="wedding-studio-brand">
            <span className="wedding-studio-brand-mark" aria-hidden="true">✦</span>
            <span>
              <strong>Wedding Studio</strong>
              <small>Invitation Design Atelier</small>
            </span>
          </Link>
          <div className="wedding-studio-nav-actions">
            <Link to="/admin/studio/templates" className="wedding-studio-nav-link">Templates</Link>
            <Link to="/admin/dashboard" className="wedding-studio-nav-link">
              My Cards
            </Link>
            <Link to="/admin/invitations/new" className="wedding-studio-nav-create">
              Create Invitation <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </nav>

        <header className="wedding-studio-hero">
          <div className="wedding-studio-hero-copy">
            <span className="wedding-studio-kicker">THE WEDDING DESIGN ATELIER</span>
            <h1>
              Your celebration,
              <span> beautifully told.</span>
            </h1>
            <p>
              A home for meaningful wedding invitations. Explore wedding
              traditions and craft a design that feels uniquely yours.
            </p>
            <div className="wedding-studio-hero-actions">
              <Link className="wedding-studio-action-primary" to="/admin/studio/templates">
                Explore Design Gallery <span aria-hidden="true">↗</span>
              </Link>
              <Link className="wedding-studio-action-secondary" to="/admin/invitations/new">
                Create With Current Builder
              </Link>
              <Link className="wedding-studio-action-secondary" to="/admin/dashboard">
                Open My Cards
              </Link>
            </div>
            <span className="wedding-studio-hero-hint">
              Your existing invitation cards and their designs stay unchanged.
            </span>
          </div>

          <div className="wedding-studio-hero-art" aria-hidden="true">
            <div className="wedding-studio-art-halo" />
            <div className="wedding-studio-art-card">
              <span className="wedding-studio-art-flourish">❦</span>
              <span className="wedding-studio-art-overline">A CELEBRATION OF LOVE</span>
              <span className="wedding-studio-art-names">Your Wedding</span>
              <span className="wedding-studio-art-divider">✦</span>
              <span className="wedding-studio-art-caption">A story worth celebrating</span>
              <span className="wedding-studio-art-flourish wedding-studio-art-flourish-bottom">❦</span>
            </div>
          </div>
        </header>

        <section className="wedding-studio-collections" aria-labelledby="studio-collection-heading">
          <div className="wedding-studio-section-heading">
            <div>
              <span className="wedding-studio-kicker">DESIGNED FOR EVERY CELEBRATION</span>
              <h2 id="studio-collection-heading">Explore wedding traditions</h2>
              <p>
                Explore existing working themes and original community-specific
                layouts. New layouts become editable in the next phase.
              </p>
            </div>
            <span className="wedding-studio-coming-pill">
              {existingDesignCount} working themes · {studioPreviewCount} new previews
            </span>
          </div>

          <div className="wedding-studio-category-grid">
            {STUDIO_CATEGORIES.map((category, index) => (
              <Link
                className="wedding-studio-category"
                key={category.id}
                to={`/admin/studio/templates?category=${encodeURIComponent(category.id)}`}
                style={{
                  "--studio-category-from": category.colors[0],
                  "--studio-category-to": category.colors[1],
                  "--studio-category-index": index,
                }}
              >
                <span className="wedding-studio-category-symbol" aria-hidden="true">
                  {category.symbol}
                </span>
                <div className="wedding-studio-category-info">
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                  <span>{category.id === "bohra"
                    ? `${existingDesignCount} working themes · ${listStudioTemplates(category.id).length} new preview ↗`
                    : `${listStudioTemplates(category.id).length} new layout ${listStudioTemplates(category.id).length === 1 ? "preview" : "previews"} ↗`}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="wedding-studio-steps" aria-labelledby="studio-steps-heading">
          <span className="wedding-studio-kicker">A SIMPLE CREATIVE JOURNEY</span>
          <h2 id="studio-steps-heading">From inspiration to invitation</h2>
          <div className="wedding-studio-steps-grid">
            {studioSteps.map((step) => (
              <div className="wedding-studio-step-card" key={step.number}>
                <span className="wedding-studio-step-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="wedding-studio-footer">
          <span>Wedding Studio · Crafted for your celebration</span>
          <Link to="/admin/dashboard">Back to My Cards</Link>
        </footer>
      </div>
    </main>
  );
}

export default WeddingStudioHome;
