import "./style.css";

const APP_NAME = "Hello Nolan";
const app = document.querySelector<HTMLDivElement>('#app')!;

// Set the document title and add an app title
app.innerHTML = `<h1>${APP_NAME}</h1>`;
document.title = APP_NAME;

// Add a canvas to the webpage
// https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
type CanvasElement = HTMLCanvasElement & { getContext: (contextId: "2d") => CanvasRenderingContext2D | null };

const canvas: CanvasElement = document.createElement("canvas") as CanvasElement;
canvas.width = 256;
canvas.height = 256;
canvas.id = "myCanvas";
app.appendChild(canvas);

const context = canvas.getContext("2d");
if (context) {
    context.fillStyle = "#7EC6E5";
    context.fillRect(0, 0, canvas.width, canvas.height);
}

//refrenced from https://developer.mozilla.org/en-US/docs/Web/API/Element/mousemove_event
// When true, moving the mouse draws on the canvas
interface MarkerLine {
    points: { x: number; y: number }[];
    lineWidth: number;
    drag: (x: number, y: number) => void;
    display: (ctx: CanvasRenderingContext2D) => void;
}

const createMarkerLine = (startX: number, startY:  number, lineWidth: number): MarkerLine => {
    const points = [{ x: startX, y: startY }];

    const drag = (x: number, y: number) => {
        points.push({ x, y });
    };

    const display = (ctx: CanvasRenderingContext2D) => {
        if (points.length < 2) return;

        ctx.beginPath();
        ctx.strokeStyle = "black";
        ctx.lineWidth = lineWidth;
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
        ctx.closePath();
    };

    return { points, lineWidth, drag, display };
};

// Variables to keep track of drawing state 
let isDrawing = false;
let currentLine: MarkerLine | null = null;
let currentLineWidth = 1;
const lines: MarkerLine[] = [];
const redoStack: MarkerLine[] = [];

// Function to redraw all lines
const redrawLines = () => {
    if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#7EC6E5";
        context.fillRect(0, 0, canvas.width, canvas.height);
        lines.forEach(line => line.display(context));
    }
};

// Event listeners for mouse actions
canvas.addEventListener("mousedown", (e) => {
    currentLine = createMarkerLine(e.offsetX, e.offsetY, currentLineWidth);
    isDrawing = true;
});

//https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent
canvas.addEventListener("mousemove", (e) => {
    if (isDrawing && currentLine) {
        currentLine.drag(e.offsetX, e.offsetY);
        canvas.dispatchEvent(new Event("drawing-changed"));
    }
});

globalThis.addEventListener("mouseup", () => {
    if (isDrawing && currentLine) {
        isDrawing = false;
        lines.push(currentLine);
        redoStack.length = 0;
        currentLine = null;
        canvas.dispatchEvent(new Event("drawing-changed"));
    }
});

// Observer for the "drawing-changed" event
canvas.addEventListener("drawing-changed", redrawLines);

// Add a "clear" button and make it clear the canvas.
const clearButton = document.createElement("button");
clearButton.innerText = "Clear";
app.appendChild(clearButton);

clearButton.addEventListener("click", () => {
    lines.length = 0;
    redoStack.length = 0;
    if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#7EC6E5";
        context.fillRect(0, 0, canvas.width, canvas.height);
    }
});

// Add an "undo" button
const undoButton = document.createElement("button");
undoButton.innerText = "Undo";
app.appendChild(undoButton);

undoButton.addEventListener("click", () => {
    if (lines.length > 0) {
        const lastLine = lines.pop();
        if (lastLine) {
            redoStack.push(lastLine);
        }
        canvas.dispatchEvent(new Event("drawing-changed"));
    }
});

// Add a "redo" button
const redoButton = document.createElement("button");
redoButton.innerText = "Redo";
app.appendChild(redoButton);

redoButton.addEventListener("click", () => {
    if (redoStack.length > 0) {
        const lastRedo = redoStack.pop();
        if (lastRedo) {
            lines.push(lastRedo);
        }
        canvas.dispatchEvent(new Event("drawing-changed"));
    }
});

// Create buttons for the “thin” and “thick” marker tools.
//https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
const thinButton = document.createElement("button");
thinButton.innerText = "Thin";
thinButton.classList.add("tool-button");
app.appendChild(thinButton);	

const thickButton = document.createElement("button");
thickButton.innerText = "Thick";
thickButton.classList.add("tool-button");
app.appendChild(thickButton);

thinButton.addEventListener("click", () => {
    currentLineWidth = 1;
    thinButton.classList.add("selectedTool");
    thickButton.classList.remove("selectedTool");
});

thickButton.addEventListener("click", () => {
    currentLineWidth = 5;
    thickButton.classList.add("selectedTool");
    thinButton.classList.remove("selectedTool");
});
// Set default selected tool
thinButton.classList.add("selectedTool"); 