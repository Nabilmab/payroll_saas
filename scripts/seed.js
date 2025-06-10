// scripts/seed.js

const { sequelize, Tenant, User, Role, Department, Employee, SalaryComponent, PaySchedule } = require('../models');
// const bcrypt = require('bcryptjs'); // User model has a hook for password hashing

// --- Seed Data (from previous step, ensure it's available here) ---
/**
 * @typedef {Object} TenantData
 * @property {string} name - The name of the tenant company.
 * @property {string} [slogan] - The slogan of the tenant company.
 * @property {Tenant?} instance - Will store the Sequelize instance after creation.
 */
const tenantsData = [
  { name: "TechSolutions SARL", slogan: "Solutions technologiques innovantes pour le Maroc." },
  { name: "Artisanat Marocain Coop", slogan: "L'artisanat traditionnel marocain à portée de main." },
  { name: "Services Financiers Al Maghrib", slogan: "Votre partenaire financier de confiance." },
];

/**
 * @typedef {Object} RoleData
 * @property {string} name - The name of the role.
 * @property {string} [description] - A brief description of the role.
 * @property {Role?} instance - Will store the Sequelize instance.
 */
const rolesData = [
  // These are generic roles; they will be created per tenant
  { name: "Admin", description: "Administrateur système avec tous les privilèges." },
  { name: "Manager", description: "Responsable d'équipe ou de département." },
  { name: "Employé", description: "Employé standard." },
  { name: "Comptable", description: "Responsable de la comptabilité et de la paie." },
];

/**
 * @typedef {Object} UserData
 * @property {string} email - The email address of the user.
 * @property {string} password - The plain text password.
 * @property {string} tenantName - The name of the tenant this user belongs to.
 * @property {string[]} roleNames - An array of role names assigned to this user.
 * @property {User?} instance - Will store the Sequelize instance.
 */
const usersData = [
  { email: "admin@techsolutions.ma", password: "password123", tenantName: "TechSolutions SARL", roleNames: ["Admin"] },
  { email: "manager.rh@techsolutions.ma", password: "password123", tenantName: "TechSolutions SARL", roleNames: ["Manager", "Comptable"] },
  { email: "dev.ahmed@techsolutions.ma", password: "password123", tenantName: "TechSolutions SARL", roleNames: ["Employé"] },
  { email: "admin@artisanatmaroc.ma", password: "password123", tenantName: "Artisanat Marocain Coop", roleNames: ["Admin", "Manager"] },
  { email: "artisan.fatima@artisanatmaroc.ma", password: "password123", tenantName: "Artisanat Marocain Coop", roleNames: ["Employé"] },
  { email: "directeur.financier@sfalmaghrib.ma", password: "password123", tenantName: "Services Financiers Al Maghrib", roleNames: ["Admin", "Manager", "Comptable"] },
  { email: "analyste.youssef@sfalmaghrib.ma", password: "password123", tenantName: "Services Financiers Al Maghrib", roleNames: ["Employé"] },
];

/**
 * @typedef {Object} DepartmentData
 * @property {string} name - The name of the department.
 * @property {string} tenantName - The name of the tenant this department belongs to.
 * @property {string} [managerEmail] - The email of the user who manages this department (optional).
 * @property {Department?} instance - Will store the Sequelize instance.
 */
