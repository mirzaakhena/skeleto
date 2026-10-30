export type Pagination = {
  page?: number;
  size?: number;
};

export function paginate<T>(items: T[], pagination: Pagination): [T[], number] {
  const page = Math.max(pagination.page ?? 1, 1);
  const size = Math.max(pagination.size ?? 20, 1);

  return [items.slice((page - 1) * size, page * size), items.length];
}
