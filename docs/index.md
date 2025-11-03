---
layout: home
title: tacozip
hero:
  name: tacozip
  text: High-Speed Archival for Cloud-Native Data
  tagline: A blazing-fast, STORE-only ZIP writer with embedded TACO Header for instant metadata access. Built in C with first-class Python bindings.
  actions:
    - theme: brand
      text: What is tacozip?
      link: en/python/overview.html#what-is-tacozip
    - theme: alt
      text: GitHub
      link: https://github.com/tacofoundation/tacozip
  image:
    alt: 

features:
  - icon: ⚡
    title: Native C Performance
    details: C library with zero-overhead Python bindings.Perfect for processing multi-GB files without Python GIL bottlenecks.
  - icon: 🗂️
    title: 100% ZIP Compatible
    details: Open with WinZip, 7-Zip, or any standard tool. The TACO Header transparently appears as a regular file - full ecosystem compatibility.
  - icon: ☁️
    title: Cloud-Native Design
    details: Single 165-byte read gets all metadata. Perfect for S3, Azure, HTTP CDN - access specific chunks (e.g., Parquet row groups) without downloading entire archives.
    link: https://tacofoundation.github.io/
comment: true
---

<ProtomapsSnippet />
<ContactForm />
<MyProtomapsIndependent />