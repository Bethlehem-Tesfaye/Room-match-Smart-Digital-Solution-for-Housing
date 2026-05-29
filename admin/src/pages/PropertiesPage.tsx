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
      <header className="dashboard-hero">
        <div className="dashboard-inner">
          <h1 className="hero-title">Properties</h1>
          <div className="button-row">
            <button onClick={load} className="button secondary">
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="container-wide">
          <div className="table-controls" style={{display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between'}}>
            <SearchBar
            value={search}
            onChange={setSearch}
            filter={filter}
            onFilterChange={setFilter}
            placeholder="Search properties by title, owner, place, or status"
            filterOptions={[
              { value: "all", label: "All fields" },
              { value: "title", label: "Title" },
              { value: "owner", label: "Owner" },
              { value: "email", label: "Owner Email" },
              { value: "place", label: "Place" },
              { value: "status", label: "Status" },
            ]}
          />
            <div style={{display:'flex', gap:8}}>
              <Link to="/dashboard" className="button">
                Back to Dashboard
              </Link>
              <button onClick={load} className="button secondary">
                Refresh
              </button>
            </div>
          </div>
          {error ? <div className="alert">{error}</div> : null}
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="table-card">
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
                        <td>{p.status || "-"}</td>
                      <td className="button-row">
                        <button onClick={() => handleEditClick(p)} className="button small">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(p)} className="button small danger">
                          Delete
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

