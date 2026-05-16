# Task Management System

A full-stack Task Management System built with React, Node.js, Express, and MongoDB.

## Features
- **User Management**: Register and login. Admin vs. User roles.
- **Task CRUD**: Create, Read, Update, Delete tasks.
- **Filtering, Sorting, & Pagination**: Easily manage large lists of tasks.
- **File Uploads**: Attach up to 3 PDF documents per task.
- **Real-time Updates**: WebSockets integration for real-time task status changes.
- **Dockerized**: Run the entire stack with a single command.

## Tech Stack
- **Frontend**: React, TailwindCSS, React Router, Context API
- **Backend**: Node.js, Express, JWT, Socket.io
- **Database**: MongoDB
- **Testing**: Jest, Supertest

## Getting Started

### Prerequisites
- Docker and Docker Compose installed on your machine.

### Running the Application

1. Clone this repository (if applicable).
2. Run the following command in the root directory:

```bash
docker compose up 
```

3. The services will be available at:
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:5000

### Initializing the First Admin Account
For security reasons, anyone registering from the frontend will be assigned the `user` role by default. To create your very first admin account (`admin_user` / `admin123`), open a new terminal while Docker is running and execute the seeding script:

```bash
docker exec -it task_backend node /usr/src/app/src/scripts/seedAdmin.js
```
Once you log in as `admin_user`, you can navigate to the "Manage Users" dashboard to create or upgrade other admin accounts.

### API Documentation
API documentation is provided via Swagger. Once the backend is running, navigate to:
http://localhost:5000/api-docs

### Testing
To run the backend unit and integration tests:
```bash
docker exec -it task_backend npm test -- --coverage --runInBand 
```
