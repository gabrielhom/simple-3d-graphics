# Simple 3D Graphics (Vanilla JS)

A lightweight 3D visualization engine built from scratch using HTML5 Canvas and pure JavaScript. No external libraries, no WebGL—just math.

![Demo Animation](animation.gif)

🔗 **Live Demo**: [https://gabrielhom.github.io/simple-3d-graphics/](https://gabrielhom.github.io/simple-3d-graphics/)

## 🚀 Key Features

*   **Zero Dependencies**: Pure Vanilla JS implementation of 3D projection math.
*   **OBJ Loader**: Parse and render custom `.obj` 3D models directly in the browser.
*   **Interactive Controls**:
    *   **Rotate**: Left-click drag / One-finger touch
    *   **Pan**: Right-click drag / Two-finger drag
    *   **Zoom**: Scroll wheel / Pinch gesture
*   **Physics**: Smooth momentum-based rotation handling.
*   **Responsive UI**: Custom control panel for color, thickness, and zoom adjustments.

## 🛠️ How It Works

This project demonstrates the fundamentals of 3D computer graphics:

1.  **Vertex Processing**: Objects are defined by vertices in 3D space (x, y, z).
2.  **Perspective Projection**: Implements the math to map 3D coordinates onto a 2D viewport.
3.  **Render Loop**: Uses `requestAnimationFrame` for smooth 60fps rendering.
4.  **Wireframe Rendering**: Connects projected vertices to form faces and meshes.
## 📂 Project Structure

*   `main.js`: Core engine logic (math, event handling, render loop).
*   `index.html`: Canvas setup and UI overlay.
*   `style.css`: Minimalist styling.

## Credits

*   Inspired by **Tsoding**: [YouTube Video](https://www.youtube.com/watch?v=qjWkNZ0SXfo)
*   `penger.obj` model by **Max Kawula**: [GitHub Repository](https://github.com/Max-Kawula/penger-obj)
