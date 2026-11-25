import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Textarea, Button } from '../../ui';
import type { DailyCard } from '../../lib/types';
import styles from './contents.module.css';

interface DailyCardBlockProps {
  courseId: string;
  card: DailyCard | null;
}

export function DailyCardBlock({ courseId, card }: DailyCardBlockProps) {
  const [answer, setAnswer] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (value: string) => api.dailyCard.answer(courseId, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyCard', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });

  if (!card) return null;

  const answered = card.answered || mutation.isSuccess;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!answer.trim() || mutation.isPending) return;
    mutation.mutate(answer.trim());
  };

  return (
    <section className={styles.card} aria-labelledby="daily-card-title">
      <div className={styles.cardHead}>
        <span className={styles.cardBadge} id="daily-card-title">
          Today's card
        </span>
      </div>
      <p className={styles.cardPrompt}>{card.prompt}</p>
      <p className={styles.cardHint}>One question from an earlier section. No timer.</p>

      {answered ? (
        <>
          <p className={styles.cardAnswered}>Answered</p>
          {(card.answer || answer) && <p className={styles.cardAnswer}>You wrote: {card.answer || answer}</p>}
        </>
      ) : (
        <form onSubmit={handleSubmit} className={styles.cardForm}>
          <Textarea
            aria-label="Your answer to today's card"
            placeholder="Write a short answer…"
            value={answer}
            onChange={event => setAnswer(event.target.value)}
            rows={2}
          />
          <div className={styles.cardActions}>
            <Button type="submit" size="sm" loading={mutation.isPending}>
              Answer the card
            </Button>
          </div>
          {mutation.isError && (
            <p className={styles.cardHint} style={{ color: 'var(--red-pencil)' }} role="alert">
              That didn't go through. Try again.
            </p>
          )}
        </form>
      )}
    </section>
  );
}