import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TabStrip } from './TabStrip';
import { fixtureCourses } from '../../mocks/fixtures';

describe('TabStrip', () => {
  it('renders one tab per section and marks the active one', () => {
    render(
      <MemoryRouter>
        <TabStrip courseId="psy101" sections={fixtureCourses[0].sections} activeSectionId="sec-4" />
      </MemoryRouter>
    );

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(6);
    expect(screen.getByRole('link', { name: /Section 4: Memory/ })).toHaveAttribute('aria-current', 'page');
  });

  it('links each tab to its section', () => {
    render(
      <MemoryRouter>
        <TabStrip courseId="psy101" sections={fixtureCourses[0].sections} activeSectionId="sec-4" />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /Section 1: Foundations/ })).toHaveAttribute(
      'href',
      '/c/psy101/s/sec-1'
    );
  });
});