import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Textarea, Button, Status } from '../../ui';
import type { Citation, StreamEvent, Turn } from '../../lib/types';
import styles from './worksheet.module.css';

export function WorksheetPage() {
  const { id: courseId, sectionId } = useParams<{ id: string; sectionId: string }>();
  const queryClient = useQueryClient();

  const [answer, setAnswer] = useState('');
  const [liveTurn, setLiveTurn] = useState<Turn | null>(null);
  const [phase, setPhase] = useState<'reading' | 'marking' | 'idle'>('idle');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealedTurnId, setRevealedTurnId] = useState<string | null>(null);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const [completedHere, setCompletedHere] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const controllerRef = useRef<AbortController | null>(null);

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => api.courses.get(courseId!),
    enabled: !!courseId,
  });

  const { data: section, isLoading } = useQuery({
    queryKey: ['section', courseId, sectionId],
    queryFn: () => api.sections.get(courseId!, sectionId!),
    enabled: !!courseId && !!sectionId,
  });

  useDocumentTitle(
    course && section ? `Section ${section.order}: ${section.title} — ${course.code} — Margin` : 'Margin'
  );

  const { data: serverTurns = [] } = useQuery({
    queryKey: ['turns', sectionId],
    queryFn: () => api.turns.list(sectionId!),
    enabled: !!sectionId,
  });

  useEffect(() => () => controllerRef.current?.abort(), []);

  const turns = useMemo(() => {
    if (liveTurn && !serverTurns.some(turn => turn.id === liveTurn.id)) {
      return [...serverTurns, liveTurn];
    }
    return serverTurns;
  }, [serverTurns, liveTurn]);

  const { citationIndex, allCitations } = useMemo(() => {
    const index = new Map<string, number>();
    const list: Citation[] = [];
    for (const turn of turns) {
      for (const citation of turn.citations) {
        if (!index.has(citation.id)) {
          index.set(citation.id, list.length + 1);
          list.push(citation);
        }
      }
    }
    return { citationIndex: index, allCitations: list };
  }, [turns]);

  const lastTurn = turns[turns.length - 1];
  const isComplete = completedHere || section?.state === 'complete';
  const canReveal =
    !busy &&
    !!lastTurn &&
    turns.length >= 2 &&
    !!lastTurn.explanation &&
    revealedTurnId !== lastTurn.id;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const text = answer.trim();
    if (!text || busy || !sectionId) return;

    setBusy(true);
    setError(null);
    setAnswer('');

    let created: Turn;
    try {
      created = await api.turns.create(sectionId, text);
    } catch {
      setError('That didn’t go through. Your answer is still in the box. Try again.');
      setAnswer(text);
      setBusy(false);
      return;
    }

    const working: Turn = { ...created, citations: [] };
    setLiveTurn(working);
    setPhase('reading');

    const controller = new AbortController();
    controllerRef.current = controller;

    let note = '';
    let explanation = '';
    let citations: Citation[] = [];

    try {
      for await (const event of api.turns.stream(sectionId, created.id, controller.signal)) {
        handleStreamEvent(event);
      }

      const finalTurn: Turn = {
        ...working,
        note,
        explanation,
        citations,
        outcome: 'partial',
      };

      setLiveTurn(null);
      queryClient.setQueryData<Turn[]>(['turns', sectionId], old => {
        const rest = (old ?? []).filter(turn => turn.id !== finalTurn.id);
        return [...rest, finalTurn];
      });
      setAnnouncement('Tutor note ready.');
      queryClient.invalidateQueries({ queryKey: ['section', courseId, sectionId] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError('The connection dropped. Your answer is saved. Try again.');
      setAnswer(text);
    } finally {
      setPhase('idle');
      setBusy(false);
      controllerRef.current = null;
    }

    function handleStreamEvent(event: StreamEvent) {
      switch (event.type) {
        case 'status':
          setPhase(event.phase);
          break;
        case 'note':
          note = event.text;
          setLiveTurn(prev => (prev ? { ...prev, note } : prev));
          break;
        case 'explanation':
          explanation = event.text;
          setLiveTurn(prev => (prev ? { ...prev, explanation } : prev));
          break;
        case 'citations':
          citations = event.items;
          setLiveTurn(prev => (prev ? { ...prev, citations } : prev));
          break;
        case 'section':
          if (event.state === 'complete') setCompletedHere(true);
          break;
        case 'error':
          setError(event.message);
          break;
        case 'done':
          break;
      }
    }
  };

  if (isLoading) {
    return <p className={styles.loading}>Loading…</p>;
  }

  if (!section) {
    return <p className={styles.missing}>Section not found.</p>;
  }

  const orderedSections = [...(course?.sections ?? [])].sort((a, b) => a.order - b.order);
  const nextSection = orderedSections.find(candidate => candidate.order > section.order);

  return (
    <div className={styles.page}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className={styles.header}>
        <Link to={`/c/${courseId}`} className={styles.crumbs}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className={styles.crumbCode}>{course?.code}</span>
          <span className={styles.crumbSection}>
            Section {section.order}: {section.title}
          </span>
        </Link>
        <Link to={`/c/${courseId}/sources`} className={styles.sourcesLink}>
          Sources
        </Link>
      </header>

      <main id="main" tabIndex={-1} className={styles.body}>
        <h1 className="sr-only">
          Section {section.order}: {section.title}
        </h1>

        <section className={styles.promptBlock} aria-labelledby="prompt-text">
          <p className={styles.promptText} id="prompt-text">
            {section.prompt ?? 'Explain the key concepts from this section. The tutor will ask follow-up questions and cite your readings.'}
          </p>
          <p className={styles.promptHint}>
            Answer in your own words. The tutor will ask before it tells, and cite the reading when it does.
          </p>
        </section>

        {turns.map((turn, index) => (
          <TurnRow
            key={turn.id}
            turn={turn}
            index={index + 1}
            citationIndex={citationIndex}
            onCitation={setActiveCitation}
            workedVisible={revealedTurnId === turn.id}
            isLive={busy && turn.id === liveTurn?.id}
            phase={busy && turn.id === liveTurn?.id ? phase : 'idle'}
          />
        ))}

        <div className={styles.formRow}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <Textarea
              label="Your answer"
              placeholder="Write your answer…"
              value={answer}
              onChange={event => setAnswer(event.target.value)}
              rows={4}
              disabled={busy}
            />
            <div className={styles.formActions}>
              <Button type="submit" loading={busy} disabled={!answer.trim()}>
                Check my answer
              </Button>
              {canReveal && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => lastTurn && setRevealedTurnId(lastTurn.id)}
                >
                  Show worked answer
                </Button>
              )}
            </div>
            <p className={styles.formHint}>
              {isComplete
                ? 'Section complete. Keep practising if you like.'
                : 'The tutor asks before it tells. After two attempts, the worked answer unlocks.'}
            </p>
            {error && (
              <p className={styles.formError} role="alert">
                {error}
              </p>
            )}
          </form>

          <div className={styles.margin}>
            {!busy && turns.length === 0 && (
              <p className={styles.emptyMargin}>No notes yet. Answer the prompt and I’ll mark it up.</p>
            )}
            {!busy && turns.length > 0 && (
              <p className={styles.marginHint}>
                {canReveal
                  ? 'The worked answer is available beside your last attempt.'
                  : isComplete
                    ? 'Tab filled. The next section is waiting.'
                    : 'Your note is in the margin. Answer again when you are ready.'}
              </p>
            )}
          </div>
        </div>

        {isComplete && (
          <section className={styles.complete} aria-labelledby="complete-title">
            <h2 className={styles.completeTitle} id="complete-title">
              Section complete
            </h2>
            <p className={styles.completeBody}>
              Tab filled.{' '}
              <Link
                to={nextSection ? `/c/${courseId}/s/${nextSection.id}` : `/c/${courseId}`}
                className={styles.completeLink}
              >
                {nextSection ? `Continue to ${nextSection.title}` : 'Back to contents'}
              </Link>
            </p>
          </section>
        )}

        {allCitations.length > 0 && (
          <section className={styles.footnotes} aria-labelledby="footnotes-title">
            <h2 className={styles.footnotesTitle} id="footnotes-title">
              Sources
            </h2>
            <ol className={styles.footnoteList}>
              {allCitations.map(citation => (
                <li key={citation.id} className={styles.footnote}>
                  <button
                    type="button"
                    className={styles.footnoteButton}
                    onClick={() => setActiveCitation(citation)}
                  >
                    <span className={styles.footnoteNum}>{citationIndex.get(citation.id)}.</span>
                    {citation.title}, p. {citation.page}
                  </button>
                  {citation.quote && <blockquote className={styles.quote}>{citation.quote}</blockquote>}
                </li>
              ))}
            </ol>
          </section>
        )}

        <p className="sr-only" role="status">
          {announcement}
        </p>
      </main>

      <SourceDrawer
        citation={activeCitation}
        onClose={() => setActiveCitation(null)}
        courseId={courseId}
      />
    </div>
  );
}

