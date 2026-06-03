export const DEFAULT_ADMIN_PAGE_SIZE = 10;
export const MAX_ADMIN_PAGE_SIZE = 50;

export const parseAdminPagination = (query = {}) => {
  const page = Math.max(1, Number.parseInt(String(query.page ?? "1"), 10) || 1);
  const rawLimit = Number.parseInt(String(query.limit ?? DEFAULT_ADMIN_PAGE_SIZE), 10);
  const limit = Math.min(
    MAX_ADMIN_PAGE_SIZE,
    Math.max(1, Number.isFinite(rawLimit) ? rawLimit : DEFAULT_ADMIN_PAGE_SIZE)
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
};

export const buildAdminPaginationMeta = (total, page, limit) => {
  const safeTotal = Math.max(0, total);
  const totalPages = Math.max(1, Math.ceil(safeTotal / limit) || 1);

  return {
    page,
    limit,
    total: safeTotal,
    totalPages
  };
};

export const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