const departmentsData = [
  { name: "Technologie de l'Information", tenantName: "TechSolutions SARL", managerEmail: "manager.rh@techsolutions.ma" },
  { name: "Ressources Humaines", tenantName: "TechSolutions SARL", managerEmail: "manager.rh@techsolutions.ma" },
  { name: "Développement Logiciel", tenantName: "TechSolutions SARL", managerEmail: "admin@techsolutions.ma"},
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
 * @property {string} [reportingManagerEmail]
 * @property {Employee?} instance - Will store the Sequelize instance.
 */
const employeesData = [
  { firstName: "Ahmed", lastName: "Bennani", email: "dev.ahmed@techsolutions.ma", phoneNumber: "0612345678", dateOfBirth: new Date("1990-05-15"), address: "12 Rue de la Liberté, Casablanca", hireDate: new Date("2022-01-10"), jobTitle: "Développeur Senior", departmentName: "Développement Logiciel", tenantName: "TechSolutions SARL", reportingManagerEmail: "admin@techsolutions.ma" },
  { firstName: "Fatima", lastName: "Zahra", email: "manager.rh@techsolutions.ma", phoneNumber: "0698765432", dateOfBirth: new Date("1985-11-20"), address: "45 Avenue Hassan II, Rabat", hireDate: new Date("2020-03-01"), jobTitle: "Responsable RH et Comptabilité", departmentName: "Ressources Humaines", tenantName: "TechSolutions SARL" },
  { firstName: "Fatima", lastName: "El Fassi", email: "artisan.fatima@artisanatmaroc.ma", phoneNumber: "0655554433", dateOfBirth: new Date("1978-03-25"), address: "7 Derb Lihoudi, Fès", hireDate: new Date("2015-06-01"), jobTitle: "Artisane Principale", departmentName: "Production Artisanale", tenantName: "Artisanat Marocain Coop", reportingManagerEmail: "admin@artisanatmaroc.ma" },
  { firstName: "Youssef", lastName: "Alaoui", email: "youssef.marketing@artisanatmaroc.ma", phoneNumber: "0622334455", dateOfBirth: new Date("1992-07-12"), address: "10 Rue Souika, Marrakech", hireDate: new Date("2023-01-20"), jobTitle: "Spécialiste Marketing", departmentName: "Ventes et Marketing", tenantName: "Artisanat Marocain Coop", reportingManagerEmail: "admin@artisanatmaroc.ma" },
  { firstName: "Youssef", lastName: "Tazi", email: "analyste.youssef@sfalmaghrib.ma", phoneNumber: "0677889900", dateOfBirth: new Date("1995-09-03"), address: "33 Boulevard Mohammed V, Agadir", hireDate: new Date("2024-02-01"), jobTitle: "Analyste Financier Junior", departmentName: "Analyse Financière", tenantName: "Services Financiers Al Maghrib", reportingManagerEmail: "directeur.financier@sfalmaghrib.ma" },
  { firstName: "Amina", lastName: "Saidi", email: "amina.clientele@sfalmaghrib.ma", phoneNumber: "0611223344", dateOfBirth: new Date("1988-12-30"), address: "5 Avenue des FAR, Tanger", hireDate: new Date("2021-08-15"), jobTitle: "Chargée de Clientèle", departmentName: "Service Clientèle", tenantName: "Services Financiers Al Maghrib", reportingManagerEmail: "directeur.financier@sfalmaghrib.ma" },
];

/**
 * @typedef {Object} SalaryComponentData
 * @property {string} name
 * @property {string} type - 'Earning' or 'Deduction'
 * @property {number} [amount]
 * @property {number} [percentage]
 * @property {string} tenantName
 * @property {boolean} [isTaxApplicable]
 * @property {boolean} [isPensionApplicable]
 * @property {SalaryComponent?} instance - Will store the Sequelize instance.
 */
const salaryComponentsData = [
  { name: "Salaire de Base", type: "Earning", tenantName: "TechSolutions SARL", isTaxApplicable: true, isPensionApplicable: true },
  { name: "Indemnité de Transport", type: "Earning", tenantName: "TechSolutions SARL", amount: 500, isTaxApplicable: false, isPensionApplicable: false },
  { name: "CNSS", type: "Deduction", tenantName: "TechSolutions SARL", percentage: 0.0674, isTaxApplicable: false, isPensionApplicable: false },
  { name: "AMO", type: "Deduction", tenantName: "TechSolutions SARL", percentage: 0.0226, isTaxApplicable: false, isPensionApplicable: false },
  { name: "Salaire de Base", type: "Earning", tenantName: "Artisanat Marocain Coop", isTaxApplicable: true, isPensionApplicable: true },
  { name: "Prime de Rendement", type: "Earning", tenantName: "Artisanat Marocain Coop", amount: 1000, isTaxApplicable: true, isPensionApplicable: true },
  { name: "CNSS", type: "Deduction", tenantName: "Artisanat Marocain Coop", percentage: 0.0674, isTaxApplicable: false, isPensionApplicable: false },
  { name: "AMO", type: "Deduction", tenantName: "Artisanat Marocain Coop", percentage: 0.0226, isTaxApplicable: false, isPensionApplicable: false },
  { name: "Salaire de Base", type: "Earning", tenantName: "Services Financiers Al Maghrib", isTaxApplicable: true, isPensionApplicable: true },
  { name: "Bonus de Performance", type: "Earning", tenantName: "Services Financiers Al Maghrib", percentage: 0.10, isTaxApplicable: true, isPensionApplicable: true }, // 10% of base for example
  { name: "IGR (Impôt Général sur le Revenu)", type: "Deduction", tenantName: "Services Financiers Al Maghrib", isTaxApplicable: false, isPensionApplicable: false }, // Placeholder; actual IGR is calculated
  { name: "CNSS", type: "Deduction", tenantName: "Services Financiers Al Maghrib", percentage: 0.0674, isTaxApplicable: false, isPensionApplicable: false },
  { name: "AMO", type: "Deduction", tenantName: "Services Financiers Al Maghrib", percentage: 0.0226, isTaxApplicable: false, isPensionApplicable: false },
];

/**
 * @typedef {Object} PayScheduleData
 * @property {string} name
 * @property {string} payFrequency - 'Monthly', 'Bi-Weekly', 'Weekly'
 * @property {number} payDayOfMonth
 * @property {string} [payDayOfWeek]
 * @property {string} tenantName
 * @property {PaySchedule?} instance - Will store the Sequelize instance.
 */
const paySchedulesData = [
  { name: "Paiement Mensuel Standard", payFrequency: "Monthly", payDayOfMonth: 28, tenantName: "TechSolutions SARL" },
  { name: "Paiement Fin de Mois Artisans", payFrequency: "Monthly", payDayOfMonth: 30, tenantName: "Artisanat Marocain Coop" },
  { name: "Paiement Mensuel Cadres", payFrequency: "Monthly", payDayOfMonth: 25, tenantName: "Services Financiers Al Maghrib" },
  { name: "Paiement Hebdomadaire Stagiaires", payFrequency: "Weekly", payDayOfWeek: "Friday", tenantName: "TechSolutions SARL" }
];


// --- Seeding Functions ---

async function seedTenants() {
  console.log('Seeding tenants...');
  for (const tenantData of tenantsData) {
    const [tenant, created] = await Tenant.findOrCreate({
      where: { name: tenantData.name },
      defaults: { name: tenantData.name, slogan: tenantData.slogan },
    });
    tenantData.instance = tenant; // Store instance for later use
    if (created) console.log(`Tenant '${tenant.name}' created.`);
    else console.log(`Tenant '${tenant.name}' already exists.`);
  }
}

async function seedRoles() {
  console.log('Seeding roles...');
  for (const tenantData of tenantsData) {
    if (!tenantData.instance) {
      console.error(`Tenant instance for ${tenantData.name} not found. Skipping roles.`);
      continue;
    }
    for (const roleData of rolesData) { // Using the generic rolesData for each tenant
      const [role, created] = await Role.findOrCreate({
        where: { name: roleData.name, tenant_id: tenantData.instance.id },
        defaults: {
          name: roleData.name,
          description: roleData.description,
          tenant_id: tenantData.instance.id,
        },
      });
      // Storing role instances might be complex if rolesData is reused.
      // Instead, we'll fetch them as needed in seedUsers.
      if (created) console.log(`Role '${role.name}' for tenant '${tenantData.instance.name}' created.`);
      else console.log(`Role '${role.name}' for tenant '${tenantData.instance.name}' already exists.`);
    }
  }
}

async function seedUsers() {
  console.log('Seeding users...');
  for (const userData of usersData) {
    const tenant = tenantsData.find(t => t.name === userData.tenantName)?.instance;
    if (!tenant) {
      console.error(`Tenant '${userData.tenantName}' not found for user '${userData.email}'. Skipping.`);
      continue;
    }

    const [user, created] = await User.findOrCreate({
      where: { email: userData.email }, // Assuming email is unique across all tenants. If not, add tenant_id to where.
      defaults: {
        email: userData.email,
        password: userData.password, // Hook in User model will hash it
        tenant_id: tenant.id,
      },
    });
    userData.instance = user;

    if (created) console.log(`User '${user.email}' created.`);
    else console.log(`User '${user.email}' already exists.`);

    // Assign roles
    if (userData.roleNames && userData.roleNames.length > 0) {
      const rolesToAssign = await Role.findAll({
        where: {
          name: userData.roleNames,
          tenant_id: tenant.id,
        },
      });
      await user.setRoles(rolesToAssign); // setRoles handles the join table
      console.log(`Assigned roles to user '${user.email}': ${userData.roleNames.join(', ')}`);
    }
  }
}

async function seedDepartments() {
  console.log('Seeding departments...');
  for (const deptData of departmentsData) {
    const tenant = tenantsData.find(t => t.name === deptData.tenantName)?.instance;
    if (!tenant) {
      console.error(`Tenant '${deptData.tenantName}' not found for department '${deptData.name}'. Skipping.`);
      continue;
    }

    let managerId = null;
    if (deptData.managerEmail) {
      const managerUser = usersData.find(u => u.email === deptData.managerEmail && u.tenantName === deptData.tenantName)?.instance;
      if (managerUser) {
        managerId = managerUser.id;
      } else {
        console.warn(`Manager user with email '${deptData.managerEmail}' for department '${deptData.name}' not found. Setting manager_id to null.`);
      }
    }

    const [department, created] = await Department.findOrCreate({
      where: { name: deptData.name, tenant_id: tenant.id },
      defaults: {
        name: deptData.name,
        tenant_id: tenant.id,
        manager_id: managerId,
      },
    });
    deptData.instance = department;
    if (created) console.log(`Department '${department.name}' for tenant '${tenant.name}' created.`);
    else console.log(`Department '${department.name}' for tenant '${tenant.name}' already exists.`);
  }
}

async function seedEmployees() {
  console.log('Seeding employees...');
  for (const empData of employeesData) {
    const tenant = tenantsData.find(t => t.name === empData.tenantName)?.instance;
    if (!tenant) {
      console.error(`Tenant '${empData.tenantName}' not found for employee '${empData.email}'. Skipping.`);
      continue;
    }

    const department = departmentsData.find(d => d.name === empData.departmentName && d.tenantName === empData.tenantName)?.instance;
    if (!department) {
      console.error(`Department '${empData.departmentName}' for tenant '${empData.tenantName}' not found for employee '${empData.email}'. Skipping.`);
      continue;
    }

    let reportingManagerId = null;
    if (empData.reportingManagerEmail) {
      // Assuming manager is an Employee, first find the User, then the Employee record
      const managerUser = usersData.find(u => u.email === empData.reportingManagerEmail && u.tenantName === empData.tenantName)?.instance;
      if (managerUser) {
        const managerEmployee = await Employee.findOne({ where: { user_id: managerUser.id, tenant_id: tenant.id }});
        if(managerEmployee) {
            reportingManagerId = managerEmployee.id;
        } else {
            console.warn(`Reporting manager (as Employee) with email '${empData.reportingManagerEmail}' not found for employee '${empData.email}'.`);
        }
      } else {
        console.warn(`Reporting manager (as User) with email '${empData.reportingManagerEmail}' not found for employee '${empData.email}'.`);
      }
    }

    // Find the corresponding User for the Employee
    const user = usersData.find(u => u.email === empData.email && u.tenantName === empData.tenantName)?.instance;
    if (!user) {
        console.error(`User with email '${empData.email}' for employee not found. Skipping employee.`);
        continue;
    }

    const [employee, created] = await Employee.findOrCreate({
      where: { email: empData.email, tenant_id: tenant.id }, // Using email and tenant_id as unique constraint for employee
      defaults: {
        ...empData, // Spreading other fields like firstName, lastName, etc.
        tenant_id: tenant.id,
        department_id: department.id,
        user_id: user.id, // Link to the User record
        manager_id: reportingManagerId,
      },
    });
    empData.instance = employee;
    if (created) console.log(`Employee '${employee.firstName} ${employee.lastName}' (${employee.email}) created.`);
    else console.log(`Employee '${employee.firstName} ${employee.lastName}' (${employee.email}) already exists.`);
  }
}

async function seedSalaryComponents() {
  console.log('Seeding salary components...');
  for (const scData of salaryComponentsData) {
    const tenant = tenantsData.find(t => t.name === scData.tenantName)?.instance;
    if (!tenant) {
      console.error(`Tenant '${scData.tenantName}' not found for salary component '${scData.name}'. Skipping.`);
      continue;
    }
    const [component, created] = await SalaryComponent.findOrCreate({
      where: { name: scData.name, tenant_id: tenant.id },
      defaults: { ...scData, tenant_id: tenant.id },
    });
    scData.instance = component;
    if (created) console.log(`SalaryComponent '${component.name}' for tenant '${tenant.name}' created.`);
    else console.log(`SalaryComponent '${component.name}' for tenant '${tenant.name}' already exists.`);
  }
}

async function seedPaySchedules() {
  console.log('Seeding pay schedules...');
  for (const psData of paySchedulesData) {
    const tenant = tenantsData.find(t => t.name === psData.tenantName)?.instance;
    if (!tenant) {
      console.error(`Tenant '${psData.tenantName}' not found for pay schedule '${psData.name}'. Skipping.`);
      continue;
    }
    const [schedule, created] = await PaySchedule.findOrCreate({
      where: { name: psData.name, tenant_id: tenant.id },
      defaults: { ...psData, tenant_id: tenant.id },
    });
    psData.instance = schedule;
    if (created) console.log(`PaySchedule '${schedule.name}' for tenant '${tenant.name}' created.`);
    else console.log(`PaySchedule '${schedule.name}' for tenant '${tenant.name}' already exists.`);
  }
}


// --- Main Seeding Orchestration ---

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Consider if sync is needed here or handled by migrations.
    // Using { force: false } to avoid data loss, { alter: true } can be used for development.
    // For a production-like seed, migrations should handle schema.
    // Let's assume migrations are separate and tables exist. If not, uncomment:
    // await sequelize.sync({ alter: true }); // or { force: false } if you are sure schema is up-to-date
    // console.log('Database synchronized.');

    await seedTenants();
    await seedRoles(); // Roles depend on Tenants
    await seedUsers(); // Users depend on Tenants and Roles
    await seedDepartments(); // Departments depend on Tenants and potentially Users (for manager_id)
    await seedEmployees(); // Employees depend on Tenants, Departments, and Users. Managers are Employees.
    await seedSalaryComponents(); // Depend on Tenants
    await seedPaySchedules(); // Depend on Tenants

    console.log('Database seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exitCode = 1; // Indicate failure
  } finally {
    // It's often better to let the calling process manage connection closing.
    // If this script is run standalone and meant to exit, then close.
    // await sequelize.close();
    // console.log('Database connection closed.');
  }
}

// If the script is run directly (node scripts/seed.js)
if (require.main === module) {
  (async () => {
    // Sync database schema before seeding.
    // force: true will drop and recreate tables. Use with extreme caution in dev, never in prod.
    // alter: true will attempt to make non-destructive changes.
    // In a real app, migrations (e.g., using Sequelize CLI) are preferred for schema management.
    // For this seed script, we'll use alter:true to ensure tables are created/updated if they don't match models.
    try {
      await sequelize.sync({ alter: true }); // Ensure schema is up-to-date or created
      console.log('Database schema synchronized.');
      await seedDatabase();
    } catch (syncError) {
      console.error('Error synchronizing database schema:', syncError);
      process.exitCode = 1;
    } finally {
        await sequelize.close();
        console.log('Database connection closed.');
    }
  })();
}

// Export for potential programmatic use (e.g. testing, or if called by another script)
module.exports = {
  seedDatabase,
  tenantsData,
  usersData,
  rolesData,
  departmentsData,
  employeesData,
  salaryComponentsData,
  paySchedulesData,
};
