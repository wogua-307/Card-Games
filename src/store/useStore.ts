import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MatchRecord {
  id: string;
  gameId: string;
  gameName: string;
  date: string;
  result: string;
  duration: number; // in seconds
}

interface AppState {
  history: MatchRecord[];
  addMatchRecord: (record: Omit<MatchRecord, 'id' | 'date'>) => void;
  clearHistory: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      history: [],
      addMatchRecord: (record) =>
        set((state) => ({
          history: [
            {
              ...record,
              id: Math.random().toString(36).substring(2, 9),
              date: new Date().toISOString(),
            },
            ...state.history,
          ],
        })),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'board-games-storage',
    }
  )
);
