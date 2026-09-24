
import {
  callMcpTool,
} from "../mcp/mcpClient.js";

/**
 * Execute a Gemini-selected backend API through MCP.
 *
 * Supports:
 * - Path parameters
 * - Query parameters
 * - Request body
 * - Authorization forwarding
 * - Generic pagination
 */
export const executeGeminiTool = async (
  tool: any,
  args: Record<string, any>,
  authorization?: string
) => {

  console.log(
    `Executing Gemini tool: ${tool.name}`
  );

  const method =
    tool._api.method;

  const originalPath =
    tool._api.path;

  let path =
    originalPath;

  const query: Record<string, any> = {};

  let body:
    | Record<string, any>
    | undefined;

  /*
   * --------------------------------------------------
   * 1. Replace path parameters
   * --------------------------------------------------
   *
   * Example:
   *
   * /api/user/{id}
   *
   * becomes:
   *
   * /api/user/123
   */

  path = path.replace(
    /\{([^}]+)\}/g,
    (
      _match: string,
      parameterName: string
    ) => {

      const value =
        args[parameterName];

      if (
        value === undefined ||
        value === null
      ) {
        throw new Error(
          `Missing required path parameter: ${parameterName}`
        );
      }

      return encodeURIComponent(
        String(value)
      );
    }
  );

  /*
   * --------------------------------------------------
   * 2. Request body
   * --------------------------------------------------
   */

  if (args.body) {
    body = args.body;
  }

  /*
   * --------------------------------------------------
   * 3. Query parameters
   * --------------------------------------------------
   *
   * Example:
   *
   * language=all
   *
   * will become:
   *
   * {
   *   language: "all"
   * }
   */

  for (
    const [key, value]
    of Object.entries(args)
  ) {

    /*
     * Do not send body as query parameter.
     */
    if (key === "body") {
      continue;
    }

    /*
     * Do not send path parameters
     * as query parameters.
     */
    if (
      originalPath.includes(
        `{${key}}`
      )
    ) {
      continue;
    }

    query[key] = value;
  }

  /*
   * --------------------------------------------------
   * 4. Authorization header
   * --------------------------------------------------
   */

  const headers =
    authorization
      ? {
          Authorization:
            authorization,
        }
      : undefined;

  console.log(
    "MCP API request:",
    {
      method,
      path,
      query:
        Object.keys(query).length > 0
          ? query
          : undefined,
      body,
      authorization:
        authorization
          ? "Bearer token present"
          : "No token",
    }
  );

  /*
   * --------------------------------------------------
   * 5. Function to call one backend page
   * --------------------------------------------------
   */

  const callBackendPage =
    async (
      pageQuery: Record<string, any>
    ) => {

      console.log(
        "\nCalling backend API:"
      );

      console.log({
        method,
        path,
        query:
          Object.keys(pageQuery).length > 0
            ? pageQuery
            : undefined,
      });

      return await callMcpTool(
        "call_backend_api",
        {
          method,
          path,

          query:
            Object.keys(pageQuery).length > 0
              ? pageQuery
              : undefined,

          body,

          headers,
        }
      );
    };

  /*
   * --------------------------------------------------
   * 6. Call first page
   * --------------------------------------------------
   */

  const firstResult =
    await callBackendPage(
      query
    );

  /*
   * --------------------------------------------------
   * 7. Parse MCP response
   * --------------------------------------------------
   *
   * MCP normally returns something like:
   *
   * {
   *   content: [
   *     {
   *       type: "text",
   *       text: "{...backend response...}"
   *     }
   *   ]
   * }
   */

  const parseMcpResult =
    (result: any) => {

      try {

        const firstContent =
          result?.content?.[0];

        if (
          firstContent &&
          firstContent.type === "text" &&
          firstContent.text
        ) {

          return JSON.parse(
            firstContent.text
          );
        }

      } catch (error) {

        console.error(
          "Failed to parse MCP response:",
          error
        );
      }

      return result;
    };

  const firstData =
    parseMcpResult(
      firstResult
    );
/*
 * --------------------------------------------------
 * Handle backend/API errors
 * --------------------------------------------------
 *
 * Do not throw the error here.
 * Return it to agentService so that
 * generateNaturalLanguageResponse()
 * can create the final user-friendly message.
 */

