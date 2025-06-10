'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SalaryComponent extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // SalaryComponent belongs to a Tenant
      SalaryComponent.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant',
        allowNull: true,
      });

      // For components calculated as a percentage of another component
      // SalaryComponent.belongsTo(models.SalaryComponent, {
      //   foreignKey: 'basedOnComponentId',
      //   as: 'basedOnComponent',
      //   allowNull: true, // Null if not percentage-based or based on a fixed value/formula
      // });
      // SalaryComponent.hasMany(models.SalaryComponent, {
      //   foreignKey: 'basedOnComponentId',
      //   as: 'dependentComponents'
      // });

      // This component might be part of many EmployeeSalary structures or PayrollItems
      // Example: (Assuming an EmployeeSalaryComponent join table or direct use in PayrollItem)
      // SalaryComponent.belongsToMany(models.Employee, {
      //   through: 'EmployeeSalaryComponents', // Join table
      //   foreignKey: 'salaryComponentId',
      //   otherKey: 'employeeId',
      //   as: 'employees',
      //   through: { amount: DataTypes.DECIMAL(10, 2) } // Example of additional attribute in join table
      // });
    }
  }

  SalaryComponent.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'tenants', key: 'id' },
      onUpdate: 'CASCADE', onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: { // Earning or Deduction
      type: DataTypes.ENUM('earning', 'deduction'),
      allowNull: false,
    },
    calculation_type: { // How the component value is determined
      type: DataTypes.ENUM('fixed', 'percentage', 'formula'), // 'formula' might need custom logic
      allowNull: false,
      defaultValue: 'fixed',
    },
    amount: { // Fixed amount for 'fixed' type, or default/base amount.
      type: DataTypes.DECIMAL(12, 2), // Precision 12, 2 decimal places
      allowNull: true, // Might be null if 'percentage' or complex 'formula'
    },
    // percentage: { // Percentage value if 'percentage' type
    //   type: DataTypes.DECIMAL(5, 2), // e.g., 50.00 for 50%
    //   allowNull: true, // Null if not 'percentage' type
    // },
    // basedOnComponentId: { // Self-referential FK for percentage calculations
    //   type: DataTypes.UUID,
    //   allowNull: true,
    //   references: { model: 'salary_components', key: 'id' }, // Points to itself
    //   onUpdate: 'CASCADE', onDelete: 'SET NULL', // Or 'RESTRICT'
    // },
    // formula_json: { // For 'formula' type, store parameters or steps as JSON
    //   type: DataTypes.JSONB,
    //   allowNull: true,
    // },
    is_taxable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    is_system_defined: { // Indicates if this is a system-provided default component
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    payslip_display_order: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    component_code: { // For specific system components like 'SALBASE', 'IGR_PRELEV', 'CNSS_COT', 'AMO_COT'
      type: DataTypes.STRING,
      allowNull: true, // Can be null for tenant-defined components
      unique: true, // Ensures system codes are unique if provided
    },
    is_cnss_subject: { // Does this component contribute to the CNSS taxable base?
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    is_amo_subject: { // Does this component contribute to the AMO taxable base?
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    // order: { // For display or calculation order
    //   type: DataTypes.INTEGER,
    //   allowNull: true,
    // }
  }, {
    sequelize,
    modelName: 'SalaryComponent',
    tableName: 'salary_components',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      { fields: ['tenant_id'] },
      { unique: true, fields: ['tenant_id', 'name'], name: 'unique_tenant_salary_component_name' },
      // { fields: ['based_on_component_id'] },
    ]
  });

  return SalaryComponent;
};
