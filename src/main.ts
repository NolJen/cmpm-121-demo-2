import "./style.css";

const APP_NAME = "Hello Nolan";
const app = document.querySelector<HTMLDivElement>('#app')!;

// Set the document title and add an app title
app.innerHTML = `<h1>${APP_NAME}</h1>`;
document.title = APP_NAME;

// Add a canvas to the webpage
// https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
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
// Variables to keep track of drawing state 
let isDrawing = false;
let currentLine: { x: number; y: number }[] = [];
const lines: { x: number; y: number }[][] = [];
const redoStack: { x: number; y: number }[][] = [];

// Function to draw a line on the canvas
const drawLine = (ctx: CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number) => {
    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.closePath();
};

// Function to redraw all lines
const redrawLines = () => {
    if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#7EC6E5";
        context.fillRect(0, 0, canvas.width, canvas.height);
        for (const line of lines) {
            for (let i = 1; i < line.length; i++) {
                drawLine(context, line[i - 1].x, line[i - 1].y, line[i].x, line[i].y);
            }
        }
    }
};

// Event listeners for mouse actions
canvas.addEventListener("mousedown", (e) => {
    currentLine = [{ x: e.offsetX, y: e.offsetY }];
    isDrawing = true;
});

canvas.addEventListener("mousemove", (e) => {
    if (isDrawing) {
        currentLine.push({ x: e.offsetX, y: e.offsetY });
        canvas.dispatchEvent(new Event("drawing-changed"));
    }
});

globalThis.addEventListener("mouseup", () => {
    if (isDrawing) {
        isDrawing = false;
        lines.push(currentLine);
        redoStack.length = 0;
        canvas.dispatchEvent(new Event("drawing-changed"));
    }
});

// Observer for the "drawing-changed" event
canvas.addEventListener("drawing-changed", () => {
    redrawLines();
});

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
