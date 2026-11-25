import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button } from '../../ui';
import styles from './sources.module.css';

export function SourcesPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropping, setDropping] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const { data: course } = useQuery({
    queryKey: ['course', id],
    queryFn: () => api.courses.get(id!),
    enabled: !!id,
  });

  useDocumentTitle(course ? `Sources — ${course.code} — Margin` : 'Sources — Margin');

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ['sources', id],
    queryFn: () => api.courses.listSources(id!),
    enabled: !!id,
  });

  const addMutation = useMutation({
    mutationFn: (selected: File) => api.courses.addSource(id!, selected),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources', id] });
      setFile(null);
    },
  });

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDropping(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDropping(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDropping(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected) setFile(selected);
    event.target.value = '';
  };

  if (isLoading) {
    return <p className={styles.loading}>Loading…</p>;
  }

  return (
    <div className={styles.page}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className={styles.header}>
        <Link to={`/c/${id}`} className={styles.back}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Sources
        </Link>
        <span className={styles.headerCode}>{course?.code}</span>
      </header>

      <main id="main" tabIndex={-1} className={styles.main}>
        <h1 className={styles.title}>Add readings</h1>
        <p className={styles.intro}>
          PDFs, slides, and notes become the citations in your margins. Files are indexed for this course only.
        </p>

        <input
          ref={inputRef}
          type="file"
          id="file-upload"
          accept=".pdf,.ppt,.pptx,.txt,.md"
          onChange={handleSelect}
          className="sr-only"
          aria-label="Upload course material"
        />

        <button
          type="button"
          className={`${styles.dropzone} ${dropping ? styles.dropping : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          <span className={styles.dropTitle}>Drop a file, or choose one</span>
          <span className={styles.dropHint}>PDF, slides, or text. Up to 50 MB.</span>
        </button>

        {file && (
          <div className={styles.fileRow}>
            <div className={styles.fileInfo}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <div>
                <p className={styles.fileName}>{file.name}</p>
                <p className={styles.fileSize}>{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
            </div>
            <button
              type="button"
              className={styles.remove}
              onClick={() => setFile(null)}
              aria-label="Remove selected file"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {file && (
          <div className={styles.actions}>
            <Button onClick={() => addMutation.mutate(file)} loading={addMutation.isPending}>
              Add to course
            </Button>
            <Button variant="ghost" onClick={() => setFile(null)} disabled={addMutation.isPending}>
              Cancel
            </Button>
          </div>
        )}

        {addMutation.isError && (
          <p className={styles.error} role="alert">
            Failed to add the source. Try again.
          </p>
        )}

        <section className={styles.sources} aria-labelledby="sources-title">
          <div className={styles.sourcesHead}>
            <h2 className={styles.sourcesTitle} id="sources-title">
              Indexed sources
            </h2>
            <span className={styles.sourcesCount}>{sources.length} total</span>
          </div>
          {sources.length === 0 ? (
            <p className={styles.emptySources}>No sources added yet. The tutor has nothing to cite.</p>
          ) : (
            <ul className={styles.sourceList}>
              {sources.map(source => (
                <li key={source.id} className={styles.sourceRow}>
                  <div>
                    <p className={styles.sourceTitle}>{source.title}</p>
                    <p className={styles.sourceMeta}>
                      {source.kind === 'pdf' ? 'PDF' : source.kind === 'slides' ? 'Slides' : source.kind === 'notes' ? 'Notes' : 'Link'}
                      {source.pages ? `, ${source.pages} pages` : ''}
                    </p>
                  </div>
                  <span className={styles.sourceDate}>
                    Added {new Date(source.addedAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}