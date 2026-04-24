// frontend/src/pages/Profile.jsx

/* 

  Profile and Edit Profile Section

*/

import React, { useEffect, useState, useRef } from "react";
import "./Profile.css";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://nexmed.onrender.com/api";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("medicines");
  const navigate = useNavigate();

  // edit form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    user_type: "",
    phone: "",
    address: "",
    date_of_birth: "",
    medical_license_path: ""
  });
  const [photoFile, setPhotoFile] = useState(null);
  const photoPreviewRef = useRef(null);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getToken = () => localStorage.getItem("token");

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const token = getToken();
      if (!token) {
        setError("Not authenticated. Please log in.");
        setLoading(false);
        navigate("/login");
        return;
      }

      const res = await fetch(`${API_BASE}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const data = await res.json();
      if (!data.success || !data.profile) {
        throw new Error("Invalid response from server");
      }

      const profile = data.profile;
      setUser(profile);

      // set form defaults
      setForm({
        name: profile.name || "",
        email: profile.email || "",
        user_type: profile.user_type || "",
        phone: profile.phone || "",
        address: profile.address || "",
        date_of_birth: profile.date_of_birth || "",
        medical_license_path: profile.medical_license_path || ""
      });

      // contributions (backend may return both lists)
      setMedicines(data.contributions?.medicines || []);
      setEquipments(data.contributions?.equipments || []);
    } catch (err) {
      console.error("Profile fetch error:", err);
      setError("Failed to load profile: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const openEdit = () => setEditing(true);
  const closeEdit = () => {
    setEditing(false);
    setPhotoFile(null);
    if (photoPreviewRef.current) photoPreviewRef.current.src = "";
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      const file = files[0];
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        if (photoPreviewRef.current) photoPreviewRef.current.src = reader.result;
      };
      reader.readAsDataURL(file);
      return;
    }
    setForm((p) => ({ ...p, [name]: value }));
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const token = getToken();
      if (!token) throw new Error("Not authenticated");

      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("email", form.email);
      payload.append("user_type", form.user_type);
      payload.append("phone", form.phone || "");
      payload.append("address", form.address || "");
      // DOB optional
      if (form.date_of_birth) payload.append("date_of_birth", form.date_of_birth);
      // profile photo optional
      if (photoFile) payload.append("profile_photo", photoFile);

      const res = await fetch(`${API_BASE}/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: payload
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(`HTTP ${res.status}: ${t}`);
      }

      const data = await res.json();
      if (!data.success || !data.profile) {
        throw new Error("Update failed");
      }

      setUser(data.profile);
      closeEdit();
    } catch (err) {
      console.error("Profile update error:", err);
      setError("Update failed: " + (err.message || "Unknown error"));
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>Profile</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => navigate("/home")}>Back</button>
          <button className="btn btn-primary" onClick={openEdit}>Edit Profile</button>
        </div>
      </div>

      {error && <div className="message error">{error}</div>}

      {user && (
        <div className="profile-layout">
          {/* Left Column - User Info */}
          <div className="profile-sidebar">
            <div className="profile-card">
              <div className="profile-avatar">
                {user.profile_photo ? (
                  <img src={`https://nexmed.onrender.com${user.profile_photo}`} alt={user.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </div>
              
              <h2 className="profile-name">{user.name}</h2>
              <p className="profile-email">{user.email}</p>
              
              <div className="profile-details">
                <div className="detail-item">
                  <span className="detail-label">User Type</span>
                  <span className="detail-value">{user.user_type || "—"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">License</span>
                  <span className="detail-value">{user.medical_license_path ? "Uploaded" : "—"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{user.phone || "—"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">DOB</span>
                  <span className="detail-value">{user.date_of_birth || "—"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Member ID</span>
                  <span className="detail-value">{user.id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Contributions */}
          <div className="profile-content">
            <div className="content-header">
              <h3>Contributions</h3>
              <div className="tab-nav">
                <button 
                  className={`tab-btn ${tab === "medicines" ? "active" : ""}`}
                  onClick={() => setTab("medicines")}
                >
                  Medicines
                </button>
                <button 
                  className={`tab-btn ${tab === "equipments" ? "active" : ""}`}
                  onClick={() => setTab("equipments")}
                >
                  Equipment
                </button>
              </div>
            </div>

            <div className="contributions-list">
              {tab === "medicines" && (
                <div>
                  {medicines.length === 0 ? (
                    <p className="empty-message">No medicines added yet.</p>
                  ) : (
                    medicines.map((item) => (
                      <div key={item.id} className="contribution-item">
                        <div className="item-image">
                          {item.image_path ? (
                            <img src={`https://nexmed.onrender.com/uploads/items/${item.image_path}`} alt={item.name} />
                          ) : (
                            <div className="image-placeholder">{item.name?.charAt(0)}</div>
                          )}
                        </div>
                        <div className="item-details">
                          <h4>{item.name}</h4>
                          <div className="item-meta">
                            <span className="meta-type">{item.option_type}</span>
                            <span className="meta-divider">•</span>
                            <span className="meta-quantity">Qty: {item.quantity}</span>
                            <span className="meta-divider">•</span>
                            <span className="meta-status">{item.status}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === "equipments" && (
                <div>
                  {equipments.length === 0 ? (
                    <p className="empty-message">No equipment added yet.</p>
                  ) : (
                    equipments.map((item) => (
                      <div key={item.id} className="contribution-item">
                        <div className="item-image">
                          {item.image_path ? (
                            <img src={`https://nexmed.onrender.com/uploads/items/${item.image_path}`} alt={item.name} />
                          ) : (
                            <div className="image-placeholder">{item.name?.charAt(0)}</div>
                          )}
                        </div>
                        <div className="item-details">
                          <h4>{item.name}</h4>
                          <div className="item-meta">
                            <span className="meta-type">{item.option_type}</span>
                            <span className="meta-divider">•</span>
                            <span className="meta-quantity">Qty: {item.quantity}</span>
                            <span className="meta-divider">•</span>
                            <span className="meta-status">{item.status}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}



      {/* 
      

        Edit Your Profile 
      
      
      */}
      {editing && (
        <div className="modal-overlay" onClick={closeEdit}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button className="modal-close" onClick={closeEdit}>×</button>
            </div>

            <form onSubmit={submitEdit} className="modal-form">
              <div className="form-group">
                <label>Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={form.name} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={form.email} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className="form-group">
                <label>User Type</label>
                <input 
                  type="text" 
                  name="user_type" 
                  value={form.user_type} 
                  onChange={handleChange} 
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input 
                  type="text" 
                  name="phone" 
                  value={form.phone} 
                  onChange={handleChange} 
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input 
                  type="text" 
                  name="address" 
                  value={form.address} 
                  onChange={handleChange} 
                />
              </div>

              <div className="form-group">
                <label>Date of Birth (optional)</label>
                <input 
                  type="date" 
                  name="date_of_birth" 
                  value={form.date_of_birth} 
                  onChange={handleChange} 
                />
              </div>

              <div className="form-group">
                <label>Profile Photo (optional)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  name="profile_photo" 
                  onChange={handleChange} 
                  className="file-input"
                />
                {photoPreviewRef.current?.src && (
                  <div className="photo-preview">
                    <img ref={photoPreviewRef} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeEdit}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}