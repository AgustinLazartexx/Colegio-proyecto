module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('clases', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      materiaId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'materias', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      anio: { type: Sequelize.INTEGER, allowNull: false },
      division: { type: Sequelize.STRING, allowNull: false },
      diaSemana: { type: Sequelize.STRING, allowNull: false },
      horaInicio: { type: Sequelize.STRING, allowNull: false },
      horaFin: { type: Sequelize.STRING, allowNull: false },
      duracion: { type: Sequelize.INTEGER, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('Clases', ['materiaId','anio','division','diaSemana','horaInicio'], { unique: true });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('Clases');
  }
};
