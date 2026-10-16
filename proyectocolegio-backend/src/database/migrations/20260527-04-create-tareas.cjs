module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tareas', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      titulo: { type: Sequelize.STRING, allowNull: false },
      descripcion: { type: Sequelize.TEXT, allowNull: true },
      fechaEntrega: { type: Sequelize.DATE, allowNull: false },
      materiaId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'materias', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      profesorId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      archivo: { type: Sequelize.STRING, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('Tareas');
  }
};
