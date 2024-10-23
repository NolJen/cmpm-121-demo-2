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
