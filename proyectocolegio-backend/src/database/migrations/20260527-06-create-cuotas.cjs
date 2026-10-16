module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('cuotas', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      usuarioId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      monto: { type: Sequelize.DECIMAL(10,2), allowNull: false },
      fechaVencimiento: { type: Sequelize.DATE, allowNull: true },
      pagado: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('Cuotas');
  }
};
