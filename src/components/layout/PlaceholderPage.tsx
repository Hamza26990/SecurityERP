type PlaceholderPageProps = {
  title: string;
  description?: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="page-header">
      <h1 className="page-title">{title}</h1>
      <p className="page-description">
        {description ?? "Module placeholder — implementation coming soon."}
      </p>
    </section>
  );
}
