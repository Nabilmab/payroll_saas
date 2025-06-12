'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Department extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Department belongs to a Tenant
      Department.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant',
        allowNull: false, // A department must belong to a tenant
      });

      // Department can have many Employees
      Department.hasMany(models.Employee, {
        foreignKey: 'departmentId',
        as: 'employees',
      });
    }
  }

  Department.init({
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
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Department',
    tableName: 'departments',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      // Add a composite unique key for tenantId and name to ensure department names are unique within a tenant
      {
        unique: true,
        fields: ['tenantId', 'name'] // CORRECTED: Use camelCase model attribute names
      }
    ]
  });

  return Department;
};
