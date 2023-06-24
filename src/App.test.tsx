import { render, screen } from '@testing-library/react';
import React from 'react'; // Import the React module
import App from './App';

test('renders learn react link', () => {
    render(<App />);
    const linkElement = screen.getByText(/learn react/i);
    expect(linkElement).toBeInTheDocument();
});
