import { createPortal } from 'react-dom';
import { getRootDomNode } from 'src/ui/shared/getRootDomNode';

const rootNode = getRootDomNode();

export function PortalToRootNode({ children }: React.PropsWithChildren) {
  return createPortal(children, rootNode);
}
