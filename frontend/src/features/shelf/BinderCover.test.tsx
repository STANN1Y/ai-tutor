import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BinderCover } from './BinderCover';
import { fixtureCourses } from '../../mocks/fixtures';

describe('BinderCover', () => {
  it('renders the course label and progress', () => {
    render(
      <MemoryRouter>
        <BinderCover course={fixtureCourses[0]} />
      </MemoryRouter>
    );

    expect(screen.getByText('PSY 101')).toBeInTheDocument();
    expect(screen.getByText('Introduction to Psychology')).toBeInTheDocument();
    expect(screen.getByText('2 of 6 complete')).toBeInTheDocument();
  });

  it('links to the course and describes its progress', () => {
    render(
      <MemoryRouter>
        <BinderCover course={fixtureCourses[0]} />
      </MemoryRouter>
    );

    const link = screen.getByRole('link', {
      name: 'PSY 101: Introduction to Psychology, 2 of 6 sections complete',
    });
    expect(link).toHaveAttribute('href', '/c/psy101');
  });
});