import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ShelfPage } from './features/shelf';
import { ContentsPage } from './features/contents';
import { WorksheetPage } from './features/worksheet';
import { SourcesPage } from './features/sources';
import './styles/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ShelfPage />} />
          <Route path="/c/:id" element={<ContentsPage />} />
          <Route path="/c/:id/s/:sectionId" element={<WorksheetPage />} />
          <Route path="/c/:id/sources" element={<SourcesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}