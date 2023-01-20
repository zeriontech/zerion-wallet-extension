/* eslint-env node */
/* eslint-disable import/no-commonjs, import/no-nodejs-modules */

module.exports = async ({ github, context, name }) => {
  let artifacts = await github.rest.actions.listWorkflowRunArtifacts({
    owner: context.repo.owner,
    repo: context.repo.repo,
    run_id: context.payload.workflow_run.id,
  });
  let matchArtifact = artifacts.data.artifacts.filter((artifact) => {
    return artifact.name == name;
  })[0];
  let download = await github.rest.actions.downloadArtifact({
    owner: context.repo.owner,
    repo: context.repo.repo,
    artifact_id: matchArtifact.id,
    archive_format: 'zip',
  });
  let fs = require('fs');
  fs.writeFileSync(
    `${process.env.GITHUB_WORKSPACE}/${name}.zip`,
    Buffer.from(download.data)
  );
};
