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
      field: 'department_id', // Add field mapping for consistency
      references: { model: 'departments', key: 'id' },
      onUpdate: 'CASCADE', onDelete: 'SET NULL',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      unique: true,
      field: 'user_id', // Add field mapping
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE', onDelete: 'SET NULL',
    },
    employeeIdAlt: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'employee_id_alt',
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'first_name',
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'last_name',
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { isEmail: true },
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'phone_number',
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    jobTitle: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'job_title',
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'date_of_birth',
    },
    hireDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'hire_date',
    },
    terminationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'termination_date',
    },
    // --- THIS IS THE FIX ---
    status: {
      type: DataTypes.STRING, // Changed from ENUM
      defaultValue: 'pending_hire',
      allowNull: false,
      validate: {
        isIn: {
          args: [['active', 'on_leave', 'terminated', 'pending_hire']],
          msg: "Status must be one of: active, on_leave, terminated, pending_hire"
        }
      }
    },
    // --- END OF FIX ---
    reportingManagerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'reporting_manager_id', // Add field mapping
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
    // Add underscored: true to automatically map camelCase model fields to snake_case table columns.
    underscored: true,
    indexes: [
      { name: 'employees_tenant_id_idx', fields: ['tenant_id'] },
      { name: 'employees_department_id_idx', fields: ['department_id'] }, // Use snake_case
      { name: 'employees_user_id_idx', fields: ['user_id'] }, // Use snake_case
      { unique: true, fields: ['tenant_id', 'email'], name: 'unique_tenant_employee_email', where: { email: { [Op.ne]: null } } },
      { unique: true, fields: ['tenant_id', 'employee_id_alt'], name: 'unique_tenant_employee_id_alt', where: { employee_id_alt: { [Op.ne]: null } } }
    ]
  });

  return Employee;
};