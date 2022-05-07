export function getPageTemplateName() {
  const pathParts = window.location.pathname.split('/');
  return pathParts[1].endsWith('.html') ? `/${pathParts[1]}` : undefined;
}
