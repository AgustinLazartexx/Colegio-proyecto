module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('claseprofesores', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      claseId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'clases', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      profesorId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('ClaseProfesores');
  }
};
