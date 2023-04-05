declare module '*.svg' {
  const url: string;
  export default url;
}

declare module 'jsx:*.svg' {
  const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

declare module 'data-url:*' {
  const url: string;
  export default url;
}

declare module '@download/blockies' {
  interface CreateIcon {
    (options: {
      seed?: string; // seed used to generate icon data, default: random
      color?: string; // to manually specify the icon color, default: random
      bgcolor?: string; // choose a different background color, default: white
      size?: number; // width/height of the icon in blocks, default: 10
      scale?: number; // width/height of each block in pixels, default: 5
    }): HTMLCanvasElement;
  }
  const createIcon: CreateIcon;

  export { createIcon };
}

declare module '*.module.css';
declare module '*.png';
