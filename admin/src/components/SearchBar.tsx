import { adminPalette } from "../theme/palette";

export type SearchFilter =
  | "all"
  | "name"
  | "email"
  | "type"
  | "status"
  | "joined"
  | "title"
  | "owner"
  | "place";

const SearchBar: React.FC<{
  value: string;
  onChange: (v: string) => void;
  filter: SearchFilter;
  onFilterChange: (filter: SearchFilter) => void;
  placeholder?: string;
  filterOptions?: Array<{ value: SearchFilter; label: string }>;
}> = ({ value, onChange, filter, onFilterChange, placeholder, filterOptions }) => {
  const defaultOptions: Array<{ value: SearchFilter; label: string }> = [
    { value: "all", label: "All fields" },
    { value: "status", label: "Status" },
    { value: "type", label: "Type" },
    { value: "name", label: "Name" },
    { value: "email", label: "Email" },
    { value: "joined", label: "Joined date" },
  ];

  const options = filterOptions ?? defaultOptions;
  const inputClass =
    "w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-200";

  return (
    <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
      <select
        className={inputClass}
        value={filter}
        onChange={(e) => onFilterChange(e.target.value as SearchFilter)}
        style={{
          borderColor: adminPalette.border,
          backgroundColor: adminPalette.inputBg,
          color: adminPalette.deep,
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {filter === "status" ? (
        <select
          className={inputClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            borderColor: adminPalette.border,
            backgroundColor: adminPalette.inputBg,
            color: adminPalette.deep,
          }}
        >
          <option value="">Select status</option>
          <option value="Active">Active</option>
          <option value="Blocked">Blocked</option>
          <option value="Rented">Rented</option>
          <option value="Reserved">Reserved</option>
        </select>
      ) : filter === "type" ? (
        <select
          className={inputClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            borderColor: adminPalette.border,
            backgroundColor: adminPalette.inputBg,
            color: adminPalette.deep,
          }}
        >
          <option value="">Select type</option>
          <option value="Tenant">Tenant</option>
          <option value="Owner">Owner</option>
          <option value="Admin">Admin</option>
        </select>
      ) : filter === "joined" ? (
        <input
          className={inputClass}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            borderColor: adminPalette.border,
            backgroundColor: adminPalette.inputBg,
            color: adminPalette.deep,
          }}
        />
      ) : (
        <input
          className={inputClass}
          placeholder={placeholder ?? "Search records..."}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            borderColor: adminPalette.border,
            backgroundColor: adminPalette.inputBg,
            color: adminPalette.deep,
          }}
        />
      )}
    </div>
  );
};

export default SearchBar;
