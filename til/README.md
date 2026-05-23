# 🌐 Net Walkthrough — A Hands-On Networking Journey

A personal lab to learn networking by **seeing** it on the wire, not just reading about it.

> Started: 2026-05-22
> Trigger: A long-haul TCP throughput issue where the root cause was *"sender-side socket buffer too small even though TCP window scaling was working."* I wanted to understand what that actually looks like in packets.

---

## 🎯 Learning Goals

By the end of this lab, I should be able to:

1. Read a `.pcapng` file and explain every packet of a TCP+TLS connection.
2. Spot **TCP window scaling**, **MSS**, **SACK**, and **initial RTT** in a SYN.
3. Recognize the visual signature of a **small sender buffer** (the long-haul problem).
4. Compute **P50/P95/P99/P99.9 latency** from a real capture and explain why mean lies.
5. Tie packet-level evidence back to a livesite monitoring dashboard.

---

## 🧪 The Plan

| # | Experiment | Concept | Tool | Status |
|---|---|---|---|---|
| 0 | Install Wireshark + Npcap + iperf3 | Setup | winget | 🟡 In progress |
| 1 | Capture an HTTPS request to example.com | TCP handshake, TLS handshake | `tshark`, `curl` | ⬜ |
| 2 | Download 10 MB and watch window grow | Slow start, window scaling, BDP | `tshark`, `curl` | ⬜ |
| 3 | Simulate the long-haul case with small `-w` | Sender buffer collapse | `iperf3` + Wireshark | ⬜ |
| 4 | Compute percentiles from capture | Tail latency, P99 vs mean | `tshark` + Python | ⬜ |

---

## 📁 Folder Layout

```
netwalkthough/
├── README.md            ← this file (the journal)
├── exp1-handshake/      ← capture + write-up for TCP/TLS handshake
├── exp2-window/         ← window scaling experiment
├── exp3-buffer/         ← sender buffer comparison (the long-haul repro)
├── exp4-percentiles/    ← latency distribution analysis
└── lab-report.html      ← final stitched single-page report
```

---

## 📓 Journal

### 2026-05-22 — Setup begins
- ✅ Wireshark 4.6.6 installed via winget.
- ⚠️ Npcap missing (needs admin elevation). Installer staged at `%TEMP%\npcap-installer.exe`.
- 📝 Next: run elevated install, then start Experiment 1.

<!-- Add new entries above this line, newest first -->

---

## 🔑 Key Concepts (filled in as I learn)

### TCP 3-way handshake
*Coming after Experiment 1.*

### Window scaling
*Coming after Experiment 2.*

### Sender buffer vs receiver window
*Coming after Experiment 3 — this is the long-haul lesson.*

### Tail latency / percentiles
*Coming after Experiment 4.*

---

## 📚 References

- [Wireshark User's Guide](https://www.wireshark.org/docs/wsug_html_chunked/)
- [RFC 7323 — TCP Extensions for High Performance (window scaling)](https://datatracker.ietf.org/doc/html/rfc7323)
- [The Tail at Scale (Dean & Barroso)](https://research.google/pubs/the-tail-at-scale/)
