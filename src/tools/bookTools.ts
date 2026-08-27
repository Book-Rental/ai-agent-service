import { backendClient } from "../config/backendClient.js";
import {
  Book,
  BookFilters,
  NumericFilter,
} from "../types/agent.types.js";

const matchesNumericFilter = (
  actualValue: number | undefined,
  filter: NumericFilter
): boolean => {
  if (
    actualValue === undefined ||
    filter.operator === null ||
    filter.value === null
  ) {
    return filter.operator === null;
  }

  switch (filter.operator) {
    case "eq":
      return actualValue === filter.value;

    case "lt":
      return actualValue < filter.value;

    case "lte":
      return actualValue <= filter.value;

    case "gt":
      return actualValue > filter.value;

    case "gte":
      return actualValue >= filter.value;

    default:
      return true;
  }
};

const textMatches = (
  actualValue: string | undefined,
  searchValue: string | null
): boolean => {
  if (!searchValue) {
    return true;
  }

  if (!actualValue) {
    return false;
  }

  return actualValue
    .toLowerCase()
    .includes(searchValue.toLowerCase().trim());
};

export const bookTools = {
  async getAllBooks(): Promise<Book[]> {
    const allBooks: Book[] = [];

    let currentPage = 1;
    let totalPages = 1;

    while (currentPage <= totalPages) {
      console.log(`Fetching books page ${currentPage}...`);

      const response = await backendClient.get("/api/book", {
        params: {
          language: "all",
          page: currentPage,
        },
      });

      const responseData = response.data?.data;

      const books: Book[] = responseData?.products || [];

      totalPages = responseData?.totalPages || 1;

      allBooks.push(...books);

      currentPage++;
    }

    console.log(`Total books loaded: ${allBooks.length}`);

    return allBooks;
  },

  async searchBooks(filters: BookFilters): Promise<Book[]> {
    const books = await this.getAllBooks();

    const matchingBooks = books.filter((book) => {
      const categoryName =
        book.category?.name || "";

      return (
        textMatches(book.name, filters.name) &&
        textMatches(book.author, filters.author) &&
        textMatches(book.language, filters.language) &&
        textMatches(categoryName, filters.category) &&

        matchesNumericFilter(
          book.rentalPricePerDay,
          filters.rentalPricePerDay
        ) &&

        matchesNumericFilter(
          book.rentalPricePerWeek,
          filters.rentalPricePerWeek
        ) &&

        matchesNumericFilter(
          book.rentalPricePerMonth,
          filters.rentalPricePerMonth
        ) &&

        matchesNumericFilter(
          book.purchasePrice,
          filters.purchasePrice
        ) &&

        (
          filters.availableForRent === null ||
          book.availableForRent === filters.availableForRent
        ) &&

        (
          filters.availableForSale === null ||
          book.availableForSale === filters.availableForSale
        )
      );
    });

    console.log(
      `Matching books found: ${matchingBooks.length}`
    );

    return matchingBooks;
  },

  async findBookByName(bookName: string): Promise<Book | null> {
    const books = await this.getAllBooks();

    const normalizedName = bookName
      .toLowerCase()
      .trim();

    const book = books.find(
      (item) =>
        item.name?.toLowerCase().trim() === normalizedName
    );

    if (!book) {
      return null;
    }

    console.log("Book found:", book.name);
    console.log("Book ID:", book._id);

    const response = await backendClient.get(
      `/api/book/${book._id}`
    );

    return response.data;
  },

  async getBookById(bookId: string) {
    const response = await backendClient.get(
      `/api/book/${bookId}`
    );

    return response.data;
  },
};