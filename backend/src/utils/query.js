const RESERVED = new Set(['sort', 'limit', 'offset']);

const coerceValue = (value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (!Number.isNaN(Number(value)) && value !== '') return Number(value);
  return value;
};

export const buildWhereClause = (query = {}) => {
  const where = {};
  Object.entries(query).forEach(([key, value]) => {
    if (RESERVED.has(key)) return;
    if (value === undefined || value === null || value === '') return;

    if (Array.isArray(value)) {
      where[key] = { in: value.map(coerceValue) };
    } else {
      where[key] = coerceValue(value);
    }
  });
  return where;
};

export const buildOrderBy = (sortParam) => {
  if (!sortParam) return undefined;
  const orderClauses = [];
  const segments = Array.isArray(sortParam) ? sortParam : [sortParam];

  segments.forEach((segment) => {
    if (!segment) return;
    const trimmed = segment.trim();
    if (!trimmed) return;
    const direction = trimmed.startsWith('-') ? 'desc' : 'asc';
    const field = trimmed.replace(/^[-+]/, '');
    if (field) {
      orderClauses.push({ [field]: direction });
    }
  });

  if (orderClauses.length === 0) return undefined;
  if (orderClauses.length === 1) return orderClauses[0];
  return orderClauses;
};
