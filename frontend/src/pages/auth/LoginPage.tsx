import * as React from "react";
import {useEffect, useState} from "react";
import {login as loginApi} from "../../services/auth.ts";
import {useAuth} from "../../context/AuthContext.tsx";
import {useNavigate} from "react-router-dom";

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const {login, logout, user} = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate("/");
        }
    }, [user, navigate]);

    const handleLogin = async (e: React.SubmitEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setMessage("");
            const data = await loginApi(email, pass);
            login(data.accessToken, data.user);
            setMessage(data.message);
            navigate("/");
        } catch (err: any) {
            setMessage(err.message || "Đăng nhập thất bại");
        } finally {
            setLoading(false);
        }
    }

    const handleLogout = async () => {
        await logout();
    }

    return (
        <form onSubmit={handleLogin}>
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Mật khẩu"
                value={pass}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPass(e.target.value)}
                required
            />
            <button type="submit" disabled={loading}>
                {loading ? "Đang đăng nhập..." : "Login"}
            </button>
            <button type="button" onClick={handleLogout}>
                Logout
            </button>
            {message && <label>{message}</label>}
        </form>
    );
}