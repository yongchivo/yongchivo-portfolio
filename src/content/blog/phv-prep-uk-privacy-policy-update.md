---
title: "Making the PHV Prep UK Privacy Policy Match What the App Actually Does"
description: "Before submitting PHV Prep UK 1.7.3, I corrected two statements in the app's privacy policy: a consent mechanism the app never had, and crash data it never collected."
pubDate: "Oct 06 2026"
heroImage: "/post-phv-prep-uk.webp"
tags: ["privacy", "indie-dev", "firebase", "mobile-development", "learning-in-public"]
badge: "APP DEVELOPMENT"
---

A privacy policy is a description of a system. Like any description, it can
drift away from the thing it describes. Before submitting version 1.7.3 of PHV
Prep UK, I read the [privacy policy](/phv-prep-uk/privacy/) line by line against
what the app actually does, and found two statements that were not true.

Neither was hiding anything. Both described more than the app does, not less.
But a privacy policy that is wrong in a reassuring direction is still wrong, and
the people reading it are deciding whether to trust the app with their data.

## What was wrong

**A consent mechanism that didn't exist.** The policy listed consent as a legal
basis "for certain analytics" and said you could withdraw it at any time. The
app has no consent banner, no settings screen and no switch for analytics. There
was nothing to withdraw.

**Crash data the app never collected.** The policy said Firebase Analytics
collected "diagnostic or crash data" to help find and fix problems. The app
does not include Crashlytics or any other crash-reporting or performance SDK.

## What the app actually does

From version 1.7.3, this is the full picture of analytics in PHV Prep UK:

- **Firebase Analytics** records the events the SDK collects automatically
  (such as first open, session start and engagement time) and three of my own:
  when the premium screen is viewed, when a purchase is completed and when a
  free-tier limit is reached. Each carries the council you selected and where in
  the app it happened.
- **No identity is attached.** The app does not set a user ID in Analytics, and
  no email address or account ID is sent with any event.
- **No advertising ID.** The app does not use the Android advertising ID,
  ad personalisation is turned off on both platforms, and the app does not ask
  for tracking permission on iOS.
- **Firebase App Check** verifies that requests to the backend come from the
  genuine app.
- **No crash or performance reporting** of any kind.

## What changed on the page

The consent line is now a plain description of analytics: what is collected,
why, that there is no setting in the app to turn it off, and that you can email
[support@yongchivo.com](mailto:support@yongchivo.com) to ask about this data or
object to its use. The "diagnostic or crash data" claim is gone, replaced with a
clear statement that no crash reports or performance data are collected. The
"Last updated" date now reads 6 October 2026.

## Why it matters

It's tempting to copy privacy policy wording that sounds thorough. "You can
withdraw consent at any time" sounds responsible. But if the app has no way to
do that, the sentence is a promise the product can't keep. The same goes for
crash data: claiming you collect something you don't is still an inaccurate
description of your data processing.

I treated this the same way I treat [changes to the question
database](/blog/change-management-live-database/): check every claim against
the real system, change only what is wrong, and keep a record of what changed
and why. The privacy policy is part of the product. It should be as accurate as
the answers in the exam questions.

---

*PHV Prep UK is available on the [App Store](https://apps.apple.com/gb/app/phv-prep-uk-taxi-badge-test/id6776364932) and [Google Play](https://play.google.com/store/apps/details?id=com.phvprepuk.app).*
