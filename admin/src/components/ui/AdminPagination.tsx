import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AdminPaginationMeta } from "../../lib/pagination";
import { getPageRangeLabel } from "../../lib/pagination";
import { adminPalette } from "../../theme/palette";

type AdminPaginationProps = {
  pagination: AdminPaginationMeta;
  currentCount: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
};

function AdminPagination({
  pagination,
  currentCount,
  onPageChange,
  loading = false,
}: AdminPaginationProps) {
  if (pagination.total === 0) return null;

  if (pagination.totalPages <= 1) {
    return (
      <div
        className="border-t px-5 py-4"
        style={{ borderColor: adminPalette.border }}
      >
        <p className="text-sm" style={{ color: adminPalette.muted }}>
          {getPageRangeLabel(pagination, currentCount)}
        </p>
      </div>
    );
  }

  const { page, totalPages } = pagination;
  const canGoPrev = page > 1 && !loading;
  const canGoNext = page < totalPages && !loading;

  const pageWindow = () => {
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + maxButtons - 1);
    const adjustedStart = Math.max(1, end - maxButtons + 1);

    return Array.from(
      { length: end - adjustedStart + 1 },
      (_, i) => adjustedStart + i,
    );
  };

  return (
    <div
      className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
      style={{ borderColor: adminPalette.border }}
    >
      <p className="text-sm" style={{ color: adminPalette.muted }}>
        {getPageRangeLabel(pagination, currentCount)}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          style={{ borderColor: adminPalette.border, color: adminPalette.deep }}
        >
          <ChevronLeft size={14} />
          Previous
        </button>

        {pageWindow().map((pageNumber) => {
          const isActive = pageNumber === page;
          return (
            <button
              key={pageNumber}
              type="button"
              disabled={loading}
              onClick={() => onPageChange(pageNumber)}
              className="inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold disabled:opacity-50"
              style={{
                borderColor: isActive ? adminPalette.deep : adminPalette.border,
                backgroundColor: isActive ? adminPalette.deep : adminPalette.cardBg,
                color: isActive ? "#fff" : adminPalette.deep,
              }}
            >
              {pageNumber}
            </button>
          );
        })}

        <button
          type="button"
          disabled={!canGoNext}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          style={{ borderColor: adminPalette.border, color: adminPalette.deep }}
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export default AdminPagination;
