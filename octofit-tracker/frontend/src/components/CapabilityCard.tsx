import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  children?: ReactNode;
  loading?: boolean;
  error?: string;
  emptyText?: string;
};

export function CapabilityCard({ title, description, children, loading = false, error, emptyText }: Props) {
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {loading ? <p role="status">Loading {title.toLowerCase()}...</p> : null}
        {error ? <div role="alert">Unable to load {title.toLowerCase()}: {error}</div> : null}
        {!loading && !error && !children ? <p>{emptyText ?? `No ${title.toLowerCase()} found.`}</p> : null}
        {children}
      </div>
    </section>
  );
}
