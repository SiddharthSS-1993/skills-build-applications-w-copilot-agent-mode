import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardRow = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLeaderboard() {
      try {
        const response = await getJson<{ leaderboard: LeaderboardRow[] }>('/api/leaderboard');
        if (isMounted) {
          setLeaderboard(response.leaderboard ?? []);
          setError(null);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof Error ? caughtError.message : 'Unknown error');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadLeaderboard();
    return () => { isMounted = false; };
  }, []);

  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      loading={loading}
      error={error ?? undefined}
      emptyText="No leaderboard found."
    >
      {!loading && !error && leaderboard.length > 0 ? (
        <ol className="list-group list-group-numbered mt-3">
          {leaderboard.map((entry) => (
            <li key={`${entry.teamName}-${entry.rank}`} className="list-group-item d-flex justify-content-between align-items-center">
              <span>{entry.rank}. {entry.teamName}</span>
              <span className="badge text-bg-primary rounded-pill">{entry.totalPoints}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </CapabilityCard>
  );
}
