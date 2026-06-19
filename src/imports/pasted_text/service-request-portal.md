# Build an Enterprise Dynamic Service Request Portal

## Project Overview

Build a modern, lightweight, enterprise-grade Service Request Portal for an organization.

The application replaces manual PDF forms with a completely digital workflow.

This is NOT a ticketing system.

This is a Dynamic Form + Approval Workflow System.

Technology Stack

Frontend

* React 19
* Vite
* Tailwind CSS
* React Router
* React Hook Form
* React Query
* Axios
* React Hot Toast
* Hero Icons

Backend

* Node.js
* Express.js
* MongoDB (Mongoose)
* JWT Authentication
* Multer
* Nodemailer
* Zod Validation

Database

* MongoDB for forms, requests, workflow and audit logs.

External Database

* Existing HRMS SQL Server
* Employee information must be fetched from HRMS.
* Do NOT duplicate employee master records inside MongoDB.

Project Architecture

React
↓

Express REST API

↓

Workflow Engine

↓

MongoDB

↓

HRMS SQL API

The system should be modular and scalable.

---

MAIN MODULES

1. Public Employee Portal

No login required.

Employee enters Employee ID.

System fetches employee information from HRMS.

Employee details become readonly.

Employee only fills request specific fields.

Employee can

• Submit Request
• View Previous Requests
• Track Status
• Download Completed PDF (optional)

---

2. Approver Portal

Login Required

Roles

Admin

HOD

IT Team

HR Team

Finance Team

Department Processor

JWT Authentication.

Dashboard

Pending

Approved

Rejected

Completed

Notifications

---

3. Dynamic Form Builder

Admin can create forms visually.

Available field types

Text

Textarea

Number

Email

Phone

Date

Time

Dropdown

Multi Select

Radio

Checkbox

File Upload

Signature

Hidden Field

Readonly Field

Employee Information

Section Title

Divider

Each field supports

label

placeholder

required

validation

default value

options

width

help text

icon

visibility conditions

---

Save every form as JSON.

Example

forms/

it/

employee_wifi_request.json

miss_punch_request.json

official_email_request.json

hr/

leave_request.json

finance/

advance_request.json

The JSON is the source for rendering forms.

---

4. Form Metadata

Store metadata in MongoDB.

Example

title

department

icon

description

json filename

workflow

version

active

createdBy

updatedAt

---

5. Dynamic Form Renderer

React must render the form completely from JSON.

No hardcoded forms.

The renderer must support every field type automatically.

---

6. Workflow Engine

Every form has a workflow.

Example

Employee Department HOD

↓

Owner Department Processor

↓

Completed

Workflow must support

EmployeeDepartmentHOD

ReportingManager

Specific User

Specific Role

Department Processor

HR

Finance

IT

Parallel Approval

Final Approval

Custom Workflow

Everything configurable.

No hardcoded approval logic.

---

7. HRMS Integration

Employee enters Employee ID.

Call internal HRMS API.

Example

GET

/api/hrms/employee/{employeeId}

Return

Employee ID

Name

Department

Designation

Branch

Email

Mobile

Reporting Manager

HOD

Employment Status

Auto-fill all fields.

User cannot edit HRMS fields.

Store a snapshot of employee details inside every request.

---

8. Request Processing

Every request contains

Request Number

Employee Snapshot

Answers

Workflow Status

Approval History

Processing History

Comments

Attachments

Audit Logs

---

9. Approval Screen

Approver sees

Employee

Department

Submitted Date

Form

Remarks

Attachments

Approve

Reject

Send Back

Forward

Request More Information

Timeline

---

10. Department Processing

After approval

Automatically create work queue.

Example

IT Queue

Pending

In Progress

Completed

Cancelled

Assign request to processor.

Processor can update status.

Processor can upload completion proof.

---

11. Employee Tracking

No login.

Employee enters Employee ID.

Show every request.

Newest first.

Display

Submitted

Pending Approval

Approved

Processing

Completed

Rejected

Timeline view.

---

12. Search

Global search

Employee ID

Employee Name

Request Number

Department

Status

Form Type

Date Range

---

13. Dashboard

Admin Dashboard

Requests Today

Pending

Approved

Rejected

Completed

Department Statistics

Top Requested Forms

Average Processing Time

Charts

---

14. Notifications

Email Notifications

Employee Submitted

Approval Required

Approved

Rejected

Completed

Reminder Emails

---

15. Audit Log

Store every action.

Example

Created

Viewed

Approved

Rejected

Forwarded

Comment Added

Completed

Include

User

Department

IP

Browser

Timestamp

---

16. JSON Driven Configuration

Use configuration files.

config/workflows.json

config/departments.json

config/roles.json

config/permissions.json

These should also sync with MongoDB.

---

17. Versioning

Every form save creates

employee_wifi_v1.json

employee_wifi_v2.json

employee_wifi_v3.json

Old requests continue referencing the version they were submitted with.

---

18. Folder Structure

server/

controllers/

routes/

middlewares/

services/

workflow/

forms/

config/

uploads/

models/

utils/

frontend/

components/

pages/

layouts/

hooks/

services/

store/

renderer/

forms/

---

19. Coding Standards

Use TypeScript where possible.

Component based architecture.

Reusable hooks.

Reusable API layer.

Proper folder organization.

Clean code.

Comments only where necessary.

No duplicated code.

---

20. UI Design

Modern

Minimal

Hospital ERP style

Rounded cards

Professional colors

Responsive

Dark Mode

Fast loading

Tailwind CSS only.

---

21. Future Ready

Support

LDAP Login

Active Directory

QR Code

Digital Signature

PDF Generation

SMS

WhatsApp

Push Notification

Offline Drafts

IndexedDB Draft Storage

PWA Support

Multi-language

Role Based Access Control

API Versioning

---

Generate the complete project structure, backend architecture, frontend architecture, MongoDB schema, reusable workflow engine, JSON renderer, API endpoints, authentication system, dynamic form builder, and responsive UI using best enterprise coding practices.
