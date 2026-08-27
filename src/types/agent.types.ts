export type Intent =
  | "GET_BOOK_DETAILS"
  | "SEARCH_BOOKS"
  | "UNKNOWN";

export type FilterOperator =
  | "eq"
  | "lt"
  | "lte"
  | "gt"
  | "gte"
  | null;

export interface NumericFilter {
  operator: FilterOperator;
  value: number | null;
}

export interface BookFilters {
  name: string | null;
  author: string | null;
  language: string | null;
  category: string | null;

  rentalPricePerDay: NumericFilter;
  rentalPricePerWeek: NumericFilter;
  rentalPricePerMonth: NumericFilter;
  purchasePrice: NumericFilter;

  availableForRent: boolean | null;
  availableForSale: boolean | null;
}

export interface AgentResult {
  intent: Intent;
  filters: BookFilters;
}

export interface Book {
  _id: string;
  name: string;
  description?: string;
  language?: string;
  author?: string;
  category?: {
    name?: string;
  };

  rentalPricePerDay?: number;
  rentalPricePerWeek?: number;
  rentalPricePerMonth?: number;
  purchasePrice?: number;

  availableForRent?: boolean;
  availableForSale?: boolean;

  availabilityStatus?: string;
  condition?: string;
  quantity?: number;
  coverImage?: string;
}