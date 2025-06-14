// --- START OF FINAL seed.js FILE ---
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { sequelize, Tenant, User, Role, Department, Employee, SalaryComponent, PaySchedule, EmployeeDependent, EmployeeSalarySetting } = require('../models');

/**
 * @typedef {Object} TenantData
 * @property {string} name
 * @property {string} [description]
 * @property {string} schemaName
 * @property {Tenant?} instance
 */
const tenantsData = [
  { name: "TechSolutions SARL", description: "Solutions technologiques innovantes pour le Maroc.", schemaName: "techsolutions" },
  { name: "Artisanat Marocain Coop", description: "L'artisanat traditionnel marocain à portée de main.", schemaName: "artisanat" },
  { name: "Services Financiers Al Maghrib", description: "Votre partenaire financier de confiance.", schemaName: "sfmaghrib" },
];

/**
 * @typedef {Object} RoleData
 * @property {string} name
 * @property {string} [description]
 * @property {Role?} instance
 */
const rolesData = [
  { name: "Admin", description: "Administrateur système avec tous les privilèges." },
  { name: "Manager", description: "Responsable d'équipe ou de département." },
  { name: "Employé", description: "Employé standard." },
  { name: "Comptable", description: "Responsable de la comptabilité et de la paie." },
];

/**
 * @typedef {Object} UserData
 * @property {string} email
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} password
 * @property {string} tenantName
 * @property {string[]} roleNames
 * @property {string} [status='active']
 * @property {User?} instance
 */
const usersData = [
  { firstName: "Admin", lastName: "TechSol", email: "admin@techsolutions.ma", password: "password123", tenantName: "TechSolutions SARL", roleNames: ["Admin"], status: "active" },
  { firstName: "Fatima", lastName: "Zahra", email: "manager.rh@techsolutions.ma", password: "password123", tenantName: "TechSolutions SARL", roleNames: ["Manager", "Comptable"], status: "active" },
  { firstName: "Ahmed", lastName: "Bennani", email: "dev.ahmed@techsolutions.ma", password: "password123", tenantName: "TechSolutions SARL", roleNames: ["Employé"], status: "active" },
  { firstName: "Admin", lastName: "Artisanat", email: "admin@artisanatmaroc.ma", password: "password123", tenantName: "Artisanat Marocain Coop", roleNames: ["Admin", "Manager"], status: "active" },
  { firstName: "Fatima", lastName: "El Fassi", email: "artisan.fatima@artisanatmaroc.ma", password: "password123", tenantName: "Artisanat Marocain Coop", roleNames: ["Employé"], status: "active" },
  { firstName: "Directeur", lastName: "Financier", email: "directeur.financier@sfalmaghrib.ma", password: "password123", tenantName: "Services Financiers Al Maghrib", roleNames: ["Admin", "Manager", "Comptable"], status: "active" },
  { firstName: "Youssef", lastName: "Tazi", email: "analyste.youssef@sfalmaghrib.ma", password: "password123", tenantName: "Services Financiers Al Maghrib", roleNames: ["Employé"], status: "active" },
  { firstName: "Youssef", lastName: "Alaoui", email: "youssef.marketing@artisanatmaroc.ma", password: "password123", tenantName: "Artisanat Marocain Coop", roleNames: ["Employé"], status: "active" },
  { firstName: "Amina", lastName: "Saidi", email: "amina.clientele@sfalmaghrib.ma", password: "password123", tenantName: "Services Financiers Al Maghrib", roleNames: ["Employé"], status: "active" },
];

/**
 * @typedef {Object} DepartmentData
 * @property {string} name
 * @property {string} tenantName
 * @property {string} [managerEmail]
 * @property {Department?} instance
 */
const departmentsData = [
  { name: "Technologie de l'Information", tenantName: "TechSolutions SARL", managerEmail: "manager.rh@techsolutions.ma" },
  { name: "Ressources Humaines", tenantName: "TechSolutions SARL", managerEmail: "manager.rh@techsolutions.ma" },
  { name: "Développement Logiciel", tenantName: "TechSolutions SARL", managerEmail: "manager.rh@techsolutions.ma"},
  { name: "Production Artisanale", tenantName: "Artisanat Marocain Coop", managerEmail: "admin@artisanatmaroc.ma" },
  { name: "Ventes et Marketing", tenantName: "Artisanat Marocain Coop", managerEmail: "admin@artisanatmaroc.ma" },
  { name: "Analyse Financière", tenantName: "Services Financiers Al Maghrib", managerEmail: "directeur.financier@sfalmaghrib.ma" },
  { name: "Service Clientèle", tenantName: "Services Financiers Al Maghrib", managerEmail: "directeur.financier@sfalmaghrib.ma" },
];

