import { invariant } from 'src/shared/invariant';

export function getRootDomNode() {
  const root = document.getElementById('root');
  invariant(root, 'Root element must be in DOM');
  return root;
}
