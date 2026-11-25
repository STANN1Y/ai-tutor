import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { BinderCover } from './BinderCover';
import { CourseForm } from './CourseForm';
import styles from './shelf.module.css';

function AddBinder({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={styles.addBinder} onClick={onClick} aria-label="Add a new course">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
      <span className={styles.addLabel}>Add a course</span>
    </button>
  );
}

export function ShelfPage() {
  useDocumentTitle('Margin — Courses');
  const [showForm, setShowForm] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: api.courses.list,
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (showForm && !dialog.open) dialog.showModal();
    if (!showForm && dialog.open) dialog.close();
  }, [showForm]);

  return (
    <div className={styles.page}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className={styles.header}>
        <Link to="/" className={styles.wordmark}>
          Margin
        </Link>
        <span className={styles.shelfCaption}>
          {courses.length === 0 ? 'No binders yet' : `${courses.length} ${courses.length === 1 ? 'binder' : 'binders'}`}
        </span>
      </header>

      <main id="main" tabIndex={-1} className={styles.main}>
        <div className={styles.shelfHead}>
          <h1 className={styles.shelfTitle}>Courses</h1>
          <span className={styles.shelfCaption}>One binder per course</span>
        </div>

        {isLoading ? (
          <p className={styles.shelfCaption}>Loading…</p>
        ) : courses.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>No courses on the shelf. Add the first one.</p>
            <div style={{ width: 200 }}>
              <AddBinder onClick={() => setShowForm(true)} />
            </div>
          </div>
        ) : (
          <div className={styles.grid}>
            {courses.map(course => (
              <BinderCover key={course.id} course={course} />
            ))}
            <AddBinder onClick={() => setShowForm(true)} />
          </div>
        )}
      </main>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        onClose={() => setShowForm(false)}
        onClick={event => {
          if (event.target === dialogRef.current) setShowForm(false);
        }}
        aria-labelledby="course-form-title"
      >
        <CourseForm onClose={() => setShowForm(false)} />
      </dialog>
    </div>
  );
}