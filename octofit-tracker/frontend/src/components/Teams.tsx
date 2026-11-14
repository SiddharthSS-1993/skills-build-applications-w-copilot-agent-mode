import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamRecord = {
  name: string;
  mascot?: string;
  members?: Array<string | { _id?: string; toString?: () => string }>;
};

export default function Teams() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTeams() {
      try {
        const response = await getJson<{ teams: TeamRecord[] }>('/api/teams');
        if (isMounted) {
          setTeams(response.teams ?? []);
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

    void loadTeams();
    return () => { isMounted = false; };
  }, []);

  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      loading={loading}
      error={error ?? undefined}
      emptyText="No teams found."
    >
      {!loading && !error && teams.length > 0 ? (
        <ul className="list-group list-group-flush mt-3">
          {teams.map((team) => (
            <li key={team.name} className="list-group-item">
              <strong>{team.name}</strong> · {team.mascot ?? 'Mascot'}
              <div className="small text-muted">Members: {team.members?.length ?? 0}</div>
            </li>
          ))}
        </ul>
      ) : null}
    </CapabilityCard>
  );
}
