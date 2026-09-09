import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";

import {
  env,
} from "../config/env.js";

let client: Client | null = null;

export const connectMcpClient =
  async (): Promise<Client> => {

    if (client) {
      return client;
    }

    const newClient =
      new Client({
        name: "book-rental-ai-agent",
        version: "1.0.0",
      });

    const transport =
      new StreamableHTTPClientTransport(
        new URL(env.MCP_SERVER_URL)
      );

    await newClient.connect(
      transport
    );

    client = newClient;

    console.log(
      `Connected to MCP server: ${env.MCP_SERVER_URL}`
    );

    return client;
  };


export const getMcpTools = async () => {

  const mcpClient =
    await connectMcpClient();

  const result =
    await mcpClient.listTools();

  return result.tools;
};


export const callMcpTool = async (
  name: string,
  args: Record<string, unknown>
) => {

  const mcpClient =
    await connectMcpClient();

  console.log(
    "Calling MCP tool:",
    name
  );

  console.log(
    "MCP tool arguments:",
    JSON.stringify(
      args,
      null,
      2
    )
  );

  return await mcpClient.callTool({
    name,
    arguments: args,
  });
};