/**
 * @typedef {Object} EmployeeData
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} [phoneNumber]
 * @property {Date} dateOfBirth
 * @property {string} [address]
 * @property {Date} hireDate
 * @property {string} [jobTitle]
 * @property {string} departmentName
 * @property {string} tenantName
 * @property {string} [managerEmail]
 * @property {Employee?} instance
 */
const employeesData = [
  { firstName: "Ahmed", lastName: "Bennani", email: "dev.ahmed@techsolutions.ma", phoneNumber: "0612345678", dateOfBirth: new Date("1990-05-15"), address: "12 Rue de la Liberté, Casablanca", hireDate: new Date("2022-01-10"), jobTitle: "Développeur Senior", departmentName: "Développement Logiciel", tenantName: "TechSolutions SARL", managerEmail: "manager.rh@techsolutions.ma" },
  { firstName: "Fatima", lastName: "Zahra", email: "manager.rh@techsolutions.ma", phoneNumber: "0698765432", dateOfBirth: new Date("1985-11-20"), address: "45 Avenue Hassan II, Rabat", hireDate: new Date("2020-03-01"), jobTitle: "Responsable RH et Comptabilité", departmentName: "Ressources Humaines", tenantName: "TechSolutions SARL", managerEmail: null },
  { firstName: "Fatima", lastName: "El Fassi", email: "artisan.fatima@artisanatmaroc.ma", phoneNumber: "0655554433", dateOfBirth: new Date("1978-03-25"), address: "7 Derb Lihoudi, Fès", hireDate: new Date("2015-06-01"), jobTitle: "Artisane Principale", departmentName: "Production Artisanale", tenantName: "Artisanat Marocain Coop", managerEmail: "admin@artisanatmaroc.ma" },
  { firstName: "Youssef", lastName: "Alaoui", email: "youssef.marketing@artisanatmaroc.ma", phoneNumber: "0622334455", dateOfBirth: new Date("1992-07-12"), address: "10 Rue Souika, Marrakech", hireDate: new Date("2023-01-20"), jobTitle: "Spécialiste Marketing", departmentName: "Ventes et Marketing", tenantName: "Artisanat Marocain Coop", managerEmail: "admin@artisanatmaroc.ma" },
  { firstName: "Youssef", lastName: "Tazi", email: "analyste.youssef@sfalmaghrib.ma", phoneNumber: "0677889900", dateOfBirth: new Date("1995-09-03"), address: "33 Boulevard Mohammed V, Agadir", hireDate: new Date("2024-02-01"), jobTitle: "Analyste Financier Junior", departmentName: "Analyse Financière", tenantName: "Services Financiers Al Maghrib", managerEmail: "directeur.financier@sfalmaghrib.ma" },
  { firstName: "Amina", lastName: "Saidi", email: "amina.clientele@sfalmaghrib.ma", phoneNumber: "0611223344", dateOfBirth: new Date("1988-12-30"), address: "5 Avenue des FAR, Tanger", hireDate: new Date("2021-08-15"), jobTitle: "Chargée de Clientèle", departmentName: "Service Clientèle", tenantName: "Services Financiers Al Maghrib", managerEmail: "directeur.financier@sfalmaghrib.ma" },
];

const salaryComponentsData = [
  { name: "Salaire de Base", tenantName: "TechSolutions SARL", type: "earning", category: "employee_earning", calculationType: "fixed", is_taxable: true, componentCode: 'BASE_SALARY_MONTHLY', isCnssSubject: true, isAmoSubject: true, payslipDisplayOrder: 1 },
  { name: "Prime d'Ancienneté", tenantName: "TechSolutions SARL", type: "earning", category: "employee_earning", calculationType: "formula", is_taxable: true, componentCode: 'SENIORITY_BONUS', isCnssSubject: true, isAmoSubject: true, payslipDisplayOrder: 5 },
  { name: "Indemnité de Transport", tenantName: "TechSolutions SARL", type: "earning", category: "employee_earning", calculationType: "fixed", amount: 500, is_taxable: false, componentCode: 'TRANSPORT_ALLOWANCE', isCnssSubject: false, isAmoSubject: false, payslipDisplayOrder: 10 },
  { name: "CNSS", tenantName: "TechSolutions SARL", type: "deduction", category: "statutory_deduction", calculationType: "percentage", percentage: 6.74, is_taxable: false, componentCode: 'CNSS_EMPLOYEE', isCnssSubject: false, isAmoSubject: false, payslipDisplayOrder: 100 },
  { name: "AMO", tenantName: "TechSolutions SARL", type: "deduction", category: "statutory_deduction", calculationType: "percentage", percentage: 2.26, is_taxable: false, componentCode: 'AMO_EMPLOYEE', isCnssSubject: false, isAmoSubject: false, payslipDisplayOrder: 101 },
  { name: "IGR (Impôt Général sur le Revenu)", tenantName: "TechSolutions SARL", type: "deduction", category: "statutory_deduction", calculationType: "formula", is_taxable: false, componentCode: 'IGR_MONTHLY', isCnssSubject: false, isAmoSubject: false, payslipDisplayOrder: 102 },
  { name: "Salaire de Base", tenantName: "Artisanat Marocain Coop", type: "earning", category: "employee_earning", calculationType: "fixed", is_taxable: true, componentCode: 'BASE_SALARY_MONTHLY', isCnssSubject: true, isAmoSubject: true, payslipDisplayOrder: 1 },
  { name: "CNSS", tenantName: "Artisanat Marocain Coop", type: "deduction", category: "statutory_deduction", calculationType: "percentage", percentage: 6.74, is_taxable: false, componentCode: 'CNSS_EMPLOYEE', isCnssSubject: false, isAmoSubject: false, payslipDisplayOrder: 100 },
];

