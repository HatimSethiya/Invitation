import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { resolveMediaUrl } from "../../services/api";
import ImageUpload from "../../components/ImageUpload";

const steps = ["Basic & Style", "Couple", "Bohra Details", "Events", "Family & Story", "Venue", "Music", "Review"];
const eventTemplate = { type: "Wedding", title: "", date: "", time: "", venue: "", address: "", description: "", mapUrl: "" };
const familyTemplate = { name: "", relation: "", side: "other" };
const galleryTemplate = { imageUrl: "", caption: "" };
const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

function InvitationWizard() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEditing = Boolean(editId);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadingInvitation, setLoadingInvitation] = useState(Boolean(editId));
  const [invitationStatus, setInvitationStatus] = useState("draft");
  const [audioUploading, setAudioUploading] = useState(false);
  const [musicQuery, setMusicQuery] = useState("");
  const [musicTracks, setMusicTracks] = useState([]);
  const [musicLoading, setMusicLoading] = useState(false);
  const [musicError, setMusicError] = useState("");
  const [musicCatalogLoaded, setMusicCatalogLoaded] = useState(false);
  const [musicOffset, setMusicOffset] = useState(0);
  const [musicHasMore, setMusicHasMore] = useState(false);
  const [previewTrackId, setPreviewTrackId] = useState("");
  const previewAudioRef = useRef(null);
  const musicRequestRef = useRef(0);
  const [form, setForm] = useState({
    title: "", slug: "", weddingDate: "", theme: "bohraNikah", cardType: "single", coverImageUrl: "",
    couple: { brideName: "", groomName: "", bridePhoto: "", groomPhoto: "", couplePhoto: "", brideBio: "", groomBio: "" },
    secondCouple: { brideName: "", groomName: "", bridePhoto: "", groomPhoto: "", couplePhoto: "", brideBio: "", groomBio: "" },
    bohraDetails: {
      openingBlessing: "With The Grace of Allah & Panjatan Pak (AS)",
      razaDuaLine: "With Raza & Dua Mubarak of",
      spiritualLeader: "Aqa Maula Syedna Mufaddal Saifuddin (TUS)",
      hostFamilyOne: "",
      hostBridge: "Thereafter",
      hostFamilyTwo: "",
      invitationWording: "Cordially Invite & Request The Honor Of Your Presence To Grace The Wedding Ceremony Of Their Grand Son",
      brideFamilyLine: "",
      nikahOfficiantIntro: "Nikah Solemnised On The Hand Mubarak Of His Holiness",
      nikahOfficiant: "",
      programmeHeading: "Programme Inshallah",
      programmeTitle: "Daris & Dinner",
      hijriDate: "",
      programmeTime: "",
      programmeVenue: "",
      invitees: "",
      complimentsFrom: "",
      specialRequest: "",
      heavenlyBlessings: "",
      senderName: "",
      senderFirm: "",
      senderAddress: "",
      senderContacts: ""
    },
    events: [{ ...eventTemplate }],
    family: [{ ...familyTemplate }],
    story: [{ title: "", content: "", image: "" }],
    gallery: [{ ...galleryTemplate }],
    venue: { name: "", address: "", city: "", latitude: "", longitude: "", mapUrl: "" },
    music: { audioUrl: "", title: "", artist: "", provider: "", trackId: "", shareUrl: "", licenseUrl: "", attribution: "", autoplay: false, loop: true }
  });

  const isBohraTemplate = form.theme === "bohraNikah" || form.theme === "purpleWhite";

  useEffect(() => {
    if (!editId) return undefined;

    let active = true;
    setLoadingInvitation(true);
    setError("");

    api.get(`/invitations/${editId}`)
      .then(({ data }) => {
        if (!active) return;
        const invitation = data.invitation;
        setInvitationStatus(invitation.status || "draft");
        setForm((current) => ({
          ...current,
          title: invitation.title || "",
          slug: invitation.slug || "",
          weddingDate: toDateInput(invitation.weddingDate),
          theme: invitation.theme || "bohraNikah",
          cardType: invitation.cardType || "single",
          coverImageUrl: invitation.coverImageUrl || "",
          couple: { ...current.couple, ...(invitation.couple || {}) },
          secondCouple: { ...current.secondCouple, ...(invitation.secondCouple || {}) },
          bohraDetails: { ...current.bohraDetails, ...(invitation.bohraDetails || {}) },
          events: Array.isArray(invitation.events) && invitation.events.length
            ? invitation.events.map((event) => ({ ...event, date: toDateInput(event.date) }))
            : [{ ...eventTemplate }],
          family: Array.isArray(invitation.family) && invitation.family.length
            ? invitation.family
            : [{ ...familyTemplate }],
          story: Array.isArray(invitation.story) && invitation.story.length
            ? invitation.story
            : [{ title: "", content: "", image: "" }],
          gallery: Array.isArray(invitation.gallery) && invitation.gallery.length
            ? invitation.gallery
            : [{ ...galleryTemplate }],
          venue: { ...current.venue, ...(invitation.venue || {}) },
          music: { ...current.music, ...(invitation.music || {}) },
        }));
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || "Unable to load invitation for editing.");
      })
      .finally(() => {
        if (active) setLoadingInvitation(false);
      });

    return () => { active = false; };
  }, [editId]);

  const loadMusicTracks = useCallback(async ({ query = "", offset = 0, append = false } = {}) => {
    const requestId = ++musicRequestRef.current;
    setMusicLoading(true);
    setMusicError("");
    try {
      const response = await api.get("/music/catalog", {
        params: { query, offset, limit: 24 },
      });

      if (requestId !== musicRequestRef.current) return;

      const tracks = Array.isArray(response.data.tracks) ? response.data.tracks : [];
      setMusicTracks((current) => append ? [...current, ...tracks] : tracks);
      setMusicOffset(Number(response.data.nextOffset ?? offset + tracks.length));
      setMusicHasMore(Boolean(response.data.hasMore));
      setMusicCatalogLoaded(true);
    } catch (err) {
      if (requestId !== musicRequestRef.current) return;
      setMusicError(err.response?.data?.message || "Unable to load instrumental tracks. Try again.");
      setMusicCatalogLoaded(true);
    } finally {
      if (requestId === musicRequestRef.current) setMusicLoading(false);
    }
  }, []);

  useEffect(() => {
    if (step === 6 && !musicCatalogLoaded && !musicLoading) {
      loadMusicTracks();
    }
  }, [step, musicCatalogLoaded, musicLoading, loadMusicTracks]);

  const previewTrack = async (track) => {
    const audio = previewAudioRef.current;
    if (!audio) return;

    if (previewTrackId === track.id && !audio.paused) {
      audio.pause();
      setPreviewTrackId("");
      return;
    }

    audio.pause();
    audio.src = track.audioUrl;
    setPreviewTrackId(track.id);
    setMusicError("");

    try {
      await audio.play();
    } catch {
      setPreviewTrackId("");
      setMusicError("The preview could not start. Try this track again.");
    }
  };

  const selectMusicTrack = (track) => {
    setForm((current) => ({
      ...current,
      music: {
        ...current.music,
        audioUrl: track.audioUrl,
        title: track.title,
        artist: track.artist,
        provider: track.provider || "internet-archive",
        trackId: track.id,
        shareUrl: track.shareUrl || "",
        licenseUrl: track.licenseUrl || "",
        attribution: track.attribution || "",
        autoplay: false,
      },
    }));
    if (previewAudioRef.current) previewAudioRef.current.pause();
    setPreviewTrackId("");
    setMusicError("");
  };

  const handleAudioFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const allowedExtensions = /\.(mp3|mpeg|wav|ogg|m4a|aac|flac|webm)$/i;
    const allowedMimeTypes = [
      "audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a", "video/mpeg",
      "audio/wav", "audio/x-wav", "audio/ogg", "application/ogg",
      "audio/aac", "audio/flac", "audio/x-flac", "audio/webm",
      "application/octet-stream",
    ];

    const isMpegMimeAlias = /\.mpeg$/i.test(file.name) && file.type === "video/mpeg";
    if (!allowedExtensions.test(file.name) || (file.type && !allowedMimeTypes.includes(file.type) && !isMpegMimeAlias)) {
      setMusicError("Choose an MP3/MPEG, WAV, OGG, M4A, AAC, FLAC or WebM audio file.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setMusicError("Audio files must be 25 MB or smaller.");
      return;
    }

    setAudioUploading(true);
    setMusicError("");
    const payload = new FormData();
    payload.append("audio", file);

    try {
      const response = await api.post("/uploads/audio", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const fileTitle = file.name.replace(/\.[^.]+$/, "");
      setForm((current) => ({
        ...current,
        music: {
          ...current.music,
          audioUrl: response.data.path,
          title: fileTitle || "Uploaded audio",
          artist: "",
          provider: "custom",
          trackId: "",
          shareUrl: "",
          licenseUrl: "",
          attribution: "",
          autoplay: false,
        },
      }));
    } catch (err) {
      setMusicError(err.response?.data?.message || "Unable to upload this audio file. Please try another file.");
    } finally {
      setAudioUploading(false);
    }
  };

  const clearMusicTrack = () => {
    setForm((current) => ({
      ...current,
      music: {
        ...current.music,
        audioUrl: "",
        title: "",
        artist: "",
        provider: "",
        trackId: "",
        shareUrl: "",
        licenseUrl: "",
        attribution: "",
        autoplay: false,
      },
    }));
    if (previewAudioRef.current) previewAudioRef.current.pause();
    setPreviewTrackId("");
  };

  const root = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const nested = (group, key, value) => setForm((current) => ({ ...current, [group]: { ...current[group], [key]: value } }));
  const item = (group, index, key, value) => setForm((current) => ({ ...current, [group]: current[group].map((entry, i) => i === index ? { ...entry, [key]: value } : entry) }));
  const add = (group, template) => setForm((current) => ({ ...current, [group]: [...current[group], { ...template }] }));
  const remove = (group, index) => setForm((current) => ({ ...current, [group]: current[group].filter((_, i) => i !== index) }));

  const back = () => {
    if (saving) return;
    setError("");
    setStep((current) => Math.max(0, current - 1));
  };

  const next = () => {
    setError("");
    if (step === 0 && (!form.title.trim() || !form.weddingDate)) return setError("Invitation title and wedding date are required.");
    if (step === 1 && form.cardType === "double" && (!form.secondCouple.brideName.trim() || !form.secondCouple.groomName.trim())) return setError("Enter both names for the second couple.");
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const save = async () => {
    setSaving(true); setError("");
    try {
      const payload = { ...form, status: isEditing ? invitationStatus : "draft", events: form.events.filter((x) => x.title || x.venue || x.date), family: form.family.filter((x) => x.name), story: form.story.filter((x) => x.title || x.content), gallery: form.gallery.filter((x) => x.imageUrl) };
      if (isEditing) {
        await api.put(`/invitations/${editId}`, payload);
      } else {
        await api.post("/invitations", payload);
      }
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || (isEditing ? "Unable to save invitation changes." : "Unable to create invitation."));
    } finally { setSaving(false); }
  };

  if (isEditing && loadingInvitation) {
    return <main className="wizard-page"><div className="empty-state">Loading invitation details…</div></main>;
  }

  return (
    <main className={`wizard-page ${isBohraTemplate ? "bohra-wizard-page" : ""}`}>
      <header className="wizard-header"><div><span className="eyebrow">{isEditing ? "Edit Invitation" : "Create Invitation"}</span><h1>{isEditing ? "Refine your wedding invitation" : isBohraTemplate ? "Create a Bohra Nikah invitation" : "Build your wedding story"}</h1><p>{isBohraTemplate ? "Add the family wording, Nikah programme and sender details from your card reference." : "Everything you add here will power the guest-facing invitation."}</p></div>{isEditing ? <button className="secondary-button" type="button" onClick={save} disabled={saving || audioUploading}>{saving ? "Saving..." : "Save & Exit"}</button> : <Link className="secondary-button" to="/admin/dashboard">Save & Exit</Link>}</header>
      <nav className="stepper">{steps.map((label, index) => <button type="button" key={label} className={index === step ? "step active" : index < step ? "step done" : "step"} onClick={() => { if (index <= step && !saving) { setError(""); setStep(index); } }}><span>{index + 1}</span>{label === "Bohra Details" && !isBohraTemplate ? "Optional Details" : label}</button>)}</nav>

      <section className="wizard-card">
        {step === 0 && <div className="form-section"><h2>Start your invitation</h2><p className="section-note">Choose the wedding type, opening card image and invitation design.</p>{!isEditing && <div className="form-grid"><label className="full">Wedding card type<select value={form.cardType} onChange={(e) => root("cardType", e.target.value)}><option value="single">Single Wedding Card — one couple</option><option value="double">Double Wedding Card — two couples</option></select></label></div>}<div className="form-grid"><label>Invitation title<input value={form.title} onChange={(e) => root("title", e.target.value)} placeholder="Ibrahim & Dr. Fatema" /></label><label>Share URL slug<input value={form.slug} onChange={(e) => root("slug", e.target.value)} placeholder="ibrahim-fatema" /></label><label>Wedding date<input type="date" value={form.weddingDate} onChange={(e) => root("weddingDate", e.target.value)} /></label><label>Invitation design<select value={form.theme} onChange={(e) => root("theme", e.target.value)}><option value="bohraNikah">Bohra Nikah — Emerald, Ivory & Gold</option><option value="purpleWhite">Purple–White Wedding</option><option value="royalRose">Royal Rose</option><option value="emeraldGarden">Emerald Garden</option><option value="ivoryHeritage">Ivory Heritage</option></select></label><div className="full"><ImageUpload label="Tap to Open card image (optional)" value={form.coverImageUrl} onChange={(value) => root("coverImageUrl", value)} /></div></div><div className="bohra-template-note"><span className="bohra-template-note-mark">۞</span><div><strong>{form.theme === "purpleWhite" ? "Purple–White glass card selected" : isBohraTemplate ? "Bohra Nikah card selected" : "Classic wedding template selected"}</strong><p>{isBohraTemplate ? "Uses the Nikah invitation layout with the selected colour theme. Couple photos and gallery are not used." : "Existing couple, story and gallery fields remain available for this design."}</p></div></div></div>}

        {step === 1 && <div className="form-section"><h2>Couple details</h2><p className="section-note">Enter names exactly as they should appear on the invitation.</p><div className="form-grid"><label>Bride name<input value={form.couple.brideName} onChange={(e) => nested("couple", "brideName", e.target.value)} placeholder="Dr. Fatema" /></label><label>Groom name<input value={form.couple.groomName} onChange={(e) => nested("couple", "groomName", e.target.value)} placeholder="Ibrahim" /></label>{form.cardType === "double" && <div className="full"><h3>Second couple</h3><div className="form-grid"><label>Second bride name<input value={form.secondCouple.brideName} onChange={(e) => nested("secondCouple", "brideName", e.target.value)} placeholder="Rabab" /></label><label>Second groom name<input value={form.secondCouple.groomName} onChange={(e) => nested("secondCouple", "groomName", e.target.value)} placeholder="Mustafa" /></label></div></div>}{!isBohraTemplate && <><div className="full upload-grid"><ImageUpload label="Couple photo" value={form.couple.couplePhoto} onChange={(value) => nested("couple", "couplePhoto", value)} /><ImageUpload label="Bride photo" value={form.couple.bridePhoto} onChange={(value) => nested("couple", "bridePhoto", value)} /><ImageUpload label="Groom photo" value={form.couple.groomPhoto} onChange={(value) => nested("couple", "groomPhoto", value)} /></div><label>Bride bio<textarea value={form.couple.brideBio} onChange={(e) => nested("couple", "brideBio", e.target.value)} /></label><label>Groom bio<textarea value={form.couple.groomBio} onChange={(e) => nested("couple", "groomBio", e.target.value)} /></label></>}</div></div>}

        {step === 2 && (isBohraTemplate ? (
          <div className="form-section bohra-admin-section"><h2>Bohra Nikah details</h2><p className="section-note">These fields follow your supplied Ibrahim Sethiya wedding-card reference. Personal names and contacts are left blank for the invitation owner to fill in.</p><div className="bohra-admin-group"><h3>Opening & family introduction</h3><div className="form-grid"><label>Opening blessing<textarea rows="2" value={form.bohraDetails.openingBlessing} onChange={(e) => nested("bohraDetails", "openingBlessing", e.target.value)} /></label><label>Raza & Dua line<input value={form.bohraDetails.razaDuaLine} onChange={(e) => nested("bohraDetails", "razaDuaLine", e.target.value)} /></label><label className="full">Aqa Maula / spiritual leader line<textarea rows="2" value={form.bohraDetails.spiritualLeader} onChange={(e) => nested("bohraDetails", "spiritualLeader", e.target.value)} /></label><label className="full">First host family line<textarea rows="2" value={form.bohraDetails.hostFamilyOne} onChange={(e) => nested("bohraDetails", "hostFamilyOne", e.target.value)} placeholder="Parents / grandparents hosting the invitation" /></label><label>Bridge wording<input value={form.bohraDetails.hostBridge} onChange={(e) => nested("bohraDetails", "hostBridge", e.target.value)} /></label><label className="full">Second host family line<textarea rows="2" value={form.bohraDetails.hostFamilyTwo} onChange={(e) => nested("bohraDetails", "hostFamilyTwo", e.target.value)} placeholder="Thereafter — second family line" /></label><label className="full">Invitation wording<textarea rows="3" value={form.bohraDetails.invitationWording} onChange={(e) => nested("bohraDetails", "invitationWording", e.target.value)} /></label><label className="full">Bride's family line<textarea rows="2" value={form.bohraDetails.brideFamilyLine} onChange={(e) => nested("bohraDetails", "brideFamilyLine", e.target.value)} placeholder="D/o ... (optional)" /></label></div></div><div className="bohra-admin-group"><h3>Nikah & programme</h3><div className="form-grid"><label className="full">Nikah solemnization heading<textarea rows="2" value={form.bohraDetails.nikahOfficiantIntro} onChange={(e) => nested("bohraDetails", "nikahOfficiantIntro", e.target.value)} /></label><label className="full">Officiant / Aqa Maula name<textarea rows="2" value={form.bohraDetails.nikahOfficiant} onChange={(e) => nested("bohraDetails", "nikahOfficiant", e.target.value)} placeholder="Leave blank if not needed" /></label><label>Programme heading<input value={form.bohraDetails.programmeHeading} onChange={(e) => nested("bohraDetails", "programmeHeading", e.target.value)} /></label><label>Programme title<input value={form.bohraDetails.programmeTitle} onChange={(e) => nested("bohraDetails", "programmeTitle", e.target.value)} placeholder="Daris & Dinner" /></label><label>Hijri date<input value={form.bohraDetails.hijriDate} onChange={(e) => nested("bohraDetails", "hijriDate", e.target.value)} placeholder="24mi Shehre Rajabul Asab 1447" /></label><label>Programme time<input value={form.bohraDetails.programmeTime} onChange={(e) => nested("bohraDetails", "programmeTime", e.target.value)} placeholder="7:30 p.m." /></label><label className="full">Programme venue<input value={form.bohraDetails.programmeVenue} onChange={(e) => nested("bohraDetails", "programmeVenue", e.target.value)} placeholder="Evan-E-Fakhri" /></label><label>Invitees / guest note<input value={form.bohraDetails.invitees} onChange={(e) => nested("bohraDetails", "invitees", e.target.value)} placeholder="Optional" /></label></div></div><div className="bohra-admin-group"><h3>Family notes & sender details</h3><div className="form-grid"><label className="full">With the best compliments from<textarea rows="2" value={form.bohraDetails.complimentsFrom} onChange={(e) => nested("bohraDetails", "complimentsFrom", e.target.value)} placeholder="Family names and relatives" /></label><label>Special request<textarea rows="2" value={form.bohraDetails.specialRequest} onChange={(e) => nested("bohraDetails", "specialRequest", e.target.value)} placeholder="Names / request" /></label><label>Heavenly blessings<textarea rows="2" value={form.bohraDetails.heavenlyBlessings} onChange={(e) => nested("bohraDetails", "heavenlyBlessings", e.target.value)} placeholder="Names / blessings" /></label><label>Sender name<input value={form.bohraDetails.senderName} onChange={(e) => nested("bohraDetails", "senderName", e.target.value)} /></label><label>Sender firm<input value={form.bohraDetails.senderFirm} onChange={(e) => nested("bohraDetails", "senderFirm", e.target.value)} /></label><label className="full">Sender address<textarea rows="2" value={form.bohraDetails.senderAddress} onChange={(e) => nested("bohraDetails", "senderAddress", e.target.value)} /></label><label className="full">Contact numbers<input value={form.bohraDetails.senderContacts} onChange={(e) => nested("bohraDetails", "senderContacts", e.target.value)} placeholder="Optional phone numbers" /></label></div></div></div>
        ) : (
          <div className="form-section bohra-form-note">
            <h2>No Bohra wording needed</h2>
            <p className="section-note">The selected classic theme uses the existing couple, event, family and venue fields. Continue to the next step; these Bohra-specific fields won't be used.</p>
          </div>
        ))}

        {step === 3 && <div className="form-section"><div className="section-title-row"><div><h2>Wedding events</h2><p className="section-note">Add ceremonies, receptions and other moments.</p></div><button className="small-button" onClick={() => add("events", eventTemplate)}>+ Add event</button></div>{form.events.map((event, index) => <div className="repeat-card" key={index}><div className="section-title-row"><strong>Event {index + 1}</strong>{form.events.length > 1 && <button className="text-danger" onClick={() => remove("events", index)}>Remove</button>}</div><div className="form-grid"><label>Type<input value={event.type} onChange={(e) => item("events", index, "type", e.target.value)} /></label><label>Title<input value={event.title} onChange={(e) => item("events", index, "title", e.target.value)} placeholder="Wedding" /></label><label>Date<input type="date" value={event.date} onChange={(e) => item("events", index, "date", e.target.value)} /></label><label>Time<input value={event.time} onChange={(e) => item("events", index, "time", e.target.value)} placeholder="7:00 PM" /></label><label>Venue<input value={event.venue} onChange={(e) => item("events", index, "venue", e.target.value)} /></label><label>Map URL<input value={event.mapUrl} onChange={(e) => item("events", index, "mapUrl", e.target.value)} /></label><label className="full">Address<input value={event.address} onChange={(e) => item("events", index, "address", e.target.value)} /></label><label className="full">Description<textarea value={event.description} onChange={(e) => item("events", index, "description", e.target.value)} /></label></div></div>)}</div>}

        {step === 4 && (isBohraTemplate ? (
          <div className="form-section bohra-form-note">
            <h2>Family wording is already covered</h2>
            <p className="section-note">This Bohra invitation uses the host families, bride's family line, special request and heavenly blessings from the previous step. It intentionally leaves out personal story and photo sections.</p>
            <div className="bohra-template-note">
              <span className="bohra-template-note-mark">✦</span>
              <div>
                <strong>Photo-free layout</strong>
                <p>Continue to venue details. Your public invitation will not display couple photos, story images or a photo gallery.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="form-section">
            <div className="section-title-row">
              <div>
                <h2>Family & story</h2>
                <p className="section-note">Introduce the people and memories behind the celebration.</p>
              </div>
              <button className="small-button" onClick={() => add("family", familyTemplate)}>+ Family member</button>
            </div>
            {form.family.map((member, index) => (
              <div className="repeat-card" key={index}>
                <div className="section-title-row">
                  <strong>Family member {index + 1}</strong>
                  {form.family.length > 1 && <button className="text-danger" onClick={() => remove("family", index)}>Remove</button>}
                </div>
                <div className="form-grid">
                  <label>Name<input value={member.name} onChange={(e) => item("family", index, "name", e.target.value)} /></label>
                  <label>Relation<input value={member.relation} onChange={(e) => item("family", index, "relation", e.target.value)} /></label>
                  <label>Side<select value={member.side} onChange={(e) => item("family", index, "side", e.target.value)}><option value="bride">Bride</option><option value="groom">Groom</option><option value="other">Other</option></select></label>
                </div>
              </div>
            ))}
            <div className="repeat-card">
              <h3>Our story</h3>
              <div className="form-grid">
                <label>Story title<input value={form.story[0].title} onChange={(e) => item("story", 0, "title", e.target.value)} placeholder="How we met" /></label>
                <label className="full">Story content<textarea rows="5" value={form.story[0].content} onChange={(e) => item("story", 0, "content", e.target.value)} /></label>
                <div className="full"><ImageUpload label="Story image" value={form.story[0].image} onChange={(value) => item("story", 0, "image", value)} /></div>
              </div>
            </div>
          </div>
        ))}{step === 5 && (isBohraTemplate ? <div className="form-section"><h2>Venue & directions</h2><p className="section-note">No gallery is needed for the Bohra Nikah design. Add the venue address and optional map link.</p><div className="repeat-card"><div className="form-grid"><label>Venue name<input value={form.venue.name} onChange={(e) => nested("venue", "name", e.target.value)} /></label><label>City<input value={form.venue.city} onChange={(e) => nested("venue", "city", e.target.value)} /></label><label className="full">Address<input value={form.venue.address} onChange={(e) => nested("venue", "address", e.target.value)} /></label><label className="full">Google Maps URL<input value={form.venue.mapUrl} onChange={(e) => nested("venue", "mapUrl", e.target.value)} /></label></div></div></div> : <div className="form-section"><div className="section-title-row"><div><h2>Gallery & venue</h2><p className="section-note">Upload your memories and add the main celebration location.</p></div><button className="small-button" onClick={() => add("gallery", galleryTemplate)}>+ Photo</button></div>{form.gallery.map((photo, index) => <div className="repeat-card" key={index}><div className="form-grid"><div className="full"><ImageUpload label={`Gallery photo ${index + 1}`} value={photo.imageUrl} onChange={(value) => item("gallery", index, "imageUrl", value)} /></div><label>Caption<input value={photo.caption} onChange={(e) => item("gallery", index, "caption", e.target.value)} /></label></div></div>)}<div className="repeat-card"><h3>Main venue</h3><div className="form-grid"><label>Name<input value={form.venue.name} onChange={(e) => nested("venue", "name", e.target.value)} /></label><label>City<input value={form.venue.city} onChange={(e) => nested("venue", "city", e.target.value)} /></label><label className="full">Address<input value={form.venue.address} onChange={(e) => nested("venue", "address", e.target.value)} /></label><label className="full">Google Maps URL<input value={form.venue.mapUrl} onChange={(e) => nested("venue", "mapUrl", e.target.value)} /></label></div></div></div>)}        {step === 6 && <div className="form-section music-library-section">
          <div className="section-title-row music-library-heading">
            <div>
              <h2>Instrumental music library</h2>
              <p className="section-note">Search the instrumental library or attach your own audio file, including MP3/MPEG.</p>
            </div>
          </div>

          {form.music.audioUrl && (
            <div className="music-selected-track">
              <div className="music-selected-icon" aria-hidden="true">♫</div>
              <div className="music-selected-copy">
                <span>Selected for this invitation</span>
                <strong>{form.music.title || "Wedding instrumental"}</strong>
                {form.music.artist && <small>{form.music.artist}</small>}
                {form.music.licenseUrl && <a href={form.music.licenseUrl} target="_blank" rel="noreferrer">View track license ↗</a>}
              </div>
              <button className="small-button" type="button" onClick={clearMusicTrack}>Remove</button>
            </div>
          )}

          <div className="audio-attachment-panel">
            <div className="audio-attachment-copy">
              <strong>Or attach your own music</strong>
              <p>MP3 / MPEG, WAV, OGG, M4A, AAC, FLAC or WebM · Up to 25 MB.</p>
            </div>
            <label className={`small-button audio-file-picker ${audioUploading ? "is-uploading" : ""}`}>
              {audioUploading ? "Uploading…" : "Browse audio file"}
              <input
                type="file"
                accept=".mp3,.mpeg,.wav,.ogg,.m4a,.aac,.flac,.webm,audio/mpeg,audio/mp3,audio/mp4,audio/wav,audio/ogg,audio/aac,audio/flac,audio/webm,video/mpeg"
                onChange={handleAudioFileChange}
                disabled={audioUploading}
              />
            </label>
          </div>
          {form.music.provider === "custom" && form.music.audioUrl && (
            <audio className="uploaded-audio-preview" controls preload="metadata" src={resolveMediaUrl(form.music.audioUrl)}>
              Your browser does not support audio playback.
            </audio>
          )}

          <div className="music-search-row">
            <label className="music-search-field">Find a mood, instrument or track
              <input
                value={musicQuery}
                onChange={(event) => setMusicQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    loadMusicTracks({ query: musicQuery, offset: 0, append: false });
                  }
                }}
                placeholder="Romantic piano, soft strings, acoustic..."
              />
            </label>
            <button className="primary-button" type="button" disabled={musicLoading} onClick={() => loadMusicTracks({ query: musicQuery, offset: 0, append: false })}>
              {musicLoading ? "Loading…" : "Search instrumentals"}
            </button>
          </div>

          <div className="music-library-note">
            <span aria-hidden="true">ⓘ</span>
            <p>Tracks stream from Internet Archive. Only public-domain, CC0, CC BY and CC BY-SA tracks are listed; review attribution before publishing. A browser may require guests to press Play once.</p>
          </div>

          {musicError && (
            <div className="music-library-error" role="alert">
              <span>{musicError}</span>
              <button className="small-button" type="button" disabled={musicLoading} onClick={() => loadMusicTracks({ query: musicQuery, offset: 0, append: false })}>Retry</button>
            </div>
          )}

          {musicLoading && musicTracks.length === 0 && <div className="music-library-empty">Finding instrumentals…</div>}
          {!musicLoading && !musicError && musicCatalogLoaded && musicTracks.length === 0 && <div className="music-library-empty">No instrumentals found. Try “piano”, “strings”, “acoustic” or clear your search.</div>}

          <div className="music-track-list">
            {musicTracks.map((track) => {
              const selected = form.music.trackId === track.id;
              const previewing = previewTrackId === track.id;
              return (
                <article className={`music-track-card ${selected ? "selected" : ""}`} key={track.id}>
                  <div className="music-track-artwork">
                    {track.artworkUrl
                      ? <img src={track.artworkUrl} alt="" loading="lazy" decoding="async" />
                      : <span aria-hidden="true">♫</span>}
                  </div>
                  <div className="music-track-info">
                    <strong>{track.title}</strong>
                    <span>{track.artist}</span>
                    <small>{Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, "0")} · Instrumental</small>
                    <div className="music-track-links">
                      {track.shareUrl && <a href={track.shareUrl} target="_blank" rel="noreferrer">Track details ↗</a>}
                      {track.licenseUrl && <a href={track.licenseUrl} target="_blank" rel="noreferrer">License ↗</a>}
                    </div>
                  </div>
                  <div className="music-track-actions">
                    <button className="small-button" type="button" disabled={!track.audioUrl} onClick={() => previewTrack(track)}>
                      {previewing ? "Pause preview" : "Preview"}
                    </button>
                    <button className={selected ? "music-use-button selected" : "music-use-button"} type="button" onClick={() => selectMusicTrack(track)} disabled={selected}>
                      {selected ? "Added ✓" : "Use track"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {musicLoading && musicTracks.length > 0 && <div className="music-library-loading-more">Loading more tracks…</div>}
          {musicHasMore && !musicLoading && (
            <div className="music-load-more">
              <button className="secondary-button" type="button" onClick={() => loadMusicTracks({ query: musicQuery, offset: musicOffset, append: true })}>Load more instrumentals</button>
            </div>
          )}

          <label className="music-option-toggle">
            <input type="checkbox" checked={form.music.loop !== false} onChange={(event) => nested("music", "loop", event.target.checked)} />
            <span><strong>Loop selected track</strong><small>Keep the instrumental playing until the guest pauses it.</small></span>
          </label>
          <label className="music-option-toggle">
            <input type="checkbox" checked={form.music.autoplay === true} onChange={(event) => nested("music", "autoplay", event.target.checked)} />
            <span><strong>Try autoplay after the invitation opens</strong><small>Some browsers block autoplay; the guest can always use the Play control.</small></span>
          </label>
          <audio ref={previewAudioRef} preload="none" onEnded={() => setPreviewTrackId("")} onError={() => {
            if (previewTrackId) {
              setMusicError("This preview stream is unavailable. Try another instrumental.");
              setPreviewTrackId("");
            }
          }} />
        </div>}

{step === 7 && <div className="form-section bohra-review-section"><h2>Review your invitation</h2><p className="section-note">Check the key details before creating the draft.</p><div className="bohra-review-grid"><div><span>Card type</span><strong>{form.cardType === "double" ? "Double Wedding" : "Single Wedding"}</strong></div><div><span>Design</span><strong>{form.theme === "bohraNikah" ? "Bohra Nikah · Emerald / Ivory / Gold" : form.theme === "purpleWhite" ? "Purple–White Wedding" : form.theme === "royalRose" ? "Royal Rose" : form.theme === "emeraldGarden" ? "Emerald Garden" : "Ivory Heritage"}</strong></div><div><span>Couples</span><strong>{[[form.couple.groomName, form.couple.brideName].filter(Boolean).join(" Weds "), ...(form.cardType === "double" ? [[form.secondCouple.groomName, form.secondCouple.brideName].filter(Boolean).join(" Weds ")] : [])].filter(Boolean).join(" · ") || "Names not entered yet"}</strong></div><div><span>Programme</span><strong>{form.bohraDetails.programmeTitle || "Not specified"}</strong></div><div><span>Date</span><strong>{form.weddingDate ? new Date(form.weddingDate + "T12:00:00").toLocaleDateString(undefined, { dateStyle: "long" }) : "Not specified"}</strong></div></div><div className="publish-note"><strong>Ready to create?</strong><span>{isEditing ? "Your changes will be saved without changing the current publication status." : "This saves as a draft first. Publish the guest link from the dashboard."} Bohra Nikah layout does not display couple photos or a gallery.</span></div></div>}

        {error && <div className="auth-error wizard-error">{error}</div>}
        <footer className="wizard-footer"><button type="button" className="secondary-button" onClick={back} disabled={step === 0 || saving}>Back</button>{step < steps.length - 1 ? <button type="button" className="primary-button" onClick={next}>Continue</button> : <button type="button" className="primary-button" onClick={save} disabled={saving}>{saving ? (isEditing ? "Saving..." : "Creating...") : (isEditing ? "Save Changes" : "Create Draft")}</button>}</footer>
      </section>
    </main>
  );
}
export default InvitationWizard;
