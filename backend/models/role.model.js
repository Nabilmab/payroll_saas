'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Role belongs to a Tenant
      Role.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant',
        allowNull: false, // A role must belong to a tenant
      });

      // Role can be assigned to many Users (through a join table, UserRoles)
      Role.belongsToMany(models.User, {
        through: 'user_roles', // Name of the join table
        foreignKey: 'roleId',    // Foreign key in user_roles linking to Role
        otherKey: 'userId',      // Foreign key in user_roles linking to User
        as: 'users',
      });
    }
  }

  Role.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    tenantId: { // Foreign key for Tenant
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tenants', // Name of the Tenant table
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE', // If a tenant is deleted, their roles are also deleted
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      // Roles should be unique within a tenant, handled by a composite unique key or application logic
      // unique: true, // This would make it unique globally, which might not be desired
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // You might add a 'permissions' field, perhaps JSONB, to store specific permissions for the role
    // permissions: {
    //   type: DataTypes.JSONB,
    //   allowNull: true,
    // }
  }, {
    sequelize,
    modelName: 'Role',
    tableName: 'roles', // Explicitly define table name
    timestamps: true,   // Enable timestamps (createdAt, updatedAt)
    paranoid: true,     // Enable soft deletes (deletedAt)
    underscored: true,  // Use snake_case for automatically generated attributes
    // Model attribute names (camelCase) are used in `fields`.
    // Sequelize, with `underscored: true`, maps these to snake_case DB column names.
    indexes: [
      // Add a composite unique key for tenantId and name to ensure role names are unique within a tenant
      {
        unique: true,
        // FIX: Use snake_case column names when `underscored: true` is set.
        fields: ['tenant_id', 'name']
      }
    ]
  });

  return Role;
};