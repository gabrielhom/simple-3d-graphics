/* Modern 3D Engine - ES2024 Refactor */

// --- DOM References ---
const el = {
    canvas: document.getElementById('canvas'),
    ctx: document.getElementById('canvas').getContext('2d'),
    ui: {
        color: document.getElementById('colorPicker'),
        thickness: document.getElementById('thicknessSlider'),
        zoom: document.getElementById('zoomSlider'),
        loader: document.getElementById('objLoader'),
        btnPenger: document.getElementById('loadPengerBtn'),
        btnToggle: document.getElementById('toggleBtn'),
        panel: document.getElementById('controlsPanel'),
        bg: document.getElementById('bgPicker'),
        autoRotate: document.getElementById('autoRotateToggle'),
        autoRotateSpeed: document.getElementById('autoRotateSpeed'),
        btnResetView: document.getElementById('resetViewBtn'),
        btnFit: document.getElementById('fitModelBtn'),
        info: document.getElementById('modelInfo'),
    }
};

// --- Configuration ---
const CONFIG = {
    fov: 350,
    zoom: { min: 0.5, max: 50, speed: 0.005, pinchSpeed: 0.1 },
    physics: { friction: 0.95, draggingSpeed: 0.01 },
    initialCamera: 4,
    colors: { bg: '#000' }
};

// --- App State ---
const state = {
    width: 0,
    height: 0,
    geometry: {
        vertices: [],
        edges: [],
        radius: 1,
    },
    transform: {
        angle: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        camera: {
            distance: CONFIG.initialCamera,
            offset: { x: 0, y: 0 }
        },
        autoRotate: true,
        autoRotateSpeed: 0.01,
    },
    input: {
        isDragging: false,
        isPanning: false,
        lastMouse: { x: 0, y: 0 },
        lastPan: { x: 0, y: 0 },
        lastTouchDist: 0
    }
};

// --- Geometry Helpers ---
const point3D = (x, y, z) => ({ x, y, z });

const normalizeGeometry = () => {
    const { vertices } = state.geometry;
    if (!vertices.length) return;
    let min = { x: Infinity, y: Infinity, z: Infinity };
    let max = { x: -Infinity, y: -Infinity, z: -Infinity };
    vertices.forEach(({ x, y, z }) => {
        min.x = Math.min(min.x, x); max.x = Math.max(max.x, x);
        min.y = Math.min(min.y, y); max.y = Math.max(max.y, y);
        min.z = Math.min(min.z, z); max.z = Math.max(max.z, z);
    });
    const center = point3D(
        (min.x + max.x) / 2,
        (min.y + max.y) / 2,
        (min.z + max.z) / 2
    );
    const size = Math.max(max.x - min.x, max.y - min.y, max.z - min.z) || 1;
    const scale = 2 / size;
    state.geometry.vertices = vertices.map(({ x, y, z }) => point3D(
        (x - center.x) * scale,
        (y - center.y) * scale,
        (z - center.z) * scale
    ));
    state.geometry.radius = 1; // normalized
};

const fitToView = () => {
    state.transform.camera.distance = Math.max(
        CONFIG.zoom.min,
        Math.min(CONFIG.zoom.max, state.geometry.radius * 4)
    );
    state.transform.camera.offset = { x: 0, y: 0 };
    state.transform.angle = { x: 0, y: 0 };
    el.ui.zoom.value = state.transform.camera.distance;
};

const updateInfo = () => {
    el.ui.info.textContent = `Vertices: ${state.geometry.vertices.length} | Arestas: ${state.geometry.edges.length}`;
};

// Setup default Cube
const initCube = () => {
    state.geometry.vertices = [
        point3D(-1, -1, -1), point3D(1, -1, -1),
        point3D(1, 1, -1), point3D(-1, 1, -1),
        point3D(-1, -1, 1), point3D(1, -1, 1),
        point3D(1, 1, 1), point3D(-1, 1, 1)
    ];
    state.geometry.edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
    ];
    normalizeGeometry();
    updateInfo();
};
initCube();

// --- Core Engine ---

const resize = () => {
    state.width = el.canvas.width = window.innerWidth;
    state.height = el.canvas.height = window.innerHeight;
};
window.addEventListener('resize', resize);
resize();

const project = ({ x, y, z }) => {
    const { distance, offset } = state.transform.camera;
    const zFactor = distance - z;

    // Clip behind camera
    if (zFactor <= 0) return { x: 0, y: 0 };

    const scale = CONFIG.fov / zFactor;
    return {
        x: x * scale + state.width / 2 + offset.x,
        y: y * scale + state.height / 2 + offset.y
    };
};

