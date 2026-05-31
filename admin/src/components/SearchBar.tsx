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
  return (
    <div className="search-bar">
      <select value={filter} onChange={(e) => onFilterChange(e.target.value as SearchFilter)}>
        {(filterOptions || [
          { value: "all", label: "All fields" },
          { value: "title", label: "Title" },
          { value: "owner", label: "Owner" },
          { value: "place", label: "Place" },
          { value: "status", label: "Status" },
          { value: "type", label: "Type" },
          { value: "name", label: "Name" },
          { value: "email", label: "Email" },
          { value: "joined", label: "Joined Date" },
        ]).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <input
        placeholder={placeholder ?? "Search across all records..."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;
