import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { UserRoles, type PublicUser } from '@decentdebates/shared-types';
import { userReducer } from '@/store/slices/user.slice';
import { debatesSlice } from '@/store/slices/debates.slice';
import { moderatorSlice } from '@/store/slices/moderator.slice';
import type { Debate } from '@/store/slices/debates.slice';

vi.mock('@/components/Layout/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/utils/api/debate', () => ({
  fetchDebatesWithFilters: vi.fn(),
  createDebate: vi.fn(),
}));

import { DebatesClient } from './DebatesClient';
import { fetchDebatesWithFilters } from '@/utils/api/debate';

const mockedFetch = fetchDebatesWithFilters as unknown as ReturnType<typeof vi.fn>;

const buildDebate = (id: number, overrides: Partial<Debate> = {}): Debate => ({
  id,
  title: `Debate ${id}`,
  createdAt: '2024-01-01T00:00:00Z',
  modifiedAt: '2024-01-01T00:00:00Z',
  username: 'foo.bar',
  userId: 1,
  tags: [{ id, name: `tag-${id}` }],
  ...overrides,
});

const renderWithStore = (
  ui: React.ReactElement,
  { currentUser = null }: { currentUser?: PublicUser | null } = {},
) => {
  const store = configureStore({
    reducer: {
      user: userReducer,
      [debatesSlice.name]: debatesSlice.reducer,
      [moderatorSlice.name]: moderatorSlice.reducer,
    },
    preloadedState: {
      user: { currentUser },
      debates: debatesSlice.getInitialState(),
      moderator: moderatorSlice.getInitialState(),
    },
  });
  return render(<Provider store={store}>{ui}</Provider>);
};

describe('DebatesClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders debates passed from the server component', () => {
    const debates = [buildDebate(1), buildDebate(2), buildDebate(3)];
    renderWithStore(<DebatesClient debates={debates} />);
    expect(screen.getAllByTestId('debate-card')).toHaveLength(3);
    expect(screen.getByText('Debate 1')).toBeInTheDocument();
  });

  it('renders a "No Debates found." empty state when the list is empty', () => {
    renderWithStore(<DebatesClient debates={[]} />);
    expect(screen.getByText('No Debates found.')).toBeInTheDocument();
  });

  it('hides the "Start a debate" button when no user is logged in', () => {
    renderWithStore(<DebatesClient debates={[buildDebate(1)]} />);
    expect(screen.queryByRole('button', { name: 'Start a debate' })).not.toBeInTheDocument();
  });

  it('shows the "Start a debate" button when a user is logged in', () => {
    renderWithStore(<DebatesClient debates={[buildDebate(1)]} />, {
      currentUser: { id: 1, username: 'foo.bar', email: 'foo.bar@example.com', role: UserRoles.USER },
    });
    expect(screen.getByRole('button', { name: 'Start a debate' })).toBeInTheDocument();
  });

  it('calls fetchDebatesWithFilters with the typed query and swaps the list', async () => {
    const user = userEvent.setup();
    mockedFetch.mockResolvedValueOnce([buildDebate(42, { title: 'Only match' })]);

    renderWithStore(<DebatesClient debates={[buildDebate(1), buildDebate(2)]} />);

    await user.type(screen.getByPlaceholderText('Search by title...'), 'only');

    await waitFor(() => {
      expect(mockedFetch).toHaveBeenCalledWith({ query: 'only' });
    });

    await waitFor(() => {
      expect(screen.getAllByTestId('debate-card')).toHaveLength(1);
      expect(screen.getByText('Only match')).toBeInTheDocument();
    });
  });
});
