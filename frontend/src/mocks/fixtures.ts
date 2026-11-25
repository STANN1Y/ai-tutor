import type { Course, Section, Source, Turn, DailyCard } from '../lib/types';

const now = new Date().toISOString();

const psy101Sections: Section[] = [
  {
    id: 'sec-1',
    title: 'Foundations of Psychology',
    order: 1,
    prerequisites: [],
    state: 'complete',
    sourceIds: ['src-1'],
    prompt: 'In your own words, what does it mean to study behaviour scientifically? Name one assumption psychology makes about behaviour.',
  },
  {
    id: 'sec-2',
    title: 'Sensation and Perception',
    order: 2,
    prerequisites: ['sec-1'],
    state: 'not-started',
    sourceIds: ['src-1', 'src-2'],
    prompt: 'Explain the difference between sensation and perception, using one example where the two diverge.',
  },
  {
    id: 'sec-3',
    title: 'Learning',
    order: 3,
    prerequisites: ['sec-1'],
    state: 'complete',
    sourceIds: ['src-2'],
    prompt: 'A dog learns to salivate at the sound of a bell. Identify the unconditioned stimulus, conditioned stimulus, and conditioned response.',
  },
  {
    id: 'sec-4',
    title: 'Memory',
    order: 4,
    prerequisites: ['sec-3'],
    state: 'in-progress',
    sourceIds: ['src-3'],
    prompt: 'Explain the difference between episodic and semantic memory. Use an example from your own experience to illustrate each.',
  },
  {
    id: 'sec-5',
    title: 'Development',
    order: 5,
    prerequisites: ['sec-3'],
    state: 'not-started',
    sourceIds: ['src-3'],
    prompt: 'Describe one way Piaget and Vygotsky disagreed about how children learn. What evidence would distinguish their views?',
  },
  {
    id: 'sec-6',
    title: 'Social Psychology',
    order: 6,
    prerequisites: ['sec-4'],
    state: 'not-started',
    sourceIds: ['src-4'],
    prompt: 'What is the difference between conformity and obedience? Give one classic study for each.',
  },
];

const hist110Sections: Section[] = [
  {
    id: 'sec-h1',
    title: 'The Ancient World',
    order: 1,
    prerequisites: [],
    state: 'not-started',
    sourceIds: ['src-h1'],
    prompt: 'What role did writing play in the consolidation of early states? Use one example from the reading.',
  },
  {
    id: 'sec-h2',
    title: 'Classical Civilizations',
    order: 2,
    prerequisites: ['sec-h1'],
    state: 'not-started',
    sourceIds: ['src-h1'],
    prompt: 'Compare how two classical empires legitimised rule. Where did their ideologies overlap?',
  },
  {
    id: 'sec-h3',
    title: 'Post-Classical Era',
    order: 3,
    prerequisites: ['sec-h2'],
    state: 'not-started',
    sourceIds: ['src-h2'],
    prompt: 'How did trade networks reshape religious and cultural life between 500 and 1500?',
  },
  {
    id: 'sec-h4',
    title: 'Early Modern World',
    order: 4,
    prerequisites: ['sec-h3'],
    state: 'not-started',
    sourceIds: ['src-h2'],
    prompt: 'What made the early modern world "early modern"? Choose two features and defend them.',
  },
];

export const fixtureCourses: Course[] = [
  {
    id: 'psy101',
    code: 'PSY 101',
    title: 'Introduction to Psychology',
    term: 'Fall 2024',
    cover: 'cobalt',
    sections: psy101Sections,
    createdAt: now,
    dailyCard: {
      id: 'card-1',
      sectionId: 'sec-3',
      prompt: 'In classical conditioning, what is the difference between extinction and spontaneous recovery?',
      date: new Date().toISOString().split('T')[0],
      answered: false,
    },
  },
  {
    id: 'hist110',
    code: 'HIST 110',
    title: 'World History',
    term: 'Fall 2024',
    cover: 'oxblood',
    sections: hist110Sections,
    createdAt: now,
    dailyCard: {
      id: 'card-h1',
      sectionId: 'sec-h1',
      prompt: 'Name one technology and one idea that moved along the Silk Road. Explain how each changed a receiving society.',
      date: new Date().toISOString().split('T')[0],
      answered: false,
    },
  },
];

export const fixtureSources: Record<string, Source[]> = {
  psy101: [
    { id: 'src-1', title: 'Lecture 01: What Is Psychology?', kind: 'pdf', pages: 12, addedAt: now },
    { id: 'src-2', title: 'Lecture 04: Classical Conditioning', kind: 'slides', pages: 24, addedAt: now },
    { id: 'src-3', title: 'Chapter 7: Memory Systems', kind: 'pdf', pages: 36, addedAt: now },
    { id: 'src-4', title: 'Lecture 12: Social Influence', kind: 'notes', pages: 8, addedAt: now },
  ],
  hist110: [
    { id: 'src-h1', title: 'Reader: Ancient Mesopotamia', kind: 'pdf', pages: 45, addedAt: now },
    { id: 'src-h2', title: 'Lecture: The Silk Road', kind: 'slides', pages: 30, addedAt: now },
  ],
};

export const fixtureTurns: Record<string, Turn[]> = {
  'sec-4': [
    {
      id: 'turn-1',
      sectionId: 'sec-4',
      prompt: psy101Sections[3].prompt!,
      answer:
        'Episodic memory is for personal events like my graduation. Semantic memory is for facts like knowing that Paris is the capital of France.',
      note:
        "Good distinction. Keep the graduation example concrete: what makes that memory episodic rather than just a fact you recall?",
      citations: [
        {
          id: 'cit-1',
          sourceId: 'src-3',
          title: 'Chapter 7: Memory Systems',
          page: 88,
          quote:
            "Episodic memory is typically the first system affected in Alzheimer's disease, while semantic memory remains relatively intact in the early stages.",
        },
      ],
      outcome: 'partial',
      createdAt: new Date(Date.now() - 3_600_000).toISOString(),
    },
  ],
};

export function getCourse(id: string): Course | undefined {
  return fixtureCourses.find(c => c.id === id);
}

export function getSources(courseId: string): Source[] {
  return fixtureSources[courseId] || [];
}

export function getTurns(sectionId: string): Turn[] {
  return fixtureTurns[sectionId] || [];
}

export function getDailyCard(courseId: string): DailyCard | null {
  return getCourse(courseId)?.dailyCard ?? null;
}