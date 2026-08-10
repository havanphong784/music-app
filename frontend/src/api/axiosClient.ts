import axios from 'axios';
import {getAccessToken, setAccessToken} from '../auth/accessToken';

export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';

let refreshPromise: Promise<string> | null = null;

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

axiosClient.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const refreshAccessToken = () => {
    if (!refreshPromise) {
        refreshPromise = axios.post(
            `${axiosClient.defaults.baseURL}/auth/refresh`,
            {},
            {withCredentials: true}
        ).then((response) => {
            const token = response.data.token;
            if (typeof token !== 'string' || !token) {
                throw new Error('Refresh response does not contain an access token');
            }

            setAccessToken(token);
            return token;
        }).finally(() => {
            refreshPromise = null;
        });
    }

    return refreshPromise;
};

axiosClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const newAccessToken = await refreshAccessToken();
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                return axiosClient(originalRequest);
            } catch (refreshError) {
                setAccessToken(null);
                window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosClient;
