module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('entregas', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      tareaId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'tareas', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      alumnoId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      archivo: { type: Sequelize.STRING, allowNull: true },
      fechaEntrega: { type: Sequelize.DATE, allowNull: true },
      comentario: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('Entregas');
  }
};
