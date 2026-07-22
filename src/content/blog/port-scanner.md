---
title: "Building a port scanner in Python — and finally understanding sockets"
description: "I followed LinkedIn Learning's Python for Security module and built my first port scanner. Here's what a socket actually is, what those two confusing lines do, and what I'd improve in my code."
pubDate: "May 17 2026"
heroImage: "/post-port-scanner.webp"
tags: ["cyber-security", "python", "networking", "learning-in-public"]
badge: "CYBERSECURITY JOURNEY"
---

Today I worked through the "Python for Security" module on LinkedIn 
Learning — specifically the videos on creating a socket connection and 
building a port scanner. By the end I had a working port scanner running 
against my own machine. This post is me writing down what I understood, 
because the best way to find out whether you actually learned something is 
to try to explain it.

Going in, all I really knew was that sockets are "a way for programs to 
communicate." That's true, but it's vague enough to be useless when you're 
staring at real code. Two lines in particular took me a while to get.

## The code

Here is the scanner I ended up with:

```python
import socket

for ports in range(1, 1025):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(1)
    result = s.connect_ex(("127.0.0.1", ports))
    if result == 0:
        print(f"Port: {ports} is open")
    else:
        print(f"Port: {ports} is close")
    s.close()
```

It loops through ports 1 to 1024 on `127.0.0.1` — my own machine — and 
reports whether each one is open or closed.

## The line that confused me first

```python
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
```

This creates a socket object. The confusing part was the two arguments.

`socket.AF_INET` is the **address family**. It tells the socket what kind 
of addresses it will deal with. `AF_INET` means IPv4 — the familiar 
four-number addresses like `127.0.0.1`. If I wanted IPv6, I'd use 
`AF_INET6` instead.

`socket.SOCK_STREAM` is the **socket type**. It tells the socket which 
transport protocol to use. `SOCK_STREAM` means TCP — the protocol that 
sets up a reliable, ordered connection before any data is sent. The 
alternative, `SOCK_DGRAM`, means UDP, which fires packets off without 
establishing a connection first.

So that line, in plain English, is: "create me a socket that speaks IPv4 
and uses TCP." For a port scanner that makes sense — I want to know whether 
a TCP connection can be established on each port, and establishing a 
connection is exactly what TCP does.

## The line that confused me more

```python
result = s.connect_ex(("127.0.0.1", ports))
```

I understood that this tries to connect to a port. What I didn't 
understand was the `_ex` part and why `result` was a number.

`connect_ex` tries to open a TCP connection to the given address and port. 
The difference between `connect` and `connect_ex` is how they report 
failure. Plain `connect` raises an exception if the connection fails — so 
on a closed port, the program would crash unless I wrapped it in a 
try/except. `connect_ex` instead **returns an error code as a number**.

A return value of `0` means the connection succeeded — the port is open 
and something is listening on it. Any other number is an error code 
meaning the connection failed — the port is closed, filtered, or nothing 
is there.

That's why the check is `if result == 0`. For scanning hundreds of ports, 
`connect_ex` is the right choice: I get a clean number to test instead of 
an exception to catch on every closed port.

The `settimeout(1)` line matters here too. Without it, a port that doesn't 
respond would make the scanner hang waiting. One second is enough to decide 
the port isn't answering and move on.

## What I'd improve

The scanner works, but writing this post made me look at it more 
critically, and I found something.

I create a new socket inside the loop, but my `s.close()` sits outside the 
loop. That means only the last socket actually gets closed properly — the 
other 1023 stay open until the program exits. On a small script this 
causes no visible problem, but it's sloppy. Sockets are a finite system 
resource, and leaking them is the kind of habit that does cause real bugs 
in bigger programs. The fix is simply to indent `s.close()` so it runs on 
every iteration.

That's a small thing, but noticing it is the point. Code that runs is not 
the same as code that's correct.

## A note on using this responsibly

A port scanner is a dual-use tool. Running it against `127.0.0.1` — my own 
machine — or against a host I own or have explicit permission to test is 
legitimate learning. Running it against systems I don't own is not.

In the UK, unauthorised port scanning can fall under the Computer Misuse 
Act 1990. The technical barrier to scanning someone else's server is 
basically zero — it's the same code, just a different IP. The thing that 
makes it acceptable or not is permission, not difficulty. As a Cyber 
Security student, that distinction is part of the job, not an afterthought.

So: I scanned my own machine, and that's the only kind of target I'd point 
this at without written authorisation.

## What's next

This scanner is sequential — it checks one port, waits, then checks the 
next. Scanning 1024 ports with a one-second timeout each is slow. The 
obvious next step is concurrency: using threads so multiple ports are 
checked at once. That's the next thing I want to understand properly, and 
when I do, it'll probably be its own post.

---

*Part of "learning in public" — documenting things I figure out as I go 
through my Cyber Security degree at Worcester. If something here is wrong 
or incomplete, tell me.*