import { getOpenApiSpec } from "./openApiService.js";

const run = async () => {
    console.log("Loading OpenAPI...");

    const spec = await getOpenApiSpec();

    console.log(
        "OpenAPI loaded successfully"
    );

    console.log(
        "OpenAPI version:",
        spec.openapi
    );

    console.log(
        "API title:",
        spec.info?.title
    );

    console.log(
        "\nAvailable API paths:"
    );

    console.log(
        Object.keys(spec.paths || {})
    );
};

run().catch((error) => {
    console.error(
        "OpenAPI test failed:",
        error
    );
});