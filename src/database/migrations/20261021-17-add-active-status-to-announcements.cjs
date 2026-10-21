const { DataTypes } = require("sequelize");

module.exports = {
  up: async (queryInterface) => {
    const columns = await queryInterface.describeTable("school_anuncios");
    if (!columns.isActive) {
      await queryInterface.addColumn("school_anuncios", "isActive", {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }
  },
  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable("school_anuncios");
    if (columns.isActive) await queryInterface.removeColumn("school_anuncios", "isActive");
  },
};
