import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

/**
 * Minimal portal/area system vendored from react-area 0.1.1-alpha.6 (MIT).
 * The package is an alpha with very low usage; behavior is preserved so the
 * layout/onboarding composition does not change.
 */
interface ComponentHolder {
  value: React.ReactElement;
  orderNumber: number | null;
}

export interface AreaContextValue {
  addComponent: (areaId: string, component: ComponentHolder) => void;
  removeComponent: (areaId: string, component: ComponentHolder) => void;
  updateComponent: (areaId: string, component: ComponentHolder) => void;
  getComponents: (areaId: string) => React.ReactElement[] | null;
  orderNumberRef: { current: number };
}

export const AreaContext = React.createContext<AreaContextValue>({
  addComponent: () => undefined,
  removeComponent: () => undefined,
  updateComponent: () => undefined,
  getComponents: () => null,
  orderNumberRef: { current: 0 },
});

export function AreaProvider({ children }: { children: React.ReactNode }) {
  const [components, setComponents] = useState<Record<string, Set<ComponentHolder>>>({});

  const addComponent = useCallback((areaId: string, component: ComponentHolder) => {
    setComponents((current) => {
      const existing = current[areaId] || new Set<ComponentHolder>();
      if (existing.has(component)) {
        return current;
      }
      existing.add(component);
      return { ...current, [areaId]: existing };
    });
  }, []);

  const removeComponent = useCallback((areaId: string, component: ComponentHolder) => {
    setComponents((current) => {
      const existing = current[areaId];
      if (!existing) {
        return current;
      }
      existing.delete(component);
      existing.forEach((item) => {
        item.orderNumber = null;
      });
      return { ...current };
    });
  }, []);

  const updateComponent = useCallback((areaId: string) => {
    setComponents((current) => {
      const existing = current[areaId];
      if (!existing) {
        return current;
      }
      return { ...current };
    });
  }, []);

  const getComponents = useCallback(
    (areaId: string) => {
      if (!(areaId in components)) {
        return null;
      }
      return Array.from(components[areaId])
        .sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0))
        .map((component) => component.value);
    },
    [components],
  );

  const orderNumberRef = useRef(0);
  const value = useMemo(
    () => ({
      addComponent,
      getComponents,
      removeComponent,
      updateComponent,
      orderNumberRef,
    }),
    [addComponent, getComponents, removeComponent, updateComponent],
  );

  return <AreaContext.Provider value={value}>{children}</AreaContext.Provider>;
}

type RenderCallback = (components: React.ReactElement[]) => React.ReactNode;

const EMPTY_ARRAY: React.ReactElement[] = [];

export function RenderArea({
  name,
  children,
}: {
  name: string;
  children?: React.ReactNode | RenderCallback;
}) {
  const context = useContext(AreaContext);
  const components = context.getComponents(name);
  if (typeof children === 'function') {
    return (children as RenderCallback)(components || EMPTY_ARRAY);
  }
  return components;
}

interface ComponentData {
  value: React.ReactElement;
  orderNumber: number | null;
}

function useRender(areaId: string, children: React.ReactElement) {
  const { addComponent, removeComponent, updateComponent, orderNumberRef } =
    useContext(AreaContext);
  const ref = useRef<ComponentData>({ value: children, orderNumber: null });

  if (ref.current.orderNumber == null) {
    ref.current.orderNumber = orderNumberRef.current;
  }
  orderNumberRef.current += 1;

  useLayoutEffect(() => {
    const component = ref.current;
    addComponent(areaId, component);
    return () => {
      removeComponent(areaId, component);
    };
  }, [areaId, addComponent, removeComponent]);

  useEffect(() => {
    if (children !== ref.current.value) {
      ref.current.value = children;
      updateComponent(areaId, ref.current);
    }
  }, [areaId, children, updateComponent]);
}

export function Content({ name, children }: React.PropsWithChildren<{ name: string }>) {
  useRender(name, children as React.ReactElement);
  return null;
}

export function createRenderingPair(areaId: string) {
  return {
    RenderArea: (props: Omit<React.ComponentProps<typeof RenderArea>, 'name'>) => (
      <RenderArea {...props} name={areaId} />
    ),
    Content: ({ children }: React.PropsWithChildren) => <Content name={areaId}>{children}</Content>,
  };
}
