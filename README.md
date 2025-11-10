# Universal Dark Mode

A standalone dark mode toggle for any site. Include via `<script src="..."></script>` and configure with globals—no edits required.

```html
<!-- Optional configuration (set before including the script) -->
<script>
  window.UNIVERSAL_DARK_MODE_OPTIONS = {
    exclude: ['.no-dark'],  // selectors, elements, or function(el) => boolean
    position: 'top-right'   // default: 'bottom-right', supported positions: top/middle/bottom × left/center/right.
  };
</script>

<!-- Required script inclusion -->
<script src="https://cdn.jsdelivr.net/gh/DaUmega/web-dark-mode-toggle@main/script.js"></script>
```

## Features
- Zero dependencies, single file.  
- Exclude elements by selector, element, or function.  
- Toggle button in 9 positions.  
- Saves preference in `localStorage`.  
- Lightweight CSS with safe DOM handling.  

## Runtime API
```js
UNIVERSAL_DARK_MODE.enable();
UNIVERSAL_DARK_MODE.disable();
UNIVERSAL_DARK_MODE.toggle();
UNIVERSAL_DARK_MODE.isEnabled();
UNIVERSAL_DARK_MODE.setExclusions(v);
UNIVERSAL_DARK_MODE.setPosition(p);
```

## License
MIT
