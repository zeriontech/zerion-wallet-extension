const noPreviewRule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow registerPreview usage in production code',
      category: 'Internal Convention',
    },
    messages: {
      noRegisterPreview:
        'Reminder: use during development and remove before committing code.' +
        'To create a permanent preview, use `registerPreviewPermanent`',
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'registerPreview'
        ) {
          context.report({
            node: node.callee,
            messageId: 'noRegisterPreview',
          });
        }
      },
    };
  },
};

export default { rules: { 'no-preview': noPreviewRule } };
