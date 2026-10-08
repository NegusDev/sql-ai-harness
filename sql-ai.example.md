# Database Context

<!--
This file is optional.
Rename it to `sql-ai.md` if you want to provide business/domain context
for the connected database.
-->

## Overview

Describe what this database is used for and the domain it represents.

Example:

This database belongs to a school management system. It stores information
about students, parents, teachers, classes, enrollments, attendance and fees.

## Business Rules

Add important rules that are not obvious from the database schema.

- Only active enrollments represent currently enrolled students.
- Completed payments are considered successful payments.
- Cancelled payments should not be included in revenue calculations.

## Terminology

Explain domain-specific terms where the database naming may not be obvious.

- Student: A learner registered at the school.
- Enrollment: A student's registration for an academic period.
- Revenue: The total amount from completed payments.
