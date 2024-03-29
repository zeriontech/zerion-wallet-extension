function getDocumentName() {
  const pathParts = window.location.pathname.split('/');
  return pathParts[1].endsWith('.html') ? `/${pathParts[1]}` : undefined;
}

const templates = {
  popup: (name?: string) => name && /popup\.\w+\.html$/.test(name),
  tab: (name?: string) => name && /popup\.\w+\.html$/.test(name),
  dialog: (name?: string) => name && /dialog\.\w+\.html$/.test(name),
};

type TemplateType = keyof typeof templates;

function isKnownTemplateType(x: string): x is TemplateType {
  return x in templates;
}

function getPageTemplateType(): TemplateType | null {
  const url = new URL(window.location.href);
  if (url.searchParams.has('templateType')) {
    const templateType = url.searchParams.get('templateType');
    if (!templateType || !isKnownTemplateType(templateType)) {
      throw new Error(
        `Unexpected template type: ${templateType}. Known types: ${Object.keys(
          templates
        )}`
      );
    }
    return templateType;
  }
  const templateName = getDocumentName();
  for (const [key, check] of Object.entries(templates)) {
    if (check(templateName)) {
      return key as TemplateType;
    }
  }
  return null;
}

function getFullScreenMode(): boolean {
  const url = new URL(window.location.href);
  if (url.searchParams.has('templateType')) {
    const fullScreenMode = url.searchParams.get('fullScreen');
    return fullScreenMode === 'true';
  }
  return false;
}

export const pageTemplateType = getPageTemplateType();
export const isFullScreenMode = getFullScreenMode();
