# Payroll SaaS Project

This project is a Software as a Service (SaaS) application for managing payroll.

## Database Seeding

### Purpose

The seed script is designed to populate the database with initial data. This is useful for:

-   **Development:** Providing a consistent dataset to develop and test features against.
-   **Testing:** Ensuring that automated tests can run against a known database state.
-   **Demonstration:** Allowing new users or stakeholders to quickly see the application with sample data.

The script is idempotent, meaning it can be run multiple times without creating duplicate entries. It uses Sequelize's `findOrCreate` method to only add data if it doesn't already exist based on unique constraints.

### Data Seeded

The script populates the database with sample data relevant to a Moroccan context, including:

-   **Tenants:** Example companies (e.g., "TechSolutions SARL", "Artisanat Marocain Coop").
-   **Users:** Sample user accounts with different roles (Admin, Manager, Employee) for each tenant.
-   **Roles:** Definitions for user roles within each tenant.
-   **Departments:** Organizational departments for tenants (e.g., "Technologie de l'Information", "Ressources Humaines").
-   **Employees:** Sample employee profiles with Moroccan names, linked to users, departments, and tenants.
-   **Salary Components:** Typical Moroccan payroll elements like "Salaire de Base", "Indemnité de Transport", "CNSS", "AMO".
-   **Pay Schedules:** Examples of pay frequencies (e.g., monthly).

### How to Run

To execute the seed script, ensure your database connection is correctly configured (typically in a `.env` file or environment variables, as per Sequelize setup). Then, run the following command from the project root:

```bash
npm run db:seed
```

Alternatively, if you use Yarn:

```bash
yarn db:seed
```

This command will execute the `scripts/seed.js` file using Node.js, which will connect to the database, synchronize the schema (if configured to do so in the script, e.g., via `sequelize.sync({ alter: true })`), and then populate the tables. You should see console output indicating the progress and completion of the seeding process.
