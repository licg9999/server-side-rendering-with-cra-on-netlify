import { render, screen } from '@testing-library/react';
import { StaticRouter } from 'react-router-dom/server';
import { App } from './App';

jest.mock('./pages/Home/Page', () => ({
  HomePage: () => 'Home Page',
}));
jest.mock('./pages/NotFound/Page', () => ({
  NotFoundPage: () => 'Not Found Page',
}));

test('renders page by route', () => {
  render(
    <StaticRouter location="/">
      <App />
    </StaticRouter>
  );
  expect(screen.getByText(/Home Page/i)).toBeInTheDocument();

  render(
    <StaticRouter location="/somewhere-else">
      <App />
    </StaticRouter>
  );
  expect(screen.getByText(/Not Found Page/i)).toBeInTheDocument();
});
