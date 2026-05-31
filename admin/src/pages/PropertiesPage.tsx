import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAdminProperties,
  getAdminProperty,
  updateAdminProperty,
  deleteAdminProperty,
  AdminPropertyRow,
  AdminPropertyDetail,
} from "../lib/api";
import PropertyEditModal from "../components/PropertyEditModal";
import SearchBar, { SearchFilter } from "../components/SearchBar";

// Helper component to display polished, color-coded status badges
function StatusBadge({ status }: { status: string | undefined }) {
  const label = status || "-";
  const normalized = label.toLowerCase().trim();

  const baseStyle: React.CSSProperties = {
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "0.82rem",
    fontWeight: "600",
    display: "inline-block",
    textAlign: "center",
  };

  if (normalized === "active") {
    return <span style={{ ...baseStyle, backgroundColor: "#e6f4ea", color: "#137333" }}>Active</span>;
  }
  if (normalized === "rented") {
    return <span style={{ ...baseStyle, backgroundColor: "#fce8e6", color: "#c5221f" }}>Rented</span>;
  }
  if (normalized === "reserved") {
    return <span style={{ ...baseStyle, backgroundColor: "#fef7e0", color: "#b06000" }}>Reserved</span>;
  }

  return <span style={{ ...baseStyle, backgroundColor: "#f1f3f4", color: "#5f6368" }}>{label}</span>;
}

