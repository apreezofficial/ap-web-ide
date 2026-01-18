const API_BASE_URL = "/api";

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            ...options.headers,
        },
    });

    if (!res.ok) {
        let errorMessage = "API request failed";
        try {
            const error = await res.json();
            errorMessage = error.error || errorMessage;
        } catch (e) {
            // If it's not JSON, it might be a PHP error or 401/500 page
            const text = await res.text().catch(() => "");
            console.error("Non-JSON error response from API:", text.slice(0, 500));
            errorMessage = `API Error (${res.status}): ${res.statusText}`;
        }
        throw new Error(errorMessage);
    }

    return res.json();
}
