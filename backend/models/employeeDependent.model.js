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
      references: { model: 'tenants', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
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
    }
  }, {
    sequelize,
    modelName: 'EmployeeDependent',
    tableName: 'employee_dependents',
    timestamps: true,
    paranoid: true, // Soft delete for historical records
    underscored: true,
    indexes: [
      { fields: ['tenantId'] }, // DB column name
      { fields: ['employeeId'] }, // DB column name
      // DB column names, mapping from model attributes (fullName, dateOfBirth) handled by underscored: true
      { fields: ['employeeId', 'fullName', 'dateOfBirth'], unique: true, name: 'unique_employee_dependent_profile' }
    ]
  });

  return EmployeeDependent;
};