function TurnRow({
  turn,
  index,
  citationIndex,
  onCitation,
  workedVisible,
  isLive,
  phase,
}: {
  turn: Turn;
  index: number;
  citationIndex: Map<string, number>;
  onCitation: (citation: Citation) => void;
  workedVisible: boolean;
  isLive: boolean;
  phase: 'reading' | 'marking' | 'idle';
}) {
  const correction = turn.outcome === 'incorrect';
  const hasNote = Boolean(turn.note) || isLive;

  return (
    <article className={styles.turn}>
      <div>
        <p className={styles.speaker}>You</p>
        <p className={styles.answer}>{turn.answer}</p>

        {workedVisible && turn.explanation && (
          <div className={styles.worked}>
            <p className={styles.workedLabel}>Worked answer</p>
            <p className={styles.workedText}>{turn.explanation}</p>
          </div>
        )}
      </div>

      <div className={styles.margin}>
        {isLive && <Status phase={phase} />}
        {hasNote && (
          <div className={`${styles.note} ${correction ? styles.noteCorrection : ''}`}>
            <p className={styles.noteHeader}>
              Tutor
              {correction && <span className={styles.correctionTag}>(Correction)</span>}
            </p>
            {turn.note && (
              <p className={styles.noteText}>
                {turn.note}
                {turn.citations.length > 0 && (
                  <span className={styles.refs}>
                    {turn.citations.map(citation => (
                      <button
                        key={citation.id}
                        type="button"
                        className={styles.ref}
                        onClick={() => onCitation(citation)}
                        aria-label={`Source ${citationIndex.get(citation.id)}: ${citation.title}, page ${citation.page}`}
                      >
                        {citationIndex.get(citation.id)}
                      </button>
                    ))}
                  </span>
                )}
              </p>
            )}
          </div>
        )}
        {!hasNote && <p className={styles.speaker}>Entry {index}</p>}
      </div>
    </article>
  );
}

function SourceDrawer({
  citation,
  onClose,
  courseId,
}: {
  citation: Citation | null;
  onClose: () => void;
  courseId?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (citation && !dialog.open) dialog.showModal();
    if (!citation && dialog.open) dialog.close();
  }, [citation]);

  return (
    <dialog
      ref={ref}
      className={styles.drawer}
      onClose={onClose}
      onClick={event => {
        if (event.target === ref.current) onClose();
      }}
      aria-labelledby="source-drawer-title"
    >
      {citation && (
        <div className={styles.drawerBody}>
          <div className={styles.drawerHead}>
            <div>
              <span className={styles.drawerBadge}>Source</span>
              <h2 className={styles.drawerTitle} id="source-drawer-title">
                {citation.title}
              </h2>
            </div>
            <button type="button" className={styles.drawerClose} onClick={onClose} aria-label="Close source">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <p className={styles.drawerPage}>Page {citation.page}</p>
          {citation.quote && <blockquote className={styles.drawerQuote}>{citation.quote}</blockquote>}
          {courseId && (
            <Link to={`/c/${courseId}/sources`} className={styles.drawerLink}>
              Open all sources
            </Link>
          )}
        </div>
      )}
    </dialog>
  );
}