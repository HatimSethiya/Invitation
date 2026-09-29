import { useState } from "react";
import api from "../services/api";

function ImageUpload({ label, value, onChange, compact = false }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const body = new FormData();
      body.append("image", file);
      const response = await api.post("/uploads/image", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(response.data.url);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Image upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className={compact ? "image-upload compact" : "image-upload"}>
      <div className="image-upload-head">
        <span>{label}</span>
        <label className="upload-button">
          {uploading ? "Uploading..." : value ? "Change photo" : "Upload photo"}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFile} disabled={uploading} />
        </label>
      </div>
      {value ? (
        <div className="image-preview">
          <img src={value} alt="Uploaded preview" />
          <button type="button" onClick={() => onChange("")}>Remove</button>
        </div>
      ) : (
        <div className="upload-drop">JPG, PNG, WEBP or GIF · max 5 MB</div>
      )}
      {error && <small className="upload-error">{error}</small>}
    </div>
  );
}

export default ImageUpload;
