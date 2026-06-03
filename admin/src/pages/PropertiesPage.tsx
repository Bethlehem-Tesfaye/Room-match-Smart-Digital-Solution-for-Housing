import { useCallback, useEffect, useState } from "react";
import { Pencil, RefreshCw, Trash2 } from "lucide-react";
import { useAdminNotifications } from "../context/AdminNotificationContext";
import {
  getAdminProperties,
  getAdminProperty,
  updateAdminProperty,
  deleteAdminProperty,
  AdminPropertyRow,
  AdminPropertyDetail,
} from "../lib/api";
import PropertyEditModal from "../components/PropertyEditModal";
import DeletePropertyModal from "../components/DeletePropertyModal";
import SearchBar, { SearchFilter } from "../components/SearchBar";
import AdminShell from "../components/layout/AdminShell";
import BentoCard from "../components/layout/BentoCard";
import AdminPagination from "../components/ui/AdminPagination";
import { PropertyStatusChip } from "../components/ui/Chips";
import {
  ADMIN_PAGE_SIZE,
  defaultPagination,
  type AdminPaginationMeta,
} from "../lib/pagination";
import { adminPalette } from "../theme/palette";

function PropertiesPage() {
  const { clearPropertyNotifications } = useAdminNotifications();
  const [properties, setProperties] = useState<AdminPropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<AdminPropertyDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<AdminPropertyRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<SearchFilter>("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<AdminPaginationMeta>(defaultPagination);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminProperties({
        page,
        limit: ADMIN_PAGE_SIZE,
        search: search || undefined,
        searchField: filter,
      });
      setProperties(res.properties ?? []);
      setPagination(res.pagination ?? defaultPagination());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load properties.");
    } finally {
      setLoading(false);
    }
  }, [page, search, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, filter]);

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
                place: [res.property.address, res.property.city]
                  .filter(Boolean)
                  .join(", "),
              }
            : x,
        ),
      );
      setModalOpen(false);
      setSelectedProperty(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteClick = (prop: AdminPropertyRow) => {
    setPropertyToDelete(prop);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!propertyToDelete) return;

    setDeleteLoading(true);
    setError(null);

    try {
      await deleteAdminProperty(propertyToDelete.id);
      setDeleteModalOpen(false);
      setPropertyToDelete(null);

      if (properties.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <AdminShell
      eyebrow="Admin · Properties"
      title="Property listings"
      subtitle="Moderate owner listings and update property details."
    >
      <BentoCard
        label="Search & filter"
        action={
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-[#f8fafc]"
            style={{ borderColor: adminPalette.border, color: adminPalette.deep }}
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        }
      >
        <div className="p-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            filter={filter}
            onFilterChange={(newFilter) => {
              setFilter(newFilter);
              setSearch("");
            }}
            placeholder="Search by title, owner, place, or status..."
            filterOptions={[
              { value: "all", label: "All fields" },
              { value: "title", label: "Title" },
              { value: "owner", label: "Owner" },
              { value: "email", label: "Owner email" },
              { value: "place", label: "Place" },
              { value: "status", label: "Status" },
            ]}
          />
        </div>
      </BentoCard>

      {error && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: "#fecaca",
            backgroundColor: "#fef2f2",
            color: adminPalette.accent,
          }}
        >
          {error}
        </div>
      )}

      {loading && properties.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed px-5 py-12 text-center text-sm"
          style={{ borderColor: adminPalette.border, color: adminPalette.muted }}
        >
          Loading property database…
        </div>
      ) : (
        <BentoCard
          label="Listings"
          action={
            <span className="text-xs font-semibold" style={{ color: adminPalette.muted }}>
              Page {pagination.page} of {pagination.totalPages}
            </span>
          }
        >
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr
                  className="border-b text-left text-[11px] font-semibold uppercase tracking-wider"
                  style={{ borderColor: adminPalette.border, color: adminPalette.muted }}
                >
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Owner</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Place</th>
                  <th className="px-5 py-3">Posted</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b transition-colors hover:bg-[#f8fafc]"
                    style={{ borderColor: adminPalette.border }}
                  >
                    <td className="px-5 py-4 font-semibold" style={{ color: adminPalette.deep }}>
                      {p.title}
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: adminPalette.muted }}>
                      {p.ownerName || "Unknown"}
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: adminPalette.muted }}>
                      {p.ownerEmail || "—"}
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: adminPalette.muted }}>
                      {p.place || "—"}
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: adminPalette.muted }}>
                      {p.postedDate || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <PropertyStatusChip status={p.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void handleEditClick(p)}
                          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-[#f8fafc]"
                          style={{
                            borderColor: adminPalette.border,
                            color: adminPalette.deep,
                          }}
                        >
                          <Pencil size={12} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(p)}
                          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-[#fef2f2]"
                          style={{
                            borderColor: "#fecaca",
                            color: adminPalette.accent,
                          }}
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y md:hidden" style={{ borderColor: adminPalette.border }}>
            {properties.map((p) => (
              <article key={p.id} className="space-y-3 px-4 py-4">
                <p className="font-semibold" style={{ color: adminPalette.deep }}>
                  {p.title}
                </p>
                <p className="text-xs" style={{ color: adminPalette.muted }}>
                  {p.ownerName || "Unknown"} · {p.ownerEmail || "—"}
                </p>
                <p className="text-xs" style={{ color: adminPalette.muted }}>
                  {p.place || "—"} · Posted {p.postedDate || "—"}
                </p>
                <PropertyStatusChip status={p.status} />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleEditClick(p)}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-semibold"
                    style={{ borderColor: adminPalette.border, color: adminPalette.deep }}
                  >
                    <Pencil size={12} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(p)}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-semibold"
                    style={{ borderColor: "#fecaca", color: adminPalette.accent }}
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>

          {properties.length === 0 && !loading && (
            <div className="px-5 py-10 text-center text-sm" style={{ color: adminPalette.muted }}>
              No properties match your search.
            </div>
          )}

          <AdminPagination
            pagination={pagination}
            currentCount={properties.length}
            onPageChange={setPage}
            loading={loading}
          />
        </BentoCard>
      )}

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

      <DeletePropertyModal
        property={propertyToDelete}
        open={deleteModalOpen}
        loading={deleteLoading}
        onClose={() => {
          if (deleteLoading) return;
          setDeleteModalOpen(false);
          setPropertyToDelete(null);
        }}
        onConfirm={() => void handleConfirmDelete()}
      />
    </AdminShell>
  );
}

export default PropertiesPage;
