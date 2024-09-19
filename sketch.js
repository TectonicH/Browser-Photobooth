
// Setting up references to DOM elements 
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const filtersSelect = document.getElementById('filters');
const borderColorPicker = document.getElementById('borderColor');
const fillColorPicker = document.getElementById('fillColor');
const borderThicknessSelect = document.getElementById('borderThickness');

// Variables that hold the current settings for the border colour, fill colour, and border thickness
let borderColor = borderColorPicker.value;
let fillColor = fillColorPicker.value;
let borderThickness = borderThicknessSelect.value;

// Flag for checking whether the cursor is within the canvas to decide whether to show the stamp preview
let isCursorInCanvas = false;

// The current tool being used, whether the user is currently drawing, and the starting position for drawing
let currentTool = 'none';
let drawing = false;
let startX, startY;

// Arrays to store the shapes and stamps that the user has added to the canvas
let shapes = [];
let stamps = [];

// Variables to manage the currently selected stamp and its position
let currentStamp = null;
let currentStampX = 0;
let currentStampY = 0;

// Load stamp images and store them in an object for quick access
let stampImages = {
    axolotl: new Image(),
    corgi: new Image(),
    hearts: new Image(),
    bubbleT: new Image()
};

// Set the source for the stamp images
stampImages.axolotl.src = 'assets/axolotl.png';
stampImages.corgi.src = 'assets/corgi.png';
stampImages.hearts.src = 'assets/hearts.png';
stampImages.bubbleT.src = 'assets/bubbleT.png';


// Attempt to initialize the video stream from the webcam
navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(err => {
        console.error("Error accessing webcam:", err);
    });

/*
* FUNCTION: selectStamp
* DESCRIPTION: Selects a stamp and sets it as the current tool.
* PARAMETERS: stampName: The name of the stamp to select.
*/    
function selectStamp(stampName) {
    currentTool = 'stamp';
    currentStamp = stampImages[stampName];
}

/*
* FUNCTION: selectTool
* DESCRIPTION: Selects a drawing tool and sets it as the current tool.
* PARAMETERS: toolName: The name of the tool to select.
*/
function selectTool(toolName) {
    currentTool = toolName;
    currentStamp = null;
}

/*
* FUNCTION: applyFilter
* DESCRIPTION: Applies a selected filter to the video feed displayed on the canvas.
* PARAMETERS: filter: The filter to apply.
*/
function applyFilter(filter) {
    let imageData;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (filter === 'posterize') {
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        posterizeToHopeColours(imageData);
        ctx.putImageData(imageData, 0, 0);
    } else {
        switch (filter) {
            case 'invert':
                ctx.filter = 'invert(100%)';
                break;
            case 'gray':
                ctx.filter = 'grayscale(100%)';
                break;
            case 'blur':
                ctx.filter = 'blur(5px)';
                break;
            default:
                ctx.filter = 'none';
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
}

document.getElementById('resetButton').addEventListener('click', resetCanvas);

/*
* FUNCTION: resetCanvas
* DESCRIPTION: Clears all drawings, resets selected stamps and filters
* PARAMETERS: None
*/
function resetCanvas() {
    // Clear shapes and stamps
    shapes = [];
    stamps = [];

    // Reset filter to 'none'
    filtersSelect.value = 'none';
    ctx.filter = 'none';

    // Redraw the canvas
    draw();
}

/*
* FUNCTION: posterizeToHopeColours
* DESCRIPTION: Adjusts image data to apply a Posterize effect 
* PARAMETERS: imageData: The image data from the canvas to apply the effect to.
* RETURNS: ImageData: The modified image data after applying the effect.
*/
function posterizeToHopeColours(imageData) {
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        let brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];

        if (brightness < 64) {
            // Dark Blue
            data[i] = 0; // Red
            data[i + 1] = 51; // Green
            data[i + 2] = 76; // Blue
        } else if (brightness < 128) {
            // Red
            data[i] = 217;
            data[i + 1] = 26;
            data[i + 2] = 33;
        } else if (brightness < 192) {
            // Light Blue
            data[i] = 112;
            data[i + 1] = 150;
            data[i + 2] = 158;
        } else {
            // Beige
            data[i] = 252;
            data[i + 1] = 227;
            data[i + 2] = 166;
        }
    }

    return imageData;
}

