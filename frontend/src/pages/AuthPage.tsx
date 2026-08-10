import type {FormEvent, ReactNode} from 'react';
import {useState} from 'react';
import axios from 'axios';
import {useLocation, useNavigate} from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import type {User} from '../contexts/AuthContext';
import {useAuth} from '../contexts/AuthContext';

type AuthMode = 'login' | 'register';

interface AuthFormData {
    displayName: string;
    email: string;
    password: string;
    confirmPassword: string;
}

const initialForm: AuthFormData = {
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
};

const getErrorMessage = (error: unknown) => {
    if (axios.isAxiosError<{ message?: string }>(error)) {
        return error.response?.data?.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại.';
    }

    return 'Đã có lỗi xảy ra. Vui lòng thử lại.';
};

const MusicNote = ({className = ''}: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M9 18V5.8L19 4v11.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              strokeLinejoin="round"/>
        <circle cx="6" cy="18" r="3" fill="currentColor"/>
        <circle cx="16" cy="15.5" r="3" fill="currentColor"/>
    </svg>
);

const FieldIcon = ({children}: { children: ReactNode }) => (
    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500">
        {children}
    </span>
);

export default function AuthPage() {
    const {user, isAuthenticated, isLoading, login, logout} = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mode, setMode] = useState<AuthMode>('login');
    const [form, setForm] = useState<AuthFormData>(initialForm);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const switchMode = (nextMode: AuthMode) => {
        setMode(nextMode);
        setError('');
        setMessage('');
        setShowPassword(false);
        setForm((current) => ({...current, password: '', confirmPassword: ''}));
    };

    const updateField = (field: keyof AuthFormData, value: string) => {
        setForm((current) => ({...current, [field]: value}));
        if (error) setError('');
    };

    const validate = () => {
        if (mode === 'register' && !form.displayName.trim()) {
            return 'Vui lòng nhập tên hiển thị.';
        }
        if (form.password.length < 6) {
            return 'Mật khẩu phải có ít nhất 6 ký tự.';
        }
        if (mode === 'register' && form.password !== form.confirmPassword) {
            return 'Mật khẩu xác nhận chưa khớp.';
        }
        return '';
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSubmitting(true);
        setError('');
        setMessage('');

        try {
            if (mode === 'register') {
                await axiosClient.post('/auth/register', {
                    display_name: form.displayName.trim(),
                    email: form.email.trim(),
                    password: form.password,
                });

                setMode('login');
                setForm((current) => ({
                    ...current,
                    displayName: '',
                    password: '',
                    confirmPassword: '',
                }));
                setMessage('Tạo tài khoản thành công. Bạn có thể đăng nhập ngay.');
                return;
            }

            const response = await axiosClient.post<{ user: User; token: string }>('/auth/login', {
                email: form.email.trim(),
                password: form.password,
            });

            login(response.data.user, response.data.token);

            const previousLocation = (location.state as {
                from?: {pathname?: string; search?: string; hash?: string};
            } | null)?.from;
            const destination = previousLocation?.pathname
                ? `${previousLocation.pathname}${previousLocation.search ?? ''}${previousLocation.hash ?? ''}`
                : '/';

            navigate(destination, {replace: true});
        } catch (requestError) {
            setError(getErrorMessage(requestError));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#090a0c] text-white">
                <div className="flex flex-col items-center gap-4">
                    <span className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-[#b7f34a]"/>
                    <p className="text-sm text-zinc-400">Đang kiểm tra phiên đăng nhập...</p>
                </div>
            </main>
        );
    }

    if (isAuthenticated && user) {
        return (
            <main
                className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090a0c] px-6 text-white">
                <div className="auth-glow auth-glow-left"/>
                <section
                    className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.055] p-8 text-center shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-10">
                    <div
                        className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#b7f34a] text-zinc-950 shadow-lg shadow-lime-500/20">
                        <MusicNote className="h-8 w-8"/>
                    </div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#b7f34a]">Đã kết nối</p>
                    <h1 className="text-3xl font-semibold tracking-tight">Chào, {user.display_name}</h1>
                    <p className="mt-3 text-sm leading-6 text-zinc-400">Phiên đăng nhập của bạn đang hoạt động. Âm nhạc
                        đã sẵn sàng.</p>
                    <button
                        type="button"
                        onClick={() => void logout()}
                        className="mt-8 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
                    >
                        Đăng xuất
                    </button>
                </section>
            </main>
        );
    }

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#090a0c] text-white">
            <div className="auth-grid absolute inset-0 opacity-30"/>
            <div className="auth-glow auth-glow-left"/>
            <div className="auth-glow auth-glow-right"/>

            <div className="relative mx-auto grid min-h-screen w-full max-w-[1440px] lg:grid-cols-[1.05fr_0.95fr]">
                <section className="hidden flex-col justify-between p-12 lg:flex xl:p-16">
                    <div className="flex items-center gap-3">
                        <span
                            className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#b7f34a] text-zinc-950">
                            <MusicNote className="h-6 w-6"/>
                        </span>
                        <span className="text-lg font-semibold tracking-tight">sonora</span>
                    </div>

                    <div className="max-w-xl pb-8">
                        <div className="mb-8 flex h-20 items-end gap-2" aria-hidden="true">
                            {[34, 58, 42, 76, 52, 68, 88, 44, 62, 36, 72, 50, 82, 40].map((height, index) => (
                                <span
                                    key={`${height}-${index}`}
                                    className="wave-bar w-2 rounded-full bg-[#b7f34a]"
                                    style={{height: `${height}%`, animationDelay: `${index * 90}ms`}}
                                />
                            ))}
                        </div>
                        <p className="mb-5 text-sm font-medium uppercase tracking-[0.24em] text-[#b7f34a]">Nghe theo
                            cách của bạn</p>
                        <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-0.04em] xl:text-6xl">
                            Mọi giai điệu.<br/>
                            <span className="text-zinc-500">Một không gian.</span>
                        </h1>
                        <p className="mt-6 max-w-md text-base leading-7 text-zinc-400">
                            Khám phá nghệ sĩ mới, lưu những bài hát yêu thích và tạo playlist cho từng khoảnh khắc.
                        </p>
                    </div>

                    <p className="text-xs text-zinc-600">© 2026 Sonora Music. Feel every frequency.</p>
                </section>

                <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-12">
                    <div className="w-full max-w-[460px]">
                        <div className="mb-10 flex items-center gap-3 lg:hidden">
                            <span
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b7f34a] text-zinc-950">
                                <MusicNote className="h-5 w-5"/>
                            </span>
                            <span className="font-semibold">sonora</span>
                        </div>

                        <div
                            className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-9">
                            <div className="mb-8">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#b7f34a]">
                                    {mode === 'login' ? 'Mừng bạn trở lại' : 'Bắt đầu miễn phí'}
                                </p>
                                <h2 className="text-3xl font-semibold tracking-[-0.03em]">
                                    {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                                </h2>
                                <p className="mt-2 text-sm text-zinc-400">
                                    {mode === 'login'
                                        ? 'Tiếp tục hành trình âm nhạc của bạn.'
                                        : 'Tham gia và lưu giữ mọi giai điệu bạn yêu.'}
                                </p>
                            </div>

                            <div className="mb-7 grid grid-cols-2 rounded-xl bg-black/30 p-1" role="tablist"
                                 aria-label="Chọn loại biểu mẫu">
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={mode === 'login'}
                                    onClick={() => switchMode('login')}
                                    className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${mode === 'login' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    Đăng nhập
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={mode === 'register'}
                                    onClick={() => switchMode('register')}
                                    className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${mode === 'register' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    Đăng ký
                                </button>
                            </div>

                            <form className="space-y-4" onSubmit={handleSubmit}>
                                {mode === 'register' && (
                                    <label className="block">
                                        <span
                                            className="mb-2 block text-sm font-medium text-zinc-300">Tên hiển thị</span>
                                        <span className="relative block">
                                            <FieldIcon>
                                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"
                                                     stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                                    <circle cx="12" cy="8" r="4"/><path
                                                    d="M4.5 20c.7-4 3.2-6 7.5-6s6.8 2 7.5 6"/>
                                                </svg>
                                            </FieldIcon>
                                            <input
                                                value={form.displayName}
                                                onChange={(event) => updateField('displayName', event.target.value)}
                                                required
                                                maxLength={100}
                                                autoComplete="name"
                                                placeholder="Tên của bạn"
                                                className="auth-input"
                                            />
                                        </span>
                                    </label>
                                )}

                                <label className="block">
                                    <span className="mb-2 block text-sm font-medium text-zinc-300">Email</span>
                                    <span className="relative block">
                                        <FieldIcon>
                                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"
                                                 stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                                <rect x="3" y="5" width="18" height="14" rx="3"/><path
                                                d="m5 8 7 5 7-5"/>
                                            </svg>
                                        </FieldIcon>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(event) => updateField('email', event.target.value)}
                                            required
                                            autoComplete="email"
                                            placeholder="ban@email.com"
                                            className="auth-input"
                                        />
                                    </span>
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-medium text-zinc-300">Mật khẩu</span>
                                    <span className="relative block">
                                        <FieldIcon>
                                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"
                                                 stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                                <rect x="4" y="10" width="16" height="11" rx="3"/><path
                                                d="M8 10V7a4 4 0 0 1 8 0v3"/>
                                            </svg>
                                        </FieldIcon>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={form.password}
                                            onChange={(event) => updateField('password', event.target.value)}
                                            required
                                            minLength={6}
                                            maxLength={100}
                                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                            placeholder="Tối thiểu 6 ký tự"
                                            className="auth-input pr-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((visible) => !visible)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-500 transition hover:text-zinc-200"
                                            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                        >
                                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"
                                                 stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                                <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle
                                                cx="12" cy="12" r="2.5"/>
                                            </svg>
                                        </button>
                                    </span>
                                </label>

                                {mode === 'register' && (
                                    <label className="block">
                                        <span
                                            className="mb-2 block text-sm font-medium text-zinc-300">Xác nhận mật khẩu</span>
                                        <span className="relative block">
                                            <FieldIcon>
                                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"
                                                     stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                                    <rect x="4" y="10" width="16" height="11" rx="3"/><path
                                                    d="M8 10V7a4 4 0 0 1 8 0v3"/>
                                                </svg>
                                            </FieldIcon>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={form.confirmPassword}
                                                onChange={(event) => updateField('confirmPassword', event.target.value)}
                                                required
                                                autoComplete="new-password"
                                                placeholder="Nhập lại mật khẩu"
                                                className="auth-input"
                                            />
                                        </span>
                                    </label>
                                )}

                                {error && (
                                    <div role="alert"
                                         className="rounded-xl border border-red-400/15 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                                        {error}
                                    </div>
                                )}
                                {message && (
                                    <div role="status"
                                         className="rounded-xl border border-lime-300/15 bg-lime-300/10 px-4 py-3 text-sm text-lime-100">
                                        {message}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#b7f34a] px-5 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-lime-500/10 transition hover:bg-[#c5ff59] focus:outline-none focus:ring-2 focus:ring-[#b7f34a]/50 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSubmitting && <span
                                      className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950"/>}
                                    {isSubmitting
                                        ? (mode === 'login' ? 'Đang đăng nhập...' : 'Đang tạo tài khoản...')
                                        : (mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản')}
                                </button>
                            </form>

                            <p className="mt-6 text-center text-sm text-zinc-500">
                                {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
                                <button
                                    type="button"
                                    onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                                    className="font-semibold text-[#b7f34a] transition hover:text-[#d0ff77]"
                                >
                                    {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
                                </button>
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
