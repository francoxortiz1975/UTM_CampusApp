export type User = {
    id: number;
    email: string;
};

function apiBase(): string {
    if (typeof window !== "undefined") {
        const host = window.location.hostname || "localhost";
        return `http://${host}:5000`;
    }
    return "http://localhost:5000";
}

export async function Signup(email: string, password: string): Promise<User | null> {
    try {
        const result: Response = await fetch(`${apiBase()}/auth/signup`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({"email": email, "password": password}),
            credentials: "include",
        });

        if (!result.ok) return null;
        const data = await result.json();
        return data;
    } catch {
        return null;
    }
}

export async function Login(email: string, password: string): Promise<User | null> {
    try {
        const result: Response = await fetch(`${apiBase()}/auth/login`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({"email": email, "password": password}),
            credentials: "include",
        });

        if (!result.ok) return null;
        const data = await result.json();
        return data;
    } catch {
        return null;
    }
}

export async function Logout(): Promise<boolean> {
    try {
        const result: Response = await fetch(`${apiBase()}/auth/logout`, {
            method: "POST",
            credentials: "include",
        });

        if (!result.ok) return false;
        await result.json();
        return true;
    } catch {
        return false;
    }
}

export async function Profile(): Promise<User | null> {
    try {
        const result: Response = await fetch(`${apiBase()}/auth/profile`, {
            method: "GET",
            credentials: "include",
        });

        if (!result.ok) return null;
        const data = await result.json();
        return data;
    } catch {
        return null;
    }
}
