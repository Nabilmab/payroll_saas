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
      field: 'tenant_id', // important
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
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
    },
    deletedAt: {
      type: DataTypes.DATE,
      field: 'deleted_at',
    },
  }, {
    sequelize,
    modelName: 'Department',
    tableName: 'departments',
    timestamps: true, // Sequelize will manage createdAt and updatedAt
    paranoid: true,   // Enables soft deletes (deletedAt)
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['tenantId', 'name'], // match real column names, not JS names
        name: 'departments_tenant_id_name' // Added name for the index as per issue example
      }
    ]
  });

  return Department;
};
