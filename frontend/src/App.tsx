import {Navigate, Route, Routes} from 'react-router-dom';
import AuthPage from './pages/AuthPage';

function App() {
    return (
        <Routes>
            <Route path="/" element={<div>Home Page</div>}/>
            <Route path="/auth" element={<AuthPage/>}/>
            <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
    );
}

export default App;
