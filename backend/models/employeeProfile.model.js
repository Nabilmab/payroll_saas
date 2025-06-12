'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EmployeeProfile extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // EmployeeProfile belongs to one Employee
      EmployeeProfile.belongsTo(models.Employee, {
        foreignKey: 'employeeId',
        as: 'employee',
        allowNull: false,
      });
    }
  }

  EmployeeProfile.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true, // Crucial for a one-to-one relationship
      references: {
        model: 'employees', // Name of the Employee table
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE', // If the employee record is deleted, their profile is also deleted
    },
    // Address fields
    addressLine1: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    addressLine2: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    stateProvinceRegion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Emergency Contact
    emergencyContactName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    emergencyContactPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    emergencyContactRelationship: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Highly sensitive information - consider encryption or other security measures
    // For example, these fields might be stored encrypted or in a separate, more secure system.
    // ssn: { // Social Security Number - example of highly sensitive data
    //   type: DataTypes.STRING, // Store encrypted if necessary
    //   allowNull: true,
    // },
    // bank_account_number: { // Example of highly sensitive data
    //   type: DataTypes.STRING, // Store encrypted if necessary
    //   allowNull: true,
    // },
    // bank_routing_number: { // Example of highly sensitive data
    //   type: DataTypes.STRING, // Store encrypted if necessary
    //   allowNull: true,
    // },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Other profile information like preferred_pronouns, allergies, etc.
  }, {
    sequelize,
    modelName: 'EmployeeProfile',
    tableName: 'employee_profiles',
    timestamps: true,   // Enable timestamps (createdAt, updatedAt)
    paranoid: true,     // Enable soft deletes, aligns with Employee model
    underscored: true,
    indexes: [
      // employee_id here refers to the DB column name.
      // Sequelize will map the employeeId attribute (camelCase) to employee_id column (snake_case)
      // due to `underscored: true`.
      { fields: ['employee_id'], unique: true }
    ]
  });

  return EmployeeProfile;
};
