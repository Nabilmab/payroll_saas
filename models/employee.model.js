'use strict';
const { Model, Op } = require('sequelize'); // Import Op

module.exports = (sequelize, DataTypes) => {
  class Employee extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Employee belongs to a Tenant
      Employee.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant',
        allowNull: false, // An employee must belong to a tenant
      });

      // Employee belongs to a Department
      Employee.belongsTo(models.Department, {
        foreignKey: 'departmentId',
        as: 'department',
        allowNull: true, // An employee might not be assigned to a department initially
      });

      // Employee might be linked to a User account
      Employee.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'userAccount', // Alias for the user account
        allowNull: true, // An employee might not have a system user account
      });

      // Employee can be part of many PayrollRuns (through a join table or direct FK if an employee is in one run at a time)
      // For simplicity, let's assume an Employee can be directly associated with multiple PayrollRun entries if needed.
      // Or, more commonly, a PayrollRun would have many EmployeePayroll entries.
      // For now, we'll leave this out and let PayrollRun handle its relation to employees.

      // Self-referential for manager/reportees
      Employee.belongsTo(models.Employee, {
        as: 'manager',
        foreignKey: 'reportingManagerId',
        // allowNull: true is implied by the field definition, not specified in association for belongsTo like this
      });

      Employee.hasMany(models.Employee, {
        as: 'reportees',
        foreignKey: 'reportingManagerId',
      });
    }
  }

  Employee.init({
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
      onUpdate: 'CASCADE', onDelete: 'CASCADE',
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: true, // Or false, depending on business rules
      references: { model: 'departments', key: 'id' },
      onUpdate: 'CASCADE', onDelete: 'SET NULL', // Or 'RESTRICT'
    },
    userId: { // Link to the user model, if the employee has a system login
      type: DataTypes.UUID,
      allowNull: true,
      unique: true, // One user account per employee
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE', onDelete: 'SET NULL',
    },
    employee_id_alt: { // An alternative employee ID, e.g., from an external system or company-specific
      type: DataTypes.STRING,
      allowNull: true,
      // unique: true, // Could be unique within a tenant
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: { // Work email, might be different from user account email
      type: DataTypes.STRING,
      allowNull: true, // Or false, depending on requirements
      validate: { isEmail: true },
      // unique: true, // Could be unique within a tenant
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    job_title: {
      type: DataTypes.STRING,
      allowNull: true, // Or false
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    hire_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    termination_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    status: { // e.g., active, on_leave, terminated
      type: DataTypes.ENUM('active', 'on_leave', 'terminated', 'pending_hire'),
      defaultValue: 'pending_hire',
      allowNull: false,
    },
    reportingManagerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'employees', // Table name for Employee model
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    // Add other employee-specific fields like address, salary info (could be in a separate model), etc.
  }, {
    sequelize,
    modelName: 'Employee',
    tableName: 'employees',
    timestamps: true,
    paranoid: true, // Soft deletes for employee records
    underscored: true,
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['department_id'] },
      { fields: ['user_id'] },
      { unique: true, fields: ['tenant_id', 'email'],  name: 'unique_tenant_employee_email',  where: { email: { [Op.ne]: null } } }, // Unique work email within a tenant if not null
      { unique: true, fields: ['tenant_id', 'employee_id_alt'], name: 'unique_tenant_employee_id_alt', where: { employee_id_alt: { [Op.ne]: null } } } // Unique alt ID within a tenant if not null
    ]
  });

  return Employee;
};
