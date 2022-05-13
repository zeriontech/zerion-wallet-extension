declare module '*.svg' {
  const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const content: string;

  export { ReactComponent };
  export default content;
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
