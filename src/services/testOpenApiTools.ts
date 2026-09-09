import { getGeminiApiTools } from "./openApiToolsService.js";

const run = async () => {
    console.log("Generating Gemini API tools...");

    const tools =
        await getGeminiApiTools();

    console.log(
        `Generated ${tools.length} API tools`
    );

    for (const tool of tools) {
        console.log(
            `\n${tool.name}`
        );

        console.log(
            `${tool._api.method} ${tool._api.path}`
        );

        console.log(
            "Parameters:",
            JSON.stringify(
                tool.parameters,
                null,
                2
            )
        );
    }
};

run().catch((error) => {
    console.error(
        "OpenAPI tools test failed:",
        error
    );
});