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
    <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        style={{ borderColor: "#E7E1FA", color: palette.deep }}
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
            className="h-9 min-w-9 rounded-lg border px-3 text-sm font-semibold"
            style={{
              borderColor: isActive ? palette.purple : "#E7E1FA",
              backgroundColor: isActive ? palette.purple : "#FFFFFF",
              color: isActive ? "#FFFFFF" : palette.deep,
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
        className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        style={{ borderColor: "#E7E1FA", color: palette.deep }}
      >
        Next
      </button>
    </div>
  );
}

export default PropertyPagination;
