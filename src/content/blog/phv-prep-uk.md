---
title: "Building PHV Prep UK: an exam preparation app for private hire drivers"
description: "I'm currently building PHV Prep UK, a Flutter and Firebase-powered mobile app designed to help drivers pass the Wolverhampton PHV knowledge test. Here's what I've built so far, why I chose this niche, and what I've learned during development."
pubDate: "May 30 2026"
heroImage: "/post-phv-prep-uk.webp"
tags: ["flutter", "firebase", "mobile-development", "ai", "learning-in-public"]
badge: "APP DEVELOPMENT" 
---

Over the last few months, I've been building PHV Prep UK — a mobile application designed to help private hire drivers prepare for the Wolverhampton City Council PHV knowledge test.

The original idea came from noticing a surprisingly large gap in the market.

Thousands of drivers across the UK apply for their private hire licences through Wolverhampton due to its streamlined licensing process. However, while the knowledge test is mandatory and relatively difficult to pass, the preparation resources available are often outdated, fragmented across different websites, or hidden behind expensive training courses.

I wanted to create something modern, affordable, and genuinely useful.

What started as a simple quiz app quickly evolved into a much larger platform.

At this stage, PHV Prep UK already includes:

- 300+ exam-grade practice questions
- Realistic mock exams that mirror the official test
- Performance tracking by category
- AI-powered tutoring
- User authentication
- Premium subscription features
- Question management tools for administrators
- Detailed analytics collection
- Secure cloud-based infrastructure

It's also become one of the most technically complete projects I've worked on so far.

## Why this market interested me

One of the things I've learned while studying software development is that good products often solve specific problems for specific groups of people.

Rather than building another generic quiz app, I wanted to focus on a niche audience with a genuine need.

The Wolverhampton PHV knowledge test has strict pass requirements:

* Drivers must achieve at least 75% overall
* All key safeguarding, disability awareness, and plying for hire questions must be answered correctly
* Failing any key question results in failing the entire exam

Despite this, there was no dedicated mobile app focused solely on helping candidates prepare.

That made it an interesting opportunity from both a technical and business perspective.

## Why I chose Flutter and Firebase

I wanted a single codebase that could support both iOS and Android without doubling development time.

Flutter ended up being an easy choice.

The framework provides excellent performance, a mature ecosystem, and a fast development workflow. Combined with Firebase, it allowed me to move quickly without having to build and maintain a traditional backend infrastructure.

Firebase currently handles:

* User authentication
* Database storage
* Analytics
* Cloud file storage
* Security enforcement

This allowed me to focus more on product development and less on server maintenance.

The application itself uses Riverpod for state management and go_router for navigation, which has made the codebase significantly easier to scale as new features are added.

## The architecture so far

The app follows a fairly clean separation between presentation, business logic, and data access.

Questions are stored inside Firestore and can be seeded through administration scripts. The application generates realistic mock exams by following the exact structure used in the real council examination.

This means every generated exam contains:

* 3 Safeguarding questions
* 3 Plying for Hire questions
* 2 Disability Awareness questions
* 20 additional questions from the remaining syllabus topics

The scoring system also mirrors the real assessment rules rather than simply counting total correct answers.

One of my goals throughout development has been making the preparation experience feel as authentic as possible.

## Introducing AI tutoring

One of the most interesting features I've built is the AI Tutor.

After answering a question, users can ask follow-up questions about topics they don't fully understand.

The system uses Anthropic Claude to generate explanations and references relevant UK legislation where appropriate, including:

* Equality Act 2010
* Local Government (Miscellaneous Provisions) Act 1976
* Safeguarding guidance
* Disability awareness requirements

Rather than simply telling users whether an answer is right or wrong, the app helps explain the reasoning behind it.

That educational component is something I felt was missing from many existing revision platforms.

## One challenge I underestimated: premium access control

The freemium model sounds straightforward until you start implementing it properly.

Restricting access isn't just a UI problem.

Users shouldn't be able to bypass limits simply by manipulating the frontend.

Because of that, premium restrictions are enforced at multiple layers:

* Firestore queries only return permitted content
* Daily usage limits are tracked server-side
* Upgrade prompts are handled in the interface
* Security rules validate access permissions

Building these controls taught me a lot about balancing user experience with application security.

## Security considerations

Any application handling user accounts, subscriptions, and analytics requires careful attention to security.

One of the biggest mistakes developers make is trusting the client.

In PHV Prep UK, Firestore Security Rules act as the primary layer of protection.

Users can only access their own records, while administrators have elevated permissions for content management.

I've also implemented data structures and indexes specifically designed to keep queries efficient as the user base grows.

It's not the most visible part of the application, but it's arguably one of the most important.

## Looking ahead

The current version focuses entirely on Wolverhampton licensing, but the architecture was designed with expansion in mind.

Future plans include:

* Support for additional councils
* Dedicated analytics dashboards
* Improved content management tools
* Enhanced AI tutoring features
* Community-driven learning features

One of the reasons the product is called PHV Prep UK rather than PHV Prep Wolverhampton is that I wanted room to grow without needing a complete rebrand later.

## Why projects like this matter

University assignments are valuable, but real projects force you to solve real problems.

You quickly find yourself dealing with things tutorials rarely cover:

* Product-market fit
* Monetisation strategies
* Subscription management
* Authentication flows
* Database architecture
* AI integration
* Security rules
* Scalability planning

PHV Prep UK started as a simple revision app and gradually became a complete software product.

And that's exactly why building projects remains one of the fastest ways to learn.

---

*Part of "learning in public" — documenting projects, lessons learned, and the process of building software while studying Cyber Security and Software Development.*