const paySchedulesData = [
  { name: "Paiement Mensuel Standard", frequency: "monthly", payDayOfMonth: 28, tenantName: "TechSolutions SARL" },
  { name: "Paiement Fin de Mois Artisans", frequency: "monthly", payDayOfMonth: 30, tenantName: "Artisanat Marocain Coop" },
];

const employeeDependentsData = [
  { employeeEmail: "dev.ahmed@techsolutions.ma", tenantName: "TechSolutions SARL", fullName: "Aisha Bennani", relationship: "spouse", dateOfBirth: new Date("1991-08-20"), isFiscallyDependent: true },
  { employeeEmail: "dev.ahmed@techsolutions.ma", tenantName: "TechSolutions SARL", fullName: "Omar Bennani", relationship: "child", dateOfBirth: new Date("2018-05-10"), isFiscallyDependent: true },
];

const employeeSalarySettingsData = [
  { employeeEmail: "dev.ahmed@techsolutions.ma", tenantName: "TechSolutions SARL", componentName: "Salaire de Base", componentType: "earning", effectiveDate: new Date("2023-01-01"), amount: 18000.00, isActive: true },
  { employeeEmail: "dev.ahmed@techsolutions.ma", tenantName: "TechSolutions SARL", componentName: "Indemnité de Transport", componentType: "earning", effectiveDate: new Date("2023-01-01"), amount: 400.00, isActive: true },
  { employeeEmail: "dev.ahmed@techsolutions.ma", tenantName: "TechSolutions SARL", componentName: "CNSS", componentType: "deduction", effectiveDate: new Date("2023-01-01"), isActive: true },
  { employeeEmail: "dev.ahmed@techsolutions.ma", tenantName: "TechSolutions SARL", componentName: "AMO", componentType: "deduction", effectiveDate: new Date("2023-01-01"), isActive: true },
  { employeeEmail: "manager.rh@techsolutions.ma", tenantName: "TechSolutions SARL", componentName: "Salaire de Base", componentType: "earning", effectiveDate: new Date("2023-01-01"), amount: 25000.00, isActive: true },
];

// --- Seeding Functions ---

async function seedTenants() {
  console.log('Seeding tenants...');
  for (const tenantData of tenantsData) {
    const [tenant, created] = await Tenant.findOrCreate({ where: { schemaName: tenantData.schemaName }, defaults: tenantData });
    tenantData.instance = tenant;
    if (created) console.log(`Tenant '${tenant.name}' created with schema '${tenant.schemaName}'.`);
    else console.log(`Tenant '${tenant.name}' with schema '${tenant.schemaName}' already exists.`);
  }
}

async function seedRoles() {
  console.log('Seeding roles...');
  for (const tenantData of tenantsData) {
    if (!tenantData.instance) continue;
    for (const roleData of rolesData) {
      const [role, created] = await Role.findOrCreate({
        where: { name: roleData.name, tenantId: tenantData.instance.id },
        defaults: { ...roleData, tenantId: tenantData.instance.id },
      });
    }
  }
}

async function seedUsers() {
  console.log('Seeding users...');
  for (const userData of usersData) {
    const tenant = tenantsData.find(t => t.name === userData.tenantName)?.instance;
    if (!tenant) continue;
    const [user, created] = await User.findOrCreate({
      where: { email: userData.email },
      defaults: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        passwordHash: userData.password,
        tenantId: tenant.id,
        status: userData.status || 'active',
      },
    });
    userData.instance = user;
    const rolesToAssign = await Role.findAll({ where: { name: userData.roleNames, tenantId: tenant.id } });
    if (rolesToAssign.length > 0) await user.setRoles(rolesToAssign);
  }
}

