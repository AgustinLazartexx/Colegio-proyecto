const { DataTypes } = require("sequelize");

module.exports = {
  up: async (queryInterface) => {
    const columns = await queryInterface.describeTable("clase_alumnos");
    if (!columns.isActive) {
      await queryInterface.addColumn("clase_alumnos", "isActive", {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }
  },
  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable("clase_alumnos");
    if (columns.isActive) await queryInterface.removeColumn("clase_alumnos", "isActive");
  },
};
