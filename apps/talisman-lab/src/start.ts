#!/usr/bin/env node

import path from 'path';
import pino from 'pino';
import { runTalismanLabServer } from '.';
import { TALISMAN_LAB_APP_NAME } from './constants';

const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
  },
});

const server = runTalismanLabServer({
  logger,
  appProps: {},
  toolkitOptions: {
    entrypointJsFile: path.join(path.dirname(__dirname), 'dist/entrypoint.js'),
  },
  title: TALISMAN_LAB_APP_NAME,
  edition: 'cli',
});

const shutdown = () =>
  server
    .shutdown()
    .catch((err) => {
      logger.error({ err }, 'Error during shutdown');
    })
    .finally(() => {
      process.exit(0);
    });

// Catch SIGINT and SIGTERM to allow for graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down...');
  shutdown();
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down...');
  shutdown();
});

export {};
