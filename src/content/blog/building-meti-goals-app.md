---
title: "Building Meti: a goals app that never leaves your phone"
description: "Meti is a goals app where every goal has a deadline and everything stays on the phone: no account, no network, no analytics. What building it taught me about widgets, data migration and privacy."
pubDate: "Nov 23 2026"
heroImage: "/meti-cover.webp"
tags: ["flutter", "ios", "android", "privacy", "security"]
badge: "APP DEVELOPMENT"
---

Most goal apps want an account, a sync server and permission to send you notifications. I wanted the opposite: a goals app where everything stays on the phone.

**[Meti](/projects/meti/)** is that app. Every goal has a deadline, and the countdown lives where you can't ignore it: on your home screen and Lock Screen. When you reach a goal, Meti, a small neon mascot drawn entirely in code, celebrates with you. The bigger the effort, the bigger the celebration, and the rewards are never random.

Building it taught me more about security than I expected. A widget is a second program reading your data, so I gave it only the minimum it needs and moved everything else out of its reach, migrating my own real data with checksums and a way back. The Lock Screen can be seen by anyone, so titles are hidden there by default. Tapping a widget opens the app through links that are validated and can only navigate, never change anything. And no log ever contains what you write.

Meti is built with Flutter, with native widgets in SwiftUI on iOS and Kotlin on Android, and more than 1,600 automated tests. I planned and reviewed every session with Claude Code, using separate reviews for design, engineering and privacy.

Meti is coming soon to iOS and Android.
