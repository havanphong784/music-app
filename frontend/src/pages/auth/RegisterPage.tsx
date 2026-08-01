import * as React from "react";
import {useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {register as registerApi} from "@/services/auth";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {AlertCircle, CheckCircle2, Eye, EyeOff, Lock, Mail, User} from "lucide-react";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");

        if (!name.trim()) {
            setError("Vui lòng nhập họ và tên.");
            return;
        }

        if (!email.trim()) {
            setError("Vui lòng nhập địa chỉ email.");
            return;
        }

        if (password.length < 8 || password.length > 128) {
            setError("Mật khẩu phải từ 8 đến 128 ký tự.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Mật khẩu xác nhận không trùng khớp.");
            return;
        }

        try {
            setLoading(true);
            const res = await registerApi(name.trim(), email.trim(), password);
            setSuccessMessage(res.message || "Tạo tài khoản thành công!");
            setTimeout(() => {
                navigate("/auth/login");
            }, 1500);
        } catch (e: unknown) {
            setError("Đăng ký thất bại. Vui lòng thử lại.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden transition-colors duration-300">
            <CardHeader className="space-y-1 text-center pb-4">
                <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Tạo tài khoản mới
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                    Nhập thông tin cá nhân của bạn để bắt đầu trải nghiệm âm nhạc
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {error && (
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive text-sm font-medium animate-shake">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {successMessage && (
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{successMessage} Đang chuyển sang trang đăng nhập...</span>
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    {/* Họ và tên */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-slate-700 dark:text-slate-200 text-xs font-semibold uppercase tracking-wider">
                            Họ và tên
                        </Label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                id="name"
                                type="text"
                                aria-label="Họ và tên"
                                placeholder="Nguyễn Văn A"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="pl-10 bg-slate-100/80 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 focus:border-purple-500 focus:ring-purple-500/20 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 h-10 rounded-2xl transition-colors"
                                required
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-700 dark:text-slate-200 text-xs font-semibold uppercase tracking-wider">
                            Email
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                id="email"
                                type="email"
                                aria-label="Email"
                                placeholder="example@gmail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10 bg-slate-100/80 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 focus:border-purple-500 focus:ring-purple-500/20 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 h-10 rounded-2xl transition-colors"
                                required
                            />
                        </div>
                    </div>

                    {/* Mật khẩu */}
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-slate-700 dark:text-slate-200 text-xs font-semibold uppercase tracking-wider">
                            Mật khẩu
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                aria-label="Mật khẩu"
                                placeholder="Ít nhất 8 ký tự"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 pr-10 bg-slate-100/80 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 focus:border-purple-500 focus:ring-purple-500/20 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 h-10 rounded-2xl transition-colors"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Nhập lại mật khẩu */}
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-slate-200 text-xs font-semibold uppercase tracking-wider">
                            Xác nhận mật khẩu
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                aria-label="Xác nhận mật khẩu"
                                placeholder="Nhập lại mật khẩu của bạn"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="pl-10 pr-10 bg-slate-100/80 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 focus:border-purple-500 focus:ring-purple-500/20 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 h-10 rounded-2xl transition-colors"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                tabIndex={-1}
                            >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        loading={loading}
                        className="w-full h-11 mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-purple-600/25 transition-all duration-200"
                    >
                        Đăng Ký
                    </Button>
                </form>
            </CardContent>

            <CardFooter className="flex justify-center border-t border-slate-200/60 dark:border-slate-800/60 pt-4 pb-6">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Đã có tài khoản?{" "}
                    <Link
                        to="/auth/login"
                        className="font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 underline underline-offset-4 transition-colors"
                    >
                        Đăng nhập ngay
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
