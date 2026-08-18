import {
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_text,
  tableFeatures,
} from "@tanstack/react-table";

/**
 * The shared TanStack Table feature set for the firm-wide pooled tables
 * (Documents #21, Messages #23): sorting + client-side pagination. Filtering,
 * visibility, and selection are deliberately omitted until a surface needs
 * them, so they stay tree-shaken out.
 */
export const features = tableFeatures({
  rowPaginationFeature,
  rowSortingFeature,
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  // String columns sort by text (localeCompare); numeric/rank columns pass a
  // custom sortFn directly on the column instead.
  sortFns: { text: sortFn_text },
});

/** The feature type columns and the table hook read through. */
export type DataTableFeatures = typeof features;
