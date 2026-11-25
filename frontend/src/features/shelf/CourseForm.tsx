import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Field, Button } from '../../ui';
import { api } from '../../lib/api';
import type { Cover } from '../../lib/types';
import styles from './shelf.module.css';

const covers: Cover[] = ['cobalt', 'oxblood', 'forest', 'ochre'];
const coverLabels: Record<Cover, string> = {
  cobalt: 'Cobalt',
  oxblood: 'Oxblood',
  forest: 'Forest',
  ochre: 'Ochre',
};
const coverColors: Record<Cover, string> = {
  cobalt: 'var(--cover-cobalt)',
  oxblood: 'var(--cover-oxblood)',
  forest: 'var(--cover-forest)',
  ochre: 'var(--cover-ochre)',
};

interface CourseFormProps {
  onClose: () => void;
}

export function CourseForm({ onClose }: CourseFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [term, setTerm] = useState('');
  const [cover, setCover] = useState<Cover>('cobalt');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!code.trim()) next.code = 'Course code is required';
    if (!title.trim()) next.title = 'Course title is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const course = await api.courses.create({
        code: code.trim().toUpperCase(),
        title: title.trim(),
        term: term.trim() || undefined,
        cover,
      });
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
      onClose();
      navigate(`/c/${course.id}`);
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to create course' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <div className={styles.formHead}>
        <h2 className={styles.formTitle} id="course-form-title">
          New binder
        </h2>
        <p className={styles.formHint}>Fill in the label. The cover color is for the shelf only.</p>
      </div>

      <div className={styles.formGrid}>
        <Field
          label="Course code"
          value={code}
          onChange={event => setCode(event.target.value.toUpperCase())}
          error={errors.code}
          placeholder="PSY 101"
          maxLength={12}
          autoFocus
        />
        <Field
          label="Term (optional)"
          value={term}
          onChange={event => setTerm(event.target.value)}
          placeholder="Fall 2024"
        />
      </div>

      <Field
        label="Course title"
        value={title}
        onChange={event => setTitle(event.target.value)}
        error={errors.title}
        placeholder="Introduction to Psychology"
      />

      <fieldset className={styles.covers}>
        <legend className={styles.coversLegend}>Cover</legend>
        {covers.map(option => (
          <label
            key={option}
            className={`${styles.swatch} ${cover === option ? styles.swatchActive : ''}`}
            style={{ background: coverColors[option] }}
          >
            <input
              type="radio"
              name="cover"
              value={option}
              checked={cover === option}
              onChange={() => setCover(option)}
              className="sr-only"
            />
            <span className="sr-only">{coverLabels[option]}</span>
          </label>
        ))}
      </fieldset>

      {errors.submit && (
        <p className={styles.submitError} role="alert">
          {errors.submit}
        </p>
      )}

      <div className={styles.formActions}>
        <Button type="submit" loading={submitting}>
          Create binder
        </Button>
        <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}