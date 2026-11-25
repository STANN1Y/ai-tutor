import { http, HttpResponse, delay } from 'msw';
import {
  fixtureCourses,
  fixtureSources,
  fixtureTurns,
  getCourse,
  getSources,
  getTurns,
  getDailyCard,
} from './fixtures';
import type { Course, Section, Source, Turn, Citation, StreamEvent, DailyCard } from '../lib/types';

const COURSE_DELAY = 250;

function findSection(sectionId: string): { course: Course; section: Section } | undefined {
  for (const course of fixtureCourses) {
    const section = course.sections.find(s => s.id === sectionId);
    if (section) return { course, section };
  }
  return undefined;
}

const demoNote =
  "Good distinction. Episodic is autobiographical; semantic is general knowledge. Now: which system is impaired first in early Alzheimer's?";
const demoExplanation =
  "Episodic memory records personal events and depends heavily on the hippocampus. Semantic memory stores general facts and draws on wider temporal cortex. In early Alzheimer's, episodic memory is typically the first to fail while semantic memory is relatively spared — which is why a patient may forget this morning's appointment but still know the capital of France.";
const demoCitations: Citation[] = [
  {
    id: 'cit-1',
    sourceId: 'src-3',
    title: 'Chapter 7: Memory Systems',
    page: 88,
    quote:
      "Episodic memory is typically the first system affected in Alzheimer's disease, while semantic memory remains relatively intact in the early stages.",
  },
];

export const handlers = [
  http.get('/api/courses', async () => {
    await delay(COURSE_DELAY);
    return HttpResponse.json(fixtureCourses);
  }),

  http.get('/api/courses/:id', async ({ params }) => {
    await delay(COURSE_DELAY);
    const course = getCourse(params.id as string);
    if (!course) return HttpResponse.json({ message: 'Course not found' }, { status: 404 });
    return HttpResponse.json(course);
  }),

  http.post('/api/courses', async ({ request }) => {
    await delay(COURSE_DELAY);
    const data = (await request.json()) as Omit<Course, 'id' | 'createdAt' | 'sections'>;
    const newCourse: Course = {
      ...data,
      id: `course-${Date.now()}`,
      createdAt: new Date().toISOString(),
      sections: [],
    };
    fixtureCourses.push(newCourse);
    return HttpResponse.json(newCourse, { status: 201 });
  }),

  http.get('/api/courses/:id/sources', async ({ params }) => {
    await delay(COURSE_DELAY);
    return HttpResponse.json(getSources(params.id as string));
  }),

  http.post('/api/courses/:id/sources', async ({ params, request }) => {
    await delay(COURSE_DELAY * 2);
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const newSource: Source = {
      id: `src-${Date.now()}`,
      title: file.name,
      kind: 'pdf',
      pages: Math.max(1, Math.ceil(file.size / 20_000)),
      addedAt: new Date().toISOString(),
    };
    const sources = fixtureSources[params.id as string] || [];
    sources.push(newSource);
    fixtureSources[params.id as string] = sources;
    return HttpResponse.json(newSource, { status: 201 });
  }),

  http.get('/api/courses/:courseId/sections/:sectionId', async ({ params }) => {
    await delay(COURSE_DELAY);
    const course = getCourse(params.courseId as string);
    const section = course?.sections.find(s => s.id === params.sectionId);
    if (!section) return HttpResponse.json({ message: 'Section not found' }, { status: 404 });
    return HttpResponse.json(section);
  }),

  http.get('/api/sections/:sectionId/turns', async ({ params }) => {
    await delay(COURSE_DELAY);
    return HttpResponse.json(getTurns(params.sectionId as string));
  }),

  http.post('/api/sections/:sectionId/turns', async ({ params, request }) => {
    await delay(COURSE_DELAY);
    const { answer } = (await request.json()) as { answer: string };
    const found = findSection(params.sectionId as string);
    const newTurn: Turn = {
      id: `turn-${Date.now()}`,
      sectionId: params.sectionId as string,
      prompt: found?.section.prompt || 'Respond to the prompt.',
      answer,
      citations: [],
      createdAt: new Date().toISOString(),
    };
    const turns = fixtureTurns[params.sectionId as string] || [];
    turns.push(newTurn);
    fixtureTurns[params.sectionId as string] = turns;
    return HttpResponse.json(newTurn, { status: 201 });
  }),

  http.get('/api/sections/:sectionId/turns/:turnId/stream', async ({ params }) => {
    const turns = fixtureTurns[params.sectionId as string] || [];
    const turn = turns.find(t => t.id === params.turnId);
    const note =
      turn?.note ||
      (turns.length >= 3
        ? "That's the distinction. The hippocampus carries episodic recall; semantic memory leans on wider temporal cortex. Keep the concrete example; it is doing the work."
        : demoNote);
    const explanation = turn?.explanation || demoExplanation;
    const citations = turn?.citations.length ? turn.citations : demoCitations;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let closed = false;
        const send = (event: StreamEvent) => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          } catch {
            closed = true;
          }
        };

        send({ type: 'status', phase: 'reading' });
        await delay(450);

        send({ type: 'status', phase: 'marking' });
        await delay(300);

        const noteWords = note.split(' ');
        let noteText = '';
        for (const word of noteWords) {
          noteText += `${word} `;
          send({ type: 'note', text: noteText.trim() });
          await delay(45);
        }

        await delay(200);
        send({ type: 'citations', items: citations });

        const expWords = explanation.split(' ');
        let expText = '';
        for (const word of expWords) {
          expText += `${word} `;
          send({ type: 'explanation', text: expText.trim() });
          await delay(25);
        }

        if (turn) {
          turn.note = note;
          turn.explanation = explanation;
          turn.citations = citations;
          turn.outcome = 'partial';
        }

        const section = findSection(params.sectionId as string)?.section;
        const complete = turns.length >= 3;
        if (complete && section) section.state = 'complete';
        if (complete) {
          send({ type: 'section', sectionId: params.sectionId as string, state: 'complete' });
        }
        send({ type: 'done', turnId: params.turnId as string });
        try {
          controller.close();
        } catch {
          // The client may have closed the stream.
        }
      },
    });

    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }),

  http.get('/api/citations/:id', async ({ params }) => {
    await delay(COURSE_DELAY);
    const all = Object.values(fixtureTurns).flatMap(sectionTurns => sectionTurns.flatMap(t => t.citations));
    const citation = all.find(c => c.id === params.id);
    if (!citation) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    return HttpResponse.json(citation);
  }),

  http.get('/api/courses/:id/daily-card', async ({ params }) => {
    await delay(COURSE_DELAY);
    return HttpResponse.json(getDailyCard(params.id as string));
  }),

  http.post('/api/courses/:id/daily-card', async ({ params, request }) => {
    await delay(COURSE_DELAY);
    const { answer } = (await request.json()) as { answer: string };
    const course = getCourse(params.id as string);
    const card = course?.dailyCard;
    if (!card) return HttpResponse.json({ message: 'No card today' }, { status: 404 });
    card.answered = true;
    card.answer = answer;
    return HttpResponse.json(card as DailyCard);
  }),
];