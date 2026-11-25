import { Link } from 'react-router-dom';
import type { Cover, Course } from '../../lib/types';
import styles from './shelf.module.css';

const coverColors: Record<Cover, string> = {
  cobalt: 'var(--cover-cobalt)',
  oxblood: 'var(--cover-oxblood)',
  forest: 'var(--cover-forest)',
  ochre: 'var(--cover-ochre)',
};

const coverText: Record<Cover, string> = {
  cobalt: 'var(--page)',
  oxblood: 'var(--page)',
  forest: 'var(--page)',
  ochre: 'var(--ink)',
};

interface BinderCoverProps {
  course: Course;
}

export function BinderCover({ course }: BinderCoverProps) {
  const completed = course.sections.filter(s => s.state === 'complete').length;
  const total = course.sections.length;
  const marks = course.sections.slice(0, 6);

  return (
    <Link
      to={`/c/${course.id}`}
      className={styles.cover}
      style={
        {
          '--cover': coverColors[course.cover],
          '--coverText': coverText[course.cover],
        } as React.CSSProperties
      }
      aria-label={`${course.code}: ${course.title}, ${completed} of ${total} sections complete`}
    >
      <span className={styles.spine} aria-hidden="true" />
      <span className={styles.foreEdge} aria-hidden="true" />
      <div className={styles.labelWindow}>
        <span className={styles.code}>{course.code}</span>
        <span className={styles.title}>{course.title}</span>
        {course.term && <span className={styles.term}>{course.term}</span>}
      </div>
      <div className={styles.coverFoot}>
        <span className={styles.progressText}>
          {completed} of {total} complete
        </span>
        <div className={styles.marks} aria-hidden="true">
          {marks.map(section => (
            <span
              key={section.id}
              className={`${styles.mark} ${section.state === 'complete' ? styles.markComplete : ''}`}
            />
          ))}
        </div>
      </div>
      <div className={styles.coverBottom} aria-hidden="true" />
    </Link>
  );
}