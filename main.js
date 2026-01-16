const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width, height;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

// 3D Point class
class Point3D {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

// Cube vertices (centered at 0,0,0)
const vertices = [
    new Point3D(-1, -1, -1),
    new Point3D(1, -1, -1),
    new Point3D(1, 1, -1),
    new Point3D(-1, 1, -1),
    new Point3D(-1, -1, 1),
    new Point3D(1, -1, 1),
    new Point3D(1, 1, 1),
    new Point3D(-1, 1, 1)
];

// Edges connecting vertices (indices)
const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0], // Back face
    [4, 5], [5, 6], [6, 7], [7, 4], // Front face
    [0, 4], [1, 5], [2, 6], [3, 7]  // Connecting lines
];

// Animation state
let angleX = 0;
let angleY = 0;

// Physics state
let isDragging = false;
let isPanning = false;
let lastMouseX = 0;
let lastMouseY = 0;
let lastPanX = 0;
let lastPanY = 0;
let velocityX = 0;
let velocityY = 0;

// Camera and Transform
let cameraDistance = 4;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 50;
let offsetX = 0;
let offsetY = 0;

// Mouse Interaction Events
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // Left click: Rotate
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        // Stop momentum when grabbing
        velocityX = 0;
        velocityY = 0;
    } else if (e.button === 2) { // Right click: Pan
        isPanning = true;
        lastPanX = e.clientX;
        lastPanY = e.clientY;
    }
});

window.addEventListener('mouseup', () => {
    isDragging = false;
    isPanning = false;
});

window.addEventListener('mouseleave', () => {
    isDragging = false;
    isPanning = false;
});

// Prevent context menu on right click
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;

        lastMouseX = e.clientX;
        lastMouseY = e.clientY;

        // Apply rotation
        angleY += deltaX * 0.01;
        angleX += deltaY * 0.01;

        // Store velocity for momentum
        velocityX = deltaY * 0.01;
        velocityY = deltaX * 0.01;
    } else if (isPanning) {
        const deltaX = e.clientX - lastPanX;
        const deltaY = e.clientY - lastPanY;

        lastPanX = e.clientX;
        lastPanY = e.clientY;

        offsetX += deltaX;
        offsetY += deltaY;
    }
});

// Zoom with scroll
window.addEventListener('wheel', (e) => {
    e.preventDefault();
    cameraDistance += e.deltaY * 0.005;
    // Clamp zoom
    cameraDistance = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, cameraDistance));
    // Update slider UI
    zoomSlider.value = cameraDistance;
}, { passive: false });

// Touch Interactions
let lastTouchDistance = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
        isDragging = true;
        lastMouseX = e.touches[0].clientX;
        lastMouseY = e.touches[0].clientY;
        velocityX = 0;
        velocityY = 0;
    } else if (e.touches.length === 2) {
        isPanning = true;
        // Midpoint for Pan
        lastPanX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        lastPanY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

        // Distance for Zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDistance = Math.hypot(dx, dy);
    }
}, { passive: false });

window.addEventListener('touchend', () => {
    isDragging = false;
    isPanning = false;
    lastTouchDistance = 0;
});

window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (isDragging && e.touches.length === 1) {
        const clientX = e.touches[0].clientX;
        const clientY = e.touches[0].clientY;

        const deltaX = clientX - lastMouseX;
        const deltaY = clientY - lastMouseY;

        lastMouseX = clientX;
        lastMouseY = clientY;

        angleY += deltaX * 0.01;
        angleX += deltaY * 0.01;

        velocityX = deltaY * 0.01;
        velocityY = deltaX * 0.01;
    } else if (e.touches.length === 2) {
        // Pan Logic
        const currentPanX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const currentPanY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

        if (isPanning) {
            const deltaX = currentPanX - lastPanX;
            const deltaY = currentPanY - lastPanY;
            offsetX += deltaX;
            offsetY += deltaY;
            lastPanX = currentPanX;
            lastPanY = currentPanY;
        }

        // Pinch Zoom Logic
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(dx, dy);

        if (lastTouchDistance > 0) {
            const deltaDist = currentDist - lastTouchDistance;
            // Sensitivity factor
            const zoomSpeed = 0.05;
            // Inverse logic: increasing distance -> zoom in -> smaller cameraDistance
            cameraDistance -= deltaDist * zoomSpeed;
            cameraDistance = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, cameraDistance));
            zoomSlider.value = cameraDistance;
        }
        lastTouchDistance = currentDist;
    }
}, { passive: false });


