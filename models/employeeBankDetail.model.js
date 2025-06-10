'use strict';
const { Model } = require('sequelize');

// Consider using a library for encryption/decryption if these fields are stored directly.
// For example, sequelize-encrypted fields or application-level encryption.

module.exports = (sequelize, DataTypes) => {
  class EmployeeBankDetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // EmployeeBankDetail belongs to one Employee
      EmployeeBankDetail.belongsTo(models.Employee, {
        foreignKey: 'employeeId',
        as: 'employee',
        allowNull: false,
      });
    }
  }

  EmployeeBankDetail.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'employees', // Name of the Employee table
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE', // If the employee record is deleted, their bank details are also deleted
    },
    // All fields below are highly sensitive.
    // Ensure proper security measures like encryption at rest and restricted access are implemented.
    account_holder_name: {
      type: DataTypes.STRING, // Potentially encrypted
      allowNull: false,
    },
    bank_name: {
      type: DataTypes.STRING, // Potentially encrypted
      allowNull: false,
    },
    account_number: { // This should definitely be encrypted if stored.
      type: DataTypes.STRING, // Store encrypted
      allowNull: false,
      // Add validation for format if possible
    },
    routing_number: { // (e.g., ABA for US, or sort code for UK) - Encrypt if stored.
      type: DataTypes.STRING, // Store encrypted
      allowNull: true, // May not be applicable for all regions/banks
    },
    iban: { // International Bank Account Number - Encrypt if stored.
      type: DataTypes.STRING, // Store encrypted
      allowNull: true,
    },
    swift_bic: { // SWIFT/BIC code - Encrypt if stored.
      type: DataTypes.STRING, // Store encrypted
      allowNull: true,
    },
    account_type: { // E.g., 'checking', 'savings'
      type: DataTypes.ENUM('checking', 'savings', 'other'),
      allowNull: true,
    },
    currency: { // e.g., USD, EUR
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'USD', // Set a common default
    },
    is_primary: { // If an employee can have multiple accounts, one might be primary
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    // Custom fields for verification status, etc.
    // bank_verification_status: {
    //   type: DataTypes.ENUM('pending', 'verified', 'failed'),
    //   defaultValue: 'pending',
    // }
  }, {
    sequelize,
    modelName: 'EmployeeBankDetail',
    tableName: 'employee_bank_details',
    timestamps: true,
    paranoid: true, // Soft delete might be required for audit trails
    underscored: true,
    indexes: [
      { fields: ['employee_id'] },
      // An employee might have multiple bank accounts, so employee_id is not unique here alone.
      // A combination of employee_id and account_number (if decrypted) might be unique,
      // but enforcing uniqueness on encrypted data is tricky at DB level.
      // Application logic should handle preventing exact duplicates if needed.
    ]
  });

  return EmployeeBankDetail;
};
