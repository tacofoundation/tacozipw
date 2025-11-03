<template>
    <section class="my-protomaps-snippet">
      <div class="content-wrapper">
        <div class="text-content">
          <h2 class="big-title">Quick Start</h2>
          <p>See tacozip API in action:</p>
          <ul>
            <li>Archive large files (like Parquet or data.bin) with custom metadata. <a href="./en/python/getting-started.html" class="arrow-link"><span class="arrow">→</span></a></li>
            <li>Define byte-range "entries" (e.g., Row Groups) in the header. <a href="./en/python/header.html#entry-semantics" class="arrow-link"><span class="arrow">→</span></a></li>
            <li>Read metadata back instantly using <code>read_header()</code>. <a href="./en/python/python-api-reference.html#read-header" class="arrow-link"><span class="arrow">→</span></a></li>
          </ul>
        </div>
        
        <div class="code-content">
          <div class="code-header">
            </div>
  
          <pre><code class="language-python">{{ codeSnippet1 }}</code></pre>
        </div>
  
      </div>
    </section>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import hljs from 'highlight.js/lib/core'
  import python from 'highlight.js/lib/languages/python'
  // Regístralo
  hljs.registerLanguage('python', python)
  
  // Importa el CSS del tema que gustes (monokai, dracula, etc.):
  import 'highlight.js/styles/monokai.css'
  
  // --- CONTENIDO DEL CÓDIGO MEJORADO ---
  // Este ejemplo es auto-contenido: crea un fichero,
  // lo archiva con metadatos y luego lo verifica.
  const codeSnippet1 = `
  import tacozip
  from pathlib import Path

  # 1. Create sample Parquet files
  Path("train.parquet").write_bytes(b"training data..." * 1000)
  Path("test.parquet").write_bytes(b"test data..." * 500)

  # 2. Archive with row group metadata
  tacozip.create(
      "dataset.taco",
      src_files=["train.parquet", "test.parquet"],
      entries=[
          (1000, 5000),  # Row group 0: bytes 1000-6000
          (6000, 4500)   # Row group 1: bytes 6000-10500
      ]
  )

  # 3. Read metadata instantly (165 bytes only!)
  entries = tacozip.read_header("dataset.taco")
  print(f"Metadata: {entries}")

  # 4. Works with cloud storage (S3, HTTP)
  import requests
  r = requests.get(
      "https://cdn.example.com/dataset.taco",
      headers={"Range": "bytes=0-164"}
  )
  entries = tacozip.read_header(r.content)
  `
  // --- FIN DEL CAMBIO ---
  
  // Estado para el botón "Copy" -> "Copied!"
  const copied = ref(false)
  
  // Copia todo el código junto
  function copyAllCode() {
    // Corregido: Solo copia codeSnippet1
    navigator.clipboard.writeText(codeSnippet1).then(() => {
      copied.value = true
      // Después de 2s volvemos a mostrar "Copy"
      setTimeout(() => {
        copied.value = false
      }, 2000)
    })
  }
  
  // Al montar, resaltamos todos los bloques <code> con highlight.js
  onMounted(() => {
    document.querySelectorAll('pre code').forEach(block => {
      hljs.highlightElement(block)
    })
  })
  </script>