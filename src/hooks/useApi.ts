// hooks/useApi.ts
import { useState } from "react";

const BASE_URL = "https://api.inditechit.com";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export function useApi<T = any>() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const request = async (
        endpoint: string,
        method: HttpMethod = "GET",
        body?: any
    ): Promise<T | null> => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${BASE_URL}${endpoint}`, {
                method,
                headers: { "Content-Type": "application/json" },
                body: body ? JSON.stringify(body) : undefined,
            });

            if (!res.ok) {
                throw new Error(`Request failed: ${res.status}`);
            }

            const data = (await res.json()) as T;
            return data;
        } catch (err: any) {
            setError(err.message || "Something went wrong");
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { request, loading, error };
}
