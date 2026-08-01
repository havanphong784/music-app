import AuthLayout from "../layouts/AuthLayout.tsx";
import LoginPage from "../pages/auth/LoginPage.tsx";
import RegisterPage from "../pages/auth/RegisterPage.tsx";
import AppLayout from "@/layouts/AppLayout.tsx";

export const routes = [
    {
        path: "/",
        element: <AppLayout/>
    },
    {
        path: "/auth",
        element: <AuthLayout/>,
        children: [
            {
                path: "login",
                element: <LoginPage/>
            },
            {
                path: "register",
                element: <RegisterPage/>
            }
        ]
    }
]