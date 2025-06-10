'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Tenant extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Tenant has many Users
      Tenant.hasMany(models.User, {
        foreignKey: 'tenantId',
        as: 'users',
      });

      // Tenant has many Employees
      Tenant.hasMany(models.Employee, {
        foreignKey: 'tenantId',
        as: 'employees',
      });

      // Tenant has many Departments
      Tenant.hasMany(models.Department, {
        foreignKey: 'tenantId',
        as: 'departments',
      });

      // Tenant has many PayrollRuns
      Tenant.hasMany(models.PayrollRun, {
        foreignKey: 'tenantId',
        as: 'payrollRuns',
      });

      // Tenant has many Roles
      Tenant.hasMany(models.Role, {
        foreignKey: 'tenantId',
        as: 'roles',
      });
    }
  }
  Tenant.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active',
      allowNull: false,
    },
    schema_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
  }, {
    sequelize,
    modelName: 'Tenant',
    tableName: 'tenants', // Explicitly define table name
    timestamps: true, // Enable timestamps (createdAt, updatedAt)
    paranoid: true,   // Enable soft deletes (deletedAt)
    underscored: true, // Use snake_case for automatically generated attributes (e.g., foreign keys)
  });
  return Tenant;
};
