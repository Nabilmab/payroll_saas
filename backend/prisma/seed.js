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
  console.log('--- Starting FULL Multi-Jurisdiction Seeding Process ---');

  // 1. Correct Cleanup
  await prisma.$transaction(async (tx) => {
    console.log('🧹 Cleaning up old data...');
    // NEW: Clean the new join table first
    await tx.userTenantAccess.deleteMany({});
    // The rest of your cleanup order is correct
    await tx.PayslipItem.deleteMany({});
    await tx.Payslip.deleteMany({});
    await tx.PayrollRun.deleteMany({});
    await tx.employeeSalarySetting.deleteMany({});
    await tx.Employee.deleteMany({});
    await tx.Department.deleteMany({});
    await tx.User.deleteMany({}); // User is now independent
    await tx.Role.deleteMany({}); // Role must be deleted before Tenant
    await tx.CalculationStep.deleteMany({});
    await tx.TaxBracket.deleteMany({});
    await tx.PaySchedule.deleteMany({});
    await tx.SalaryComponent.deleteMany({}); // Depends on Tenant and Jurisdiction
    await tx.Tenant.deleteMany({});
    await tx.Jurisdiction.deleteMany({});
    console.log('✅ All data cleaned successfully.');
  });

  // =================================================================
  // JURISDICTION 1: MOROCCO 🇲🇦 (This section is unchanged)
  // =================================================================
  console.log('\n--- Seeding Jurisdiction: Morocco ---');
  const morocco = await prisma.jurisdiction.create({
    data: { id: 'MA', name: 'Morocco', currency: 'MAD', locale: 'fr-MA' },
  });
  await prisma.taxBracket.createMany({
    data: [
      { jurisdictionId: 'MA', year: 2024, incomeMin: 0, incomeMax: 30000, rate: 0.00, flatDeduction: 0 },
      { jurisdictionId: 'MA', year: 2024, incomeMin: 30001, incomeMax: 50000, rate: 0.10, flatDeduction: 3000 },
      { jurisdictionId: 'MA', year: 2024, incomeMin: 50001, incomeMax: 60000, rate: 0.20, flatDeduction: 8000 },
      { jurisdictionId: 'MA', year: 2024, incomeMin: 60001, incomeMax: 80000, rate: 0.30, flatDeduction: 14000 },
      { jurisdictionId: 'MA', year: 2024, incomeMin: 80001, incomeMax: 180000, rate: 0.34, flatDeduction: 17200 },
      { jurisdictionId: 'MA', year: 2024, incomeMin: 180001, incomeMax: null, rate: 0.38, flatDeduction: 24400 },
    ],
  });
  const componentsMA = {
    cnss: await prisma.salaryComponent.create({ data: { name: 'CNSS', type: 'deduction', calculationType: 'formula', isSystemDefined: true, jurisdictionId: 'MA', payslipDisplayOrder: 100 } }),
    amo: await prisma.salaryComponent.create({ data: { name: 'AMO', type: 'deduction', calculationType: 'formula', isSystemDefined: true, jurisdictionId: 'MA', payslipDisplayOrder: 101 } }),
    igr: await prisma.salaryComponent.create({ data: { name: 'IGR', type: 'tax', calculationType: 'formula', isSystemDefined: true, jurisdictionId: 'MA', payslipDisplayOrder: 102 } }),
  };
  await prisma.calculationStep.createMany({
    data: [
      { jurisdictionId: 'MA', executionOrder: 10, name: 'Calculate Gross Pay', targetContextKey: 'grossPay', formula: 'SUM_EARNINGS', baseContextKeys: [] },
      { jurisdictionId: 'MA', executionOrder: 20, name: 'Calculate Taxable Pay', targetContextKey: 'taxablePay', formula: 'SUM_TAXABLE_EARNINGS', baseContextKeys: [] },
      { jurisdictionId: 'MA', executionOrder: 30, name: 'Calculate CNSS', targetContextKey: 'cnssAmount', targetComponentId: componentsMA.cnss.id, formula: 'MIN(taxablePay, 6000) * 0.0448', baseContextKeys: ['taxablePay'] },
      { jurisdictionId: 'MA', executionOrder: 40, name: 'Calculate AMO', targetContextKey: 'amoAmount', targetComponentId: componentsMA.amo.id, formula: 'taxablePay * 0.0226', baseContextKeys: ['taxablePay'] },
      { jurisdictionId: 'MA', executionOrder: 50, name: 'Calculate Annual Taxable Income', targetContextKey: 'netTaxableAnnual', formula: '(taxablePay - cnssAmount - amoAmount) * 12', baseContextKeys: ['taxablePay', 'cnssAmount', 'amoAmount'] },
      { jurisdictionId: 'MA', executionOrder: 60, name: 'Calculate IGR', targetContextKey: 'igrAmount', targetComponentId: componentsMA.igr.id, formula: 'CALCULATE_TAX(netTaxableAnnual) / 12', baseContextKeys: ['netTaxableAnnual'] },
      { jurisdictionId: 'MA', executionOrder: 70, name: 'Calculate Custom Deductions', targetContextKey: 'customDeductions', formula: 'SUM_CUSTOM_DEDUCTIONS', baseContextKeys: [] },
      { jurisdictionId: 'MA', executionOrder: 80, name: 'Calculate Total Deductions', targetContextKey: 'totalDeductions', formula: 'customDeductions', baseContextKeys: ['customDeductions'] },
      { jurisdictionId: 'MA', executionOrder: 90, name: 'Calculate Total Taxes', targetContextKey: 'totalTaxes', formula: 'cnssAmount + amoAmount + igrAmount', baseContextKeys: ['cnssAmount', 'amoAmount', 'igrAmount'] },
      { jurisdictionId: 'MA', executionOrder: 100, name: 'Calculate Net Pay', targetContextKey: 'netPay', formula: 'grossPay - totalDeductions - totalTaxes', baseContextKeys: ['grossPay', 'totalDeductions', 'totalTaxes'] },
    ]
  });
  console.log(`✅ Morocco rules seeded.`);

  // =================================================================
  // JURISDICTION 2: SENEGAL 🇸🇳 (This section is unchanged)
  // =================================================================
  console.log('\n--- Seeding Jurisdiction: Senegal ---');
  const senegal = await prisma.jurisdiction.create({
    data: { id: 'SN', name: 'Senegal', currency: 'XOF', locale: 'fr-SN' },
  });
  await prisma.taxBracket.createMany({
    data: [
        { jurisdictionId: 'SN', year: 2024, incomeMin: 0, incomeMax: 630000, rate: 0.0, flatDeduction: 0 },
        { jurisdictionId: 'SN', year: 2024, incomeMin: 630001, incomeMax: 1500000, rate: 0.2, flatDeduction: 126000 },
        { jurisdictionId: 'SN', year: 2024, incomeMin: 1500001, incomeMax: 4000000, rate: 0.3, flatDeduction: 276000 },
        { jurisdictionId: 'SN', year: 2024, incomeMin: 4000001, incomeMax: 8000000, rate: 0.35, flatDeduction: 476000 },
        { jurisdictionId: 'SN', year: 2024, incomeMin: 8000001, incomeMax: 13500000, rate: 0.37, flatDeduction: 636000 },
        { jurisdictionId: 'SN', year: 2024, incomeMin: 13500001, incomeMax: null, rate: 0.4, flatDeduction: 1041000 },
    ],
  });
  const componentsSN = {
    ipres: await prisma.salaryComponent.create({ data: { name: 'IPRES', type: 'deduction', calculationType: 'formula', isSystemDefined: true, jurisdictionId: 'SN', payslipDisplayOrder: 100 } }),
    cfce: await prisma.salaryComponent.create({ data: { name: 'CFCE', type: 'deduction', calculationType: 'formula', isSystemDefined: true, jurisdictionId: 'SN', payslipDisplayOrder: 101 } }),
    ir: await prisma.salaryComponent.create({ data: { name: 'IR', type: 'tax', calculationType: 'formula', isSystemDefined: true, jurisdictionId: 'SN', payslipDisplayOrder: 102 } }),
  };
  await prisma.calculationStep.createMany({
    data: [
        { jurisdictionId: 'SN', executionOrder: 10, name: 'Calculate Gross Pay', targetContextKey: 'grossPay', formula: 'SUM_EARNINGS', baseContextKeys: [] },
        { jurisdictionId: 'SN', executionOrder: 20, name: 'Calculate Taxable Pay', targetContextKey: 'taxablePay', formula: 'SUM_TAXABLE_EARNINGS', baseContextKeys: [] },
        { jurisdictionId: 'SN', executionOrder: 30, name: 'Calculate IPRES', targetContextKey: 'ipresAmount', targetComponentId: componentsSN.ipres.id, formula: 'MIN(taxablePay, 360000) * 0.056', baseContextKeys: ['taxablePay'] },
        { jurisdictionId: 'SN', executionOrder: 40, name: 'Calculate CFCE', targetContextKey: 'cfceAmount', targetComponentId: componentsSN.cfce.id, formula: 'taxablePay * 0.03', baseContextKeys: ['taxablePay'] },
        { jurisdictionId: 'SN', executionOrder: 50, name: 'Calculate Annual Taxable Income', targetContextKey: 'netTaxableAnnual', formula: '(taxablePay - ipresAmount - cfceAmount) * 12', baseContextKeys: ['taxablePay', 'ipresAmount', 'cfceAmount'] },
        { jurisdictionId: 'SN', executionOrder: 60, name: 'Calculate IR', targetContextKey: 'irAmount', targetComponentId: componentsSN.ir.id, formula: 'CALCULATE_TAX(netTaxableAnnual) / 12', baseContextKeys: ['netTaxableAnnual'] },
        { jurisdictionId: 'SN', executionOrder: 70, name: 'Calculate Custom Deductions', targetContextKey: 'customDeductions', formula: 'SUM_CUSTOM_DEDUCTIONS', baseContextKeys: [] },
        { jurisdictionId: 'SN', executionOrder: 80, name: 'Calculate Total Deductions', targetContextKey: 'totalDeductions', formula: 'customDeductions', baseContextKeys: ['customDeductions'] },
        { jurisdictionId: 'SN', executionOrder: 90, name: 'Calculate Total Taxes', targetContextKey: 'totalTaxes', formula: 'ipresAmount + cfceAmount + irAmount', baseContextKeys: ['ipresAmount', 'cfceAmount', 'irAmount'] },
        { jurisdictionId: 'SN', executionOrder: 100, name: 'Calculate Net Pay', targetContextKey: 'netPay', formula: 'grossPay - totalDeductions - totalTaxes', baseContextKeys: ['grossPay', 'totalDeductions', 'totalTaxes'] },
    ]
  });
  console.log(`✅ Senegal rules seeded.`);

  // =================================================================
  // CREATE DEMO TENANTS, USERS, AND DATA (UPDATED LOGIC)
  // =================================================================
  console.log('\n--- Seeding Demo Tenants and Data ---');
  
  // --- Tenant 1: TechSolutions (Morocco) ---
  const techSolutions = await prisma.tenant.create({ data: { name: "TechSolutions SARL", schemaName: "techsolutions", jurisdictionId: morocco.id } });
  
  // Create roles FOR this tenant
  const adminRoleMA = await prisma.role.create({ data: { name: 'admin', description: 'Full access to the tenant', tenantId: techSolutions.id } });
  const hrManagerRoleMA = await prisma.role.create({ data: { name: 'hr_manager', description: 'Manages employees and payroll', tenantId: techSolutions.id } });

  // Create users (they are now independent of tenants)
  const userFatima = await prisma.user.create({ data: { email: 'manager.ma@example.com', firstName: 'Fatima', lastName: 'Zahra', passwordHash: await bcrypt.hash('password123', 10) } });
  const userYoussef = await prisma.user.create({ data: { email: 'admin.ma@example.com', firstName: 'Youssef', lastName: 'Alaoui', passwordHash: await bcrypt.hash('password123', 10) } });
  
  // Grant users access to the tenant using the new join table
  await prisma.userTenantAccess.create({
    data: {
      userId: userFatima.id,
      tenantId: techSolutions.id,
      roleId: hrManagerRoleMA.id // Fatima is an HR Manager
    }
  });
  await prisma.userTenantAccess.create({
    data: {
      userId: userYoussef.id,
      tenantId: techSolutions.id,
      roleId: adminRoleMA.id // Youssef is an Admin
    }
  });
  
  // Create other data for this tenant
  const hrDeptMA = await prisma.department.create({ data: { name: 'Ressources Humaines', tenantId: techSolutions.id } });
  await prisma.employee.create({ data: { firstName: 'Ahmed', lastName: 'Bennani', email: 'ahmed.b@techsolutions.ma', jobTitle: 'Ingénieur Logiciel', hireDate: new Date('2022-05-20'), status: 'active', departmentId: hrDeptMA.id, tenantId: techSolutions.id } });
  console.log(`🏢 Moroccan Tenant, Roles, and Users (manager.ma@example.com, admin.ma@example.com) created.`);


  // --- Tenant 2: DakarInnov (Senegal) ---
  const dakarInnov = await prisma.tenant.create({ data: { name: "DakarInnov SUARL", schemaName: "dakarinnov", jurisdictionId: senegal.id } });

  // Create roles FOR this tenant
  const adminRoleSN = await prisma.role.create({ data: { name: 'admin', description: 'Full access to the tenant', tenantId: dakarInnov.id }});

  // Create a user
  const userMoussa = await prisma.user.create({ data: { email: 'manager.sn@example.com', firstName: 'Moussa', lastName: 'Diop', passwordHash: await bcrypt.hash('password123', 10) }});

  // Grant access
  await prisma.userTenantAccess.create({
    data: {
      userId: userMoussa.id,
      tenantId: dakarInnov.id,
      roleId: adminRoleSN.id // Moussa is an Admin
    }
  });
  
  // BONUS: Give Youssef (from the first tenant) access to the second tenant as well!
  // This demonstrates the multi-tenant access capability.
  console.log(`✨ Granting Youssef (admin.ma@example.com) access to DakarInnov as well...`);
  await prisma.userTenantAccess.create({
    data: {
      userId: userYoussef.id, // Re-using Youssef's user ID
      tenantId: dakarInnov.id,
      roleId: adminRoleSN.id // He is also an Admin here
    }
  });

  // Create other data for this tenant
  const finDeptSN = await prisma.department.create({ data: { name: 'Finance', tenantId: dakarInnov.id } });
  await prisma.employee.create({ data: { firstName: 'Awa', lastName: 'Fall', email: 'awa.f@dakarinnov.sn', jobTitle: 'Comptable', hireDate: new Date('2023-01-10'), status: 'active', departmentId: finDeptSN.id, tenantId: dakarInnov.id } });
  console.log(`🏢 Senegalese Tenant, Role, and User (manager.sn@example.com) created.`);
  
  console.log('\n--- Seeding Finished Successfully ---');
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