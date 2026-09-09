import { getOpenApiSpec } from "./openApiService.js";

const HTTP_METHODS = [
    "get",
    "post",
    "put",
    "patch",
    "delete",
] as const;

type HttpMethod = (typeof HTTP_METHODS)[number];

export const getGeminiApiTools = async () => {
    const spec = await getOpenApiSpec();

    const tools: any[] = [];

    for (const [path, pathItem] of Object.entries(
        spec.paths || {}
    )) {
        const pathData =
            pathItem as Record<string, any>;

        for (const method of HTTP_METHODS) {
            const operation =
                pathData[method];

            if (!operation) {
                continue;
            }

            const operationId =
                operation.operationId ||
                `${method}_${path
                    .replace(/[{}]/g, "")
                    .replace(/\//g, "_")
                    .replace(
                        /[^a-zA-Z0-9_]/g,
                        ""
                    )}`;

            const parameters =
                operation.parameters || [];

            const properties: Record<
                string,
                any
            > = {};

            const required: string[] = [];

            // Handle path/query/header parameters
            for (const parameter of parameters) {
                const name = parameter.name;

                const schema =
                    parameter.schema || {};

                properties[name] = {
                    type:
                        schema.type ||
                        "string",

                    description:
                        parameter.description ||
                        `${parameter.in} parameter`,
                };

                if (parameter.required) {
                    required.push(name);
                }
            }

            // Handle request body
            if (operation.requestBody) {
                const content =
                    operation.requestBody.content;

                const jsonContent =
                    content?.[
                        "application/json"
                    ];

                if (jsonContent?.schema) {
                    properties.body = {
                        type: "object",

                        description:
                            "Request body for this API",
                    };

                    if (
                        operation
                            .requestBody
                            .required
                    ) {
                        required.push(
                            "body"
                        );
                    }
                }
            }

            tools.push({
                name: operationId,

                description:
                    operation.summary ||
                    operation.description ||
                    `${method.toUpperCase()} ${path}`,

                parameters: {
                    type: "object",
                    properties,
                    required,
                },

                _api: {
                    method:
                        method.toUpperCase(),

                    path,
                },
            });
        }
    }

    // Debug: show APIs loaded from OpenAPI
    console.log(
        "\n========== OPENAPI → GEMINI TOOLS =========="
    );

    console.log(
        `Total APIs found: ${tools.length}`
    );

    tools.forEach((tool, index) => {
        console.log(
            `${index + 1}. ${tool.name} → ${tool._api.method} ${tool._api.path}`
        );
    });

    console.log(
        "============================================\n"
    );

    return tools;
};

