/* eslint-env node */
/* eslint-disable import/no-commonjs, import/no-nodejs-modules */

const formatDate = (date) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).format(date);

module.exports = async ({ github, context, pattern, message }) => {
  const { data: comments } = await github.issues.listComments({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
  });
  const comment = comments.find((c) => c.body.startsWith(pattern));

  const repo = { owner: context.repo.owner, repo: context.repo.repo };

  const updateComment = ({ comment_id, body }) =>
    github.issues.updateComment({ ...repo, comment_id, body });
  const createComment = ({ issue_number, body }) =>
    github.issues.createComment({ ...repo, issue_number, body });

  if (comment) {
    const body = `${message} [updated at ${formatDate(new Date())} UTC]`;
    updateComment({ comment_id: comment.id, body });
  } else {
    createComment({ issue_number: context.issue.number, body: message });
  }
};
