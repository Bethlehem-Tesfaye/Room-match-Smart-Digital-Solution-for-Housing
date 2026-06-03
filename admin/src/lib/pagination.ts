export const ADMIN_PAGE_SIZE = 10;

export type AdminPaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  searchField?: string;
  role?: "admin" | "user";
};

export const defaultPagination = (): AdminPaginationMeta => ({
  page: 1,
  limit: ADMIN_PAGE_SIZE,
  total: 0,
  totalPages: 1,
});

export const buildListQueryString = (params: AdminListQuery) => {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search?.trim()) searchParams.set("search", params.search.trim());
  if (params.searchField) searchParams.set("searchField", params.searchField);
  if (params.role) searchParams.set("role", params.role);

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export const getPageRangeLabel = (
  pagination: AdminPaginationMeta,
  currentCount: number,
) => {
  if (pagination.total === 0 || currentCount === 0) {
    return "No results";
  }

  const start = (pagination.page - 1) * pagination.limit + 1;
  const end = start + currentCount - 1;
  return `Showing ${start}–${end} of ${pagination.total}`;
};
