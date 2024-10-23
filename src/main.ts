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
let x = 0;
let y = 0;

// Function to draw a line on the canvas
const drawLine = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.closePath();
};

// Event listeners for mouse actions
canvas.addEventListener("mousedown", (e) => {
    x = e.offsetX;
    y = e.offsetY;
    isDrawing = true;
});

canvas.addEventListener("mousemove", (e) => {
    if (isDrawing && context) {
        drawLine(context, x, y, e.offsetX, e.offsetY);
        x = e.offsetX;
        y = e.offsetY;
    }
});

globalThis.addEventListener("mouseup", () => {
    if (isDrawing) {
        isDrawing = false;
    }
});

// Add a "clear" button and make it clear the canvas.
const clearButton = document.createElement("button");
clearButton.innerText = "Clear";
app.appendChild(clearButton);

clearButton.addEventListener("click", () => {
    if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#7EC6E5";
        context.fillRect(0, 0, canvas.width, canvas.height);
    }
});
