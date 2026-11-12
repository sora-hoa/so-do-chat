# so-do-chat

Mermaid diagram widget for Claude chat widgets (`show_widget`): each
`<script type="text/plain" class="sd-src" data-tab="…">` becomes a tab, rendered in a soft
light / dark palette with zoom, drag and a taller "Phóng to" (expand) layout. UI labels are
Vietnamese.

```html
<h2 class="sr-only">Sơ đồ: one sentence describing the diagram</h2>
<script type="text/plain" class="sd-src" data-tab="Flow">
flowchart LR
  A --> B
</script>
<script type="module">import('https://cdn.jsdelivr.net/gh/sora-hoa/so-do-chat@v1.0.0/so-do.js');</script>
```

Pin an exact tag. A change ships as a new tag; an existing tag is never moved.
