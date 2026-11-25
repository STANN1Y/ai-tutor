import { Link } from 'react-router-dom';
import type { Section } from '../../lib/types';
import styles from './contents.module.css';

interface TabStripProps {
  courseId: string;
  sections: Section[];
  activeSectionId?: string;
}

export function TabStrip({ courseId, sections, activeSectionId }: TabStripProps) {
  return (
    <nav className={styles.tabStrip} aria-label="Sections">
      {sections.map((section, index) => {
        const isActive = section.id === activeSectionId;
        const isComplete = section.state === 'complete';
        return (
          <Link
            key={section.id}
            to={`/c/${courseId}/s/${section.id}`}
            className={[
              styles.tab,
              isActive ? styles.tabActive : '',
              isComplete ? styles.tabComplete : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-current={isActive ? 'page' : undefined}
            aria-label={`Section ${index + 1}: ${section.title}${isComplete ? ', complete' : ''}`}
            title={`${index + 1}. ${section.title}`}
          >
            {index + 1}
          </Link>
        );
      })}
    </nav>
  );
}