if (firstResult?.isError === true) {

  console.log(
    "Backend API returned an error."
  );

  return firstResult;
}
  /*
   * --------------------------------------------------
   * 8. Check whether response is paginated
   * --------------------------------------------------
   *
   * Your book API returns:
   *
   * data.products
   * data.totalCount
   * data.hasMore
   * data.currentPage
   * data.totalPages
   */

  const paginationData =
    firstData?.data;

  const isPaginated =
    paginationData &&
    Array.isArray(
      paginationData.products
    ) &&
    (
      typeof paginationData.hasMore ===
        "boolean"
      ||
      typeof paginationData.totalPages ===
        "number"
    );

  /*
   * --------------------------------------------------
   * 9. If API is NOT paginated
   * --------------------------------------------------
   *
   * Return the original response exactly
   * as before.
   */

  if (!isPaginated) {

    console.log(
      "\nAPI is not paginated."
    );

    return firstResult;
  }

  /*
   * --------------------------------------------------
   * 10. Pagination
   * --------------------------------------------------
   */

  console.log(
    "\n========== PAGINATION =========="
  );

  console.log(
    "Total records:",
    paginationData.totalCount
  );

  console.log(
    "Current page:",
    paginationData.currentPage
  );

  console.log(
    "Total pages:",
    paginationData.totalPages
  );

  console.log(
    "Has more:",
    paginationData.hasMore
  );

  /*
   * Store all products from page 1.
   */

  const allProducts = [
    ...paginationData.products,
  ];

  let currentPage =
    Number(
      paginationData.currentPage
    ) || 1;

  const totalPages =
    Number(
      paginationData.totalPages
    ) || currentPage;

  let hasMore =
    paginationData.hasMore === true;

  /*
   * Safety limit.
   *
   * This prevents an accidental infinite loop
   * if the backend returns incorrect pagination data.
   */

  const MAX_PAGES = 100;

  let pagesFetched = 1;

  /*
   * --------------------------------------------------
   * 11. Fetch remaining pages
   * --------------------------------------------------
   */

  while (
    hasMore &&
    currentPage < totalPages &&
    pagesFetched < MAX_PAGES
  ) {

    currentPage =
      currentPage + 1;

    console.log(
      `\nFetching page ${currentPage} of ${totalPages}...`
    );

    /*
     * Copy the original query.
     *
     * This keeps filters such as:
     *
     * language=all
     *
     * on every request.
     */

    const nextPageQuery = {
      ...query,
      page: currentPage,
    };

    const nextResult =
      await callBackendPage(
        nextPageQuery
      );

    const nextData =
      parseMcpResult(
        nextResult
      );

    const nextPaginationData =
      nextData?.data;

    /*
     * Make sure the next page
     * actually contains products.
     */

    if (
      !nextPaginationData ||
      !Array.isArray(
        nextPaginationData.products
      )
    ) {

      console.log(
        `Page ${currentPage} did not contain products. Stopping pagination.`
      );

      break;
    }

    /*
     * Add products from this page.
     */

    allProducts.push(
      ...nextPaginationData.products
    );

    /*
     * Update pagination information.
     */

    hasMore =
      nextPaginationData.hasMore === true;

    if (
      typeof nextPaginationData.currentPage ===
      "number"
    ) {
      currentPage =
        nextPaginationData.currentPage;
    }

    pagesFetched++;

    console.log(
      `Page ${currentPage} fetched.`
    );

    console.log(
      `Products collected: ${allProducts.length}`
    );
  }

  /*
   * --------------------------------------------------
   * 12. Build combined response
   * --------------------------------------------------
   */

  const combinedResult = {
    ...firstData,

    data: {
      ...paginationData,

      /*
       * Replace page-1 products with
       * products from all pages.
       */
      products:
        allProducts,

      /*
       * The final combined result represents
       * the complete collection.
       */
      hasMore:
        false,

      currentPage:
        totalPages,

      totalPages:
        totalPages,

      totalCount:
        paginationData.totalCount ??
        allProducts.length,
    },
  };

  console.log(
    "\n========== PAGINATION COMPLETE =========="
  );

  console.log(
    "Pages fetched:",
    pagesFetched
  );

  console.log(
    "Total products collected:",
    allProducts.length
  );

  console.log(
    "Expected total:",
    paginationData.totalCount
  );

  console.log(
    "=========================================\n"
  );

  /*
   * --------------------------------------------------
   * 13. Return combined result
   * --------------------------------------------------
   *
   * Your agentService will then pass this data
   * to generateNaturalLanguageResponse().
   */

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          combinedResult
        ),
      },
    ],
  };
};
