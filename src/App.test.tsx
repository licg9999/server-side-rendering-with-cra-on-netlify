import { render, screen } from '@testing-library/react';
import { StaticRouter } from 'react-router-dom/server';
import { App } from './App';

jest.mock('./pages/Home/Page', () => ({
  HomePage: () => 'Home Page',
}));

jest.mock('./pages/NotFound/Page', () => ({
  NotFoundPage: () => 'Not Found Page',
}));

for (const [path, page] of Object.entries({
  '/': 'Home Page',
  '/somewhere-else': 'Not Found Page',
})) {
  test(`renders "${page}" if "${path}" is visited`, () => {
    render(
      <StaticRouter location={path}>
        <App />
      </StaticRouter>
    );
    expect(screen.getByText(page)).toBeInTheDocument();
  });
}
