*This project has been created as part of the 42 curriculum by Yalnaani, Aruckenb, Aghanam, Pvass, and Karabitsc.*

# Transcendence: 43
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

*The “Description” section should also contain a clear name for the project and its key features. we need this!

---

# Team Information

Developing **Transcendence** was a collaborative effort involving five team members, each taking on a primary role while contributing across multiple areas of the project.

*Need to include a few more things within the team information! Such as the individual contributions, detailed breakdown of what each team emmebr contributed, specific featues and models or compnents implemented by each person, and any challenged faced.

## Product Owner — Katrin Rabitsch (Karabitsc)

As the Product Owner, Katrin was responsible for defining the overall vision and direction of the project. She developed the original concept and continuously refined it by gathering feedback and feature suggestions from prospective users throughout development. One of her most significant contributions was designing and implementing the peer evaluation algorithm, which became a core feature of the platform. She also developed the evaluation system itself, contributed extensively to both the frontend and backend, and created the original `populateDB` script used to seed the database during development and testing. Her work ensured that the project remained focused on delivering a practical and engaging learning experience.

Individual Contributions:
* Original populateDB script
* Evaluation Alogithrm 
* Both the backend and frontend for the Evaluation process 

**Challenges they faced:**
Katrin 2026 "Tons i guess, the overall design and the workflow, alot of various technical features and things, the biggest one having to learn everything, alot of learning."

---

## Project Manager — Albert Ruckenbauer (Aruckenb)

Albert served as the Project Manager, coordinating the team's development efforts from planning through delivery. He organized and chaired weekly meetings, documented discussions, assigned tasks, monitored project progress, and established milestones to keep development on schedule. Beyond managing the project, he contributed to frontend development by implementing the application's localization system, enabling multilingual support throughout the platform. He was also responsible for producing and maintaining the project's documentation, installation guides, and development resources, helping ensure that both users and developers could easily understand and work with the project.

Individual Contributions:
*

**Challenges they faced:**
The overall scope of the project and creatin nothing to something
---

## Technical Lead — Yamen Alnaani (Yalnaani)

Yamen acted as the Technical Lead and was the principal architect behind the project's technical design. He designed the overall microservice architecture and established the structure that allowed the backend services to communicate efficiently while remaining modular and maintainable. Throughout development, he worked extensively across both the backend and frontend, implementing numerous core features including the file upload system, REST APIs, user profile management, assignment and class functionality, reusable page layouts, and much of the application's overall frontend structure. His architectural decisions provided a scalable foundation that allowed the team to continue adding features without compromising maintainability.

Individual Contributions:


**Challenges they faced:**
The flow of creating the classes and the assignments for the bocal, actually making the content for the student user and the students overall evaluating process, the overall jounery of this process was very complicated to create. 

---

## Developer — Adam Ghanam (Aghanam)

Adam specialized in the authentication and security components of the platform. He designed and implemented the complete authentication workflow across both the frontend and backend, including user registration, secure login, JWT-based authentication, password hashing, session management, and email verification. In addition, he integrated third-party authentication providers such as GitHub and Google through OAuth, allowing users to securely access the platform using existing accounts. His work established a secure authentication system that serves as one of the project's fundamental components.

Individual Contributions:


**Challenges they faced:**
Adam "Not Really"

---

## Developer — Peter Vass (Pvass)

Peter contributed across nearly every area of the project, making him one of the team's most versatile developers. On the backend, he helped design the PostgreSQL database structure and created the Entity Relationship Diagram used to document the application's database schema. He also contributed to the development of the `populateDB` script used during testing and development. On the frontend, he implemented the organization management interface, developed the progress dashboard, translated the application into Hungarian as part of the localization effort, and created several reusable user interface components. His broad contributions across both the frontend and backend helped ensure the platform remained consistent, well-structured, and easy to extend.

Individual Contributions:
* populateDB updated it 
* 

**Challenges they faced:**
whole project was a challenge 

---

# Project Management

Throughout development we used several tools to coordinate the project:

* GitHub
* Trello
* Discord

Github was used to manage the overall project, allowing us to push our changes in seperate branch and after our weekly meeting merge all of it onto our development branch which we used as the "main" branch. Commits and new features were looked at in person and dicussed, conflicts were also solved in person.

Trello was used as the best way to assign tasks and break down what needed to be done and by who!

Discord served as our primary communication platform where we:

* Planned weekly meetings
* Assigned tasks
* Discussed bugs
* Shared development progress
* Planned milestones
* Shared resources 

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

