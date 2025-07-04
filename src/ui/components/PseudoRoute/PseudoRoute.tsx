export function PseudoRoute({
  when,
  component,
}: {
  when: boolean;
  component: React.ReactNode;
}) {
  if (when) {
    return component;
  }
  return null;
}
