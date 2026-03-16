# Stag.io - Internship Management Platform

A professional SaaS dashboard frontend for an internship management platform built with React, Tailwind CSS, and React Router.

## Tech Stack

- **React** - UI framework
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── layout/      # Sidebar, Header, DashboardLayout
│   └── ui/          # Card, Table
├── data/            # Mock/static data
├── layouts/         # Route-specific layouts (Student, Company, Admin)
├── pages/           # Page components
│   ├── Landing.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── StudentDashboard.jsx
│   ├── CompanyDashboard.jsx
│   └── AdminDashboard.jsx
├── App.jsx
├── main.jsx
└── index.css
```

## Pages

- **/** - Landing page
- **/login** - Login page
- **/register** - Register page (Student / Company selection)
- **/student** - Student dashboard
- **/company** - Company dashboard
- **/admin** - Admin dashboard

## Design System

- **Primary**: Indigo (#6366f1)
- **Background**: Slate 50
- **Typography**: Inter font family
- **Layout**: Sidebar (260px) + main content area
