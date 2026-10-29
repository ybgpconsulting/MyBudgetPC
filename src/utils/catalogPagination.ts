export interface CatalogPage<T> {
  products: T[];
  total?: number;
  limit?: number;
  page?: number;
  pages?: number;
}

const CATALOG_PAGE_SIZE = 100;
const MAX_CATALOG_PAGES = 1000;

export async function fetchAllCatalogProducts<T>(
  fetchPage: (page: number, limit: number) => Promise<CatalogPage<T>>,
): Promise<T[]> {
  const firstPage = await fetchPage(1, CATALOG_PAGE_SIZE);
  if (!Array.isArray(firstPage.products)) {
    throw new Error('The catalogue service returned an invalid product list.');
  }

  const pageCount = Math.max(
    1,
    firstPage.pages ?? (firstPage.total === undefined
      ? 1
      : Math.ceil(firstPage.total / (firstPage.limit || CATALOG_PAGE_SIZE))),
  );
  if (!Number.isInteger(pageCount) || pageCount > MAX_CATALOG_PAGES) {
    throw new Error('The catalogue contains too many pages to load safely.');
  }

  const products = [...firstPage.products];
  for (let page = 2; page <= pageCount; page += 1) {
    const result = await fetchPage(page, CATALOG_PAGE_SIZE);
    if (!Array.isArray(result.products)) {
      throw new Error(`The catalogue service returned an invalid product list for page ${page}.`);
    }
    products.push(...result.products);
  }
  return products;
}
