module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      nombre: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      rol: { type: Sequelize.ENUM('alumno','profesor','admin'), allowNull: false },
      dni: { type: Sequelize.STRING, allowNull: true, unique: true },
      codigoAlumno: { type: Sequelize.STRING, allowNull: true, unique: true },
      anio: { type: Sequelize.INTEGER, allowNull: true },
      division: { type: Sequelize.STRING, allowNull: true },
      mustChangePassword: { type: Sequelize.BOOLEAN, defaultValue: true },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      acceso_habilitado: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('Users');
  }
};
