export function paginate(query, { page = 1, limit = 20, sort = '-createdAt' }) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  return {
    query: query.sort(sort).skip(skip).limit(limitNum),
    page: pageNum,
    limit: limitNum,
    skip,
  };
}

export function buildPagination(total, page, limit) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}

export async function paginatedFind(Model, filter, options = {}) {
  const { page = 1, limit = 20, sort = '-createdAt' } = options;
  const { query, page: pageNum, limit: limitNum } = paginate(Model.find(filter), { page, limit, sort });
  const [items, total] = await Promise.all([query.exec(), Model.countDocuments(filter)]);
  return {
    items,
    pagination: buildPagination(total, pageNum, limitNum),
  };
}
