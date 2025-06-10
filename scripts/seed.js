// scripts/seed.js

require('dotenv').config(); // THIS IS THE MISSING LINE

const { sequelize, Tenant, User, Role, Department, Employee, SalaryComponent, PaySchedule } = require('../models');
// const bcrypt = require('bcryptjs'); // User model has a hook for password hashing

// --- Seed Data (from previous step, ensure it's available here) ---
/**
 * @typedef {Object} TenantData
 * @property {string} name - The name of the tenant company.
 * @property {string} [description] - The description of the tenant company.
 * @property {string} schema_name - The schema name for the tenant.
 * @property {Tenant?} instance - Will store the Sequelize instance after creation.
 */
const tenantsData = [
  { name: "TechSolutions SARL", description: "Solutions technologiques innovantes pour le Maroc.", schema_name: "techsolutions" },
  { name: "Artisanat Marocain Coop", description: "L'artisanat traditionnel marocain à portée de main.", schema_name: "artisanat" },
  { name: "Services Financiers Al Maghrib", description: "Votre partenaire financier de confiance.", schema_name: "sfmaghrib" },
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
 * @property {string} firstName - The first name of the user.
 * @property {string} lastName - The last name of the user.
 * @property {string} password - The plain text password.
 * @property {string} tenantName - The name of the tenant this user belongs to.
 * @property {string[]} roleNames - An array of role names assigned to this user.
 * @property {string} [status='active'] - The status of the user.
 * @property {User?} instance - Will store the Sequelize instance.
 */
const usersData = [
  // For users who are also in employeesData, firstName and lastName should ideally match.
  // For users not in employeesData (e.g. pure system admins), names can be generic.
  { firstName: "Admin", lastName: "TechSol", email: "admin@techsolutions.ma", password: "password123", tenantName: "TechSolutions SARL", roleNames: ["Admin"], status: "active" },
  { firstName: "Fatima", lastName: "Zahra", email: "manager.rh@techsolutions.ma", password: "password123", tenantName: "TechSolutions SARL", roleNames: ["Manager", "Comptable"], status: "active" }, // Matches employeesData
  { firstName: "Ahmed", lastName: "Bennani", email: "dev.ahmed@techsolutions.ma", password: "password123", tenantName: "TechSolutions SARL", roleNames: ["Employé"], status: "active" }, // Matches employeesData
  { firstName: "Admin", lastName: "Artisanat", email: "admin@artisanatmaroc.ma", password: "password123", tenantName: "Artisanat Marocain Coop", roleNames: ["Admin", "Manager"], status: "active" },
  { firstName: "Fatima", lastName: "El Fassi", email: "artisan.fatima@artisanatmaroc.ma", password: "password123", tenantName: "Artisanat Marocain Coop", roleNames: ["Employé"], status: "active" }, // Matches employeesData
  { firstName: "Directeur", lastName: "Financier", email: "directeur.financier@sfalmaghrib.ma", password: "password123", tenantName: "Services Financiers Al Maghrib", roleNames: ["Admin", "Manager", "Comptable"], status: "active" },
  { firstName: "Youssef", lastName: "Tazi", email: "analyste.youssef@sfalmaghrib.ma", password: "password123", tenantName: "Services Financiers Al Maghrib", roleNames: ["Employé"], status: "active" }, // Matches employeesData
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
 * @property {string} [managerEmail] - Email of the reporting manager.
 * @property {Employee?} instance - Will store the Sequelize instance.
 */
const employeesData = [
  { firstName: "Ahmed", lastName: "Bennani", email: "dev.ahmed@techsolutions.ma", phoneNumber: "0612345678", dateOfBirth: new Date("1990-05-15"), address: "12 Rue de la Liberté, Casablanca", hireDate: new Date("2022-01-10"), jobTitle: "Développeur Senior", departmentName: "Développement Logiciel", tenantName: "TechSolutions SARL", managerEmail: "admin@techsolutions.ma" },
  { firstName: "Fatima", lastName: "Zahra", email: "manager.rh@techsolutions.ma", phoneNumber: "0698765432", dateOfBirth: new Date("1985-11-20"), address: "45 Avenue Hassan II, Rabat", hireDate: new Date("2020-03-01"), jobTitle: "Responsable RH et Comptabilité", departmentName: "Ressources Humaines", tenantName: "TechSolutions SARL", managerEmail: null }, // No manager for top RH manager or make admin manager?
  { firstName: "Fatima", lastName: "El Fassi", email: "artisan.fatima@artisanatmaroc.ma", phoneNumber: "0655554433", dateOfBirth: new Date("1978-03-25"), address: "7 Derb Lihoudi, Fès", hireDate: new Date("2015-06-01"), jobTitle: "Artisane Principale", departmentName: "Production Artisanale", tenantName: "Artisanat Marocain Coop", managerEmail: "admin@artisanatmaroc.ma" },
  { firstName: "Youssef", lastName: "Alaoui", email: "youssef.marketing@artisanatmaroc.ma", phoneNumber: "0622334455", dateOfBirth: new Date("1992-07-12"), address: "10 Rue Souika, Marrakech", hireDate: new Date("2023-01-20"), jobTitle: "Spécialiste Marketing", departmentName: "Ventes et Marketing", tenantName: "Artisanat Marocain Coop", managerEmail: "admin@artisanatmaroc.ma" },
  { firstName: "Youssef", lastName: "Tazi", email: "analyste.youssef@sfalmaghrib.ma", phoneNumber: "0677889900", dateOfBirth: new Date("1995-09-03"), address: "33 Boulevard Mohammed V, Agadir", hireDate: new Date("2024-02-01"), jobTitle: "Analyste Financier Junior", departmentName: "Analyse Financière", tenantName: "Services Financiers Al Maghrib", managerEmail: "directeur.financier@sfalmaghrib.ma" },
  { firstName: "Amina", lastName: "Saidi", email: "amina.clientele@sfalmaghrib.ma", phoneNumber: "0611223344", dateOfBirth: new Date("1988-12-30"), address: "5 Avenue des FAR, Tanger", hireDate: new Date("2021-08-15"), jobTitle: "Chargée de Clientèle", departmentName: "Service Clientèle", tenantName: "Services Financiers Al Maghrib", managerEmail: "directeur.financier@sfalmaghrib.ma" },
];

/**
 * @typedef {Object} SalaryComponentData
 * @property {string} name
 * @property {string} tenantName
 * @property {string} type - 'earning' or 'deduction'
 * @property {string} calculation_type - 'fixed', 'percentage', or 'formula'
 * @property {number} [amount] - Required if calculation_type is 'fixed'
 * @property {number} [percentage] - Required if calculation_type is 'percentage'
 * @property {boolean} is_taxable
 * @property {SalaryComponent?} instance - Will store the Sequelize instance.
 */
const salaryComponentsData = [
  // --- TechSolutions SARL ---
  { name: "Salaire de Base", tenantName: "TechSolutions SARL", type: "earning", calculation_type: "fixed", is_taxable: true },
  { name: "Indemnité de Transport", tenantName: "TechSolutions SARL", type: "earning", calculation_type: "fixed", amount: 500, is_taxable: false },
  { name: "CNSS", tenantName: "TechSolutions SARL", type: "deduction", calculation_type: "percentage", percentage: 6.74, is_taxable: false },
  { name: "AMO", tenantName: "TechSolutions SARL", type: "deduction", calculation_type: "percentage", percentage: 2.26, is_taxable: false },

  // --- Artisanat Marocain Coop ---
  { name: "Salaire de Base", tenantName: "Artisanat Marocain Coop", type: "earning", calculation_type: "fixed", is_taxable: true },
  { name: "Prime de Rendement", tenantName: "Artisanat Marocain Coop", type: "earning", calculation_type: "fixed", amount: 1000, is_taxable: true },
  { name: "CNSS", tenantName: "Artisanat Marocain Coop", type: "deduction", calculation_type: "percentage", percentage: 6.74, is_taxable: false },

  // --- Services Financiers Al Maghrib ---
  { name: "Salaire de Base", tenantName: "Services Financiers Al Maghrib", type: "earning", calculation_type: "fixed", is_taxable: true },
  { name: "Bonus de Performance", tenantName: "Services Financiers Al Maghrib", type: "earning", calculation_type: "percentage", percentage: 10.00, is_taxable: true },
  { name: "IGR (Impôt Général sur le Revenu)", tenantName: "Services Financiers Al Maghrib", type: "deduction", calculation_type: "formula", is_taxable: false },
];

/**
 * @typedef {Object} PayScheduleData
 * @property {string} name
 * @property {string} frequency - 'monthly', 'weekly', 'bi-weekly'
 * @property {number} [pay_day_of_month] - For monthly frequency
 * @property {number} [pay_period_start_day] - For weekly/bi-weekly if applicable (e.g. 1 for Monday)
 * @property {string} tenantName
 * @property {PaySchedule?} instance - Will store the Sequelize instance.
 */
const paySchedulesData = [
  {
    name: "Paiement Mensuel Standard",
    frequency: "monthly",
    pay_day_of_month: 28,
    tenantName: "TechSolutions SARL"
  },
  {
    name: "Paiement Fin de Mois Artisans",
    frequency: "monthly",
    pay_day_of_month: 30,
    tenantName: "Artisanat Marocain Coop"
  },
  {
    name: "Paiement Mensuel Cadres",
    frequency: "monthly",
    pay_day_of_month: 25,
    tenantName: "Services Financiers Al Maghrib"
  },
  {
    name: "Paiement Hebdomadaire Stagiaires",
    frequency: "weekly",
    pay_period_start_day: 1, // This entry uses pay_period_start_day instead of pay_day_of_month
    tenantName: "TechSolutions SARL"
  }
];


// --- Seeding Functions ---

async function seedTenants() {
  console.log('Seeding tenants...');
  for (const tenantData of tenantsData) {
    const [tenant, created] = await Tenant.findOrCreate({
      where: { schema_name: tenantData.schema_name }, // Keep using schema_name as the unique identifier
      defaults: tenantData, // Use the concise tenantData for defaults
    });
    tenantData.instance = tenant; // Store instance for later use
    // Ensure logging reflects the use of schema_name, which it likely already does from the previous subtask.
    if (created) console.log(`Tenant '${tenant.name}' created with schema '${tenant.schema_name}'.`);
    else console.log(`Tenant '${tenant.name}' with schema '${tenant.schema_name}' already exists.`);
  }
}

async function seedRoles() {
  console.log('Seeding roles...');
  for (const tenantData of tenantsData) {
    if (!tenantData.instance) {
      console.error(`Tenant instance for ${tenantData.name} (schema: ${tenantData.schema_name}) not found. Skipping roles.`);
      continue;
    }
    for (const roleData of rolesData) { // Using the generic rolesData for each tenant
      const [role, created] = await Role.findOrCreate({
        where: { name: roleData.name, tenantId: tenantData.instance.id },
        defaults: {
          name: roleData.name,
          description: roleData.description,
          tenantId: tenantData.instance.id,
        },
      });
      // Storing role instances might be complex if rolesData is reused.
      // Instead, we'll fetch them as needed in seedUsers.
      if (created) console.log(`Role '${role.name}' for tenant '${tenantData.instance.name}' (schema: ${tenantData.instance.schema_name}) created.`);
      else console.log(`Role '${role.name}' for tenant '${tenantData.instance.name}' (schema: ${tenantData.instance.schema_name}) already exists.`);
    }
  }
}

async function seedUsers() {
  console.log('Seeding users...');
  for (const userData of usersData) {
    const tenant = tenantsData.find(t => t.name === userData.tenantName)?.instance; // Assuming tenantName in usersData still refers to the 'name' property
    if (!tenant) {
      console.error(`Tenant '${userData.tenantName}' not found for user '${userData.email}'. Skipping.`);
      continue;
    }

    const [user, created] = await User.findOrCreate({
      where: { email: userData.email }, // Email is globally unique as per model definition
      defaults: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        password_hash: userData.password, // As per previous instruction for User model
        tenantId: tenant.id, // Corrected to camelCase
        status: userData.status || 'active', // Default to 'active' if not provided
      },
    });
    userData.instance = user;

    if (created) console.log(`User '${user.email}' (Name: ${user.first_name} ${user.last_name}) created.`);
    else console.log(`User '${user.email}' (Name: ${user.first_name} ${user.last_name}) already exists.`);

    // Assign roles
    if (userData.roleNames && userData.roleNames.length > 0) {
      const rolesToAssign = await Role.findAll({
        where: {
          name: userData.roleNames,
          tenantId: tenant.id, // Ensure roles are fetched for the correct tenant (camelCase)
        },
      });
      if (rolesToAssign.length !== userData.roleNames.length) {
        console.warn(`Not all roles (${userData.roleNames.join(', ')}) found for user '${userData.email}' in tenant '${tenant.name}' (schema: ${tenant.schema_name}). Found: ${rolesToAssign.map(r => r.name).join(', ')}`);
      }
      await user.setRoles(rolesToAssign); // setRoles handles the UserRole join table
      console.log(`Set roles for user '${user.email}' to: ${rolesToAssign.map(r => r.name).join(', ')} for tenant '${tenant.name}' (schema: ${tenant.schema_name})`);
    }
  }
}

async function seedDepartments() {
  console.log('Seeding departments...');
  for (const deptData of departmentsData) {
    const tenant = tenantsData.find(t => t.name === deptData.tenantName)?.instance; // Assuming tenantName in departmentsData still refers to the 'name' property
    if (!tenant) {
      console.error(`Tenant '${deptData.tenantName}' not found for department '${deptData.name}'. Skipping.`);
      continue;
    }

    // Manager assignment for departments is removed as per instruction (Department model does not have managerId field)
    // const managerUser = usersData.find(u => u.email === deptData.managerEmail && u.tenantName === deptData.tenantName)?.instance;
    // let managerId = managerUser ? managerUser.id : null;

    const [department, created] = await Department.findOrCreate({
      where: { name: deptData.name, tenantId: tenant.id },
      defaults: {
        name: deptData.name,
        description: deptData.description || null, // Add description if available in deptData
        tenantId: tenant.id,
        // managerId: managerId, // Removed as Department model does not have managerId
      },
    });
    deptData.instance = department;
    if (created) console.log(`Department '${department.name}' for tenant '${tenant.name}' (schema: ${tenant.schema_name}) created.`);
    else console.log(`Department '${department.name}' for tenant '${tenant.name}' (schema: ${tenant.schema_name}) already exists.`);
  }
}

async function seedEmployees() {
  console.log('Seeding employees with two-pass approach for managers...');
  const employeeInstanceMap = {}; // To store created employee instances, keyed by email

  // First Pass: Create all employees without reportingManagerId
  console.log('--- Starting Employee Creation Pass (Pass 1) ---');
  for (const tenantData of tenantsData) { // Iterate through tenants
    const tenant = tenantData.instance;
    if (!tenant) {
      console.error(`Tenant instance for ${tenantData.name} (schema: ${tenantData.schema_name}) not found. Skipping employees for this tenant.`);
      continue;
    }

    const tenantEmployeesData = employeesData.filter(emp => emp.tenantName === tenant.name); // Assuming tenantName in employeesData still refers to the 'name' property

    for (const empData of tenantEmployeesData) {
      const department = departmentsData.find(d => d.name === empData.departmentName && d.tenantName === tenant.name)?.instance; // Assuming tenantName in departmentsData still refers to the 'name' property
      if (!department) {
        console.error(`Department '${empData.departmentName}' for tenant '${tenant.name}' (schema: ${tenant.schema_name}) not found for employee '${empData.email}'. Skipping.`);
        continue;
      }

      const user = usersData.find(u => u.email === empData.email && u.tenantName === tenant.name)?.instance; // Assuming tenantName in usersData still refers to the 'name' property
      if (!user) {
        console.error(`User with email '${empData.email}' for employee not found in tenant '${tenant.name}' (schema: ${tenant.schema_name}). Skipping employee.`);
        continue;
      }

      const employeeDefaults = {
        first_name: empData.firstName,
        last_name: empData.lastName,
        email: empData.email,
        phone_number: empData.phoneNumber || null,
        date_of_birth: empData.dateOfBirth ? new Date(empData.dateOfBirth) : null,
        address: empData.address || null,
        hire_date: empData.hireDate ? new Date(empData.hireDate) : null,
        job_title: empData.jobTitle || null,
        status: empData.status || 'active', // Assuming 'status' might be in empData
        tenantId: tenant.id,
        departmentId: department.id,
        userId: user.id,
        // reportingManagerId is NOT set in the first pass
      };

      const [employee, created] = await Employee.findOrCreate({
        where: { email: empData.email, tenantId: tenant.id },
        defaults: employeeDefaults,
      });

      if (created) {
        console.log(`Created employee ${employee.first_name} ${employee.last_name} (${employee.email}) for tenant ${tenant.name} (schema: ${tenant.schema_name})`);
      } else {
        console.log(`Employee ${employee.first_name} ${employee.last_name} (${employee.email}) already exists for tenant ${tenant.name} (schema: ${tenant.schema_name})`);
      }
      // Store instance using a key that uniquely identifies the employee within the context of the seed data (email + tenantName for safety, though email is globally unique for users/employees here)
      employeeInstanceMap[`${employee.email}_${tenant.name}`] = employee; // Keyed by tenant name for consistency, though schema_name is the new unique ID for tenants
      empData.instance = employee; // also keep it on empData for reference if needed, though map is primary for lookup
    }
  }
  console.log('--- Finished Employee Creation Pass (Pass 1) ---');

  // Second Pass: Update employees with their reportingManagerId
  console.log('--- Starting Employee Manager Linking Pass (Pass 2) ---');
  for (const tenantData of tenantsData) { // Iterate through tenants again
    const tenant = tenantData.instance;
    if (!tenant) {
      console.error(`Tenant instance for ${tenantData.name} (schema: ${tenantData.schema_name}) not found during manager linking pass. Skipping.`);
      continue;
    }
    const tenantEmployeesData = employeesData.filter(emp => emp.tenantName === tenant.name); // Assuming tenantName in employeesData still refers to the 'name' property

    for (const empData of tenantEmployeesData) {
      if (empData.managerEmail) { // 'managerEmail' instead of 'reportingManagerEmail'
        const currentEmployee = employeeInstanceMap[`${empData.email}_${tenant.name}`]; // Keyed by tenant name
        // Manager must be within the same tenant
        const manager = employeeInstanceMap[`${empData.managerEmail}_${tenant.name}`]; // Keyed by tenant name

        if (currentEmployee && manager) {
          if (currentEmployee.id === manager.id) {
            console.warn(`Employee ${currentEmployee.email} (Tenant: ${tenant.name}, schema: ${tenant.schema_name}) cannot be their own manager. Skipping self-assignment.`);
            continue;
          }
          currentEmployee.reportingManagerId = manager.id; // Ensure Employee model has 'reportingManagerId'
          await currentEmployee.save();
          console.log(`Linked employee ${currentEmployee.email} to manager ${manager.email} for tenant ${tenant.name} (schema: ${tenant.schema_name})`);
        } else if (!manager) {
          console.warn(`Manager with email ${empData.managerEmail} (Tenant: ${tenant.name}, schema: ${tenant.schema_name}) not found in instance map for employee ${empData.email}.`);
        } else if (!currentEmployee) {
          // This case should ideally not happen if Pass 1 is correct
          console.warn(`Employee with email ${empData.email} (Tenant: ${tenant.name}, schema: ${tenant.schema_name}) was not found in the instance map during Pass 2.`);
        }
      }
    }
  }
  console.log('--- Finished Employee Manager Linking Pass (Pass 2) ---');
  console.log('Employee seeding complete.');
}

async function seedSalaryComponents() {
  console.log('Seeding salary components...');
  for (const scData of salaryComponentsData) {
    const tenant = tenantsData.find(t => t.name === scData.tenantName)?.instance;
    if (!tenant) {
      console.error(`Tenant '${scData.tenantName}' not found for salary component '${scData.name}'. Skipping.`);
      continue;
    }
    const defaults = {
        name: scData.name,
        tenantId: tenant.id,
        type: scData.type,
        calculation_type: scData.calculation_type,
        amount: scData.amount || null, // Model should handle default if not applicable
        percentage: scData.percentage || null, // Model should handle default if not applicable
        is_taxable: scData.is_taxable,
        // based_on_component_id: null, // Reset or handle based on new structure if needed
        // formula: null, // Reset or handle based on new structure if needed
    };
    // Example of how based_on_component_id or formula might be handled if they were in scData
    // if (scData.based_on_component_name) { ... }
    // if (scData.formula_string) { defaults.formula = scData.formula_string; }


    const [component, created] = await SalaryComponent.findOrCreate({
      where: { name: scData.name, tenantId: tenant.id, type: scData.type }, // Added type to where clause for more uniqueness
      defaults: defaults,
    });
    scData.instance = component;
    if (created) console.log(`SalaryComponent '${component.name}' for tenant '${tenant.name}' (schema: ${tenant.schema_name}) created.`);
    else console.log(`SalaryComponent '${component.name}' for tenant '${tenant.name}' (schema: ${tenant.schema_name}) already exists.`);
  }
}

async function seedPaySchedules() {
  console.log('Seeding pay schedules...');
  for (const psData of paySchedulesData) {
    const tenant = tenantsData.find(t => t.name === psData.tenantName)?.instance; // Assuming tenantName in paySchedulesData still refers to the 'name' property
    if (!tenant) {
      console.error(`Tenant '${psData.tenantName}' not found for pay schedule '${psData.name}'. Skipping.`);
      continue;
    }
    const [schedule, created] = await PaySchedule.findOrCreate({
      where: { name: psData.name, tenantId: tenant.id }, // Assuming name and tenantId define uniqueness
      defaults: {
        name: psData.name,
        tenantId: tenant.id,
        frequency: psData.frequency,
        pay_day_of_month: psData.pay_day_of_month || null,
        pay_period_start_day: psData.pay_period_start_day || null,
        // pay_day_of_week: psData.pay_day_of_week || null, // if you add this to your model
        // calculation_day_of_month: psData.calculation_day_of_month || null, // if you add this
        // calculation_day_of_week: psData.calculation_day_of_week || null, // if you add this
      },
    });
    psData.instance = schedule;
    if (created) console.log(`PaySchedule '${schedule.name}' for tenant '${tenant.name}' (schema: ${tenant.schema_name}) created.`);
    else console.log(`PaySchedule '${schedule.name}' for tenant '${tenant.name}' (schema: ${tenant.schema_name}) already exists.`);
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
