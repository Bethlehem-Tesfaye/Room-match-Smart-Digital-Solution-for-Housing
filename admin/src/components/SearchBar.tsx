import React from "react";

export type SearchFilter = "all" | "name" | "email" | "type" | "status" | "joined";

const SearchBar: React.FC<{
  value: string;
  onChange: (v: string) => void;
  filter: SearchFilter;
  onFilterChange: (filter: SearchFilter) => void;
}> = ({ value, onChange, filter, onFilterChange }) => {
  return (
    <div className="search-bar">
      <select value={filter} onChange={(e) => onFilterChange(e.target.value as SearchFilter)}>
        <option value="all">All fields</option>
        <option value="name">Name</option>
        <option value="email">Email</option>
        <option value="type">Type</option>
        <option value="status">Status</option>
        <option value="joined">Joined Date</option>
      </select>
      <input
        placeholder="Search across all records..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;
