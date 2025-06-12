// C:\payroll_saas\jest.config.js
module.exports = {
  testEnvironment: 'node',
  verbose: true,
  rootDir: './backend',
  // We no longer need the separate setupFiles for the environment
  setupFilesAfterEnv: ['./jest.setup.js'],
};