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
      field: 'tenant_id',
      references: { model: 'tenants', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'employee_id',
      references: { model: 'employees', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    relationship: {
      type: DataTypes.ENUM('spouse', 'child', 'other_relative', 'civil_partner'), // Added more options
      allowNull: false,
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true, // Might not always be known or relevant for all types
    },
    // Indicates if this dependent qualifies for fiscal deductions (e.g., IGR relief in Morocco)
    is_fiscally_dependent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    // For tracking changes over time, e.g., if a dependent stops being fiscally dependent
    effective_start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    effective_end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true, // Null means currently effective
    },
    // Optional notes, e.g., child with disability for potentially different tax treatment
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'EmployeeDependent',
    tableName: 'employee_dependents',
    timestamps: true,
    paranoid: true, // Soft delete for historical records
    underscored: true,
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['employee_id'] },
      { fields: ['employee_id', 'full_name', 'date_of_birth'], unique: true, name: 'unique_employee_dependent_profile' } // Prevent exact duplicates for an employee
    ]
  });

  return EmployeeDependent;
};
