import axios from "axios";
import { env } from "./env.js";


/*
 * --------------------------------------------------
 * Axios client
 * --------------------------------------------------
 */

export const backendClient = axios.create({

    baseURL: env.BASE_URL,

    timeout: 30000,

    headers: {
        "Content-Type": "application/json",
    },
});


/*
 * --------------------------------------------------
 * Create headers for backend request
 * --------------------------------------------------
 */

export const getBackendHeaders = (
    authorization?: string
) => {

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };


    /*
     * Forward user's JWT if available
     */

    if (authorization) {

        headers["Authorization"] =
            authorization;
    }


    return headers;
};