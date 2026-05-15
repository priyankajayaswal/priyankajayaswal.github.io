# 🚀 Upskill Plan — Networking · Performance · Code Reading · Tech Trends · Security · AI Tools

> A sustainable, build-heavy learning plan. ~1.5–2 hrs/day. Rotate focus weekly, read daily.
> Tracker UI: `try.html` in this repo already implements daily rotation + Pomodoro + streaks + mastery bars. See [§ Adapting try.html](#-adapting-tryhtml-as-the-tracker) at the bottom to re-skin it for these 6 topics.

---

## 🎯 The 6 Focus Areas

| # | Area | Why it matters |
|---|------|---------------|
| 1 | **Networking** | Every bug at scale eventually becomes a networking bug |
| 2 | **Performance analysis** | Separates senior from junior engineers |
| 3 | **Code reading** | 10x more code is read than written |
| 4 | **Latest tech advancements** | Compounding awareness, cheap to maintain |
| 5 | **Security** | Non-optional; shifts left every year |
| 6 | **AI tools** | The biggest leverage multiplier right now |

---

## 1. 🌐 Networking

### Courses
- **Stanford CS144 — Introduction to Computer Networking** (free on YouTube + labs). Build your own TCP in C++.
- **Coursera — "The Bits and Bytes of Computer Networking"** (Google). Lighter intro.

### Books
- *Computer Networking: A Top-Down Approach* — Kurose & Ross (canonical)
- *High Performance Browser Networking* — Ilya Grigorik (free online, modern stacks)
- *TCP/IP Illustrated Vol. 1* — Stevens (reference)

### Blogs & ongoing
- [blog.cloudflare.com](https://blog.cloudflare.com) — best networking writing on the internet
- [blog.apnic.net](https://blog.apnic.net) — BGP, DNS, routing reality
- [jvns.ca](https://jvns.ca) — Julia Evans, debugging & networking zines
- [tailscale.com/blog](https://tailscale.com/blog) — WireGuard, NAT traversal, modern VPN

### Tools to master
`tcpdump` · `wireshark` · `mtr` · `ss` · `dig` · `curl -v` · `nmap` · `iperf3`

### Mini-projects
- Capture a full HTTPS handshake in Wireshark and annotate every byte
- Build a toy HTTP/1.1 server from a raw TCP socket
- Trace one real production incident to the packet level

---

## 2. 📊 Performance Analysis

### Books
- ***Systems Performance*** — Brendan Gregg (THE book)
- *BPF Performance Tools* — Brendan Gregg
- *Database Internals* — Alex Petrov (for data-heavy perf)

### Blogs
- [brendangregg.com](https://www.brendangregg.com) — flame graphs, USE method
- [danluu.com](https://danluu.com) — latency, tail, CPU arch
- [Mark Callaghan — smalldatum](https://smalldatum.blogspot.com) — DB perf

### Tools to master
`perf` · `flamegraph` · `eBPF/bcc/bpftrace` · `py-spy` · `async-profiler` · Chrome DevTools Performance · `hyperfine`

### Methodologies to internalize
- **USE method** (Utilization, Saturation, Errors)
- **RED method** (Rate, Errors, Duration)
- **Little's Law** (L = λW)
- Latency percentiles (why p50 lies; always look at p99+)

### Mini-projects
- Profile one real service, produce a flame graph, cut p99 by 30%
- Write a benchmark that demonstrates a cache line / false sharing

---

## 3. 📖 Code Reading

### Books
- *Code Reading: The Open Source Perspective* — Spinellis
- *The Art of Readable Code* — Boswell & Foucher

### Practice targets (clean codebases)
- **Redis** — C, tight and readable
- **SQLite** — the gold standard for documented code
- **CPython** — well-commented, heavily reviewed
- **Go stdlib** — idiomatic, small files

### Method (apply to every repo)
1. Read `README` and `CONTRIBUTING.md`
2. Find the entry point (`main`, `cmd/`, `src/index`)
3. Pick **one** feature and trace it end-to-end
4. Draw the call graph on paper
5. Write a 1-page "how X works" doc — this is the real test

### Ongoing
- [Jon Gjengset — YouTube](https://www.youtube.com/@jonhoo) (deep Rust code walkthroughs)
- [Papers We Love](https://paperswelove.org/) — read the paper, then read the implementation

---

## 4. 📰 Latest Tech Advancements

> Keep this cheap and habitual — 15 min/day, no more.

### Newsletters (low noise)
- **TLDR Tech** — daily, 5 min
- **The Pragmatic Engineer** — Gergely Orosz, weekly deep dives
- **Bytes / Pointer** — frontend / general
- **Simon Willison's Weblog** — best AI + web tech roundup ([simonwillison.net](https://simonwillison.net))

### Daily skim
- Hacker News top 10 + comments (comments > articles)
- [The Morning Paper](https://blog.acolyer.org) archive — CS paper summaries

### Podcasts (commute / gym)
- Changelog · Software Engineering Daily · Latent Space (AI) · Oxide and Friends

---

## 5. 🔐 Security

### Courses (hands-on > theory)
- **[PortSwigger Web Security Academy](https://portswigger.net/web-security)** — free, world-class labs
- **[OverTheWire — Bandit → Natas → Narnia](https://overthewire.org/wargames/)** — wargames ladder
- **HackTheBox / TryHackMe** — subscription but worth it

### Books
- *The Web Application Hacker's Handbook* — Stuttard & Pinto
- *Serious Cryptography* — JP Aumasson
- *The Tangled Web* — Michal Zalewski (browser security)

### Blogs
- [Google Project Zero](https://googleprojectzero.blogspot.com) — elite exploit writeups
- [Trail of Bits blog](https://blog.trailofbits.com) — applied security eng
- [Krebs on Security](https://krebsonsecurity.com) — industry news
- **tldrsec newsletter** — weekly, high signal

### Feeds
- GitHub Advisory Database, CVE Trends, NVD

---

## 6. 🤖 AI Tools

### Must-watch / must-do
- **[Andrej Karpathy — Zero to Hero](https://karpathy.ai/zero-to-hero.html)** — build GPT from scratch. Non-negotiable.
- **Karpathy — "Let's build the GPT tokenizer"** & LLM-from-scratch videos
- **DeepLearning.AI short courses** — RAG, LangChain, Agents, Evals (each ~1 hr, free)

### Books
- *Hands-On Large Language Models* — Jay Alammar & Maarten Grootendorst
- *Designing Machine Learning Systems* — Chip Huyen

### Blogs
- [simonwillison.net](https://simonwillison.net) — daily AI experiments
- [lilianweng.github.io](https://lilianweng.github.io) — deep conceptual posts
- Anthropic Engineering Blog · OpenAI Cookbook · Hugging Face blog

### Tools to fluently use
Cursor · Claude Code · GitHub Copilot CLI · `llm` (Simon Willison's CLI) · Aider · Continue.dev

### Build targets
- Ship **one** RAG app on your own docs
- Ship **one** agent that does a real task (refactor, PR review, daily digest)
- Evaluate **one** model-switching decision with a proper eval harness

---

## 📅 Daily Schedule (90–120 min/day)

| Block | Minutes | Activity |
|-------|---------|----------|
| ☕ Morning skim | 15 | TLDR + HN top 10 + Simon Willison |
| 📚 Focused study | 30 | Rotating topic (see weekly plan) |
| 🛠 Hands-on lab | 30 | Tool/project tied to today's topic |
| 👀 Code reading | 15 | One OSS file or commit, take notes |
| ✍️ Journal | 10 | 3 bullets: learned · unclear · try tomorrow |

**Rule of 1:** read 1 thing, build 1 thing, write 1 thing per day.

---

## 🗓 Weekly Rotation

| Day | Focus area | Sample activity |
|-----|-----------|-----------------|
| **Mon** | Networking | Book chapter + Wireshark capture |
| **Tue** | Performance | Gregg chapter + profile something |
| **Wed** | Security | 2 PortSwigger labs |
| **Thu** | AI tools | Karpathy video OR build a small agent |
| **Fri** | Code reading | 1 hr deep-dive into an OSS module |
| **Sat** | Project day | Integrate the week into one small build |
| **Sun** | Long-form / rest | Morning Paper, or a blog deep-dive — no new material |

Tech-trends skim happens **every** day in the 15-min morning block — no dedicated day needed.

---

## 🧭 90-Day Cycles (one headline project per quarter)

| Quarter | Theme | Deliverable |
|---------|-------|-------------|
| **Q1** | Networking + Perf | Build a toy TCP + profile & optimize one real service |
| **Q2** | Security + Code reading | Complete PortSwigger Academy + 3 deep OSS writeups |
| **Q3** | AI tools | Ship one RAG app + one agent, publish eval results |
| **Q4** | Synthesis | Pick a real problem at work, apply all 4 lenses, write it up |

---

## 🧠 Guiding Principles

1. **Depth weekly, breadth daily.** One focus area per day; skim news every day.
2. **Build > Read.** Every book chapter ends with a tiny lab.
3. **Write publicly.** A notes repo / blog cements learning 10×.
4. **Retrieval > re-reading.** Anki cards made *while* studying (10–15/hr).
5. **Problem-first.** Flail on a problem for 10 min before the tutorial.
6. **Teach forward.** 1-page cheatsheet per sub-topic → GitHub.
7. **No zero days.** Even 15 min keeps the chain alive.

---

## ⚠️ Anti-patterns to avoid

- ❌ Tutorial hell — watching without building
- ❌ Tab hoarding — bookmarking ≠ learning
- ❌ Always picking comfort topics — use random rotation
- ❌ Reading without writing — no note = didn't happen
- ❌ Perfectionism — ship the ugly version first

---

## 🛠 Adapting `try.html` as the tracker

`try.html` already has everything you need:
- 5-per-day topic reshuffle with freshness/mastery weighting
- 25-min Pomodoro with idle detection + forest gamification
- Per-topic mastery bars & streaks in `localStorage`
- Daily quota, reason chips (NEW · FRESH · OVERDUE · STALE)

To re-skin it for this plan, edit the `TOPICS` array (~line 443 of `try.html`) to:

```js
const TOPICS = [
  {id:'networking',      name:'Networking',           icon:'🌐', color:'#58a6ff',
   subs:['TCP internals','HTTP/2 & HTTP/3','TLS handshake','DNS','BGP basics','NAT & WireGuard','tcpdump/Wireshark','Load balancers','CDN & caching','QUIC']},
  {id:'performance',     name:'Performance Analysis', icon:'📊', color:'#7ee787',
   subs:['USE method','RED method','Flame graphs','perf & eBPF','Latency percentiles','Little\'s Law','CPU cache & false sharing','GC tuning','Database perf','Profiling tools']},
  {id:'code-reading',    name:'Code Reading',         icon:'📖', color:'#d2a8ff',
   subs:['Redis internals','SQLite source','CPython core','Go stdlib','Entry-point tracing','Call graphs','Reading tests first','Commit archaeology','Writeup practice','PR review skill']},
  {id:'tech-trends',     name:'Latest Tech',          icon:'📰', color:'#ffa657',
   subs:['HN top 10','TLDR newsletter','Pragmatic Engineer','Simon Willison','Morning Paper','Changelog podcast','Cloudflare blog','Platform releases','Language releases','Conference talks']},
  {id:'security',        name:'Security',             icon:'🔐', color:'#f0883e',
   subs:['PortSwigger labs','OverTheWire wargames','SQLi & XSS','CSRF & SSRF','Auth & sessions','Crypto basics','TLS deep-dive','Supply chain','Threat modeling','CVE reading']},
  {id:'ai-tools',        name:'AI Tools',             icon:'🤖', color:'#79c0ff',
   subs:['Karpathy Zero-to-Hero','RAG patterns','Agents & tool use','Evals & tests','Prompt engineering','Cursor/Claude Code','llm CLI','Embeddings','Fine-tuning basics','Cost & latency']},
];
```

Also update `DAY_QUOTA` (line 461) — with 6 topics, set it to `3` so you do half the topics per day and rotate. Keep `LAUNCH_DATE` current.

That's it — the tracker, Pomodoro, streaks, and mastery bars all work unchanged.

---

*Last updated: 2026-04-20*
