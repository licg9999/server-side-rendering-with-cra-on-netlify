import { FC } from 'react';
import { Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/Home/Page';
import { NotFoundPage } from './pages/NotFound/Page';

export const App: FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
