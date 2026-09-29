import { useParams } from "react-router-dom";

function PublicInvitation() {
  const { slug } = useParams();

  return (
    <main className="page-shell">
      <section className="page-card">
        <span className="eyebrow">Invitation</span>
        <h1>Wedding Invitation</h1>
        <p>Invitation slug: {slug}</p>
      </section>
    </main>
  );
}

export default PublicInvitation;
