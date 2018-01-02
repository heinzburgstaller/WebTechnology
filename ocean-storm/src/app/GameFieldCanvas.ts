import { ASTWithSource } from '@angular/compiler';

const columnsOfField = 10;
const rowsOfField = 10;

const shipColors: string[] = [
	'rgba(196, 154, 124, 1)',
	'rgba(142, 196, 084, 1)',
	'rgba(068, 163, 139, 1)',
	'rgba(085, 097, 193, 1)',
	'rgba(163, 107, 162, 1)',
	'rgba(167, 170, 078, 1)',
	'rgba(097, 170, 078, 1)',
	'rgba(127, 078, 169, 1)',
	'rgba(010, 150, 210, 1)',
	'rgba(190, 053, 144, 1)'
];

enum CanvasFieldState {
    Empty = 1,
    ShotMiss,
    ShotHit,
	ShotSunk,
	OccupiedUndamaged, // = Ship placed there
	OccupiedHit,
}

////////////////////////
// Helper classes
////////////////////////

class CanvasElementPosition {
	x: number;
    y: number;

    constructor(x: number, y: number, ) {
        this.x = x;
        this.y = y;
    }
}

class CanvasElementSize {

    width: number;
    height: number;

    constructor(width: number, gHeight: number, ) {
        this.width = width;
        this.height = gHeight;
    }
}

class CanvasElementFrame {

    origin: CanvasElementPosition;
    size: CanvasElementSize;

    constructor(x: number, y: number, width: number, height: number) {

        this.origin = new CanvasElementPosition(x, y);
        this.size = new CanvasElementSize(width, height);
    }
}

class CanvasElement {

    frame: CanvasElementFrame;

    constructor(frame: CanvasElementFrame) {
        this.frame = frame;
    }
}


class CanvasGameTile extends CanvasElement {

	fieldState: CanvasFieldState;
	shipIndex: number;

	constructor(frame: CanvasElementFrame) {
		super(frame);
		this.fieldState = CanvasFieldState.Empty;
		this.shipIndex = -1;
    }
}


////////////////////////
// GameFieldDrawer
// uses HTML5 feature CANVAS to draw gamefield in browser
////////////////////////

export class GameFieldDrawer {

    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    cells: CanvasGameTile[][];

    cellSize: CanvasElementSize;
    gridLineWidth: number;

    start: CanvasElementPosition;

    hoverCell: CanvasGameTile;
	turnIndicatorFrame: CanvasElementFrame;

	hoveringEnabled: Boolean;

	mouseClickCallback: (click) => void;

    //////////////////////////////////////////////////////////////////////////////////////////
	// Init:
	// initializes gamefield with id and mouseClickback to get notified if a position is selected
	//////////////////

