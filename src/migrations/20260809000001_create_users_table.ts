import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('users');
  if (!hasTable) {
    await knex.schema.createTable('users', (table) => {
      table.increments('id').primary();
      table.string('name', 255).notNullable();
      table.string('email', 255).notNullable().unique();
      table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
      table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
