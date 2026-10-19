---
title: "Adding Google Play Console to my analytics dashboard"
description: "My browser-only analytics dashboard now reads Google Play Console reports alongside Search Console and App Store Connect. The preset design held up, but UTF-16 files and earnings rows that aren't sales taught me a few things."
pubDate: "Oct 19 2026"
heroImage: "/analytics-cover.webp"
tags: ["analytics", "typescript", "astro", "privacy", "learning-in-public"]
badge: "WEB DEVELOPMENT"
---

The [analytics dashboard](https://yongchivo.com/analytics/) started as a
way to read my own exports without fighting each platform's UI. You drop in
a CSV and it shows the views the native dashboards bury: CTR against
position for Google Search Console, and the impressions-to-install funnel
for App Store Connect. It all runs in the browser, so your file is never
uploaded.

PHV Prep UK is on Google Play as well as the App Store, so Play Console was
the obvious gap. It's now live at
[yongchivo.com/analytics/play-console](https://yongchivo.com/analytics/play-console/).

## What it reads

Play Console has a **Download reports** section. The dashboard reads three
of its reports:

- **Installs** (Statistics): installs and uninstalls per day. You can use
  the overview file or a split such as country or device.
- **Store performance** (Statistics): store listing visitors and
  acquisitions. Together they make the funnel from seeing your listing to
  installing the app, with the drop-off between the two.
- **Earnings** (Financial): net earnings per day and the number of
  purchases.

On top of that you get a time series, a summary with period comparison,
day-of-week performance and, where the file has a traffic source column, a
breakdown by source.

## The design paid off

When I built the dashboard, I decided that every platform would be a
self-contained **preset**. A preset is one module that knows how to
recognise and parse that platform's export, and it declares which views it
wants. The views know nothing about platforms. The preset index even had a
comment predicting that adding Play Console later would be one new module
plus one line in the list.

That turned out to be true. The Play Console preset reuses the summary,
time series, funnel, weekday and breakdown views without changing any of
them. Most of the work was in the parser, which is where it should be.

## Lesson 1: not every CSV is UTF-8

The first surprise was the encoding. Play Console writes its statistics
CSVs as **UTF-16**. The dashboard was reading every file with
`file.text()`, which always decodes as UTF-8. A UTF-16 file read that way
turns into nonsense with a null byte between every character, and no header
row ever matches.

The fix was to stop assuming. The file is now read as raw bytes, and its
byte-order mark decides the decoder: `FF FE` means UTF-16 little-endian,
`FE FF` means big-endian, and anything else is UTF-8. `TextDecoder` does
the rest. I made the fix in the shared controller rather than in the Play
preset, so every platform gets it, including an App Store file that someone
re-saved in Excel.

## Lesson 2: an earnings row is not a sale

The earnings report has one row per **transaction**, and a single sale
produces several of them: a `Charge` row for what the buyer paid, a
negative `Google fee` row, and sometimes a `Tax` row. Refunds are their own
negative rows.

That makes it easy to get a number that looks right and isn't:

- **Summing the merchant-currency amount** gives what you actually get
  paid, fees and refunds included. That's the earnings figure.
- **Counting rows as purchases** would count each sale two or three times.
  So only `Charge` rows count as a purchase.

I'd already been caught by something similar with Apple, where one sales
report lists proceeds **per unit** rather than per row. The same rule
applies to both: read what each row actually represents before adding
anything up.

## Lesson 3: choosing which installs to count

Play Console reports installs by **user** and by **device**. One person
installing on a phone and a tablet is one user install but two device
installs. The parser picks user installs first and only falls back to
device installs when the file doesn't have them, because "how many people
installed the app" is the question most people are asking.

The same goes for conversion rate. The store performance file has its own
daily conversion rate column, but the dashboard ignores it and works out
the rate from the totals: acquisitions divided by visitors. Averaging daily
rates would give a quiet Sunday the same weight as a launch day.

## Lesson 4: shared copy stays generic

Some of the dashboard's shared text still mentioned Apple. The funnel intro
said it was "the view App Store Connect makes hardest to read", and that
wording would have appeared on the Play Console page too. Text that belongs
to one platform now lives on that platform's preset, and the shared strings
only describe what every platform has in common.

## Still to check

I tested the parser against sample files laid out like Play Console's
reports, including a UTF-16 one dropped onto the real page. I haven't run
it on a real export from my own account yet. That's the next step, and if
a column name turns out to be different, the fix is one line in an alias
list.

As before, nothing you drop into the dashboard leaves your device.

---

*Part of "learning in public": documenting projects, mistakes, and things I
figure out while studying Cyber Security and building software alongside it.*
