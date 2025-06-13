'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EmployeeDependent extends Model {
    static associate(models) {
      EmployeeDependent.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant',
        allowNull: false,
      });
      EmployeeDependent.belongsTo(models.Employee, {
        foreignKey: 'employeeId',
        as: 'employee',
        allowNull: false,
      });
    }
  }

  EmployeeDependent.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'tenant_id', // important!
      references: { model: 'tenants', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'employee_id', // important!
      references: { model: 'employees', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    relationship: {
      type: DataTypes.ENUM('spouse', 'child', 'other_relative', 'civil_partner'), // Added more options
      allowNull: false,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true, // Might not always be known or relevant for all types
    },
    // Indicates if this dependent qualifies for fiscal deductions (e.g., IGR relief in Morocco)
    isFiscallyDependent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    // For tracking changes over time, e.g., if a dependent stops being fiscally dependent
    effectiveStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    effectiveEndDate: {
      type: DataTypes.DATEONLY,
      allowNull: true, // Null means currently effective
    },
    // Optional notes, e.g., child with disability for potentially different tax treatment
    notes: {
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
    modelName: 'EmployeeDependent',
    tableName: 'employee_dependents',
    timestamps: true,
    paranoid: true, // Soft delete for historical records
    // underscored: true, // REMOVED
    indexes: [
      { name: 'employee_dependents_tenant_id', fields: ['tenant_id'] }, // Updated
      { name: 'employee_dependents_employee_id_idx', fields: ['employee_id'] }, // Updated
      // Model attribute names, will be mapped to snake_case by underscored: true
      { fields: ['employee_id', 'full_name', 'date_of_birth'], unique: true, name: 'unique_employee_dependent_profile' } // Updated
    ]
  });

  return EmployeeDependent;
};
