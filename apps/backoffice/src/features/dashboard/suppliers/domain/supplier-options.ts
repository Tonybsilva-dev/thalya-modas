export const supplierCategoryOptions = [
  "women_fashion",
  "accessories",
  "footwear",
  "mens_fashion",
  "packaging",
] as const;

export const supplierTermOptions = [
  "+3",
  "+5",
  "+7",
  "+15",
  "+30",
  "+45",
] as const;

export type SupplierCategory = (typeof supplierCategoryOptions)[number];
export type SupplierTerm = (typeof supplierTermOptions)[number];