	constructor(canvasId, mouseClickCallback) {

		this.mouseClickCallback = mouseClickCallback;

        this.canvas =  <HTMLCanvasElement>document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

		if (this.canvas != null) {
			this.drawGameGrid();
			this.initCells();
		}

		this.hoveringEnabled = true;

        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this), false);
		this.canvas.addEventListener('mouseout', this.handleMouseOut.bind(this), false);

		this.canvas.addEventListener('mouseup', this.handleMouseClick.bind(this), false);
	}


	// draws the basic grid without any content
	drawGameGrid() {

		const canvasWidth = this.canvas.width;
		const canvasHeight = this.canvas.height;

        // + 1 for the Label
        this.cellSize = new CanvasElementSize(
            canvasWidth / (columnsOfField + 1),
            canvasHeight / (columnsOfField + 1));
		this.gridLineWidth = 2;

        this.start = new CanvasElementPosition(
            this.cellSize.width - this.gridLineWidth / 2,
            this.cellSize.height - this.gridLineWidth / 2);

		this.ctx.font = '24px Arial';
		this.ctx.textAlign = 'center';
		this.ctx.textBaseline = 'middle';

		this.ctx.strokeStyle = '#010101';
		this.ctx.lineWidth = this.gridLineWidth;

		for (let x = 0; x <= columnsOfField; x++) {

			if (x > 0) {
                this.ctx.fillText(
                    x.toString(),
                    this.start.x + (x - 1) * this.cellSize.width + this.cellSize.width / 2,
                    this.cellSize.height / 2);
			}

			this.ctx.moveTo(this.start.x + x * this.cellSize.width, this.start.y);
			this.ctx.lineTo(this.start.x + x * this.cellSize.width, canvasWidth);
			this.ctx.stroke();
		}

		for (let y = 0; y <= rowsOfField; y++) {

			if (y > 0) {

				const letter = String.fromCharCode(64 + y);
				this.ctx.fillText(
                    letter,
                    this.cellSize.width / 2,
                    this.start.y + (y - 1) * this.cellSize.height + this.cellSize.height / 2);
			}

			this.ctx.moveTo(this.start.x, this.start.y + y * this.cellSize.height);
			this.ctx.lineTo(canvasWidth, this.start.y + y * this.cellSize.height);
			this.ctx.stroke();
		}
	}
	// add each cell to the `cell` property of the class
	initCells() {

		this.cells = [];

		for (let x = 0; x < columnsOfField; x++) {

            this.cells[x] = [];
			for (let y = 0; y < rowsOfField; y++) {

                const frame = new CanvasElementFrame(
                    this.start.x + x * this.cellSize.width + this.gridLineWidth,
					this.start.y + y * this.cellSize.height + this.gridLineWidth,
					this.cellSize.width - this.gridLineWidth * 2,
                    this.cellSize.height - this.gridLineWidth * 2);

                this.cells[x][y] = new CanvasGameTile(frame);
			}
		}
	}

    //////////////////////////////////////////////////////////////////////////////////////////
	// Interaction:
	//////////////////

	//////////////////
	// Drawing

	// Draws the ship on cell at an x/y position. The shipIndex indicates which color the cell will have
	public drawShipAtIndex(x, y, shipIndex) {
		const cell = this.cells[x][y];
		cell.shipIndex = shipIndex;
		cell.fieldState = CanvasFieldState.OccupiedUndamaged;
		this.drawShip(cell);
	}

	// Draws the ship on a cell
	private drawShip(cell) {

		this.clearCanvasElement(cell);
		if (cell.shipIndex === -1 || cell.shipIndex >= shipColors.length) {
			this.ctx.fillStyle = 'rgba(230, 0, 0, 0.25)';
		} else {
			this.ctx.fillStyle = shipColors[cell.shipIndex];
		}
        this.ctx.fillRect(
			cell.frame.origin.x,
            cell.frame.origin.y,
            cell.frame.size.width,
            cell.frame.size.height);
	}

	// Clears a cell
	clearCelldAtIndex(x, y) {
		const cell = this.cells[x][y];

		this.clearCanvasElement(cell);
		cell.fieldState = CanvasFieldState.Empty;
	}

	// Clears a canvas element
	clearCanvasElement(element) {
		this.ctx.clearRect(
			element.frame.origin.x,
			element.frame.origin.y,
			element.frame.size.width,
			element.frame.size.height);
	}

	// Draws an X on the cell (given by coordinates) to indicate a ship hit. If the all elements of a ship are hit (aka sunk), draw the ship itself underneath the X
	drawShipHitAtIndex(x, y, sunk, shipIndex) {
		const cell = this.cells[x][y];
		cell.shipIndex = shipIndex;
		if (cell.fieldState === CanvasFieldState.OccupiedUndamaged || cell.fieldState === CanvasFieldState.OccupiedHit) {
			cell.fieldState = CanvasFieldState.OccupiedHit;
			this.drawShip(cell);
			this.drawShipHit(cell);
		} else if (!sunk) {
			cell.fieldState = CanvasFieldState.ShotHit;
			this.drawShipHit(cell);
		} else if (sunk && (cell.fieldState === CanvasFieldState.Empty || cell.fieldState === CanvasFieldState.ShotHit)) {
			cell.fieldState = CanvasFieldState.ShotSunk;
			this.drawShip(cell);
		}
	}

	// Draws an X on the cell to indicate a ship hit
	drawShipHit(cell) {

		if (cell.fieldState === CanvasFieldState.ShotHit) {
			this.clearCanvasElement(cell);
		}
		this.ctx.strokeStyle = '#FF0000';
        this.ctx.lineWidth = 2;

		this.ctx.beginPath();

		const dummy = cell.frame.size.width / 3;
		const x = cell.frame.origin.x + cell.frame.size.width / 2;
		const y = cell.frame.origin.y + cell.frame.size.height / 2;

		this.ctx.moveTo(x - dummy, y - dummy);
		this.ctx.lineTo(x + dummy, y + dummy);

		this.ctx.moveTo(x + dummy, y - dummy);
		this.ctx.lineTo(x - dummy, y + dummy);
		this.ctx.stroke();
	}

	// Draws an circle on the cell (given by coordinates) to indicate a ship miss
	drawShipMissAtIndex(x, y) {
		const cell = this.cells[x][y];
		cell.fieldState = CanvasFieldState.ShotMiss;

		this.drawShipMiss(cell);
	}

	// Draws an circle on the cell to indicate a ship miss
	drawShipMiss(cell) {
		this.ctx.strokeStyle = '#0000FF';
        this.ctx.lineWidth = 2;

		this.ctx.beginPath();
		this.ctx.arc(
			cell.frame.origin.x + cell.frame.size.width / 2,
			cell.frame.origin.y + cell.frame.size.height / 2,
			cell.frame.size.height / 3,
			0,
            2 * Math.PI);
        this.ctx.stroke();
	}

	// Clears a field and sets it state to empty
	public clearField() {
		for (let x = 0; x < columnsOfField; x++) {
			for (let y = 0; y < rowsOfField; y++) {
				const cell = this.cells[x][y];

				if (cell.fieldState !== CanvasFieldState.Empty) {
					this.clearCanvasElement(cell);
					cell.fieldState = CanvasFieldState.Empty;
					cell.shipIndex = -1;
				}
			}
		}
	}

	////////////////////////
	// Hovering

	// Enable/Disable hovering depening on the field and which player is playing
	setHoveringEnabled(hovering: Boolean) {
		this.hoveringEnabled = hovering;
	}

	// Displays the hovering of the given cell by overlaying it with a grey rectangle
	addHoveringToCell(cell) {
		this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(
			cell.frame.origin.x,
            cell.frame.origin.y,
            cell.frame.size.width,
            cell.frame.size.height);
	}

	// Clears the hovered cell and redraws its content without the hovering indicator
	resetHoverCell() {
			const ctx = this.canvas.getContext('2d');

			if (this.hoverCell != null) {
				this.clearCanvasElement(this.hoverCell);

				switch (this.hoverCell.fieldState) {
					case CanvasFieldState.Empty:
						break;
					case CanvasFieldState.ShotMiss:
						this.drawShipMiss(this.hoverCell);
						break;
					case CanvasFieldState.ShotHit:
						this.drawShipHit(this.hoverCell);
						break;
					case CanvasFieldState.ShotSunk:
						this.drawShip(this.hoverCell);
						break;
					case CanvasFieldState.OccupiedUndamaged:
						this.drawShip(this.hoverCell);
						break;
					case CanvasFieldState.OccupiedHit:
						this.drawShip(this.hoverCell);
						this.drawShipHit(this.hoverCell);
						break;
				}
			}
		}

	////////////////////////
	// Hovering indicator

	// Add a red circle to the top left corner of the game field to indicate which player is currently playing
	showTurnIndicator() {
		this.ctx.strokeStyle = '#FF0000';
		this.ctx.lineWidth = 2;

		this.ctx.beginPath();
		this.ctx.arc(
			this.cellSize.width / 2,
			this.cellSize.height / 2,
			this.cellSize.width / 4,
			0,
			2 * Math.PI);
		this.ctx.stroke();

		this.turnIndicatorFrame = new CanvasElementFrame(
			this.cellSize.width / 4 - this.ctx.lineWidth,
			this.cellSize.width / 4 - this.ctx.lineWidth,
			this.cellSize.width / 2 + this.ctx.lineWidth * 2,
			this.cellSize.width / 2 + this.ctx.lineWidth * 2);
	}

	// Clear the turn indicator
	hideTurnIndicator() {
		if (this.turnIndicatorFrame != null) {
			this.ctx.clearRect(
				this.turnIndicatorFrame.origin.x,
				this.turnIndicatorFrame.origin.y,
				this.turnIndicatorFrame.size.width,
				this.turnIndicatorFrame.size.height);
		}
	}


	////////////////////////
	// Mouse Events

	// Notify 
	handleMouseClick(arg) {
		const indices = this.getIndicesForMouseEvent(arg);
		const cell = this.cells[indices.x][indices.y];

		if (indices.positionIsInField && cell.fieldState === CanvasFieldState.Empty) {
			this.mouseClickCallback(indices);
		}

	}

	// Highlight the cell that is currently occupied by the mouse
	handleMouseMove(arg) {
		const indices = this.getIndicesForMouseEvent(arg);

		if (indices.positionIsInField && this.hoveringEnabled) {
			const potentialCell = this.cells[indices.x][indices.y];

			if (this.hoverCell !== potentialCell) {
				this.resetHoverCell();
				this.hoverCell = potentialCell;
				this.addHoveringToCell(this.hoverCell);
			}

		} else {
			this.resetHoverCell();
			this.hoverCell = null;
		}
	}

	// Reset the hovered cell if the mouse left the canvas
	handleMouseOut() {
		const ctx = this.canvas.getContext('2d');
		this.resetHoverCell();
		this.hoverCell = null;
	}

	// Get index of cell that is occupied by the mouse
	getIndicesForMouseEvent(arg) {

		const rect = this.canvas.getBoundingClientRect();
		const mouseX = arg.clientX - rect.left;
		const mouseY = arg.clientY - rect.top;

		let positionIsInField = false;

		let indexX = 0.0;
		let indexY = 0.0;

		if (mouseX >= this.start.x + this.gridLineWidth && mouseY >= this.start.y + this.gridLineWidth) {

			indexX = Math.floor((mouseX - this.start.x - this.gridLineWidth) / (this.cellSize.width) );
			indexY = Math.floor((mouseY - this.start.y - this.gridLineWidth) / (this.cellSize.height));

			positionIsInField = true;

		} else {
			positionIsInField = false;
		}

		return {
			positionIsInField: positionIsInField,
			x: indexX,
			y: indexY
		};
	}
}
