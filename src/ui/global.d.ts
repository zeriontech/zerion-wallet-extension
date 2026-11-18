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

declare module '*.module.css';
declare module '*.css';
declare module '*.png';
