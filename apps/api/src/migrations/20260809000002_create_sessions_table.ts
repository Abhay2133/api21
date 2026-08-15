import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('sessions');
  if (!hasTable) {
    await knex.schema.createTable('sessions', (table) => {
      table.increments('id').primary();
      table.string('token', 255).notNullable().unique();
      table.string('username', 255).notNullable();
      table.string('ip_address', 45).notNullable();
      table.text('user_agent').notNullable();
      table.string('session_hash', 255).notNullable().defaultTo('');
      table.boolean('is_active').notNullable().defaultTo(true);
      table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
      table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('sessions');
}
