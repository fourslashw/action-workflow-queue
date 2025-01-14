// node modules
import { inspect } from 'util'

// packages
import core from '@actions/core'

// modules
import main from './lib/index.js'

// parse inputs
const inputs = {
  token: core.getInput('github-token', { required: true }),
  delay: Number(core.getInput('delay', { required: true })),
  timeout: Number(core.getInput('timeout', { required: true })),
  extra_workflow_ids: core.getInput('wait-other-workflows', { required: true })
}

// error handler
function errorHandler ({ message, stack, request }) {
  core.error(`${message}\n${stack}`)

  // debugging for API calls
  if (request) {
    const { method, url, body, headers } = request
    core.debug(`${method} ${url}\n\n${inspect(headers)}\n\n${inspect(body)}`)
  }

  process.exit(1)
}

// catch errors and exit
process.on('unhandledRejection', errorHandler)
process.on('uncaughtException', errorHandler)

await main(inputs)
