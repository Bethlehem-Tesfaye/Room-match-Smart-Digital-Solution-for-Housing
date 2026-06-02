import React from "react";

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
    { value: "joined", label: "Joined Date" },
  ];

  return (
    <div className="admin-search">
      <select
        className="admin-input"
        value={filter}
        onChange={(e) => onFilterChange(e.target.value as SearchFilter)}
      >
        {(filterOptions || defaultOptions).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {filter === "status" ? (
        <select
          className="admin-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select status</option>
          <option value="Active">Active</option>
          <option value="Blocked">Blocked</option>
        </select>
      ) : filter === "type" ? (
        <select
          className="admin-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select type</option>
          <option value="Tenant">Tenant</option>
          <option value="Owner">Owner</option>
        </select>
      ) : filter === "joined" ? (
        <input
          className="admin-input"
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Choose joined date"}
        />
      ) : (
        <input
          className="admin-input"
          placeholder={placeholder ?? "Search across all records..."}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
};

export default SearchBar;
