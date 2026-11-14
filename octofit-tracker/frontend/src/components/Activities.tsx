import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityRecord = {
  type: string;
  minutes: number;
  points?: number;
  occurredAt?: string;
};

export default function Activities() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadActivities() {
      try {
        const response = await getJson<{ activities: ActivityRecord[] }>('/api/activities');
        if (isMounted) {
          setActivities(response.activities ?? []);
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

    void loadActivities();
    return () => { isMounted = false; };
  }, []);

  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      loading={loading}
      error={error ?? undefined}
      emptyText="No activities found."
    >
      {!loading && !error && activities.length > 0 ? (
        <ul className="list-group list-group-flush mt-3">
          {activities.map((activity, index) => (
            <li key={`${activity.type}-${activity.minutes}-${index}`} className="list-group-item">
              <strong>{activity.type}</strong> · {activity.minutes} minutes · {activity.points ?? 0} points
            </li>
          ))}
        </ul>
      ) : null}
    </CapabilityCard>
  );
}
