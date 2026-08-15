import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasDeployments = await knex.schema.hasTable('deployments');
  if (!hasDeployments) {
    await knex.schema.createTable('deployments', (table) => {
      table.string('id', 255).primary();
      table.string('status', 50).notNullable().defaultTo('pending');
      table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
      table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    });
  }

  const hasLogs = await knex.schema.hasTable('deployment_logs');
  if (!hasLogs) {
    await knex.schema.createTable('deployment_logs', (table) => {
      table.increments('id').primary();
      table.string('deployment_id', 255).notNullable().references('id').inTable('deployments').onDelete('CASCADE');
      table.text('message').notNullable();
      table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('deployment_logs');
  await knex.schema.dropTableIfExists('deployments');
}
