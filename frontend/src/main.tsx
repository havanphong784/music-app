import {createRoot} from 'react-dom/client'
import App from './App.tsx'
import {BrowserRouter} from 'react-router-dom'
import {AuthProvider} from './contexts/AuthContext.tsx'
import './styles/index.css'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {ReactQueryDevtools} from "@tanstack/react-query-devtools"

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60,      // 1 phút: data "tươi", không refetch khi focus
            gcTime: 1000 * 60 * 10,    // 10 phút: cache giữ rồi mới xóa (trước là cacheTime)
            retry: 1,                 // retry 1 lần khi lỗi
            refetchOnWindowFocus: false, // nhạc app, không cần refetch focus
        },
    },
});


createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <App/>
            </AuthProvider>
            <ReactQueryDevtools initialIsOpen={false}/>
        </QueryClientProvider>
    </BrowserRouter>
)