/*
* FUNCTION: drawShapesAndStamps
* DESCRIPTION: Draws all the shapes and stamps onto the canvas.
*/
function drawShapesAndStamps() {
    shapes.forEach(shape => {
        ctx.beginPath();
        ctx.lineWidth = shape.borderThickness;
        ctx.strokeStyle = shape.borderColor;
        ctx.fillStyle = shape.fillColor;

        if (shape.type === 'rect') {
            ctx.rect(shape.x, shape.y, shape.width, shape.height);
            if (shape.borderThickness > 0) ctx.stroke();
            if (shape.fillColor !== '#FFFFFF') ctx.fill();
        } else if (shape.type === 'ellipse') {
            ctx.ellipse(shape.x + shape.width / 2, shape.y + shape.height / 2, Math.abs(shape.width / 2), Math.abs(shape.height / 2), 0, 0, 2 * Math.PI);
            if (shape.borderThickness > 0) ctx.stroke();
            if (shape.fillColor !== '#FFFFFF') ctx.fill();
        }
        ctx.closePath();
    });

    stamps.forEach(stamp => {
        ctx.drawImage(stamp.image, stamp.x, stamp.y, 150, 150);
    });
}

/*
* FUNCTION: drawLiveStamp
* DESCRIPTION: Draws the currently selected stamp at the cursor's position on the canvas.
*/
function drawLiveStamp() {
    if (isCursorInCanvas && currentTool === 'stamp' && currentStamp) {
        ctx.drawImage(currentStamp, currentStampX, currentStampY, 150, 150);
    }
}

/*
* FUNCTION: captureImage
* DESCRIPTION: Captures the current state of the canvas and saves it as a PNG image.
*/
function captureImage() {
    const imageDataUrl = canvas.toDataURL('image/png');
    
    const link = document.createElement('a');
    link.download = 'captured-image.png'; // Default name for the image
    link.href = imageDataUrl;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

canvas.addEventListener('mouseenter', () => {
    isCursorInCanvas = true;
});

canvas.addEventListener('mouseleave', () => {
    isCursorInCanvas = false;
    draw();
});


canvas.addEventListener('mousedown', (e) => {
    startX = e.offsetX;
    startY = e.offsetY;
    drawing = true;

    if (currentTool === 'stamp' && currentStamp) 
    {
        stamps.push({ image: currentStamp, x: startX - 75, y: startY - 75 });
    } 
    else if (currentTool === 'rect' || currentTool === 'ellipse') 
    {
        shapes.push({ type: currentTool, x: startX, y: startY, width: 0, height: 0, borderColor: borderColor, fillColor: fillColor, borderThickness: borderThickness });
    }
    else if (currentTool === 'rect' || currentTool === 'ellipse')
    {
        shapes.push({
            type: currentTool,
            x: startX,
            y: startY,
            width: 0,
            height: 0,
            borderColor: borderColor,
            fillColor: fillColor,
            borderThickness: parseInt(borderThickness) 
        });
    
    }
    
});

canvas.addEventListener('mousemove', (e) => {
    if (drawing) {
        if (currentTool === 'rect' || currentTool === 'ellipse') {
            shapes[shapes.length - 1].width = e.offsetX - startX;
            shapes[shapes.length - 1].height = e.offsetY - startY;
        }
    }

    if (currentTool === 'stamp' && currentStamp) {
        currentStampX = e.offsetX - 75;
        currentStampY = e.offsetY - 75;
    }
});

canvas.addEventListener('mouseup', () => {
    drawing = false;
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        captureImage();
    }
});

borderColorPicker.addEventListener('change', (e) => {
    borderColor = e.target.value;
});

fillColorPicker.addEventListener('change', (e) => {
    fillColor = e.target.value;
});

borderThicknessSelect.addEventListener('change', (e) => {
    borderThickness = e.target.value;
});

/*
* FUNCTION: draw
* DESCRIPTION: The main drawing loop for the canvas, which updates the content each animation frame.
*/
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (filtersSelect.value !== 'posterize') {
        applyFilter(filtersSelect.value);
    }

    drawShapesAndStamps();

    if (filtersSelect.value === 'posterize') {
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        posterizeToHopeColours(imageData);
        ctx.putImageData(imageData, 0, 0);
    }

    drawLiveStamp();
    requestAnimationFrame(draw);
}

draw();
