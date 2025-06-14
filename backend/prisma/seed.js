// C:\payroll_saas\backend\prisma\seed.js

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

if (!process.env.DATABASE_URL) {
  throw new Error(`🔴 FAILED TO LOAD .env FILE. Check path resolution.`);
}

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Comprehensive Seeding Process ---');
  
  // 1. Comprehensive Cleanup
  await prisma.$transaction(async (tx) => {
    console.log('🧹 Cleaning up old data...');
    await tx.userRole.deleteMany({});
    await tx.PayslipItem.deleteMany({});
    await tx.Payslip.deleteMany({});
    await tx.PayrollRun.deleteMany({});
    await tx.employeeSalarySetting.deleteMany({});
    await tx.SalaryComponent.deleteMany({});
    await tx.Employee.deleteMany({});
    await tx.Department.deleteMany({});
    await tx.User.deleteMany({});
    await tx.Role.deleteMany({});
    await tx.Tenant.deleteMany({});
    console.log('✅ Previous data cleaned.');
  });

  // 2. Create Core Tenant
  const techSolutions = await prisma.tenant.create({
    data: { name: "TechSolutions SARL", schemaName: "techsolutions" },
  });
  console.log(`🏢 Tenant "${techSolutions.name}" created.`);

  // 3. Create Roles (with correct relational connection)
  const adminRole = await prisma.role.create({
    data: {
      name: 'admin',
      description: 'Administrator',
      tenant: { connect: { id: techSolutions.id } },
    },
  });
  const hrManagerRole = await prisma.role.create({
    data: {
      name: 'hr_manager',
      description: 'HR Manager',
      tenant: { connect: { id: techSolutions.id } },
    },
  });
  console.log('✅ Roles created.');

  // 4. Create Users
  const rhManagerUser = await prisma.user.create({
    data: {
      email: 'manager.rh@techsolutions.ma',
      firstName: 'Fatima',
      lastName: 'Zahra',
      passwordHash: await bcrypt.hash('password123', 10),
      tenantId: techSolutions.id,
      roles: { create: { roleId: hrManagerRole.id } },
    },
  });
  console.log(`👤 User created: ${rhManagerUser.email}`);

  // 5. Create Departments
  const hrDept = await prisma.department.create({ data: { name: 'Human Resources', tenantId: techSolutions.id } });
  const itDept = await prisma.department.create({ data: { name: 'Information Technology', tenantId: techSolutions.id } });
  const salesDept = await prisma.department.create({ data: { name: 'Sales & Marketing', tenantId: techSolutions.id } });
  console.log('✅ Departments created.');
  
  // 6. Create Pay Schedules
  await prisma.paySchedule.create({ data: { name: 'Monthly', frequency: 'monthly', tenantId: techSolutions.id } });
  await prisma.paySchedule.create({ data: { name: 'Weekly', frequency: 'weekly', tenantId: techSolutions.id } });
  console.log('✅ Pay Schedules created.');

  // 7. Create Salary Components (System and Custom)
  const components = {};
  components.base = await prisma.salaryComponent.create({ data: { tenantId: techSolutions.id, name: 'Salaire de Base', type: 'earning', calculationType: 'fixed', isTaxable: true, payslipDisplayOrder: 1 } });
  components.transport = await prisma.salaryComponent.create({ data: { tenantId: techSolutions.id, name: 'Indemnité de Transport', type: 'earning', calculationType: 'fixed', isTaxable: false, payslipDisplayOrder: 10 } });
  components.commission = await prisma.salaryComponent.create({ data: { tenantId: techSolutions.id, name: 'Prime de Ventes', type: 'earning', calculationType: 'percentage', isTaxable: true, payslipDisplayOrder: 5 } });
  components.loan = await prisma.salaryComponent.create({ data: { tenantId: techSolutions.id, name: 'Remboursement de Prêt', type: 'deduction', calculationType: 'fixed', payslipDisplayOrder: 200 } });
  
  // System components don't have a tenantId
  components.cnss = await prisma.salaryComponent.create({ data: { name: 'CNSS', type: 'deduction', calculationType: 'percentage', percentage: 4.48, isSystemDefined: true, payslipDisplayOrder: 100 } });
  components.amo = await prisma.salaryComponent.create({ data: { name: 'AMO', type: 'deduction', calculationType: 'percentage', percentage: 2.26, isSystemDefined: true, payslipDisplayOrder: 101 } });
  components.igr = await prisma.salaryComponent.create({ data: { name: 'IGR', type: 'tax', calculationType: 'formula', isSystemDefined: true, payslipDisplayOrder: 102 } });
  console.log('✅ Salary Components created (System & Custom).');
  
  // 8. Create Employees
  const employeeFatima = await prisma.employee.create({ data: { firstName: 'Fatima', lastName: 'Zahra', email: rhManagerUser.email, jobTitle: 'HR Manager', hireDate: new Date('2022-03-15'), status: 'active', departmentId: hrDept.id, tenantId: techSolutions.id } });
  const employeeYoussef = await prisma.employee.create({ data: { firstName: 'Youssef', lastName: 'Alaoui', email: 'y.alaoui@techsolutions.ma', jobTitle: 'Senior Developer', hireDate: new Date('2021-08-01'), status: 'active', departmentId: itDept.id, tenantId: techSolutions.id } });
  const employeeAmina = await prisma.employee.create({ data: { firstName: 'Amina', lastName: 'Bennani', email: 'a.bennani@techsolutions.ma', jobTitle: 'Sales Executive', hireDate: new Date('2023-01-20'), status: 'active', departmentId: salesDept.id, tenantId: techSolutions.id } });
  console.log('✅ Employees created.');

  // 9. Assign Salary Settings to Employees
  const effectiveDate = new Date();
  await prisma.employeeSalarySetting.createMany({
    data: [
      // Fatima's Settings
      { employeeId: employeeFatima.id, salaryComponentId: components.base.id, amount: 25000, tenantId: techSolutions.id, effectiveDate },
      { employeeId: employeeFatima.id, salaryComponentId: components.transport.id, amount: 600, tenantId: techSolutions.id, effectiveDate },

      // Youssef's Settings
      { employeeId: employeeYoussef.id, salaryComponentId: components.base.id, amount: 35000, tenantId: techSolutions.id, effectiveDate },
      { employeeId: employeeYoussef.id, salaryComponentId: components.transport.id, amount: 800, tenantId: techSolutions.id, effectiveDate },
      { employeeId: employeeYoussef.id, salaryComponentId: components.loan.id, amount: 1500, tenantId: techSolutions.id, effectiveDate },

      // Amina's Settings
      { employeeId: employeeAmina.id, salaryComponentId: components.base.id, amount: 12000, tenantId: techSolutions.id, effectiveDate },
      { employeeId: employeeAmina.id, salaryComponentId: components.transport.id, amount: 400, tenantId: techSolutions.id, effectiveDate },
      { employeeId: employeeAmina.id, salaryComponentId: components.commission.id, percentage: 5, tenantId: techSolutions.id, effectiveDate },
    ]
  });
  console.log('✅ Employee Salary Settings assigned.');

  console.log('--- Seeding Finished Successfully ---');
}

main()
  .catch((e) => {
    console.error('An error occurred during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Connection closed.');
  });