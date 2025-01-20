/* eslint-disable camelcase */

// node modules
import { inspect } from 'util'

// packages
import core from '@actions/core'
import github from '@actions/github'

export default async function ({ octokit, workflow_id, run_id, before, other_workflow_ids }) {

  const all_workflow_ids = other_workflow_ids.concat(workflow_id);

  // get current run of this workflow and all other workflows

  const run_arrays = await Promise.all(all_workflow_ids.map(async workflow_id => {
    const { data: { workflow_runs } } = await octokit.request('GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs', {
      ...github.context.repo,
      workflow_id
    });
    return workflow_runs;
  }));

  const workflow_runs = run_arrays.flat(1);

  // find any instances of the same workflow
  const active_runs = workflow_runs
    // limit to currently running ones
    .filter(run => ['in_progress', 'queued', 'waiting', 'pending', 'action_required', 'requested'].includes(run.status))
    // exclude this one
    .filter(run => run.id !== run_id)
    // get older runs

  let waiting_for = active_runs
    .filter(run => new Date(run.run_started_at) < before);


  // if we have a situation where this run and multiple others started at the exact same time (probably launched by the same trigger)
  // we should allow the workflow with the highest id to run and make all other wait
  const runs_with_same_start_to_wait = active_runs
    .filter(run => new Date(run.run_started_at) == before)
    .filter(run => run.id < run_id);

  waiting_for = waiting_for.concat(runs_with_same_start_to_wait);

  core.info(`found ${waiting_for.length} workflow runs`)
  core.debug(inspect(waiting_for.map(run => ({ id: run.id, name: run.name }))))

  return waiting_for
}
