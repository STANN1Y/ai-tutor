import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { TabStrip } from './TabStrip';
import { SectionRow } from './SectionRow';
import { DailyCardBlock } from './DailyCard';
import { Button } from '../../ui';
import styles from './contents.module.css';

export function ContentsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => api.courses.get(id!),
    enabled: !!id,
  });

  useDocumentTitle(course ? `${course.code} — Margin` : 'Margin');

  const { data: dailyCard = null } = useQuery({
    queryKey: ['dailyCard', id],
    queryFn: () => api.dailyCard.getToday(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <p className={styles.loading}>Loading…</p>;
  }

  if (!course) {
    return <p className={styles.missing}>Course not found.</p>;
  }

  const sections = [...course.sections].sort((a, b) => a.order - b.order);
  const completed = sections.filter(section => section.state === 'complete').length;
  const nextUp =
    sections.find(section => section.state === 'in-progress') ??
    sections.find(section => section.state === 'not-started');
  const target = nextUp ?? sections[0];
  const allComplete = completed === sections.length && sections.length > 0;

  return (
    <div className={styles.page}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className={styles.header}>
        <Link to="/" className={styles.back}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {course.code}
        </Link>
        <div className={styles.headerRight}>
          <Link to={`/c/${course.id}/sources`} className={styles.sourcesLink}>
            Sources
          </Link>
          <span className={styles.headerMeta}>
            {sections.length > 0 ? `${completed} of ${sections.length} complete` : 'No sections yet'}
          </span>
        </div>
      </header>

      <div className={styles.layout}>
        <main id="main" tabIndex={-1} className={styles.content}>
          <h1 className={styles.title}>{course.title}</h1>
          <p className={styles.intro}>
            Work the sections in order, or jump to any reading. Filled tabs are complete.
          </p>

          {sections.length > 0 ? (
            <>
              <nav className={styles.toc} aria-label="Table of contents">
                {sections.map((section, index) => (
                  <SectionRow
                    key={section.id}
                    courseId={course.id}
                    section={section}
                    index={index}
                    isNextUp={!allComplete && section.id === nextUp?.id}
                  />
                ))}
              </nav>

              <section className={styles.progressBlock} aria-labelledby="progress-title">
                <div className={styles.progressHead}>
                  <h2 className={styles.progressTitle} id="progress-title">
                    Progress
                  </h2>
                  <span className={styles.progressMeta}>
                    {completed} of {sections.length} complete
                  </span>
                </div>
                <Button
                  className={styles.progressButton}
                  onClick={() => target && navigate(`/c/${course.id}/s/${target.id}`)}
                  disabled={!target}
                >
                  {allComplete
                    ? 'Review from the start'
                    : nextUp
                      ? `Continue at ${nextUp.title}`
                      : 'Open the course'}
                </Button>
              </section>

              <DailyCardBlock courseId={course.id} card={dailyCard} />
            </>
          ) : (
            <section className={styles.emptyToc} aria-labelledby="empty-toc-title">
              <h2 className={styles.emptyTocTitle} id="empty-toc-title">
                No sections yet
              </h2>
              <p className={styles.emptyTocText}>
                Add the readings for this course. The tutor will use them to build the contents and
                cite them in your margins.
              </p>
              <Button onClick={() => navigate(`/c/${course.id}/sources`)}>Add readings</Button>
            </section>
          )}
        </main>

        {sections.length > 0 && (
          <TabStrip courseId={course.id} sections={sections} activeSectionId={target?.id} />
        )}
      </div>
    </div>
  );
}