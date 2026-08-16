import {Navigate, Route, Routes} from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import {AppLayout} from './components/layouts/AppLayout';
import {HomePage} from './pages/HomePage';

function App() {
    return (
        <Routes>
            <Route element={<AppLayout/>}>
                <Route path="/" element={<HomePage/>}/>
                <Route path="/search" element={<div>Search Page</div>}/>
                <Route path="/library" element={<div>Library Page</div>}/>
            </Route>
            <Route path="/auth" element={<AuthPage/>}/>
            <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
    );
}

export default App;