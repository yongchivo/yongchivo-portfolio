---
title: "Change Management When Your Live Database Is Your Product"
description: "What change management actually looks like when you're a solo developer, your product is a database, and every edit is a deployment."
pubDate: "Oct 05 2026"
heroImage: "/post-phv-prep-uk.webp"
tags: ["software-engineering", "change-management", "indie-dev", "flutter", "firebase"]
badge: "APP DEVELOPMENT"
---

I ship a mobile app called PHV Prep UK. It helps drivers pass private hire licensing tests across eight UK councils. The product is, fundamentally, a database: roughly 2,040 exam questions, each with a correct answer, an explanation grounded in legislation, and metadata tying it to a specific council's rules.

When your product is a database, every edit is a deployment. There is no staging environment that perfectly mirrors what real users see, because what real users see is the data. Get a change wrong and someone revises from a wrong answer, fails a test that costs them £50 and one of three attempts, and potentially waits 12 months before they can try again. That's the context every change happens inside.

This is what I learned building the discipline to change things safely.

## Nothing is ever deleted

Questions are deactivated, never removed. If something is wrong, it gets flagged and a corrected replacement is created alongside it. The old version stays in the database, marked inactive, so there is always a record of what was there before and why it changed. This matters more than it sounds — when you later discover a pattern of errors across a batch (and you will), you need to be able to trace what the original said, not just what the replacement says.

## Every question ID is derived from the content

Question IDs are generated from a hash of the question text. This means you cannot casually edit a question's wording without also changing its identity in the system. That is deliberate friction. It forces every wording change through the full creation pipeline rather than allowing a quiet in-place edit that nobody reviews. The inconvenience is the point.

## The batch loop

When I ran a quality pass across more than 1,400 answer sets last month, every batch followed the same sequence: back up the current state, dry run the changes locally, get human confirmation on a sample, apply to production, verify against the backup, commit without pushing until the verification is clean. No step is skipped, no batch is an exception. The moment you skip the dry run because "this one is simple" is the moment you corrupt something.

The quality pass itself was necessary because I found a pattern: in many question banks, the correct answer was consistently the longest option. In some banks it was the longest in over 90% of questions — meaning a test-taker could pass by simply picking the longest answer without reading the question. Fixing this meant rewriting answer sets so the correct option is no longer a giveaway, balancing correct-answer positions across A to D, and bringing the longest-answer rate down to roughly 30–55% with differences of only a few characters. The rewriting was straightforward. Doing it safely across eight councils' worth of live data without corrupting anything was the actual work.

## Cross-council isolation

The database holds questions for eight different councils, each with its own pass rules, categories, and source material. After every change — even one scoped to a single council — the entire database is compared against the pre-change backup to prove that no other council's data was touched. This is not elegant. It is a brute-force diff that catches the category of mistake that no amount of careful scoping prevents: the accidental write to the wrong path, the query that matched one document too many, the script that ran against the wrong environment variable.

## Facts checked against primary sources

The hardest changes were not formatting fixes but factual corrections. During the quality pass I found that some questions taught the wrong legal facts:

- A conviction reporting deadline was listed as 14 days; the council's own licence conditions say 48 hours.
- A maximum fine for refusing an assistance dog was listed as "unlimited"; the Equality Act 2010 sets it at up to £1,000.
- A maximum vehicle age was listed as 12 years; the council's policy says 11 years and 6 months at first licensing.

Each of these required going back to the primary source document — the council's published conditions, the legislation itself — and in some cases emailing the council directly to confirm points the published material left ambiguous. The corrections were small. The process of confirming them was not.

## What I actually learned

Change management is not a methodology you adopt. It is a set of habits you build because the alternative — trusting yourself to be careful — does not scale. I am one person working on this project. I do not have a QA team or a staging environment that mirrors production. What I have is a sequence of steps that I follow every time, a refusal to skip any of them, and backups that let me prove what changed and what did not.

The discipline is not interesting. That is the point. Interesting change management means something went wrong.

---

*PHV Prep UK is available on the [App Store](https://apps.apple.com/gb/app/phv-prep-uk-taxi-badge-test/id6776364932) and [Google Play](https://play.google.com/store/apps/details?id=com.phvprepuk.app).*
