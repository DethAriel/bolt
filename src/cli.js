// @flow
import meow from 'meow';
import chalk from 'chalk';
import * as logger from './utils/logger';
import * as processes from './utils/processes';
import * as commands from './commands/index';
import {PError} from './utils/errors';
import cleanStack from 'clean-stack';
import pyarn from './lib';

export default async function run(argv: Array<string>, exit: boolean = false) {
  const cli = meow({
    argv,
    help: `
      usage
        $ pyarn [command] <...args> <...opts>

      commands
        init         init a pyarn project
        install      install a pyarn project
        add          add a dependency to a pyarn project
        upgrade      upgrade a dependency in a pyarn project
        remove       remove a dependency from a pyarn project
        exec         execute a command in a pyarn project
        run          run a script in a pyarn project
        publish      publish all the packages in a pyarn project
        workspaces   run a pyarn command inside all workspaces
        workspace    run a pyarn command inside a specific workspace
        help         get help with pyarn commands

      pyarn-specific commands
        normalize    normalize dependency version ranges across packages (useful when adopting pyarn)
    `,
  });

  let [command, ...args] = cli.input;
  let opts = cli.flags;

  if (!command) {
    command = 'install';
  } else if (!commands[command]) {
    args = [command, ...args];
    command = 'run';
  }

  let start = Date.now();

  logger.title(`pyarn ${command} v${cli.pkg.version}`);

  processes.handleSignals();

  try {
    await pyarn(command, args, opts);
  } catch (err) {
    if (err instanceof PError) {
      logger.error(err.message);
    } else {
      logger.error(cleanStack(err.stack));
    }

    if (exit) {
      process.exit(1);
    } else {
      throw err;
    }
  }

  const timing = (Date.now() - start) / 1000;
  const rounded = Math.round(timing * 100) / 100;

  logger.log(`Done in ${rounded}s.`);
}