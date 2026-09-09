import {
    getMcpTools,
    callMcpTool,
} from "./mcpClient.js";

const run = async () => {
    console.log("Connecting to MCP server...");

    const tools = await getMcpTools();

    console.log("Available MCP tools:");
    console.log(
        JSON.stringify(tools, null, 2)
    );

    console.log(
        "\nCalling get books API through MCP..."
    );

    const result = await callMcpTool(
        "call_backend_api",
        {
            method: "GET",
            path: "/api/book",
        }
    );

    console.log("\nMCP Tool Result:");

    console.log(
        JSON.stringify(result, null, 2)
    );
};

run().catch((error) => {
    console.error(
        "MCP test failed:",
        error
    );
});