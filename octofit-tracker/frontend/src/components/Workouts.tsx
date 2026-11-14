import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title: string;
  focus?: string;
  minutes?: number;
  difficulty?: string;
  reason?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSuggestions() {
      try {
        const response = await getJson<{ suggestions: WorkoutSuggestion[] }>('/api/workouts/suggestions/mona@example.com');
        if (isMounted) {
          setSuggestions(response.suggestions ?? []);
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

    void loadSuggestions();
    return () => { isMounted = false; };
  }, []);

  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loading={loading}
      error={error ?? undefined}
      emptyText="No workout suggestions found."
    >
      {!loading && !error && suggestions.length > 0 ? (
        <ul className="list-group list-group-flush mt-3">
          {suggestions.map((suggestion) => (
            <li key={suggestion.title} className="list-group-item">
              <strong>{suggestion.title}</strong>
              {suggestion.focus ? <div className="small text-muted">Focus: {suggestion.focus}</div> : null}
              {suggestion.reason ? <div className="small">{suggestion.reason}</div> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </CapabilityCard>
  );
}
