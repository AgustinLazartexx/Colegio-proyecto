module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('calificaciones', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      alumnoId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      materiaId: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'materias', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      nota: { type: Sequelize.DECIMAL(5,2), allowNull: false },
      tipo: { type: Sequelize.STRING, allowNull: true },
      comentario: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('Calificaciones');
  }
};
