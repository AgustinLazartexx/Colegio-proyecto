module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('users');

    if (!columns.acceso_habilitado) {
      await queryInterface.addColumn('users', 'acceso_habilitado', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }

    if (!columns.resetPasswordToken) {
      await queryInterface.addColumn('users', 'resetPasswordToken', {
        type: Sequelize.STRING(64),
        allowNull: true,
      });
    }

    if (!columns.resetPasswordExpiresAt) {
      await queryInterface.addColumn('users', 'resetPasswordExpiresAt', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },
};
