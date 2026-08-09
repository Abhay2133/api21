import knex, { Knex } from 'knex';
import knexConfig from '../../knexfile.js';
import { config } from './env.js';

const environment = config.env || 'development';
const activeConfig = knexConfig[environment] || knexConfig.development;

let knexInstance: Knex | null = null;

export const getKnexDb = (): Knex => {
  if (!knexInstance) {
    knexInstance = knex(activeConfig);
  }
  return knexInstance;
};
