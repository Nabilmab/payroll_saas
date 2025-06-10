'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserRole extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     * Even though associations are defined in User and Role via belongsToMany,
     * defining belongsTo here can be useful for querying UserRole directly.
     */
    static associate(models) {
      UserRole.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        allowNull: false,
      });
      UserRole.belongsTo(models.Role, {
        foreignKey: 'roleId',
        as: 'role',
        allowNull: false,
      });
    }
  }

  UserRole.init({
    id: { // Optional: often join tables don't have a separate id, relying on composite PK
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true, // Making it a primary key for simplicity here
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users', // Name of the User table
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE', // If a user is deleted, their role assignments are removed
      // primaryKey: true, // Part of a composite primary key if 'id' is not used
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'roles', // Name of the Role table
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE', // If a role is deleted, its assignments to users are removed
      // primaryKey: true, // Part of a composite primary key if 'id' is not used
    },
    // Add any additional attributes for the relationship here
    // For example:
    // assignedAt: {
    //   type: DataTypes.DATE,
    //   defaultValue: DataTypes.NOW,
    //   allowNull: false,
    // }
  }, {
    sequelize,
    modelName: 'UserRole', // Conventionally singular or matching the 'through' option
    tableName: 'user_roles', // Explicitly define table name
    timestamps: true,   // Enable timestamps (createdAt, updatedAt)
    // No 'paranoid' for join tables usually, as their existence is tied to the linked records.
    // If linked records are soft-deleted, the join record might be kept or deleted based on FK constraints.
    underscored: true,  // Use snake_case for automatically generated attributes
    indexes: [
      // Ensure that a user cannot have the same role multiple times
      {
        unique: true,
        fields: ['user_id', 'role_id']
      }
    ]
  });

  return UserRole;
};
