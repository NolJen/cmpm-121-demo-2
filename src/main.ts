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

interface ToolPreview {
    x: number;
    y: number;
    lineWidth: number;
    draw: (ctx: CanvasRenderingContext2D) => void;
} 

interface Sticker {
    x: number;
    y: number;
    emoji: string;
    drag: (x: number, y: number) => void;
    display: (ctx: CanvasRenderingContext2D) => void;
} 

const createMarkerLine = (startX: number, startY: number, lineWidth: number): MarkerLine => {
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

const createToolPreview = (x: number, y: number, lineWidth: number): ToolPreview => {
    const draw = (ctx: CanvasRenderingContext2D) => {
        ctx.beginPath();
        ctx.strokeStyle = "red";
        ctx.lineWidth = 1;
        ctx.arc(x, y, lineWidth / 2, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.closePath();
    };

    return { x, y, lineWidth, draw };
}; 

const createSticker = (x: number, y: number, emoji: string): Sticker => {
    const drag = (newX: number, newY: number) => {
        x = newX;
        y = newY;
    };

    const display = (ctx: CanvasRenderingContext2D) => {
        ctx.font = "50px serif";
        ctx.fillText(emoji, x, y);
    };

    return { x, y, emoji, drag, display };
}; 

const createStickerPreview = (x: number, y: number, emoji: string): ToolPreview => {
    const draw = (ctx: CanvasRenderingContext2D) => {
        ctx.font = "50px serif";
        ctx.fillText(emoji, x, y);
    };

    return { x, y, lineWidth: 0, draw };
}; 


// Variables to keep track of drawing state 
let isDrawing = false;
let currentLine: MarkerLine | null = null;
let currentLineWidth = 1;
let toolPreview: ToolPreview | null = null;
let currentSticker: Sticker | null = null;
const lines: MarkerLine[] = [];
const stickers: Sticker[] = [];
const redoStack: MarkerLine[] = [];

// Function to redraw all lines stickers, and tool preview
const redrawLines = () => {
    if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#7EC6E5";
        context.fillRect(0, 0, canvas.width, canvas.height);
        lines.forEach(line => line.display(context));
        stickers.forEach(sticker => sticker.display(context)); 
        if (!isDrawing && toolPreview) {
            toolPreview.draw(context);
        } 
    }
};

// Event listeners for mouse actions
canvas.addEventListener("mousedown", (e) => {
    if (currentSticker) {
        currentSticker.drag(e.offsetX, e.offsetY);
        isDrawing = true;
        toolPreview = null;
        canvas.dispatchEvent(new Event("tool-moved"));
    } else { 
        currentLine = createMarkerLine(e.offsetX, e.offsetY, currentLineWidth);
        isDrawing = true;
        toolPreview = null;
        canvas.dispatchEvent(new Event("tool-moved")); 
    }
});

//https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent
canvas.addEventListener("mousemove", (e) => {
    if (isDrawing && currentLine) {
        currentLine.drag(e.offsetX, e.offsetY);
        canvas.dispatchEvent(new Event("drawing-changed"));
    } else if (isDrawing && currentSticker) {
        currentSticker.drag(e.offsetX, e.offsetY);
        canvas.dispatchEvent(new Event("drawing-changed")); 
    } else if (currentSticker) {
        toolPreview = createStickerPreview(e.offsetX, e.offsetY, currentSticker.emoji);
        canvas.dispatchEvent(new Event("tool-moved")); 
    } else {
        toolPreview = createToolPreview(e.offsetX, e.offsetY, currentLineWidth);
        canvas.dispatchEvent(new Event("tool-moved")); 
    }
});

globalThis.addEventListener("mouseup", () => {
    if (isDrawing && currentLine) {
        isDrawing = false;
        lines.push(currentLine);
        redoStack.length = 0;
        currentLine = null;
        canvas.dispatchEvent(new Event("drawing-changed"));
    } else if (isDrawing && currentSticker) {
        isDrawing = false;
        stickers.push(currentSticker);
        currentSticker = null;
        canvas.dispatchEvent(new Event("drawing-changed")); 
    }
});

// Observer for the "drawing-changed" event
canvas.addEventListener("drawing-changed", redrawLines);
canvas.addEventListener("tool-moved", redrawLines);

// Add a "clear" button and make it clear the canvas.
const clearButton = document.createElement("button");
clearButton.innerText = "Clear";
app.appendChild(clearButton);

clearButton.addEventListener("click", () => {
    lines.length = 0;
    stickers.length = 0;
    redoStack.length = 0;
    redrawLines();
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
    currentLineWidth = 10;
    thickButton.classList.add("selectedTool");
    thinButton.classList.remove("selectedTool");
});
// Set default selected tool
thinButton.classList.add("selectedTool"); 

// Create buttons for stickers
const stickerEmojis = ["🩳", "🎸", "📺"];

// Function to create a sticker button
type StickerButtonClickHandler = (emoji: string) => void;

const createStickerButton = (emoji: string, clickHandler: StickerButtonClickHandler) => {
    const button = document.createElement("button");
    button.innerText = emoji;
    button.classList.add("sticker-button");
    app.appendChild(button);

    button.addEventListener("click", () => clickHandler(emoji));
};

// Add buttons for initial stickers
stickerEmojis.forEach((emoji) => {
    createStickerButton(emoji, (emoji) => {
        currentSticker = createSticker(0, 0, emoji);
        canvas.dispatchEvent(new Event("tool-moved"));
    });
});

// Add "Create Custom Sticker" button
//https://developer.mozilla.org/en-US/docs/Web/API/Window/prompt
const customStickerButton = document.createElement("button");
customStickerButton.innerText = "Create Custom Sticker";
app.appendChild(customStickerButton);

customStickerButton.addEventListener("click", () => {
    const customEmoji = prompt("Enter a custom sticker:", "🧽");
    if (customEmoji) {
        createStickerButton(customEmoji, (emoji) => {
            currentSticker = createSticker(0, 0, emoji);
            canvas.dispatchEvent(new Event("tool-moved"));
        });
    }
});
// Add an "export" button
const exportButton = document.createElement("button");
exportButton.innerText = "Export";
app.appendChild(exportButton);

exportButton.addEventListener("click", () => {
    // Create a new canvas of size 1024x1024
    const exportCanvas = document.createElement("canvas") as CanvasElement;
    exportCanvas.width = 1024;
    exportCanvas.height = 1024;
    const exportContext = exportCanvas.getContext("2d");

    if (exportContext) {
        // Scale the context to 4x the original size
        exportContext.scale(4, 4);

        // Fill the background
        exportContext.fillStyle = "#7EC6E5";
        exportContext.fillRect(0, 0, canvas.width, canvas.height);

        // Redraw all lines and stickers on the new canvas
        lines.forEach(line => line.display(exportContext));
        stickers.forEach(sticker => sticker.display(exportContext));

        // Trigger a download of the canvas content as a PNG file
        const anchor = document.createElement("a");
        anchor.href = exportCanvas.toDataURL("image/png");
        anchor.download = "sketchpad.png";
        anchor.click();
    }
});
