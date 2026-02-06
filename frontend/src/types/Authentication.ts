export type User = {
    id: number;
    email: string;
};

export async function Signup(email: string, password: string): Promise<User | null> {
    const result: Response = await fetch("http://localhost:5000/auth/signup", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({"email": email, "password": password}),
        credentials: "include",
    });

    if (!result.ok) return null;
    const data = await result.json();
    return data;
}

export async function Login(email: string, password: string): Promise<User | null> {
    const result: Response = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({"email": email, "password": password}),
        credentials: "include",
    });

    if (!result.ok) return null;
    const data = await result.json();
    return data;
}

export async function Logout(): Promise<boolean> {
    const result: Response = await fetch("http://localhost:5000/auth/logout", {
        method: "POST",
        credentials: "include",
    });

    if (!result.ok) return false;
    const data = await result.json();
    return true;
}

export async function Profile(): Promise<User | null> {
    const result: Response = await fetch("http://localhost:5000/auth/profile", {
        method: "GET",
        credentials: "include",
    });

    if (!result.ok) return null;
    const data = await result.json();
    return data;
}
