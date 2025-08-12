'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('rows', 'order', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addIndex('rows', ['listId', 'order']);

    await queryInterface.sequelize.query(`
      WITH ranked AS (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY "listId" ORDER BY COALESCE("createdAt",'1970-01-01'), id) - 1 AS rn
        FROM "rows"
      )
      UPDATE "rows" r
      SET "order" = ranked.rn
      FROM ranked
      WHERE r.id = ranked.id;
    `);

    await queryInterface.changeColumn('rows', 'order', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('rows', ['listId', 'order']);
    await queryInterface.removeColumn('rows', 'order');
  }
};