Separating the backend into multiple services improves maintainability, scalability, and allows each service to evolve independently. In the case that one would end up failing it does not disrupt the eco-system. 

**PostgreSQL**

Reliable relational database with excellent support for transactions and complex relationships.

**Prisma ORM**

Provides excellent type safety, automatic client generation, migrations, and significantly simplifies database development.

**Docker**

Ensures every developer has an identical development environment while simplifying deployment.

---

# Modules

The project fulfills several **Major** and **Minor** modules from the **42 ft_transcendence** curriculum. Each selected module was chosen to strengthen the platform's architecture, improve the user experience, and expose the team to modern full-stack development practices. Rather than implementing the minimum required functionality, the team focused on designing reusable, maintainable, and scalable solutions that integrate seamlessly with one another throughout the application.

---

# Major Modules 
(Total Points = 12)

## ✔ Framework for Frontend and Backend (2 Points)

The project makes use of modern frameworks for both the frontend and backend to provide a scalable and maintainable application architecture. The frontend was developed using **Angular**, allowing the team to build a responsive single-page application using reusable components, dependency injection, routing, and reactive programming principles. Angular's modular architecture enabled different sections of the application, such as user management, organizations, assignments, and evaluations, to be developed independently while maintaining a consistent user experience.

The backend was built using **Express.js** and follows a microservice architecture. Rather than creating a single monolithic application, the backend is divided into multiple independent services, each responsible for a specific domain such as authentication, users, organizations, classes, enrollments, and groups. This separation of concerns improves maintainability, simplifies testing, and allows new services to be added without affecting the rest of the platform.

**Who Implented this Feature?**
Everyone, both the backend and frontend was actively worked on by the group as a whole. The Desicion to use these features were decided together in our very first meeting on Transcendence. 

---

## ✔ Public API Interacting with the Database (2 Points)

Communication between the frontend and backend is performed through a RESTful API that exposes secure endpoints for every major resource within the application. Each service provides its own collection of CRUD endpoints for managing users, organizations, classes, assignments, groups, enrollments, evaluations, and other application data. Requests are authenticated using JWT tokens before protected resources can be accessed, ensuring that only authorized users may perform sensitive operations.

The API was designed following REST principles, making it predictable and easy to extend. Validation is performed on incoming requests before they reach the database, while standardized responses allow the frontend to handle both successful requests and errors consistently across every service. This modular API structure also makes it possible for future services or third-party integrations to interact with the platform without requiring major architectural changes.

**Who Implented this Feature?**
Everyone, though the largest contributors were Yamen, Adam and Katrin working on a large potion of the API.  

---

## ✔ Standard User Management & Authentication (2 Points)

A complete user management system was implemented to securely authenticate users while providing personalized profiles and role-based access throughout the platform. New users may register accounts, authenticate using secure credentials, and maintain active sessions through JSON Web Tokens (JWT). Passwords are never stored in plain text and are securely hashed before being persisted in the database.

Each user has a customizable profile containing personal information, profile images, and account settings. The authentication system also manages session validation, protected routes, user identity verification, and secure communication between the frontend and backend. Together these features provide a reliable security foundation for every other component of the platform.

**Who Implented this Feature?**
This feature was mainly worked on by both Adam and Yamen, Yamen design the overall profile system where Adam worked on the authencation, registion process, Peter did add in this with the Admin user registering a bulk amount of users. 

---

## ✔ Advanced Permission System (2 Points)

To support the educational workflow, the platform implements a comprehensive role-based permission system consisting of three primary user roles: **Student**, **Bocal**, and **Administrator**. Rather than simply restricting page access, permissions are enforced throughout both the frontend and backend to ensure that every operation is validated before execution.

Students are able to participate in organizations, classes, assignments, and peer evaluations while only accessing information relevant to their own learning. Bocals are granted additional privileges allowing them to manage classes, create assignments, oversee evaluations, and monitor student progress. Administrators possess complete control over the platform, including user management, organization administration, and system-wide configuration. By enforcing permissions on both the client and server, the application maintains security while providing each user with an interface tailored to their responsibilities.

**Who Implented this Feature?**
this feature was a collabritive feature worked on by everyone as alot of the core concept is tied to waht permissions the various users have. 

---

## ✔ Organization System (2 Points)