const rotateX = ({ x, y, z }, theta) => {
    const cos = Math.cos(theta), sin = Math.sin(theta);
    return { x, y: y * cos - z * sin, z: y * sin + z * cos };
};

const rotateY = ({ x, y, z }, theta) => {
    const cos = Math.cos(theta), sin = Math.sin(theta);
    return { x: x * cos - z * sin, y, z: x * sin + z * cos };
};

// --- Event Handlers ---

const handleStart = (x, y, isRightClick = false) => {
    if (isRightClick) {
        state.input.isPanning = true;
        state.input.lastPan = { x, y };
    } else {
        state.input.isDragging = true;
        state.input.lastMouse = { x, y };
        state.transform.velocity = { x: 0, y: 0 }; // Stop momentum
    }
};

const handleMove = (x, y) => {
    const { isDragging, isPanning, lastMouse, lastPan } = state.input;
    const { draggingSpeed } = CONFIG.physics;

    if (isDragging) {
        const deltaX = x - lastMouse.x;
        const deltaY = y - lastMouse.y;

        state.input.lastMouse = { x, y };

        // Update rotation
        state.transform.angle.y += deltaX * draggingSpeed;
        state.transform.angle.x += deltaY * draggingSpeed;

        // Update velocity for momentum
        state.transform.velocity = {
            x: deltaY * draggingSpeed,
            y: deltaX * draggingSpeed
        };
    } else if (isPanning) {
        const deltaX = x - lastPan.x;
        const deltaY = y - lastPan.y;

        state.input.lastPan = { x, y };

        state.transform.camera.offset.x += deltaX;
        state.transform.camera.offset.y += deltaY;
    }
};

const handleEnd = () => {
    state.input.isDragging = false;
    state.input.isPanning = false;
    state.input.lastTouchDist = 0;
};

// Mouse Events
el.canvas.addEventListener('mousedown', (e) => handleStart(e.clientX, e.clientY, e.button === 2));
window.addEventListener('mouseup', handleEnd);
el.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('mousemove', (e) => {
    if (state.input.isDragging || state.input.isPanning) {
        handleMove(e.clientX, e.clientY);
    }
});

// Wheel Zoom
window.addEventListener('wheel', (e) => {
    e.preventDefault();
    state.transform.camera.distance += e.deltaY * CONFIG.zoom.speed;
    // Clamp
    state.transform.camera.distance = Math.max(
        CONFIG.zoom.min,
        Math.min(CONFIG.zoom.max, state.transform.camera.distance)
    );
    el.ui.zoom.value = state.transform.camera.distance;
}, { passive: false });

// Touch Events
el.canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
        handleStart(e.touches[0].clientX, e.touches[0].clientY, false);
    } else if (e.touches.length === 2) {
        // Multi-touch: Pan + Pinch
        state.input.isPanning = true;

        // Midpoint for Pan
        const t1 = e.touches[0], t2 = e.touches[1];
        state.input.lastPan = {
            x: (t1.clientX + t2.clientX) / 2,
            y: (t1.clientY + t2.clientY) / 2
        };

        // Distance for Pinch
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        state.input.lastTouchDist = Math.hypot(dx, dy);
    }
}, { passive: false });

window.addEventListener('touchend', handleEnd);

window.addEventListener('touchmove', (e) => {
    const { isDragging, isPanning } = state.input;
    // Prevent scrolling if active
    if (isDragging || isPanning || e.touches.length === 2) e.preventDefault();

    if (e.touches.length === 1 && isDragging) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
        const t1 = e.touches[0], t2 = e.touches[1];

        // 1. Handle Pan (Midpoint)
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;

        // We reuse handleMove logic for pan by tricking it into thinking it's a single point move
        // But we need to be careful not to trigger rotate.
        // Let's implement specific dual-touch logic here for clarity.

        if (state.input.isPanning) {
            const dx = midX - state.input.lastPan.x;
            const dy = midY - state.input.lastPan.y;
            state.transform.camera.offset.x += dx;
            state.transform.camera.offset.y += dy;
            state.input.lastPan = { x: midX, y: midY };
        }

        // 2. Handle Pinch (Zoom)
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        if (state.input.lastTouchDist > 0) {
            const delta = dist - state.input.lastTouchDist;
            state.transform.camera.distance -= delta * CONFIG.zoom.pinchSpeed;
            // Clamp
            state.transform.camera.distance = Math.max(
                CONFIG.zoom.min,
                Math.min(CONFIG.zoom.max, state.transform.camera.distance)
            );
            el.ui.zoom.value = state.transform.camera.distance;
        }
        state.input.lastTouchDist = dist;
    }
}, { passive: false });

