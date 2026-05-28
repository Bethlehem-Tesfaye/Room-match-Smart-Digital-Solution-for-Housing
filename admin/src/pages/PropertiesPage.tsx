import React, { useEffect, useState } from "react";
import {
  getAdminProperties,
  getAdminProperty,
  createAdminProperty,
  updateAdminProperty,
  deleteAdminProperty,
  AdminPropertyRow,
  AdminPropertyDetail,
} from "../lib/api";
import PropertyEditModal from "../components/PropertyEditModal";

function PropertiesPage() {
  const [properties, setProperties] = useState<AdminPropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<AdminPropertyDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

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

  const handleCreate = async () => {
    const title = window.prompt("Property title");
    if (!title) return;
    try {
      const res = await createAdminProperty({ title });
      const createdDate = res.property.createdAt ? new Date(res.property.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }) : "";
      setProperties((p) => [
        {
          id: String(res.property._id),
          title: res.property.title,
          ownerName: res.property.ownerName || "Unknown",
          status: res.property.status,
          createdAt: res.property.createdAt,
          postedDate: createdDate,
        },
        ...p,
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed.");
    }
  };

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

  const handleSaveEdit = async (data: Partial<AdminPropertyDetail>) => {
    if (!selectedProperty) return;
    try {
      setModalLoading(true);
      const res = await updateAdminProperty(selectedProperty._id, data);
      setProperties((p) =>
        p.map((x) =>
          x.id === selectedProperty._id
            ? {
                ...x,
                title: (res.property as any).title || res.property.title,
                status: (res.property as any).status || res.property.status,
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

  const handleViewDetails = (prop: AdminPropertyRow) => {
    const details = [
      `Owner: ${prop.ownerName || "Unknown"}`,
      `Type: ${prop.status}`,
      `Posted: ${prop.postedDate}`,
    ].join("\n");
    alert(details);
  };

  return (
    <div className="dashboard-wrapper">
      <header className="dashboard-hero">
        <div className="dashboard-inner">
          <h1 className="hero-title">Properties</h1>
          <div className="button-row">
            <button onClick={handleCreate} className="button">
              Create Property
            </button>
            <button onClick={load} className="button secondary">
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="container-wide">
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
                    <th>Posted</th>
                    <th>Status</th>
                    <th>Details</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((p) => (
                    <tr key={p.id}>
                      <td>{p.title}</td>
                      <td>{p.ownerName || "Unknown"}</td>
                      <td>{p.postedDate || "-"}</td>
                      <td>{p.status || "-"}</td>
                      <td>
                        <button onClick={() => handleViewDetails(p)} className="button tiny">
                          View
                        </button>
                      </td>
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

