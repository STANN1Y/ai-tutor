import type {
  Course,
  Section,
  Source,
  Turn,
  StreamEvent,
  Citation,
  DailyCard,
  Cover,
} from './types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error((err as { message?: string }).message || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface CreateCourseInput {
  code: string;
  title: string;
  term?: string;
  cover: Cover;
}

export const api = {
  courses: {
    list: () => fetchJson<Course[]>('/courses'),
    get: (id: string) => fetchJson<Course>(`/courses/${id}`),
    create: (data: CreateCourseInput) =>
      fetchJson<Course>('/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    listSources: (courseId: string) => fetchJson<Source[]>(`/courses/${courseId}/sources`),
    addSource: (courseId: string, file: File) => {
      const form = new FormData();
      form.append('file', file);
      return fetchJson<Source>(`/courses/${courseId}/sources`, {
        method: 'POST',
        body: form,
      });
    },
  },

  sections: {
    get: (courseId: string, sectionId: string) =>
      fetchJson<Section>(`/courses/${courseId}/sections/${sectionId}`),
  },

  turns: {
    list: (sectionId: string) => fetchJson<Turn[]>(`/sections/${sectionId}/turns`),
    create: (sectionId: string, answer: string) =>
      fetchJson<Turn>(`/sections/${sectionId}/turns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      }),
    stream: function (sectionId: string, turnId: string, signal: AbortSignal): AsyncGenerator<StreamEvent> {
      return (async function* () {
        const res = await fetch(`${API_BASE}/sections/${sectionId}/turns/${turnId}/stream`, { signal });
        if (!res.ok || !res.body) throw new Error('Stream failed');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const frames = buffer.split('\n\n');
            buffer = frames.pop() || '';
            for (const frame of frames) {
              const dataLines = frame
                .split('\n')
                .filter(line => line.startsWith('data:'))
                .map(line => line.slice(5).trim());
              if (dataLines.length === 0) continue;
              try {
                yield JSON.parse(dataLines.join('\n')) as StreamEvent;
              } catch {
                // Ignore malformed frames.
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      })();
    },
  },

  citations: {
    get: (citationId: string) => fetchJson<Citation>(`/citations/${citationId}`),
  },

  dailyCard: {
    getToday: (courseId: string) => fetchJson<DailyCard | null>(`/courses/${courseId}/daily-card`),
    answer: (courseId: string, answer: string) =>
      fetchJson<DailyCard>(`/courses/${courseId}/daily-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      }),
  },
};