module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('clasealumnos', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      claseId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'clases', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      alumnoId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('ClaseAlumnos');
  }
};
