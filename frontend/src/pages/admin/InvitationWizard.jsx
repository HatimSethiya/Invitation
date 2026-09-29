import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import ImageUpload from "../../components/ImageUpload";

const steps = ["Basic", "Couple", "Events", "Family & Story", "Gallery & Venue", "Theme"];
const eventTemplate = { type: "Wedding", title: "", date: "", time: "", venue: "", address: "", description: "", mapUrl: "" };
const familyTemplate = { name: "", relation: "", side: "other" };
const galleryTemplate = { imageUrl: "", caption: "" };

function InvitationWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "", slug: "", weddingDate: "", theme: "royalRose",
    couple: { brideName: "", groomName: "", bridePhoto: "", groomPhoto: "", couplePhoto: "", brideBio: "", groomBio: "" },
    events: [{ ...eventTemplate }],
    family: [{ ...familyTemplate }],
    story: [{ title: "", content: "", image: "" }],
    gallery: [{ ...galleryTemplate }],
    venue: { name: "", address: "", city: "", latitude: "", longitude: "", mapUrl: "" },
    music: { audioUrl: "", title: "", autoplay: false, loop: true }
  });

  const root = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const nested = (group, key, value) => setForm((current) => ({ ...current, [group]: { ...current[group], [key]: value } }));
  const item = (group, index, key, value) => setForm((current) => ({ ...current, [group]: current[group].map((entry, i) => i === index ? { ...entry, [key]: value } : entry) }));
  const add = (group, template) => setForm((current) => ({ ...current, [group]: [...current[group], { ...template }] }));
  const remove = (group, index) => setForm((current) => ({ ...current, [group]: current[group].filter((_, i) => i !== index) }));

  const next = () => {
    setError("");
    if (step === 0 && (!form.title.trim() || !form.weddingDate)) return setError("Invitation title and wedding date are required.");
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const save = async () => {
    setSaving(true); setError("");
    try {
      const payload = { ...form, status: "draft", events: form.events.filter((x) => x.title || x.venue || x.date), family: form.family.filter((x) => x.name), story: form.story.filter((x) => x.title || x.content), gallery: form.gallery.filter((x) => x.imageUrl) };
      await api.post("/invitations", payload);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create invitation.");
    } finally { setSaving(false); }
  };

  return (
    <main className="wizard-page">
      <header className="wizard-header"><div><span className="eyebrow">Create Invitation</span><h1>Build your wedding story</h1><p>Everything you add here will power the guest-facing invitation.</p></div><Link className="secondary-button" to="/admin/dashboard">Save & Exit</Link></header>
      <nav className="stepper">{steps.map((label, index) => <button key={label} className={index === step ? "step active" : index < step ? "step done" : "step"} onClick={() => index <= step && setStep(index)}><span>{index + 1}</span>{label}</button>)}</nav>

      <section className="wizard-card">
        {step === 0 && <div className="form-section"><h2>Start with the basics</h2><p className="section-note">Give this invitation its identity and wedding date.</p><div className="form-grid"><label>Invitation title<input value={form.title} onChange={(e) => root("title", e.target.value)} placeholder="Rahul & Priya" /></label><label>Share URL slug<input value={form.slug} onChange={(e) => root("slug", e.target.value)} placeholder="rahul-priya" /></label><label>Wedding date<input type="date" value={form.weddingDate} onChange={(e) => root("weddingDate", e.target.value)} /></label></div></div>}

        {step === 1 && <div className="form-section"><h2>Meet the couple</h2><p className="section-note">Names, photos and short bios for the opening section.</p><div className="form-grid"><label>Bride name<input value={form.couple.brideName} onChange={(e) => nested("couple", "brideName", e.target.value)} /></label><label>Groom name<input value={form.couple.groomName} onChange={(e) => nested("couple", "groomName", e.target.value)} /></label><div className="full upload-grid"><ImageUpload label="Couple photo" value={form.couple.couplePhoto} onChange={(value) => nested("couple", "couplePhoto", value)} /><ImageUpload label="Bride photo" value={form.couple.bridePhoto} onChange={(value) => nested("couple", "bridePhoto", value)} /><ImageUpload label="Groom photo" value={form.couple.groomPhoto} onChange={(value) => nested("couple", "groomPhoto", value)} /></div><label>Bride bio<textarea value={form.couple.brideBio} onChange={(e) => nested("couple", "brideBio", e.target.value)} /></label><label>Groom bio<textarea value={form.couple.groomBio} onChange={(e) => nested("couple", "groomBio", e.target.value)} /></label></div></div>}

        {step === 2 && <div className="form-section"><div className="section-title-row"><div><h2>Wedding events</h2><p className="section-note">Add ceremonies, receptions and other moments.</p></div><button className="small-button" onClick={() => add("events", eventTemplate)}>+ Add event</button></div>{form.events.map((event, index) => <div className="repeat-card" key={index}><div className="section-title-row"><strong>Event {index + 1}</strong>{form.events.length > 1 && <button className="text-danger" onClick={() => remove("events", index)}>Remove</button>}</div><div className="form-grid"><label>Type<input value={event.type} onChange={(e) => item("events", index, "type", e.target.value)} /></label><label>Title<input value={event.title} onChange={(e) => item("events", index, "title", e.target.value)} placeholder="Wedding" /></label><label>Date<input type="date" value={event.date} onChange={(e) => item("events", index, "date", e.target.value)} /></label><label>Time<input value={event.time} onChange={(e) => item("events", index, "time", e.target.value)} placeholder="7:00 PM" /></label><label>Venue<input value={event.venue} onChange={(e) => item("events", index, "venue", e.target.value)} /></label><label>Map URL<input value={event.mapUrl} onChange={(e) => item("events", index, "mapUrl", e.target.value)} /></label><label className="full">Address<input value={event.address} onChange={(e) => item("events", index, "address", e.target.value)} /></label><label className="full">Description<textarea value={event.description} onChange={(e) => item("events", index, "description", e.target.value)} /></label></div></div>)}</div>}

        {step === 3 && <div className="form-section"><div className="section-title-row"><div><h2>Family & story</h2><p className="section-note">Introduce the people and memories behind the celebration.</p></div><button className="small-button" onClick={() => add("family", familyTemplate)}>+ Family member</button></div>{form.family.map((member, index) => <div className="repeat-card" key={index}><div className="section-title-row"><strong>Family member {index + 1}</strong>{form.family.length > 1 && <button className="text-danger" onClick={() => remove("family", index)}>Remove</button>}</div><div className="form-grid"><label>Name<input value={member.name} onChange={(e) => item("family", index, "name", e.target.value)} /></label><label>Relation<input value={member.relation} onChange={(e) => item("family", index, "relation", e.target.value)} /></label><label>Side<select value={member.side} onChange={(e) => item("family", index, "side", e.target.value)}><option value="bride">Bride</option><option value="groom">Groom</option><option value="other">Other</option></select></label></div></div>)}<div className="repeat-card"><h3>Our story</h3><div className="form-grid"><label>Story title<input value={form.story[0].title} onChange={(e) => item("story", 0, "title", e.target.value)} placeholder="How we met" /></label><label className="full">Story content<textarea rows="5" value={form.story[0].content} onChange={(e) => item("story", 0, "content", e.target.value)} /></label><div className="full"><ImageUpload label="Story image" value={form.story[0].image} onChange={(value) => item("story", 0, "image", value)} /></div></div></div></div>}

        {step === 4 && <div className="form-section"><div className="section-title-row"><div><h2>Gallery & venue</h2><p className="section-note">Upload your memories and add the main celebration location.</p></div><button className="small-button" onClick={() => add("gallery", galleryTemplate)}>+ Photo</button></div>{form.gallery.map((photo, index) => <div className="repeat-card" key={index}><div className="form-grid"><div className="full"><ImageUpload label={`Gallery photo ${index + 1}`} value={photo.imageUrl} onChange={(value) => item("gallery", index, "imageUrl", value)} /></div><label>Caption<input value={photo.caption} onChange={(e) => item("gallery", index, "caption", e.target.value)} /></label></div></div>)}<div className="repeat-card"><h3>Main venue</h3><div className="form-grid"><label>Name<input value={form.venue.name} onChange={(e) => nested("venue", "name", e.target.value)} /></label><label>City<input value={form.venue.city} onChange={(e) => nested("venue", "city", e.target.value)} /></label><label className="full">Address<input value={form.venue.address} onChange={(e) => nested("venue", "address", e.target.value)} /></label><label className="full">Google Maps URL<input value={form.venue.mapUrl} onChange={(e) => nested("venue", "mapUrl", e.target.value)} /></label></div></div></div>}

        {step === 5 && <div className="form-section"><h2>Choose your invitation theme</h2><p className="section-note">The theme controls presentation while your invitation data stays separate.</p><div className="theme-grid">{[["royalRose","Royal Rose","Romantic rose, ivory and deep plum"],["emeraldGarden","Emerald Garden","Botanical green with warm ivory"],["ivoryHeritage","Ivory Heritage","Classic cream with heritage details"]].map(([value,name,description]) => <button key={value} className={form.theme === value ? "theme-choice selected" : "theme-choice"} onClick={() => root("theme", value)}><span className="theme-swatch" /><strong>{name}</strong><small>{description}</small></button>)}</div><div className="publish-note"><strong>Ready to create?</strong><span>This saves as a draft first. Publish the guest link from the dashboard.</span></div></div>}

        {error && <div className="auth-error wizard-error">{error}</div>}
        <footer className="wizard-footer"><button className="secondary-button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || saving}>Back</button>{step < steps.length - 1 ? <button className="primary-button" onClick={next}>Continue</button> : <button className="primary-button" onClick={save} disabled={saving}>{saving ? "Creating..." : "Create Draft"}</button>}</footer>
      </section>
    </main>
  );
}
export default InvitationWizard;