Organizations serve as one of the central components of the platform by grouping users into independent educational communities. Administrators can create organizations, manage membership, assign administrative staff, and configure permissions that determine how users interact within each organization. Every organization may contain multiple classes, assignments, and members while maintaining its own administrative structure.

This hierarchical design allows the platform to support multiple educational institutions simultaneously without data conflicts. The organization system also integrates closely with the permission system, ensuring that administrative actions remain isolated within their respective organizations while preserving the integrity of the overall application.

**Who Implented this Feature?**
This has strong ties with the modual mentioned before however the frontend implemention was heavily worked on by Peter. 

---

## ✔ Backend as Microservices (2 Points)

Rather than implementing a single backend application, the project follows a microservice architecture in which every major domain is developed as an independent Express service. Dedicated services manage authentication, users, organizations, classes, enrollments, groups, and additional business logic while sharing common packages for logging, error handling, utilities, and database access.

This architecture improves maintainability by reducing coupling between different parts of the application and allows individual services to evolve independently. It also simplifies debugging, testing, and future expansion, as new services can be introduced without requiring significant changes to the existing codebase. The use of Docker further isolates each service, providing consistent deployment across all development environments.

**Who Implented this Feature?**
The overall Microservices and backend was a collactive feature the idea behind and the main developer behind this was none other then our Lead Archicture and Technical Lead Yamen. 

---

# Minor Modules
Total 11 Points

## ✔ ORM Database (1 Point)

Database communication is handled using **Prisma ORM**, providing a type-safe and maintainable interface between the application and PostgreSQL. Rather than writing raw SQL queries throughout the codebase, Prisma generates a strongly typed client that simplifies database operations while significantly reducing the likelihood of runtime errors.

Prisma also manages database migrations, schema evolution, and client generation, allowing the database structure to remain synchronized across every developer's environment. This streamlined workflow made collaborative development considerably easier while improving long-term maintainability.

**Who Implented this Feature?**
The ORM and the use of Prisma was primarily lead by three developers, Peter, Yamen and Katrin each strongly contributing to the database, its overall structure and its use.  

---

## ✔ Real-Time Collaborative Features (1 Point)

The platform encourages collaboration by allowing students to work together within shared assignment groups and participate in peer evaluations. Group members can collaborate on assignments, receive invitations, and complete shared evaluation workflows that are synchronized across the application. These collaborative features reflect the educational philosophy of 42 School by encouraging teamwork, peer learning, and shared responsibility throughout the learning process.

**Who Implented this Feature?**
No oen person implement this feature as this Moduel represents our core idea and goal behind this project which was making an application for peer to peer learning. 

---

## ✔ Custom Design System (1 Point)

To ensure a consistent user experience across the application, the frontend was built around a custom design system composed of reusable Angular components. Rather than recreating interface elements for each page, the team developed standardized buttons, forms, tables, dialogs, cards, navigation components, and layout containers that are reused throughout the project.

This component-driven approach improves maintainability while providing a consistent visual identity across every section of the application. Updates to shared components automatically propagate throughout the platform, reducing duplicated code and simplifying future design improvements.

**Who Implented this Feature?**
This feature was primarily developed by Yamen with the goal of creating a simpler workflow and code strucutre allowing other members of the project to easily implement and use the resuable tokens. 

---

## ✔ Advanced Search (1 Point)

A comprehensive search system allows users to efficiently locate organizations, classes, users, and other resources throughout the platform. Search functionality integrates directly with the backend API to retrieve relevant information while supporting filtering and dynamic updates as users refine their queries. This significantly improves navigation within larger datasets and helps users quickly locate the information required for their daily workflow.

**Who Implented this Feature?**
This feature can primarily be seen with the bocal and admin user, allowing them to search for only students/bocal or admins, the search feature can also be used to search for students who are specifc classes, the lead developer behind this feature was both Peter and Yamen. 

---

## ✔ File Upload & Management (1 Point)

The platform includes a secure file management system that allows users to upload, store, retrieve, and delete assignment submissions and supporting documents. Uploaded files undergo server-side validation before being stored to ensure only supported file types and acceptable file sizes are accepted. Access permissions are enforced so that only authorized users may view or manage uploaded content.

This functionality integrates directly with assignments and evaluations, enabling students to submit work electronically while allowing instructors to access and assess submissions through the platform.

**Who Implented this Feature?**
The core developer behind this feature was none other then Yamen, implemnting it for both file submissions and profile picture and more. 


---

## ✔ Multi-language Support (1 Point)

