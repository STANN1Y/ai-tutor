export type Cover = 'cobalt' | 'oxblood' | 'forest' | 'ochre';

export interface Section {
  id: string;
  title: string;
  order: number;
  prerequisites: string[];
  state: 'not-started' | 'in-progress' | 'complete';
  sourceIds: string[];
  prompt?: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  term?: string;
  cover: Cover;
  sections: Section[];
  createdAt: string;
  dailyCard?: DailyCard;
}

export interface Source {
  id: string;
  title: string;
  kind: 'pdf' | 'slides' | 'notes' | 'link';
  pages?: number;
  addedAt: string;
}

export interface Citation {
  id: string;
  sourceId: string;
  title: string;
  page: number;
  quote: string;
  pageImageUrl?: string;
  bbox?: [number, number, number, number];
}

export interface Turn {
  id: string;
  sectionId: string;
  prompt: string;
  answer: string;
  note?: string;
  explanation?: string;
  citations: Citation[];
  outcome?: 'correct' | 'partial' | 'incorrect';
  createdAt: string;
}

export interface DailyCard {
  id: string;
  sectionId: string;
  prompt: string;
  date: string;
  answered: boolean;
  answer?: string;
}

export type StreamEvent =
  | { type: 'status'; phase: 'reading' | 'marking' }
  | { type: 'note'; text: string }
  | { type: 'explanation'; text: string }
  | { type: 'citations'; items: Citation[] }
  | { type: 'section'; sectionId: string; state: Section['state'] }
  | { type: 'error'; code: string; message: string; retryable: boolean }
  | { type: 'done'; turnId: string };