import { palette } from "../../../theme/palette";

interface PropertyPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function PropertyPagination({
  page,
  totalPages,
  onPageChange,
}: PropertyPaginationProps) {
  if (totalPages <= 1) return null;

  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  );

  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="min-h-[44px] rounded-lg border px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
        style={{ borderColor: palette.border, color: "var(--palette-deep)" }}
      >
        Previous
      </button>

      {pageNumbers.map((pageNumber) => {
        const isActive = pageNumber === page;

        return (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            className="h-11 min-w-11 rounded-lg border px-3 text-sm font-bold"
            style={{
              borderColor: isActive ? palette.purple : palette.border,
              backgroundColor: isActive ? palette.purple : palette.cardBg,
              color: isActive ? "#FFFFFF" : "var(--palette-deep)",
            }}
          >
            {pageNumber}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="min-h-[44px] rounded-lg border px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
        style={{ borderColor: palette.border, color: "var(--palette-deep)" }}
      >
        Next
      </button>
    </div>
  );
}

export default PropertyPagination;
