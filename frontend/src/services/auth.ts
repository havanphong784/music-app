export const URL = import.meta.env.VITE_API_URL ?? "";

export interface LoginResponse {
    user: User,
    message: string,
    accessToken: string,
}

export interface User {
    userId: string,
    email: string,
    role: string
}

export const login = async (email: string, pass: string): Promise<LoginResponse> => {
    const response = await fetch(URL + "/api/v1/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
            email: email,
            password: pass
        })
    })

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message)
    }
    return result;
}

export const register = async (name: string, email: string, pass: string): Promise<{ message: string }> => {
    const response = await fetch(URL + "/api/v1/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
            name,
            email,
            password: pass
        })
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message);
    }
    return result;
}

export const refreshToken = async (): Promise<LoginResponse> => {
    const response = await fetch((URL || "") + "/api/v1/auth/refresh-token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message);
    }
    return result;
}

export const logout = async (): Promise<{ message: string }> => {
    const response = await fetch((URL || "") + "/api/v1/auth/logout", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message);
    }
    return result;
}
