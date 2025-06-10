'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs'); // For password hashing

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // User belongs to a Tenant
      User.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant',
        allowNull: false, // A user must belong to a tenant
      });

      // User can have many Roles (through a join table, UserRoles)
      // User.belongsToMany(models.Role, {
      //   through: 'UserRoles', // Name of the join table
      //   foreignKey: 'userId',
      //   otherKey: 'roleId',
      //   as: 'roles',
      // });
    }

    // Instance method to check password
    validPassword(password) {
      return bcrypt.compareSync(password, this.password_hash);
    }
  }

  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    tenantId: { // Foreign key for Tenant
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tenants', // Name of the Tenant table
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE', // Or 'SET NULL' or 'RESTRICT' depending on requirements
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Email should be unique across all users
      validate: {
        isEmail: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'pending_verification'),
      defaultValue: 'pending_verification',
      allowNull: false,
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Add other user-specific fields here (e.g., phone_number, profile_picture_url)
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users', // Explicitly define table name
    timestamps: true,   // Enable timestamps (createdAt, updatedAt)
    paranoid: true,     // Enable soft deletes (deletedAt)
    underscored: true,  // Use snake_case for automatically generated attributes

    hooks: {
      // Before saving, hash the password if it has been changed
      beforeSave: async (user, options) => {
        if (user.changed('password_hash')) { // Or if you have a virtual 'password' field
          const salt = await bcrypt.genSalt(10);
          user.password_hash = await bcrypt.hash(user.password_hash, salt);
        }
      },
    },
    defaultScope: {
      attributes: { exclude: ['password_hash'] }, // Don't return password hash by default
    },
    scopes: {
      withPassword: {
        attributes: { include: ['password_hash'] },
      },
    },
  });

  return User;
};
