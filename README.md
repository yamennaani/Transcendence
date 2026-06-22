# Transcendence

> *This project has been created as part of the 42 curriculum by Yalnaani, Aruckenb, Aghanam, Pvass, and Karabitsc.*

---

# Table of Contents

* [Description](#description)
* [Team Information](#team-information)
* [Project Management](#project-management)
* [Technology Stack](#technology-stack)
* [Modules](#modules)

  * [Major Modules](#major-modules)
  * [Minor Modules](#minor-modules)
  * [Custom Modules](#custom-modules)
* [Features](#features)
* [Database Schema](#database-schema)
* [Instructions](#instructions)

  * [Requirements](#requirements)
  * [Getting Started](#getting-started)
  * [Commands](#commands)
  * [Project Structure](#project-structure)
  * [Architecture](#architecture)
  * [API Endpoints](#api-endpoints)
  * [Adding a New Service](#adding-a-new-service)
  * [Branch Strategy](#branch-strategy)
  * [Contributing](#contributing)
* [Journey](#journey)
* [Resources](#resources)

---

# Description

Transcendence is a peer-to-peer learning platform inspired by the educational model of **42 School**. The platform enables students, instructors (Bocal), and administrators to collaborate through assignments, organizations, groups, and evaluations in a modern web application.

The project follows a **microservice architecture**, with an Angular frontend, Express.js backend services, PostgreSQL database managed through Prisma ORM, and nginx acting as the reverse proxy. Everything is fully containerized using Docker for a simple development and deployment experience.

---

# Team Information

*Change the team info into something more descriptive rather then bull points 

## Project Owner — Katrin Rabitsch (Karabitsc)

* Original project concept
* Requirements planning
* Feature discussions
* Feed back and idea/additional features from interested "customers"
* Creator of the Evaluation Alogitherm 
* Evaluation feature, worked on both the backend and frontend 
* Worked on the populateDB

## Project Manager — Albert Ruckenbauer (Aruckenb)

* Project management
* Feature planning
* Frontend localization
* Documentation
* Team coordination

## Technical Lead — Yamen Alnaani (Yalnaani)

* Backend architecture
* Microservice design
* Database architecture
* Infrastructure decisions
* Worked on both the backend and frontend 

## Developer — Adam Ghanam (Aghanam)

* Authentication system
* OAuth implementation
* Frontend Authentication 
* Backend development

## Developer — Peter Vass (Pvass)

* Frontend framework
* Dashboard implementation
* Database design
* Entity Relationship Diagram
* Backend structure
* Worked on the populateDB

---

# Project Management

Throughout development we used several tools to coordinate the project:

* GitHub
* Trello
* Discord

Discord served as our primary communication platform where we:

* Planned weekly meetings
* Assigned tasks
* Discussed bugs
* Shared development progress
* Reviewed pull requests
* Planned milestones

GitHub Projects and Trello were used to organize issues, tasks, and sprint planning.

---

# Technology Stack

| Layer            | Technology               |
| ---------------- | ------------------------ |
| Frontend         | Angular 17               |
| Backend          | Express.js Microservices |
| Database         | PostgreSQL 16            |
| ORM              | Prisma v5                |
| Reverse Proxy    | nginx                    |
| Containerization | Docker & Docker Compose  |
| Authentication   | JWT + OAuth 2.0          |
| Localization     | ngx-translate            |

### Why these technologies?

**Angular**

Chosen because of its scalability, component architecture, built-in tooling, and popularity within enterprise applications.

**Express.js Microservices**

Separating the backend into multiple services improves maintainability, scalability, and allows each service to evolve independently.

**PostgreSQL**

Reliable relational database with excellent support for transactions and complex relationships.

**Prisma ORM**

Provides excellent type safety, automatic client generation, migrations, and significantly simplifies database development.

**Docker**

Ensures every developer has an identical development environment while simplifying deployment.

---

# Modules

The project fulfills both mandatory and custom modules from the 42 Transcendence curriculum.

---

## Major Modules

### ✔ Framework for Frontend and Backend

* Angular frontend
* Express.js backend
* Microservice architecture

---

### ✔ Public API interacting with the Database

REST API allowing CRUD operations across multiple services.

Examples include:

* Users
* Organizations
* Classes
* Assignments
* Groups
* Enrollments

---

### ✔ Standard User Management & Authentication

Supports:

* Registration
* Login
* JWT Authentication
* Password hashing
* Protected routes
* Session management

---

### ✔ Advanced Permission System

Three user roles:

* Student
* Bocal
* Administrator

Each role has different permissions throughout the application.

---

### ✔ Organization System

Organizations contain:

* Members
* Classes
* Administrative staff
* Permissions

---

### ✔ Microservice Backend

Backend split into independent services:

* User Service
* Authentication Service
* Organization Service
* Class Service
* Enrollment Service
* Group Service

Each service owns its own business logic while sharing common packages.

---

## Minor Modules

### ✔ ORM Database

Prisma ORM provides:

* Type-safe queries
* Database migrations
* Generated client
* Easy schema evolution
* Excellent TypeScript integration

---

### ✔ Real-Time Collaborative Feature

Students collaborate through:

* Assignment groups
* Invitations
* Shared evaluations

---

### ✔ Custom Design System

Frontend includes reusable:

* Buttons
* Cards
* Dialogs
* Tables
* Inputs
* Layout components

This keeps the interface visually consistent.

---

### ✔ Advanced Search

Search functionality includes:

* Users
* Classes
* Organizations

---

### ✔ File Upload & Management

Users may:

* Upload files
* Delete files
* Manage submissions

---

### ✔ Multi-language Support

Supported languages:

* English
* German
* Hungarian
* Arabic

---

### ✔ Right-to-Left (RTL)

Arabic is fully supported through RTL layouts.

---

### ✔ Cross-browser Support

The application has been developed to function correctly on all modern browsers.

---

### ✔ OAuth 2.0 Authentication

Users may authenticate using remote OAuth providers.

---

### ✔ User Activity Dashboard

Dashboard displaying statistics such as:

* Submission counts
* Evaluation progress
* Completion rates

---

## Custom Modules

### Evaluation Pairing Algorithm

Custom pairing algorithm that automatically assigns peer evaluations while balancing fairness and workload across students.

---

# Features

## Three User Types

### Student

* Join organizations
* Enroll in classes
* Submit assignments
* Form groups
* Evaluate peers
* View progress

---

### Bocal

* Manage classes
* Create assignments
* Manage evaluations
* Review student progress
* Moderate organizations

---

### Administrator

* Full system management
* User management
* Organization management
* Permission management
* Administrative dashboard

---

# Database Schema

The project uses **Prisma** for schema management.

Database visualization can be generated directly from the Prisma schema using Prisma Studio or ER diagram generation tools.

*(Insert your Prisma schema visualization here.)*

---

# Instructions

## Requirements

* Docker
* Docker Compose
* Make

---

## Getting Started

### Clone the repository

```bash
git clone git@github.com:yamennaani/Transcendence.git
cd Transcendence
```

### Run

```bash
make
```

On first startup the project will automatically:

* Generate `src/.env`
* Link the Prisma environment
* Build all Docker containers
* Apply database migrations
* Start every microservice

Open:

```
http://localhost
```

---

## Commands

| Command        | Description                      |
| -------------- | -------------------------------- |
| `make`         | Start development                |
| `make dev`     | Development mode with hot reload |
| `make prod`    | Production mode                  |
| `make down`    | Stop containers                  |
| `make re`      | Rebuild project                  |
| `make logs`    | View logs                        |
| `make status`  | Show running containers          |
| `make migrate` | Apply migrations                 |
| `make studio`  | Open Prisma Studio               |
| `make clean`   | Remove Docker resources          |
| `make fclean`  | Complete reset                   |

---

## Project Structure

```text
Transcendence/
├── Makefile
├── README.md
├── DEV_DOC.md
└── src/
    ├── docker-compose.yml
    ├── docker-compose.dev.yml
    ├── .env
    ├── nginx/
    ├── frontend/
    ├── database/
    ├── packages/
    │   ├── database/
    │   ├── logger/
    │   ├── errors/
    │   └── utils/
    └── services/
        ├── user/
        ├── auth/
        ├── org/
        ├── class/
        ├── enroll/
        └── group/
```

---

## Architecture

```text
Internet
    │
 nginx
    │
 ├── Frontend
 ├── User Service
 ├── Auth Service
 ├── Organization Service
 ├── Class Service
 ├── Enrollment Service
 └── Group Service
          │
     PostgreSQL
```

---

## API Endpoints

### User Service

| Method | Endpoint                |
| ------ | ----------------------- |
| GET    | `/api/user`             |
| POST   | `/api/user/register`    |
| GET    | `/api/user/:id`         |
| PATCH  | `/api/user/:id/profile` |
| DELETE | `/api/user/:id`         |

### Organization Service

| Method | Endpoint               |
| ------ | ---------------------- |
| GET    | `/api/org`             |
| POST   | `/api/org`             |
| GET    | `/api/org/:id`         |
| POST   | `/api/org/:id/members` |
| DELETE | `/api/org/:id/members` |

### Class Service

| Method | Endpoint                     |
| ------ | ---------------------------- |
| GET    | `/api/class`                 |
| POST   | `/api/class`                 |
| GET    | `/api/class/:id`             |
| GET    | `/api/class/:id/assignments` |
| POST   | `/api/class/:id/assignments` |

### Enrollment Service

| Method | Endpoint      |
| ------ | ------------- |
| POST   | `/api/enroll` |
| PATCH  | `/api/enroll` |

### Group Service

| Method | Endpoint                |
| ------ | ----------------------- |
| POST   | `/api/group`            |
| POST   | `/api/group/:id/invite` |
| PATCH  | `/api/group/invite/:id` |

---

## Adding a New Service

1. Create a new service directory.
2. Copy the User service as a template.
3. Register the service in Docker Compose.
4. Configure nginx routing.
5. Add Prisma models.
6. Run:

```bash
make migrate
make re
```

---

## Branch Strategy

```text
main
│
├── develop
│
├── feature/*
├── fix/*
└── chore/*
```

* `main` — Production
* `develop` — Integration
* `feature/*` — New features
* `fix/*` — Bug fixes
* `chore/*` — Maintenance

---

## Contributing

1. Create a branch from `develop`.
2. Follow the commit convention:

```text
feat(scope): description
```

3. Open a Pull Request.
4. Request review.
5. Merge into `develop`.

---

# Journey

The Beginning of the Journey is the same for all users, when openning the appilication for the first time, the user sees our wonderful landing page, their the user can login in. In the Login page the user can simply enter their email and password or choose to login with github or google. From their depending on the user they will three different pages and have privileges to differetn things. 

All users have accesss to 4 standard things, the settings, their own profile the language changer and the sign out!

## Students Journey

*rough notes: Students have access to the classic dashboard, what classes they are apart of, what assignments they have, what evauluations they most complete and lastly their overall progress! (Note Porgress is bugged)

## Bocal Journey

*rought notes: Bocal/teachers can create classes and assignments, activate the evaulation pairing process, add new users 

## Admin Journey 

*rought notes: Admins have access to create new organizations, adding bocal and student users. 

---

# Resources

### Inspiration

The project was inspired by the educational platform used at **42 School**.

### AI Usage

Artificial Intelligence tools were used to:

* Understand unfamiliar frameworks
* Research implementation approaches
* Assist with debugging
* Improve documentation
* Accelerate development

All architecture, implementation decisions, and final code were designed, reviewed, and validated by the development team.

---

**Maintained by:** @yamennaani
