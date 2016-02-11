/* ------------------------------------------------------------------------------------

  Maskitor - MIT License - Hexagon <github.com/Hexagon>

  PGM Mask editor, initially intended for MotionEyeOs

  ------------------------------------------------------------------------------------

  License:

	MIT:

	Copyright (c) 2016 Hexagon <github.com/Hexagon>

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.

  ------------------------------------------------------------------------------------  */

(function () {

	"use strict";

	var root = this;



	//
	// ---- Helper functions ------------------------------------------------------------------
	//

	function raise (err) {	
		throw new Error("Maskitor: " + err);
	}



	//
	// ---- PGM Importer/Exporter -------------------------------------------------------------
	//

	function PGMFile () {

		var self = this;
		
		this.maxVal;
		this.width;
		this.height;
		this.data;

		return self;

	}

	// PGM -> Image
	PGMFile.prototype.fromBinaryData = function(binaryData) {
		
		// Validate
		var dataPos,
			foundMagic = false,
			foundWidth = false,
			foundHeight = false,
			foundMaxVal = false,
			headerData = "",
			header;
		
		for(var i = 0; i < binaryData.length && i < 1024; i++) {
			headerData += String.fromCharCode(binaryData[i]);
		}
		
		header = headerData.split("\n");

		for(var i = 0; i < header.length; i++) {

			// Find magic number
			if(header[i].length === 2 && header[i][0] == 'P') {
				if (header[i] == "P5") {
					foundMagic = true;
				} else {
					console.error("PGMFile: Unsupported file format, only binary PGM accepted (1).");
					return false;
				}
			} else if ( header[i].length >= 3 && header[i].indexOf(' ') !== -1 && header[i][0] !== "#" .indexOf('#') ) {
				var widthHeight = header[i].split(' ');
				if(widthHeight.length === 2) {
					this.width = widthHeight[0];
					this.height = widthHeight[1];
					foundWidth = true;
					foundHeight = true;
				}
			} else if ( header[i].length >= 3 && header[i].indexOf('\t') !== -1 && header[i][0] !== "#" .indexOf('#') ) {
				var widthHeight = header[i].split('\t');
				if(widthHeight.length === 2) {
					this.width = widthHeight[0];
					this.height = widthHeight[1];
					foundWidth = true;
					foundHeight = true;
				}
			} else if ( header[i].length >= 1 && header[i][0] !== "#" .indexOf('#') && !isNaN(header[i]) ) {
				if ( !foundWidth ) {
					this.width = header[i];
					foundWidth = true;
				} else if ( !foundHeight ) {
					this.height = header[i];
					foundHeight = true;
				} else if ( !foundMaxVal ) {
					this.maxVal = header[i];
					foundMaxVal = true;
				}
			}
		}

		if( foundMagic && foundWidth && foundHeight && foundMaxVal ) {
			var j=0,
				dataLength = binaryData.length-headerData.lastIndexOf("\n")+1;

			if(dataLength>0) {
				this.data = new Uint8Array(dataLength);
				var j = 0;
				for(var i = headerData.lastIndexOf("\n")+1; i < binaryData.length; i++) {
					this.data[j] = binaryData[i];
					j++;
				}
				return true;
			} else {
				return false;
			}
		} else {
			console.log(foundMagic,foundWidth,foundHeight, foundMaxVal,this);
			console.error("PGMFile: Unsupported file format, only binary PGM accepted (2).");
			return false;
		}

	}

	// Context -> pgm
	PGMFile.prototype.fromContext = function(context) {
		
		this.width = context.canvas.width;
		this.height = context.canvas.height;
		this.maxVal = 255;

		var raw = context.getImageData(0,0,context.canvas.width,context.canvas.height),
			pix = raw.data;

		this.data = [];

		// Loop over each pixel and invert the color.
		for (var x = 0; x < this.width; x++) {
			for (var y = 0; y < this.height; y++) {
				var offset = ((x*this.height*4)+(y*4));

				// Treat fully transparent pixels as white
				if(pix[offset+3]==0) {
					this.data.push(255);
				} else {
					this.data.push(Math.round((pix[offset] + pix[offset+1] + pix[offset+2])/3));		
				}

			}			
		}

		return this;
	}

	PGMFile.prototype.toBinaryData = function () {

		var sourceData = [],
			binaryData;

		sourceData = sourceData.concat( "P5\n".split("") );
		sourceData = sourceData.concat( this.width.toString().split("") );
		sourceData.push( " " );
		sourceData = sourceData.concat( this.height.toString().split("") );
		sourceData.push( "\n" );
		sourceData = sourceData.concat( this.maxVal.toString().split("") );
		sourceData.push( "\n" );
		sourceData = sourceData.concat(this.data);
		
		binaryData = new Uint8Array(sourceData.length);

		for(var i = 0; i < sourceData.length; i++) {
			if(typeof sourceData[i] === "string") {
				binaryData[i] = sourceData[i].charCodeAt(0);
			} else {
				binaryData[i] = sourceData[i];
			}
		}

		return binaryData;
	}

	PGMFile.prototype.toContext = function (context) {

		var raw = context.createImageData(this.width, this.height), offsetData = 0;

		// Loop over each pixel and invert the color.
		for (var x = 0; x < this.width; x++) {
			for (var y = 0; y < this.height; y++) {
				var offset = ((x*this.height*4)+(y*4));
				raw.data[offset] = this.data[offsetData];
				raw.data[offset+1] = this.data[offsetData];
				raw.data[offset+2] = this.data[offsetData];
				raw.data[offset+3] = 255-this.data[offsetData];
				offsetData++;
			}			
		}

		context.putImageData(raw,0,0);
		
		return this;

	}



	//
	// ---- Maskitor --------------------------------------------------------------------------
	//

	function Maskitor (destination, width, height, imageWidth, imageHeight) {

		// Local variables
		var self = this;

		this.mask = [];
		this.brush = 18;
		this.mouseButtonStatus = [0,0,0,0];
		this.imageWidth = 800;
		this.imageHeight = 600;


		// Make "new" optional
		if (!(this instanceof Maskitor)) {
			return new Maskitor();
		}

		// Check that the destination is an element
		if ( typeof (this.container = document.getElementById(destination)) === "null" ) {
			raise("Destination element '" + destination + "' does not exist.");
		}

		this.backdrop = void 0;

		// Image width and height
		this.imageWidth = imageWidth;
		this.imageHeight = imageHeight;
		
		// Create canvas
		this.createCanvas();
		this.resize();

		// Hook up events
		document.addEventListener('mousedown', function(e) { self.onMouseDown(e, self) }, false);
		document.addEventListener('mouseup', function(e) { self.onMouseUp(e, self) }, false);
		document.addEventListener('mousemove', function(e) { self.onMouseMove(e, self) }, false);
		this.canvas.addEventListener('contextmenu', self.disableEvent , false);

		return self;

	}

	Maskitor.prototype.setBackdrop = function (backdrop) {

		// Check backdropImageElement
		if (!(this.backdrop = backdrop) instanceof HTMLImageElement) {
			raise("Supplied backdrop is invalid, must be an actual html image element.");
		}

		this.imageWidth = this.backdrop.width;
		this.imageHeight = this.backdrop.height;

		this.resize();

		this.render();


	};

	Maskitor.prototype.setMask = function (data) {

		var pgm = new PGMFile();
		if(pgm.fromBinaryData(data)) {
			pgm.toContext(this.maskContext);
			this.render();
		}

	};

	Maskitor.prototype.onMouseDown = function (e, self) {

		var rect = self.canvas.getBoundingClientRect(),
			x = e.clientX - rect.left,
			y = e.clientY - rect.top;

		this.mouseButtonStatus[e.button] = 1;
		this.shiftPressed = e.shiftKey;
		this.mouseStartX = x;
		this.mouseStartY = y;

		this.onMouseMove(e, self);

	};

	Maskitor.prototype.onMouseUp = function (e, self) {

	    var rect = self.canvas.getBoundingClientRect(),
			x = e.clientX - rect.left,
			y = e.clientY - rect.top;

		this.mouseButtonStatus[e.button] = 0;
		this.maskContextStatus.clearRect( 0, 0, this.canvas.width, this.canvas.height );

		if ( (e.button == 0 ) && this.shiftPressed ) {
			this.transferBrushArea(this.mouseStartX, this.mouseStartY, x, y, 0);
		} else if ( (e.button == 2 ) && this.shiftPressed ) {
			this.transferBrushArea(this.mouseStartX, this.mouseStartY, x, y, 1);
		}

		this.render();
	};


	Maskitor.prototype.onMouseMove = function (e, self) {

	    var rect = self.canvas.getBoundingClientRect(),
			x = e.clientX - rect.left,
			y = e.clientY - rect.top;
			self = this;

		// Check status of shift now
		this.maskContextStatus.clearRect(0,0,this.canvas.width, this.canvas.height);
		if(e.shiftKey) {

		} else {
			//  Draw dashed ring inducating mouse position		
			this.maskContextStatus.save();

				this.maskContextStatus.strokeStyle = "rgba(0,0,0,1)";
				this.maskContextStatus.beginPath();
				this.maskContextStatus.arc(x,y,this.brush,0,2*Math.PI);
				this.maskContextStatus.setLineDash([5, 5]);
				this.maskContextStatus.stroke();

				this.maskContextStatus.strokeStyle = "rgba(255,255,255,1)";
				this.maskContextStatus.beginPath();
				this.maskContextStatus.arc(x,y,this.brush,+5,2*Math.PI+5);
				this.maskContextStatus.setLineDash([5, 5]);
				this.maskContextStatus.stroke();
			this.maskContextStatus.restore();
			this.render();
		}
			

		// Check status of shift key when mousebutton was pressed
		if (this.shiftPressed) {

			// Left click
			if (this.mouseButtonStatus[0] == 1) {
				this.applyBrushArea(this.mouseStartX, this.mouseStartY, x, y, 0);

			// Right click
			} else if (this.mouseButtonStatus[2] == 1) {
				this.applyBrushArea(this.mouseStartX, this.mouseStartY, x, y, 1);

			}

		} else {

			// Left click
			if (this.mouseButtonStatus[0] == 1) {
				this.applyBrush(x, y, 0);

			// Right click
			} else if (this.mouseButtonStatus[2] == 1) {
				this.applyBrush(x, y, 1);

			}

		}


		this.render();

	};

	Maskitor.prototype.disableEvent = function (e) {
		return e.preventDefault();
	};

	Maskitor.prototype.resize = function() {

	    // Fit canvas to container
	    this.canvas.style.width = '100%';

	    // Set canvas width and height parameters
		this.canvas.width = this.maskCanvasStatus.width = this.canvas.offsetWidth;
		this.canvas.height = this.maskCanvasStatus.height = this.canvas.offsetWidth * (this.imageHeight / this.imageWidth);

		this.maskCanvas.width = this.imageWidth;
		this.maskCanvas.height = this.imageHeight;
		this.maskContext.clearRect( 0 , 0 , this.maskCanvas.width , this.maskCanvas.height );

	};

	Maskitor.prototype.createCanvas = function(destination) {

		this.canvas = document.createElement('canvas');
		this.context = this.canvas.getContext('2d');

		this.maskCanvas = document.createElement('canvas');
		this.maskContext = this.maskCanvas.getContext('2d');

		this.maskCanvasStatus = document.createElement('canvas');
		this.maskContextStatus = this.maskCanvasStatus.getContext('2d');

		// Set cursor of main canvas
		this.canvas.style.cursor = 'crosshair';

		this.container.appendChild(this.canvas);

	};

	Maskitor.prototype.applyBrushArea = function(x1, y1, x2, y2, type) {

		if ( x2 < x1 ) {
			var tmp = x1;
			x1 = x2;
			x2 = tmp;
		}

		if ( y2 < y1 ) {
			var tmp = y1;
			y1 = y2;
			y2 = tmp;
		}

		this.maskContextStatus.clearRect( 0, 0, this.canvas.width, this.canvas.height );

		if(type === 0 ) {
			this.maskContextStatus.fillStyle = "rgba(0,0,0,0.6)";
		} else {
			this.maskContextStatus.fillStyle = "rgba(255,255,255,0.6)";
		}
		this.maskContextStatus.fillRect( x1, y1, x2-x1, y2-y1 );

	};

	Maskitor.prototype.transferBrushArea = function(x1, y1, x2, y2, type) {

		var ratioX = this.imageWidth/this.canvas.width,
			ratioY = this.imageHeight/this.canvas.height;

		if ( x2 < x1 ) {
			var tmp = x1;
			x1 = x2;
			x2 = tmp;
		}

		if ( y2 < y1 ) {
			var tmp = y1;
			y1 = y2;
			y2 = tmp;
		}

		if (type === 0 ) {
			this.maskContext.fillStyle = (type === 0 ) ? "rgba(0,0,0,1)" : "rgba(255,255,255,0.6)";
			this.maskContext.fillRect( x1 * ratioX , y1 * ratioY, (x2-x1) * ratioX, (y2-y1) * ratioY );	
		} else {
			this.maskContext.clearRect( x1 * ratioX , y1 * ratioY, (x2-x1) * ratioX, (y2-y1) * ratioY );	
		}


	};

	Maskitor.prototype.applyBrush = function(x, y, type) {

		var ratioX = this.imageWidth/this.canvas.width,
			ratioY = this.imageHeight/this.canvas.height,
			xPos = (x)*ratioX,
			yPos = (y)*ratioY;

	
		this.maskContext.save();
			if (type === 1) this.maskContext.globalCompositeOperation = "destination-out";
			this.maskContext.fillStyle = "rgba(0,0,0,1)";
			this.maskContext.beginPath();
			this.maskContext.arc(xPos,yPos,this.brush*ratioX,0,2*Math.PI);
			this.maskContext.fill();
		this.maskContext.restore();
		
	};


	Maskitor.prototype.render = function () {

		if ( typeof this.backdrop !== "undefined" ) {
			this.context.drawImage(this.backdrop, 0, 0, this.canvas.width, this.canvas.height);		
		}
		this.context.save();
			this.context.globalAlpha = 0.8;
			this.context.drawImage(this.maskCanvas, 0, 0, this.canvas.width, this.canvas.height);
		this.context.restore();

		this.context.drawImage(this.maskCanvasStatus, 0, 0, this.canvas.width, this.canvas.height);

	};

	Maskitor.PGMFile = PGMFile;


	//
	// ---- Expose  ----------------------------------------------------------------------
	//

	// -> Node (this makes no sense, but whatever)
	if (typeof module != "undefined" && typeof module.exports === "object") {
		module.exports = Maskitor;

	// -> AMD / Requirejs etc.
	} else if (typeof define === "function" && define.amd) {
		define([], function () {
			return Maskitor;
		});

	// -> Regular script tag
	} else {
		root.Maskitor = Maskitor;
	}

}).call(this);