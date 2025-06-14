// --- START OF UPDATED FILE ---
// ---
// backend/models/employee.model.js
// ---
'use strict';
const { Model, Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Employee extends Model {
    static associate(models) {
      Employee.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant',
        allowNull: false,
      });

      Employee.belongsTo(models.Department, {
        foreignKey: 'departmentId',
        as: 'department',
        allowNull: true,
      });

      Employee.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'userAccount',
        allowNull: true,
      });

      Employee.belongsTo(models.Employee, {
        as: 'manager',
        foreignKey: 'reportingManagerId',
      });

      Employee.hasMany(models.Employee, {
        as: 'reportees',
        foreignKey: 'reportingManagerId',
      });

      Employee.hasMany(models.EmployeeDependent, {
        foreignKey: 'employeeId',
        as: 'dependents',
      });

      Employee.hasMany(models.Payslip, {
        foreignKey: 'employeeId',
        as: 'payslips'
      });

      // FIX: Add the missing association
      Employee.hasMany(models.EmployeeSalarySetting, {
        foreignKey: 'employeeId',
        as: 'employeeSalarySettings',
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
      field: 'tenant_id',
      references: { model: 'tenants', key: 'id' },
      onUpdate: 'CASCADE', onDelete: 'CASCADE',
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'departments', key: 'id' },
      onUpdate: 'CASCADE', onDelete: 'SET NULL',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      unique: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE', onDelete: 'SET NULL',
    },
    employeeIdAlt: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { isEmail: true },
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    jobTitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    hireDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    terminationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'on_leave', 'terminated', 'pending_hire'),
      defaultValue: 'pending_hire',
      allowNull: false,
    },
    reportingManagerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'employees',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
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
    modelName: 'Employee',
    tableName: 'employees',
    timestamps: true,
    paranoid: true,
    indexes: [
      { name: 'employees_tenant_id_idx', fields: ['tenant_id'] },
      { fields: ['departmentId'] },
      { fields: ['userId'] },
      { unique: true, fields: ['tenant_id', 'email'], name: 'unique_tenant_employee_email', where: { email: { [Op.ne]: null } } },
      { unique: true, fields: ['tenant_id', 'employeeIdAlt'], name: 'unique_tenant_employee_id_alt', where: { employeeIdAlt: { [Op.ne]: null } } }
    ]
  });

  return Employee;
};