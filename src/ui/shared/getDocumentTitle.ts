export function getDocumentTitle(pageTitle?: string | null) {
  if (!pageTitle) {
    return 'Zerion';
  }
  return `Zerion · ${pageTitle}`;
}
