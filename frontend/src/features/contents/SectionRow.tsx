import { Link } from 'react-router-dom';
import type { Section } from '../../lib/types';
import styles from './contents.module.css';

interface SectionRowProps {
  courseId: string;
  section: Section;
  index: number;
  isNextUp: boolean;
}

export function SectionRow({ courseId, section, index, isNextUp }: SectionRowProps) {
  const isComplete = section.state === 'complete';

  return (
    <Link
      to={`/c/${courseId}/s/${section.id}`}
      className={[
        styles.row,
        isComplete ? styles.rowComplete : '',
        isNextUp ? styles.rowNext : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={`Section ${index + 1}: ${section.title}${isComplete ? ', complete' : isNextUp ? ', recommended next' : ''}`}
    >
      <span className={styles.number}>{index + 1}</span>
      <span className={styles.rowMain}>
        <span className={styles.rowTitle}>{section.title}</span>
        {isComplete && <span className={styles.completeLabel}>Complete</span>}
        {!isComplete && isNextUp && <span className={styles.nextLabel}>Next up</span>}
      </span>
      {isComplete ? (
        <svg className={styles.check} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <span aria-hidden="true" />
      )}
    </Link>
  );
}