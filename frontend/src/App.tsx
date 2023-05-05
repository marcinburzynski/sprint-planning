import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';

import { Notifications } from './components/Notifications';
import {
    JoinPage,
    CreateSessionPage,
    EstimationPage,
    OAuth,
} from './pages';

import { store } from './store';

export const App = () => {

    return (
        <Provider store={store}>
            <Notifications />

            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<CreateSessionPage />} />
                    <Route path="/join/:sessionId" element={<JoinPage />} />
                    <Route path="/session/:sessionId" element={<EstimationPage />} />
                    <Route path="/oauth" element={<OAuth />} />
                </Routes>
            </BrowserRouter>
        </Provider>
    );
}
