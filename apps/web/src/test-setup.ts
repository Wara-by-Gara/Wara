import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { server } from './mocks/server';

// jsdom은 IntersectionObserver를 제공하지 않으므로 no-op 스텁
class IntersectionObserverMock {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}
vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
