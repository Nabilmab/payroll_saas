'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize'); // Sequelize constructor
const sequelize = require(__dirname + '/../config/database.js'); // The configured Sequelize instance
const basename = path.basename(__filename);
const db = {};

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    // Pass the sequelize instance and Sequelize constructor to the model definition function
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize; // The instance
db.Sequelize = Sequelize; // The constructor/library

module.exports = db;
