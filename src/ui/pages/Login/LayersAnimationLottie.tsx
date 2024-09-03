import React, {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react';
import type { AnimationItem } from 'lottie-web';

async function loadLottieWeb() {
  const lottieModule = await import('lottie-web');
  return lottieModule as unknown as (typeof lottieModule)['default'];
}

class LottieModule {
  animationItem: AnimationItem | null = null;
  options: { onAnimationReady?: () => void };
  private disposables: Array<() => void> = [];

  async prepareResources() {
    const [lottieWeb, animationData] = await Promise.all([
      loadLottieWeb(),
      import('./login-animation-lottie.json'),
    ]);
    return { lottieWeb, animationData };
  }

  constructor({ onAnimationReady }: { onAnimationReady?: () => void } = {}) {
    this.options = { onAnimationReady };
  }

  async startAnimation(
    container: Element,
    { autoplay, signal }: { autoplay: boolean; signal: AbortSignal }
  ) {
    const { lottieWeb, animationData } = await this.prepareResources();
    if (signal.aborted) {
      return;
    }
    const item = lottieWeb.loadAnimation({
      container,
      animationData,
      loop: false,
      autoplay,
      renderer: 'svg',
    });
    function loopOnCompleted() {
      const FRAME_NUMBER_TO_START_LOOP = 39;
      item.goToAndPlay(FRAME_NUMBER_TO_START_LOOP, true);
    }
    item.addEventListener('complete', loopOnCompleted);
    this.disposables.push(() =>
      item.removeEventListener('complete', loopOnCompleted)
    );
    this.options.onAnimationReady?.();
    this.animationItem = item;
  }

  destroy() {
    this.disposables.forEach((dispose) => dispose());
    this.animationItem?.destroy();
    this.animationItem = null;
  }
}

export interface LottieComponentHandle {
  startAnimation: () => void;
}

export const LayersAnimationLottie = React.forwardRef(
  function LayersLottieAnimation(
    {
      onAnimationReady,
    }: {
      onAnimationReady?: () => void;
    },
    ref: React.Ref<LottieComponentHandle>
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const lottieModuleRef = useRef<LottieModule | null>(null);

    const onAnimationStartRef = useRef(onAnimationReady);
    useLayoutEffect(() => {
      onAnimationStartRef.current = onAnimationReady;
    });

    useImperativeHandle(ref, () => ({
      startAnimation() {
        lottieModuleRef.current?.animationItem?.play();
      },
    }));

    useEffect(() => {
      if (!containerRef.current) {
        return;
      }
      const lottieModule = new LottieModule({
        onAnimationReady: () => onAnimationStartRef.current?.(),
      });
      lottieModule.prepareResources();
      lottieModuleRef.current = lottieModule;
      const abortController = new AbortController();
      const { signal } = abortController;
      lottieModule.startAnimation(containerRef.current, {
        autoplay: false,
        signal,
      });
      return () => {
        lottieModuleRef.current = null;
        abortController.abort();
        lottieModule.destroy();
      };
    }, []);

    return <div ref={containerRef} />;
  }
);

export default LayersAnimationLottie;
