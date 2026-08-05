import nodemailer from "nodemailer";

const requiredEnv = (name: string): string => {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`Thiếu biến môi trường ${name}`);
    }
    return value;
};

let transporter: ReturnType<typeof nodemailer.createTransport> | undefined;

const getTransporter = () => {
    if (transporter) return transporter;

    const port = Number(requiredEnv("SMTP_PORT"));
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("SMTP_PORT không hợp lệ");
    }

    transporter = nodemailer.createTransport({
        host: requiredEnv("SMTP_HOST"),
        port,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: requiredEnv("SMTP_USER"),
            pass: requiredEnv("SMTP_PASS")
        }
    });
    return transporter;
};

export const createPasswordResetUrl = (token: string): string => {
    const url = new URL("/reset-password", requiredEnv("FRONTEND_URL"));
    url.searchParams.set("token", token);
    return url.toString();
};

export const sendPasswordResetEmail = async (to: string, token: string): Promise<void> => {
    const resetUrl = createPasswordResetUrl(token);
    await getTransporter().sendMail({
        from: requiredEnv("SMTP_FROM"),
        to,
        subject: "Đặt lại mật khẩu Music App",
        text: `Bạn đã yêu cầu đặt lại mật khẩu. Mở liên kết sau trong vòng 15 phút: ${resetUrl}\n\nNếu không yêu cầu, bạn có thể bỏ qua email này.`,
        html: `<p>Bạn đã yêu cầu đặt lại mật khẩu.</p><p><a href="${resetUrl}">Đặt lại mật khẩu</a></p><p>Liên kết hết hạn sau 15 phút. Nếu không yêu cầu, bạn có thể bỏ qua email này.</p>`
    });
};
