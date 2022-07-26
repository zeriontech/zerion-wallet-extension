export function getPageTemplateName() {
  const pathParts = window.location.pathname.split('/');
  return pathParts[1].endsWith('.html') ? `/${pathParts[1]}` : undefined;
}

const templates = {
  popup: (name?: string) => name && /popup\.\w+\.html$/.test(name),
  dialog: (name?: string) => name && /dialog\.\w+\.html$/.test(name),
};

type TemplateType = keyof typeof templates;

export function getPageTemplateType(): TemplateType | null {
  const templateName = getPageTemplateName();
  for (const [key, check] of Object.entries(templates)) {
    if (check(templateName)) {
      return key as TemplateType;
    }
  }
  return null;
}
