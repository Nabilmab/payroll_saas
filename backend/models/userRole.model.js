'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserRole extends Model {
    static associate(models) {
      // These associations are helpful for querying the join table directly if needed
      UserRole.belongsTo(models.User, { foreignKey: 'userId' });
      UserRole.belongsTo(models.Role, { foreignKey: 'roleId' });
    }
  }

  UserRole.init({
    // REMOVED the separate 'id' column
    userId: {
      type: DataTypes.UUID,
      primaryKey: true, // Part of the composite primary key
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    roleId: {
      type: DataTypes.UUID,
      primaryKey: true, // Part of the composite primary key
      references: { model: 'roles', key: 'id' },
      onDelete: 'CASCADE',
    },
  }, {
    sequelize,
    modelName: 'UserRole',
    tableName: 'user_roles',
    timestamps: true,
    underscored: true,
    // No 'paranoid' needed for a join table
  });

  return UserRole;
};
