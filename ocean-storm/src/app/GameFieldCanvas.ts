import { ASTWithSource } from "@angular/compiler";

// TODO: Define this somewhere else
let columnsOfField: number = 10;
let rowsOfField: number = 10;


let shipColors: string[] = [
	"rgba(196, 154, 124, 1)",
	"rgba(142, 196, 084, 1)",
	"rgba(068, 163, 139, 1)",
	"rgba(085, 097, 193, 1)",
	"rgba(163, 107, 162, 1)",
	"rgba(167, 170, 078, 1)",
	"rgba(097, 170, 078, 1)",
	"rgba(127, 078, 169, 1)",
	"rgba(010, 150, 210, 1)",
	"rgba(190, 053, 144, 1)"
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
// Supporting classes
////////////////////////

class CanvasElementPosition {
	x: number;
    y: number;
    
    constructor(x: number, y: number,) {
        this.x = x;
        this.y = y;
    }
}

class CanvasElementSize { 

    width: number;
    height: number;

    constructor(width: number,gHeight: number,) {
        this.width = width;
        this.height = gHeight;
    }
}

class CanvasElementFrame {

    origin: CanvasElementPosition;
    size: CanvasElementSize;

    constructor(x: number, y: number, width: number, height: number) {

        this.origin = new CanvasElementPosition(x,y);
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
	shipIndex: number

	constructor(frame: CanvasElementFrame) {
		super(frame);
		this.fieldState = CanvasFieldState.Empty;
		this.shipIndex = -1;
    }
}


////////////////////////
// Main Thingy
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
	//////////////////

	constructor(canvasId, mouseClickCallback) {
	
		this.mouseClickCallback = mouseClickCallback;

        this.canvas =  <HTMLCanvasElement>document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");
		
		if(this.canvas != null) {
			this.drawGameGrid();
			this.initCells();
		}

		this.hoveringEnabled = true;
		
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this), false);
		this.canvas.addEventListener('mouseout', this.handleMouseOut.bind(this), false);
		
		this.canvas.addEventListener('mouseup', this.handleMouseClick.bind(this), false);
	}
	
	
	drawGameGrid() {

		var canvasWidth = this.canvas.width;
		var canvasHeight = this.canvas.height;
		
        // + 1 for the Label
        this.cellSize = new CanvasElementSize(
            canvasWidth / (columnsOfField + 1), 
            canvasHeight / (columnsOfField + 1));
		this.gridLineWidth = 2;

        this.start = new CanvasElementPosition(
            this.cellSize.width - this.gridLineWidth / 2, 
            this.cellSize.height - this.gridLineWidth / 2);

		this.ctx.font = "24px Arial";
		this.ctx.textAlign = "center";
		this.ctx.textBaseline = "middle";
		
		this.ctx.strokeStyle = "#010101";
		this.ctx.lineWidth = this.gridLineWidth;
	
		for (var x:number = 0; x <= columnsOfField; x++) {
		
			if(x > 0) {
                this.ctx.fillText(
                    x.toString(), 
                    this.start.x + (x - 1) * this.cellSize.width + this.cellSize.width / 2, 
                    this.cellSize.height / 2);
			}
		
			this.ctx.moveTo(this.start.x + x * this.cellSize.width, this.start.y);
			this.ctx.lineTo(this.start.x + x * this.cellSize.width, canvasWidth);
			this.ctx.stroke();
		}
		
		for (var y = 0; y <= rowsOfField; y++) {
		
			if(y > 0) {
			
				var letter = String.fromCharCode(64 + y);
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
	
	initCells() {
	
		this.cells = [];
		
		for (var x = 0; x < columnsOfField; x++) {
		
            this.cells[x] = [];
			for (var y = 0; y < rowsOfField; y++) { 
		
                let frame = new CanvasElementFrame(
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
	// Updating the fields

	public drawShipAtIndex(x, y, shipIndex) {
		var cell = this.cells[x][y];
		cell.shipIndex = shipIndex;
		cell.fieldState = CanvasFieldState.OccupiedUndamaged;
		this.drawShip(cell);
	}


	private drawShip(cell) {

		this.clearCanvasElement(cell);
		if(cell.shipIndex == -1 || cell.shipIndex >= shipColors.length) {
			this.ctx.fillStyle = "rgba(230, 0, 0, 0.25)";
		} else {
			this.ctx.fillStyle = shipColors[cell.shipIndex];
		}
        this.ctx.fillRect(
			cell.frame.origin.x,
            cell.frame.origin.y,
            cell.frame.size.width, 
            cell.frame.size.height);
	}

	clearCelldAtIndex(x, y) {
		var cell = this.cells[x][y];

		this.clearCanvasElement(cell);
		cell.fieldState = CanvasFieldState.Empty;
	}

	clearCanvasElement(element) {
		this.ctx.clearRect(
			element.frame.origin.x, 
			element.frame.origin.y,
			element.frame.size.width, 
			element.frame.size.height);
	}


	drawShipHitAtIndex(x, y, sunk, shipIndex) {
		var cell = this.cells[x][y];
		cell.shipIndex = shipIndex
		if(cell.fieldState == CanvasFieldState.OccupiedUndamaged || cell.fieldState == CanvasFieldState.OccupiedHit) {
			cell.fieldState = CanvasFieldState.OccupiedHit;
			this.drawShip(cell);
			this.drawShipHit(cell);
		} else if(!sunk) {
			cell.fieldState = CanvasFieldState.ShotHit;
			this.drawShipHit(cell);
		} else if(sunk && (cell.fieldState == CanvasFieldState.Empty || cell.fieldState == CanvasFieldState.ShotHit)) {
			cell.fieldState = CanvasFieldState.ShotSunk;
			this.drawShip(cell);
		}
	}


	drawShipHit(cell) {

		if(cell.fieldState == CanvasFieldState.ShotHit) {
			this.clearCanvasElement(cell);
		}
		this.ctx.strokeStyle = "#FF0000";
        this.ctx.lineWidth = 2;

		this.ctx.beginPath();
		
		let dummy = cell.frame.size.width / 3;
		let x = cell.frame.origin.x + cell.frame.size.width / 2;
		let y = cell.frame.origin.y + cell.frame.size.height / 2;

		this.ctx.moveTo(x - dummy, y - dummy);
		this.ctx.lineTo(x + dummy, y + dummy);
		
		this.ctx.moveTo(x + dummy, y - dummy);
		this.ctx.lineTo(x - dummy, y + dummy);
		this.ctx.stroke();
	}

	drawShipMissAtIndex(x, y) {
		var cell = this.cells[x][y];
		cell.fieldState = CanvasFieldState.ShotMiss;

		this.drawShipMiss(cell);
	}

	drawShipMiss(cell) {
		this.ctx.strokeStyle= "#0000FF";
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

	public clearField() {
		for (var x = 0; x < columnsOfField; x++) {
			for (var y = 0; y < rowsOfField; y++) { 
				var cell = this.cells[x][y];

				if(cell.fieldState != CanvasFieldState.Empty) {
					this.clearCanvasElement(cell);
					cell.fieldState = CanvasFieldState.Empty;
					cell.shipIndex = -1;
				}
			}
		}
	}

	// Hovering

	setHoveringEnabled(hovering: Boolean) {
		this.hoveringEnabled = hovering;
	} 

	addHoveringToCell(cell) {

		this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        this.ctx.fillRect(
			cell.frame.origin.x,
            cell.frame.origin.y,
            cell.frame.size.width, 
            cell.frame.size.height);
	}

	resetHoverCell() {
		
			var ctx = this.canvas.getContext("2d");
			
			if(this.hoverCell != null) {
				this.clearCanvasElement(this.hoverCell);
				
				switch(this.hoverCell.fieldState) {
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
		
		showTurnIndicator() {
			
			this.ctx.strokeStyle= "#FF0000";
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
		
		hideTurnIndicator() {
			if(this.turnIndicatorFrame != null) {
				this.ctx.clearRect(
					this.turnIndicatorFrame.origin.x, 
					this.turnIndicatorFrame.origin.y,
					this.turnIndicatorFrame.size.width, 
					this.turnIndicatorFrame.size.height);
			}
		}

		
	////////////////////////
	// Mouse Events, that should probably handled somewhere else

	handleMouseClick(arg) {
		let indices = this.getIndicesForMouseEvent(arg);
		var cell = this.cells[indices.x][indices.y];
		
		if(indices.positionIsInField && cell.fieldState == CanvasFieldState.Empty) {
			this.mouseClickCallback(indices);
		}
		
	}

	handleMouseMove(arg) {
	
		let indices = this.getIndicesForMouseEvent(arg);
				
		if(indices.positionIsInField && this.hoveringEnabled) {
			var potentialCell = this.cells[indices.x][indices.y];

			if(this.hoverCell != potentialCell) {
				this.resetHoverCell();
				this.hoverCell = potentialCell;
				this.addHoveringToCell(this.hoverCell);
			} 
		
		} else {
			this.resetHoverCell();
			this.hoverCell = null;
		}
	}

	handleMouseOut() {
		var ctx = this.canvas.getContext("2d");
		
		this.resetHoverCell();
		this.hoverCell = null;
	}

	getIndicesForMouseEvent(arg) {

		var rect = this.canvas.getBoundingClientRect();
		let mouseX = arg.clientX - rect.left;
		let mouseY = arg.clientY - rect.top;

		var positionIsInField = false;

		var indexX = 0.0;
		var indexY = 0.0;

		if(mouseX >= this.start.x + this.gridLineWidth && mouseY >= this.start.y + this.gridLineWidth) {

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