function PropertiesPage() {
  const [properties, setProperties] = useState<AdminPropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<AdminPropertyDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<SearchFilter>("all");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminProperties();
      setProperties(res.properties ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load properties.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleEditClick = async (prop: AdminPropertyRow) => {
    try {
      setModalLoading(true);
      const res = await getAdminProperty(prop.id);
      setSelectedProperty(res.property);
      setModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load property details.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleSaveEdit = async (data: Partial<AdminPropertyDetail> | FormData) => {
    if (!selectedProperty) return;
    try {
      setModalLoading(true);
      const res = await updateAdminProperty(selectedProperty._id, data);
      setProperties((p) =>
        p.map((x) =>
          x.id === selectedProperty._id
            ? {
                ...x,
                title: res.property.title,
                status: res.property.status,
                place: [res.property.address, res.property.city].filter(Boolean).join(", "),
              }
            : x
        )
      );
      setModalOpen(false);
      setSelectedProperty(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (prop: AdminPropertyRow) => {
    if (!window.confirm(`Delete property "${prop.title}"?`)) return;
    try {
      await deleteAdminProperty(prop.id);
      setProperties((p) => p.filter((x) => x.id !== prop.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  const filteredProperties = useMemo(() => {
    if (!search) return properties;
    const q = search.toLowerCase();
    return properties.filter((prop) => {
      switch (filter) {
        case "title":
          return prop.title.toLowerCase().includes(q);
        case "owner":
          return (prop.ownerName ?? "").toLowerCase().includes(q);
        case "email":
          return (prop.ownerEmail ?? "").toLowerCase().includes(q);
        case "place":
          return (prop.place ?? "").toLowerCase().includes(q);
        case "status":
          return (prop.status ?? "").toLowerCase().includes(q);
        case "all":
          default:
            return (
              prop.title.toLowerCase().includes(q) ||
              (prop.ownerName ?? "").toLowerCase().includes(q) ||
              (prop.ownerEmail ?? "").toLowerCase().includes(q) ||
              (prop.place ?? "").toLowerCase().includes(q) ||
              (prop.status ?? "").toLowerCase().includes(q)
            );
      }
    });
  }, [properties, search, filter]);

  return (
    <div className="dashboard-wrapper">
      <header className="dashboard-hero" style={{ padding: "24px 0" }}>
        <div className="dashboard-inner" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.6rem" }}>🏠</span>
          <h1 className="hero-title" style={{ margin: 0, fontSize: "1.75rem" }}>Properties</h1>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="container-wide">
          <div className="table-controls" style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between", marginBottom: "20px" }}>
            <SearchBar
              value={search}
              onChange={setSearch}
              filter={filter}
              onFilterChange={setFilter}
              placeholder="Search properties by title, owner, place, or status..."
              filterOptions={[
                { value: "all", label: "All fields" },
                { value: "title", label: "Title" },
                { value: "owner", label: "Owner" },
                { value: "email", label: "Owner Email" },
                { value: "place", label: "Place" },
                { value: "status", label: "Status" },
              ]}
            />
            {/* Cleaned layout controls with smaller, modern presentation buttons */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Link 
                to="/dashboard" 
                className="button" 
                style={{ 
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: "6px",
                  padding: "8px 14px",
                  fontSize: "0.88rem",
                  backgroundColor: "#4f46e5",
                  borderRadius: "6px",
                  textDecoration: "none",
                  color: "#ffffff"
                }}
              >
                <span>⬅</span> Back to Dashboard
              </Link>
              <button 
                onClick={load} 
                className="button secondary" 
                style={{ 
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: "6px",
                  padding: "8px 14px",
                  fontSize: "0.88rem",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#ffffff",
                  color: "#374151",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                <span style={{ display: "inline-block", transform: loading ? "rotate(360deg)" : "none", transition: "transform 1s ease" }}>🔄</span> 
                Refresh
              </button>
            </div>
          </div>

          {error ? <div className="alert" style={{ marginBottom: "20px" }}>⚠️ {error}</div> : null}

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", fontSize: "1rem", color: "#888" }}>
              🔄 Loading property database...
            </div>
          ) : (
            /* Clean table wrapper showing structural borders and subtle soft cell divisions */
            <div className="table-card" style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden", backgroundColor: "#ffffff" }}>
              <table className="table" style={{ width: "100%", borderCollapse: "collapse", margin: 0 }}>
                <thead>
                  <tr style={{ backgroundColor: "#f9fafb", borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                    <th style={{ padding: "12px 16px", fontSize: "0.88rem", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb" }}>Title</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.88rem", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb" }}>Owner</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.88rem", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb" }}>Email</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.88rem", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb" }}>Place</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.88rem", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb" }}>Posted</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.88rem", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb" }}>Status</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.88rem", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb", textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "12px 16px", fontSize: "0.9rem", fontWeight: "600", color: "#111827" }}>{p.title}</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.9rem", color: "#4b5563" }}>{p.ownerName || "Unknown"}</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.9rem", color: "#6b7280" }}>
                        <span style={{ marginRight: "6px", opacity: 0.7 }}>✉️</span>
                        {p.ownerEmail || "-"}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "0.9rem", color: "#4b5563" }}>
                        <span style={{ marginRight: "6px", opacity: 0.7 }}>📍</span>
                        {p.place || "-"}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "0.9rem", color: "#6b7280" }}>
                        <span style={{ marginRight: "6px", opacity: 0.7 }}>📅</span>
                        {p.postedDate || "-"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <StatusBadge status={p.status} />
                      </td>
                      {/* Compact, well-aligned tactical management buttons */}
                      <td className="button-row" style={{ padding: "12px 16px", display: "flex", gap: "6px", justifyContent: "center", border: "none" }}>
                        <button 
                          onClick={() => handleEditClick(p)} 
                          className="button small"
                          style={{ 
                            display: "inline-flex", 
                            alignItems: "center", 
                            gap: "4px",
                            padding: "6px 12px",
                            fontSize: "0.82rem",
                            backgroundColor: "#f3f4f6",
                            border: "1px solid #d1d5db",
                            color: "#374151",
                            borderRadius: "4px",
                            cursor: "pointer"
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(p)} 
                          className="button small danger"
                          style={{ 
                            display: "inline-flex", 
                            alignItems: "center", 
                            gap: "4px",
                            padding: "6px 12px",
                            fontSize: "0.82rem",
                            backgroundColor: "#fef2f2",
                            border: "1px solid #fee2e2",
                            color: "#dc2626",
                            borderRadius: "4px",
                            cursor: "pointer"
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <PropertyEditModal
        property={selectedProperty}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedProperty(null);
        }}
        onSave={handleSaveEdit}
        loading={modalLoading}
      />
    </div>
  );
}

export default PropertiesPage;