async function seedDepartments() {
  console.log('Seeding departments...');
  for (const deptData of departmentsData) {
    const tenant = tenantsData.find(t => t.name === deptData.tenantName)?.instance;
    if (!tenant) continue;
    const [department, created] = await Department.findOrCreate({
      where: { name: deptData.name, tenantId: tenant.id },
      defaults: { ...deptData, tenantId: tenant.id },
    });
    deptData.instance = department;
  }
}

async function seedEmployees() {
  console.log('Seeding employees (2-pass)...');
  const employeeInstanceMap = {};
  for (const empData of employeesData) {
    const tenant = tenantsData.find(t => t.name === empData.tenantName)?.instance;
    const department = departmentsData.find(d => d.name === empData.departmentName && d.tenantName === empData.tenantName)?.instance;
    const user = usersData.find(u => u.email === empData.email && u.tenantName === empData.tenantName)?.instance;
    if (!tenant || !department || !user) {
        console.warn(`Skipping employee ${empData.email} due to missing associations.`);
        continue;
    }
    const [employee, created] = await Employee.findOrCreate({
      where: { email: empData.email, tenantId: tenant.id },
      defaults: { ...empData, tenantId: tenant.id, departmentId: department.id, userId: user.id },
    });
    empData.instance = employee;
    employeeInstanceMap[`${empData.email}_${tenant.name}`] = employee;
  }
  for (const empData of employeesData) {
    if (empData.managerEmail) {
      const employee = empData.instance;
      const manager = employeeInstanceMap[`${empData.managerEmail}_${empData.tenantName}`];
      if (employee && manager) {
        employee.reportingManagerId = manager.id;
        await employee.save();
      }
    }
  }
}

async function seedSalaryComponents() {
  console.log('Seeding salary components...');
  for (const scData of salaryComponentsData) {
    const tenant = tenantsData.find(t => t.name === scData.tenantName)?.instance;
    if (!tenant) continue;
    const [component, created] = await SalaryComponent.findOrCreate({
      where: { name: scData.name, tenantId: tenant.id, type: scData.type },
      defaults: { ...scData, tenantId: tenant.id },
    });
    scData.instance = component;
  }
}

async function seedPaySchedules() {
  console.log('Seeding pay schedules...');
  for (const psData of paySchedulesData) {
    const tenant = tenantsData.find(t => t.name === psData.tenantName)?.instance;
    if (!tenant) continue;
    await PaySchedule.findOrCreate({
      where: { name: psData.name, tenantId: tenant.id },
      defaults: { ...psData, tenantId: tenant.id },
    });
  }
}

async function seedEmployeeDependents() {
  console.log('Seeding employee dependents...');
  for (const depData of employeeDependentsData) {
    const employee = employeesData.find(e => e.email === depData.employeeEmail && e.tenantName === depData.tenantName)?.instance;
    if (!employee) continue;
    await EmployeeDependent.findOrCreate({
      where: { employeeId: employee.id, fullName: depData.fullName },
      defaults: { ...depData, tenantId: employee.tenantId, employeeId: employee.id },
    });
  }
}

async function seedEmployeeSalarySettings() {
  console.log('Seeding employee salary settings...');
  for (const settingData of employeeSalarySettingsData) {
    const employee = employeesData.find(e => e.email === settingData.employeeEmail && e.tenantName === settingData.tenantName)?.instance;
    const component = salaryComponentsData.find(c => c.name === settingData.componentName && c.tenantName === settingData.tenantName && c.type === settingData.componentType)?.instance;
    if (!employee || !component) continue;
    await EmployeeSalarySetting.findOrCreate({
      where: { employeeId: employee.id, salaryComponentId: component.id },
      defaults: { ...settingData, tenantId: employee.tenantId, employeeId: employee.id, salaryComponentId: component.id },
    });
  }
}

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    await sequelize.authenticate();
    console.log('Database connection established.');
    await seedTenants();
    await seedRoles();
    await seedUsers();
    await seedDepartments();
    await seedEmployees();
    await seedSalaryComponents();
    await seedPaySchedules();
    await seedEmployeeDependents();
    await seedEmployeeSalarySettings();
    console.log('Database seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  (async () => {
    try {
      await sequelize.sync({ alter: true });
      console.log('Database schema synchronized.');
      await seedDatabase();
    } catch (syncError) {
      console.error('Error synchronizing database schema:', syncError);
      process.exit(1);
    } finally {
      await sequelize.close();
      console.log('Database connection closed.');
    }
  })();
}

module.exports = {
  seedDatabase,
  tenantsData,
  usersData,
  rolesData,
  departmentsData,
  employeesData,
  salaryComponentsData,
  paySchedulesData,
  employeeDependentsData,
  employeeSalarySettingsData,
};
// --- END OF FINAL seed.js FILE ---