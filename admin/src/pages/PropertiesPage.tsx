import React, { useEffect, useMemo, useState } from "react";
import { useAdminNotifications } from "../context/AdminNotificationContext";
import AdminNavTabs from "../components/AdminNavTabs";
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

  if (normalized === "active") {
    return <span className="status-chip active">Active</span>;
  }
  if (normalized === "rented") {
    return <span className="status-chip rented">Rented</span>;
  }
  if (normalized === "reserved") {
    return <span className="status-chip reserved">Reserved</span>;
  }

  return <span className="status-chip">{label}</span>;
}

function PropertiesPage() {
  const { clearPropertyNotifications } = useAdminNotifications();
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

  useEffect(() => {
    void clearPropertyNotifications().catch(() => undefined);
  }, [clearPropertyNotifications]);

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
      <header className="dashboard-hero">
        <div className="dashboard-inner">
          <h1 className="hero-title">Properties</h1>
          <p className="hero-sub">
            Moderate owner listings and update property details.
          </p>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="container-wide">
          <div className="tabs">
            <AdminNavTabs propertiesCount={loading ? "..." : properties.length} />
          </div>

          <div className="admin-surface">
            <div className="admin-surface-head">
              <p className="admin-mono-label">Filters</p>
            </div>
            <div className="admin-surface-body">
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
              <button onClick={load} className="btn">
                <span>↻</span>
                Refresh
              </button>
            </div>
          </div>

          {error ? <div className="alert">{error}</div> : null}

          {loading ? (
            <div className="admin-empty">Loading property database...</div>
          ) : (
            <div className="admin-surface">
              <div className="admin-surface-head">
                <p className="admin-mono-label">Listing Table</p>
              </div>
              <div className="admin-table-wrap">
                <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Owner</th>
                    <th>Email</th>
                    <th>Place</th>
                    <th>Posted</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.map((p) => (
                    <tr key={p.id}>
                      <td>{p.title}</td>
                      <td>{p.ownerName || "Unknown"}</td>
                      <td>{p.ownerEmail || "-"}</td>
                      <td>{p.place || "-"}</td>
                      <td>{p.postedDate || "-"}</td>
                      <td>
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="table-actions">
                        <button onClick={() => handleEditClick(p)} className="btn">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(p)} className="ghost-danger">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
              <div className="admin-user-cards">
                {filteredProperties.map((p) => (
                  <article key={p.id} className="admin-user-card">
                    <p className="user-name">{p.title}</p>
                    <p className="user-meta">Owner: {p.ownerName || "Unknown"}</p>
                    <p className="user-meta">Email: {p.ownerEmail || "-"}</p>
                    <p className="user-meta">Place: {p.place || "-"}</p>
                    <p className="user-meta">Posted: {p.postedDate || "-"}</p>
                    <StatusBadge status={p.status} />
                    <div className="table-actions">
                      <button onClick={() => handleEditClick(p)} className="btn">Edit</button>
                      <button onClick={() => handleDelete(p)} className="ghost-danger">Delete</button>
                    </div>
                  </article>
                ))}
              </div>
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