Internationalization was implemented using Angular's localization framework, allowing every user-facing element of the application to be translated into multiple languages. The platform currently supports English, German, Hungarian, and Arabic, with all interface text stored separately from the application's source code to simplify future translations. Users may switch languages dynamically without requiring the application to be restarted, ensuring an accessible experience for a diverse user base.

**Who Implented this Feature?**
The Core developer behind this feature was Albert, localizing a majority of the frontend. Peter did aid in the translation between English to Hungarian, Both Yamen and Adam aided in the Translation to Arabic. 

---

## ✔ Right-to-Left (RTL) Support (1 Point)

To complement the multilingual functionality, the application fully supports right-to-left layouts for Arabic users. This required more than simply changing text direction; interface layouts, navigation elements, spacing, alignment, and component positioning were mirrored where necessary to create a natural experience for RTL languages. Users can seamlessly switch between left-to-right and right-to-left languages while maintaining a consistent and intuitive interface.

**Who Implented this Feature?**
The right to left feature was an additonal implemention from Yamen to the overall Language system.

---

## ✔ Cross-Browser Support (1 Point)

Throughout development, the application was tested across multiple modern web browsers to ensure a consistent user experience regardless of platform. Browser-specific rendering differences were identified and resolved so that layouts, interactive components, authentication workflows, and application functionality behaved consistently across supported browsers. This testing process improved both reliability and accessibility for users operating in different environments.

**Who Implented this Feature?**
This feature was a collabitive effort, implemented by default while working on the project. 

---

## ✔ OAuth 2.0 Authentication (1 Point)

In addition to traditional email and password authentication, the platform supports remote authentication using OAuth 2.0 providers including GitHub and Google. This feature allows users to securely sign in using existing accounts while reducing the need to manage additional credentials. OAuth authentication is fully integrated into the existing user management system, allowing externally authenticated users to access the same features and permissions as locally registered accounts.

**Who Implented this Feature?**
The Core developer behind this was Adam, implementing this both within the frontend and backend. 

---

## ✔ User Activity Dashboard (1 Point)

A personalized dashboard provides users with a centralized overview of their activity within the platform. Students can monitor assignment completion, evaluation progress, submission history, and overall learning progress, while instructors and administrators gain insight into participation and platform usage. By presenting this information through a clean and intuitive interface, the dashboard helps users quickly understand their current status and identify outstanding tasks without navigating through multiple sections of the application.

**Who Implented this Feature?**
This was a collabritive part worked on by everyone however a honorbale mention to both Peter and Yamen, peter working on the progress feat and Yamen working on the overall structure. 


## Custom Modules

### Evaluation Pairing Algorithm (1 Point)

Custom pairing algorithm that automatically assigns peer evaluations while balancing fairness and workload across students.

**Who Implented this Feature?**
Katrin is the mastermind behind the Evaluation system and implementing it into the project.  

---

# Features

*Rough Draft of the features that were implemneted 

## Frontend Feats 
- Landing Page
- Login (Login with their email or with google/github)
- Dashboard (With basic analytics)
- Classes the sutdent is part of
  - Each class then has a drop down for all the assignments attached to that specific class 
- Assignments
  - In progress assignments and their status
  - Within the assignment page they can see what group they are apart off, 
    - how many members are in a group
    - the file uploaded
    - Description of the project
- Evaulation Page

- Overall progress
- Access to their profile pic
  - Their they can change thier avatar, 
  - edit their bio, 
  - see what role they have, see their email, 
  - their username, 
  - how long they have been a member for.
- Language changer
- Sign out

## Backend
- API (API is then broken down into the submissions)
  - auth
  - class
  - enroll
  - eval
  - group
  - org
  - submission
  - user
- Prisma 
- filemanager (Minio)

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

Below is a Enitiy Relationship Diagram, showing how the database is structure and how it is connected. If you want a further deep dive in what the database is currently storing, you can execute the command make studio which opens up prisma studio showing all the data within the database. 

![Alt text](diagram.png)

---

# Instructions

The “Instructions” section should mention all the needed prerequisites (software, tools, versions, configuration like .env setup, etc.), and step-by-step instructions to
run the project.!

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

Students also have access to the evaluation system and process, where they are assigned an evaluation, the evalue will generate a unique hash code from their device which the evalutor must enter in order to start the evaluation process! 

## Bocal Journey

*rought notes: Bocal/teachers can create classes and assignments, activate the evaulation pairing process, add new users 

They also have access to a unique analytics page just for them!.

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

### Known Limitations 

