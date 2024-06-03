interface TemplateData {
  layout: 'column' | 'page';
  windowContext: 'popup' | 'dialog' | 'tab';
}

function getLayoutType(): TemplateData['layout'] {
  const url = new URL(window.location.href);
  const layoutParam = url.searchParams.get('layout') as
    | TemplateData['layout']
    | null;
  return layoutParam || 'column';
}

function getWindowContext(): TemplateData['windowContext'] {
  const url = new URL(window.location.href);
  const windowContextParam = url.searchParams.get('windowContext') as
    | TemplateData['windowContext']
    | null;
  return windowContextParam || 'popup';
}

export const templateData: TemplateData = {
  layout: getLayoutType(),
  windowContext: getWindowContext(),
};