// --- OBJ Parser ---

const parseOBJ = (text) => {
    const lines = text.split('\n');
    const newVertices = [];
    const newEdges = [];
    const edgeSet = new Set();

    const addEdge = (i1, i2) => {
        const k = i1 < i2 ? `${i1},${i2}` : `${i2},${i1}`;
        if (edgeSet.has(k)) return;
        edgeSet.add(k);
        newEdges.push([i1, i2]);
    };

    for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const [type, ...args] = parts;

        if (type === 'v') {
            newVertices.push(point3D(...args.map(parseFloat)));
        } else if (type === 'f') {
            // Parse indices (1-based to 0-based)
            const indices = args.map(arg => parseInt(arg.split('/')[0]) - 1);
            // Connect loop
            for (let i = 0; i < indices.length; i++) {
                addEdge(indices[i], indices[(i + 1) % indices.length]);
            }
        }
    }

    if (newVertices.length) {
        state.geometry.vertices = newVertices;
        state.geometry.edges = newEdges;
        state.transform.angle = { x: 0, y: 0 };
        normalizeGeometry();
        fitToView();
        updateInfo();
        console.log(`Loaded: ${newVertices.length} v, ${newEdges.length} e`);
    }
};

// --- UI Listeners ---

// Color
el.ui.color.addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--theme-color', e.target.value);
});

// Thickness (read in loop, no listener needed for state)

// Zoom Slider
el.ui.zoom.addEventListener('input', (e) => {
    state.transform.camera.distance = parseFloat(e.target.value);
});

// Toggle UI
el.ui.btnToggle.addEventListener('click', () => {
    el.ui.panel.classList.toggle('hidden');
    el.ui.btnToggle.textContent = el.ui.panel.classList.contains('hidden') ? '+' : '_';
});

// Load OBJ
el.ui.loader.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => parseOBJ(ev.target.result);
    reader.readAsText(file);
});

// Load Penger
el.ui.btnPenger.addEventListener('click', () => {
    if (typeof PENGER_OBJ !== 'undefined') {
        parseOBJ(PENGER_OBJ);
        fitToView();
    } else {
        alert('Penger not found!');
    }
});

// --- Render Loop ---

const loop = () => {
    // Clear
    el.ctx.fillStyle = CONFIG.colors.bg;
    el.ctx.fillRect(0, 0, state.width, state.height);

    // Update Styles
    el.ctx.strokeStyle = el.ui.color.value;
    el.ctx.lineWidth = el.ui.thickness.value;

    // Physics (Momentum) + Auto-rotate
    if (!state.input.isDragging) {
        state.transform.angle.x += state.transform.velocity.x;
        state.transform.angle.y += state.transform.velocity.y;
        if (state.transform.autoRotate) {
            state.transform.angle.y += state.transform.autoRotateSpeed;
        }
        state.transform.velocity.x *= CONFIG.physics.friction;
        state.transform.velocity.y *= CONFIG.physics.friction;
    }

    // Transform Geometry
    const { vertices } = state.geometry;
    const { angle } = state.transform;

    // We project and draw edges
    // Optimization: Project all vertices first
    const projected = vertices.map(v => {
        const rX = rotateX(v, angle.x);
        const rY = rotateY(rX, angle.y);
        return project(rY);
    });

    // Draw Edges
    el.ctx.beginPath();
    for (const [start, end] of state.geometry.edges) {
        const p1 = projected[start];
        const p2 = projected[end];
        el.ctx.moveTo(p1.x, p1.y);
        el.ctx.lineTo(p2.x, p2.y);
    }
    el.ctx.stroke();

    requestAnimationFrame(loop);
};

loop();

// Remove duplicate toggle listener (was causing double-toggle)
 // el.ui.btnToggle.addEventListener('click', () => {
 //     el.ui.panel.classList.toggle('hidden');
 //     el.ui.btnToggle.textContent = el.ui.panel.classList.contains('hidden') ? '+' : '_';
 // });

// Keep the remaining listeners
el.ui.autoRotate.addEventListener('change', (e) => {
    state.transform.autoRotate = e.target.checked;
});
el.ui.autoRotateSpeed.addEventListener('input', (e) => {
    state.transform.autoRotateSpeed = parseFloat(e.target.value);
});
el.ui.btnResetView.addEventListener('click', () => {
    state.transform.angle = { x: 0, y: 0 };
    state.transform.velocity = { x: 0, y: 0 };
    state.transform.camera.offset = { x: 0, y: 0 };
    fitToView();
});
el.ui.btnFit.addEventListener('click', fitToView);
