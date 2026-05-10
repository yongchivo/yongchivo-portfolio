---
title: "Building an employee management system for a local tobacconist"
description: "I'm currently building a staff management system for a local tobacconist using Firebase, xTools, and a visual studio code. Here's the architecture so far, what I've learned, and why I chose this stack."
pubDate: "May 10 2026"
heroImage: "/post-estanco-app.webp"
tags: ["firebase", "astro", "web-development", "authentication", "learning-in-public"]
badge: "NEW"
---

For the last few weeks, I've been working on a hybrid application designed to 
manage employee hours and internal workflows for a local tobacconist.

The original idea started as something relatively simple: a system where 
employees could log in, register their working hours, and allow management 
to keep track of schedules more efficiently. But as usually happens with 
software projects, the scope expanded very quickly.

At this point, the project already has:

- Firebase Authentication
- Firestore database integration
- Protected login system
- Admin dashboard
- Home screen with role-based rendering
- User session management
- Basic employee structure
- Secure routing logic

And honestly, this has probably been one of the most practical projects I've 
worked on so far.

## Why I chose Firebase

I wanted something fast to prototype with, but still production-capable.

Running a traditional backend with Express, PostgreSQL, session handling, 
JWT logic, password hashing, and hosting would have added a lot of overhead 
for what is essentially an internal management tool. Firebase solves most of 
that out of the box.

Authentication was the biggest advantage initially. Instead of building an 
entire credential system myself, Firebase Authentication gives me:

- Secure login handling
- Password resets
- Session persistence
- Token management
- Built-in security infrastructure

That allowed me to focus on the actual application logic instead of spending 
days reinventing authentication flows.

Firestore also ended up fitting the project surprisingly well. Employee 
records, schedules, role permissions, and daily logs map naturally into a 
document-based structure.

## The architecture so far

The frontend is built using VS Code, which is honestly becoming one of my 
favourite frameworks for personal projects.

The current structure is roughly split into:

- Public routes
- Authenticated employee routes
- Admin-only routes

The authentication flow works through Firebase session state listeners. When 
the application loads, it checks whether the user is authenticated and then 
renders content depending on their role.

The admin panel currently handles:

- Viewing employee data
- Managing user access
- Monitoring registered hours
- Basic internal controls

The employee-facing side is intentionally minimal. I don't want this to feel 
bloated or corporate — the goal is speed and usability.

## One thing I underestimated: state management

Authentication sounds simple until you start dealing with real frontend 
behaviour.

Handling loading states, route protection, redirects, expired sessions, and 
conditional rendering introduced far more complexity than I expected. One of 
the most annoying issues was preventing UI flicker while Firebase restored 
authentication state asynchronously after refreshes.

Without proper loading guards, the app briefly renders logged-out content 
before Firebase confirms the user session. It's a small thing technically, 
but it makes the application feel broken if not handled correctly.

A lot of this project has been learning where the *real* complexity in web 
apps actually lives — and most of the time, it's not where beginners expect.

## Security considerations

Even though this is a relatively small internal system, security still 
matters.

Any application involving employee information, authentication, and role 
permissions needs proper access control. One thing I've been careful about 
is avoiding the classic mistake of relying purely on frontend restrictions.

Just hiding admin UI components is meaningless if database rules aren't 
enforced server-side.

Because of that, a significant part of the setup has involved configuring 
Firebase Security Rules properly so users can only access data they're 
supposed to see.

That's also been a useful reminder that modern frontend development and 
security are much more connected than people think.

## Why projects like this matter

University assignments are useful, but real projects force you to deal with 
things tutorials usually ignore:

- Authentication edge cases
- UX problems
- Data modelling decisions
- Security rules
- Application structure
- Scalability trade-offs

This project started as a simple hours tracker and slowly became a proper 
full-stack system.

And honestly, that's probably the best way to learn.

---

*Part of "learning in public" — documenting projects, mistakes, and things I 
figure out while studying Cyber Security and building software alongside it.*