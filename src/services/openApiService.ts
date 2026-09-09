import { env } from "../config/env.js";

let openApiSpec: any = null;

export const getOpenApiSpec = async () => {
    if (openApiSpec) {
        return openApiSpec;
    }

    console.log(
        `Loading OpenAPI specification from ${env.OPENAPI_URL}`
    );

    const response = await fetch(
        env.OPENAPI_URL
    );

    if (!response.ok) {
        throw new Error(
            `Failed to load OpenAPI specification: ${response.status}`
        );
    }

    openApiSpec = await response.json();

    return openApiSpec;
};