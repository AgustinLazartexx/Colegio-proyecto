const { DataTypes } = require("sequelize");

module.exports = {
  up: async (queryInterface) => {
    for (const table of ["materias", "clases"]) {
      const columns = await queryInterface.describeTable(table);
      if (!columns.isActive) {
        await queryInterface.addColumn(table, "isActive", {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        });
      }
    }
  },
  down: async (queryInterface) => {
    for (const table of ["clases", "materias"]) {
      const columns = await queryInterface.describeTable(table);
      if (columns.isActive) await queryInterface.removeColumn(table, "isActive");
    }
  },
};
