import {
  callMcpTool,
} from "../mcp/mcpClient.js";

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

  let path =
    tool._api.path;

  const query: Record<string, any> = {};

  let body:
    | Record<string, any>
    | undefined;

  /*
   * Replace path parameters
   *
   * Example:
   * /api/user/{id}
   *
   * becomes:
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
   * Request body
   */

  if (args.body) {
    body = args.body;
  }

  /*
   * Query parameters
   */

  for (
    const [key, value]
    of Object.entries(args)
  ) {

    if (key === "body") {
      continue;
    }

    /*
     * Do not send path parameters
     * as query parameters.
     */

    if (
      tool._api.path.includes(
        `{${key}}`
      )
    ) {
      continue;
    }

    query[key] = value;
  }

  /*
   * IMPORTANT:
   *
   * Forward Authorization header
   * to MCP server.
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
   * Call MCP generic API executor
   */

  const result =
    await callMcpTool(
      "call_backend_api",
      {
        method,
        path,

        query:
          Object.keys(query).length > 0
            ? query
            : undefined,

        body,

        headers,
      }
    );

  return result;
};