function project(point) {
    // Simple perspective projection
    const fov = 350;

    // Check to avoid division by zero or flipping behind camera
    const zFactor = cameraDistance - point.z;
    if (zFactor <= 0) return { x: 0, y: 0 };

    const scale = fov / zFactor;

    return {
        x: point.x * scale + width / 2 + offsetX,
        y: point.y * scale + height / 2 + offsetY
    };
}

function rotateX(point, theta) {
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const y = point.y * cos - point.z * sin;
    const z = point.y * sin + point.z * cos;
    return new Point3D(point.x, y, z);
}

function rotateY(point, theta) {
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const x = point.x * cos - point.z * sin;
    const z = point.x * sin + point.z * cos;
    return new Point3D(x, point.y, z);
}

// UI Controls
const colorPicker = document.getElementById('colorPicker');
const thicknessSlider = document.getElementById('thicknessSlider');
const zoomSlider = document.getElementById('zoomSlider');
const objLoader = document.getElementById('objLoader');
const loadPengerBtn = document.getElementById('loadPengerBtn');

// Sync theme color immediately when color changes
colorPicker.addEventListener('input', (e) => {
    const color = e.target.value;
    document.documentElement.style.setProperty('--theme-color', color);
});

// Sync zoom from slider
zoomSlider.addEventListener('input', (e) => {
    cameraDistance = parseFloat(e.target.value);
});

// Load Penger Preset
loadPengerBtn.addEventListener('click', () => {
    if (typeof PENGER_OBJ !== 'undefined') {
        parseOBJ(PENGER_OBJ);
        // Reset view for best experience ? maybe not force it but centering is good
        angleX = 0;
        angleY = 0;

        // Penger might need good zoom
        cameraDistance = 5;
        zoomSlider.value = cameraDistance;
    } else {
        alert('Modelo Penger não encontrado!');
    }
});

// Load OBJ file
objLoader.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target.result;
        parseOBJ(text);
    };
    reader.readAsText(file);
});

function parseOBJ(text) {
    const lines = text.split('\n');
    const newVertices = [];
    const newEdges = []; // We will need to compute unique edges from faces

    // Helper to check if edge exists (undirected)
    const edgeSet = new Set();
    function addEdge(i1, i2) {
        // Ensure smaller index first for uniqueness
        const k = i1 < i2 ? `${i1},${i2}` : `${i2},${i1}`;
        if (!edgeSet.has(k)) {
            edgeSet.add(k);
            newEdges.push([i1, i2]);
        }
    }

    // OBJ indices are 1-based, we need 0-based
    // Parsing
    lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts[0] === 'v') {
            const x = parseFloat(parts[1]);
            const y = parseFloat(parts[2]);
            const z = parseFloat(parts[3]);
            newVertices.push(new Point3D(x, y, z));
        } else if (parts[0] === 'f') {
            // Faces can be quads or tris, e.g. f 1 2 3 or f 1/1/1 2/2/2 ...
            const indices = [];
            for (let i = 1; i < parts.length; i++) {
                // Handle v/vt/vn format by splitting on '/'
                const indexStr = parts[i].split('/')[0];
                const index = parseInt(indexStr) - 1; // 0-based
                indices.push(index);
            }

            // Connect vertices in loop
            for (let i = 0; i < indices.length; i++) {
                const start = indices[i];
                const end = indices[(i + 1) % indices.length];
                addEdge(start, end);
            }
        }
    });

    if (newVertices.length > 0) {
        vertices.length = 0;
        vertices.push(...newVertices);
        edges.length = 0;
        edges.push(...newEdges);

        angleX = 0;
        angleY = 0;
        console.log(`Loaded model: ${newVertices.length} vertices, ${newEdges.length} edges`);
    }
}

function loop() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Get values from UI
    const color = colorPicker.value;
    const thickness = thicknessSlider.value;

    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;

    // Physics: Apply momentum when not dragging
    if (!isDragging) {
        angleX += velocityX;
        angleY += velocityY;

        // Friction
        velocityX *= 0.95;
        velocityY *= 0.95;

        // Stop completely if very slow
        if (Math.abs(velocityX) < 0.0001) velocityX = 0;
        if (Math.abs(velocityY) < 0.0001) velocityY = 0;
    }

    // Transformed vertices
    const transformedVertices = vertices.map(v => {
        let rotated = rotateX(v, angleX);
        rotated = rotateY(rotated, angleY);
        return project(rotated);
    });

    // Draw edges
    ctx.beginPath();
    for (const [startIdx, endIdx] of edges) {
        const start = transformedVertices[startIdx];
        const end = transformedVertices[endIdx];

        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
    }
    ctx.stroke();

    requestAnimationFrame(loop);
}

loop();
