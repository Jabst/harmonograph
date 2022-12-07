function toRadians(degrees) {
	return degrees / 180.0 * Math.PI;
}

const newlineSeprator = navigator.platform == "Win32" ? '\r\n' : '\n';

class CanvasRenderer{
    constructor(canvas, drawCircle){
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.drawCircle = drawCircle;

        this.r = 300;
        this.w = 1;
        this.clear();
    }

    clear() {
        var context = this.context;
        var width = this.canvas.width;
        var height = this.canvas.height;
    
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, width, height);
        context.strokeStyle = '#0500FF';
        context.lineWidth = this.w;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        
        if (this.r) {
            var scale = Math.min(width * 0.98 / 2.0 / this.r, height * 0.98 / 2.0 / this.r);
            context.setTransform(scale, 0, 0, scale, width / 2.0, height / 2.0);
            
            if (this.drawCircle) {
                context.save();
                context.beginPath();
                context.arc(0, 0, this.r, 0, 2.0 * Math.PI, false);
                
                context.lineWidth = 2;
                context.stroke();
                context.lineWidth = this.w;
                context.restore();
            }
        }
    }

    draw(xs, ys){
        var context = this.context;
        context.beginPath();
        context.moveTo(xs[0], ys[0]);
        var n = xs.length;
        for (var i = 1; i < n; i++) {
            context.lineTo(xs[i], ys[i]);
        }
        context.stroke();
    }

    save() {
        this.canvas.toBlob(function(blob) {
            saveAs(blob, 'harmonograph.png');
        }, 'image/png');
    }
}

class Harmonograph {
    constructor(d,c,p,q,A,B,u,v,R,S,f,g,h,s) {
        this.distanceBetweenPendulums = d || 900;
        this.centrePosition = c || 700;
        this.penArmLength = p || 900;
        this.penArmPosition = q || 700;
        this.leftPendulumAmplitude = toRadians(A || 10);
        this.rightPendulumAmplitude = toRadians(B || 10);
        this.leftPendulumPhase = u || 0;
        this.rightPendulumPhase = v || 0;
        this.leftPendulumDamping = R || 0.001;
        this.rightPendulumDamping = S || 0.001;
        this.leftPendulumFrequency = f || 0.3;
        this.rightPendulumFrequency = g || 0.302;
        this.paperRotationFrequency = h || 0.0008;
        this.speedUpFactor = s || 10;

        this.t = 0.0;
        this.dt = 0.1;

        this.intervalId;

        this.xs = [];
        this.ys = [];

        this.self = this;

        this.dx = new Date();

        this.intervalId = null;
    }

    setCanvas(id) {
        this.output = new CanvasRenderer(document.getElementById(id), true);
    }

    reset() {
        this.xs = [];
        this.ys = [];

        this.t = 0.0;
        this.dt = 0.1;

        this.dx = new Date();
    }

    step() {
        var newXs = [this.xs[this.xs.length - 1]];
        var newYs = [this.ys[this.ys.length - 1]];
        for (var i = 0; i < this.speedUpFactor; ++i) {
            this.t += this.dt;
            let coordinates = this.getCoordinates();
            this.xs.push(coordinates.x);
            this.ys.push(coordinates.y);
            newXs.push(coordinates.x);
            newYs.push(coordinates.y);
        }

        this.output.draw(newXs, newYs);

        if (this.t >= 300) {
            this.stop();
        }
    }

    getCoordinates() {

        let alpha = this.leftPendulumAmplitude * Math.sin(2.0 * Math.PI * (this.leftPendulumFrequency * this.t + this.leftPendulumPhase)) * Math.exp(-this.leftPendulumDamping * this.t);
        let beta  = this.rightPendulumAmplitude * Math.sin(2.0 * Math.PI * (this.rightPendulumFrequency * this.t + this.rightPendulumPhase)) * Math.exp(-this.rightPendulumDamping * this.t);
        let gamma = 2.0 * Math.PI * this.paperRotationFrequency * this.t;
        
        var xa = this.penArmLength * Math.cos(alpha) + this.penArmPosition * Math.sin(alpha) - this.distanceBetweenPendulums;
        var ya = this.penArmPosition * Math.cos(alpha) - this.penArmLength * Math.sin(alpha);
        var xb = xa * Math.cos(beta) - ya * Math.sin(beta);
        var yb = ya * Math.cos(beta) + xa * Math.sin(beta) - this.centrePosition;
        let x = xb * Math.cos(gamma) - yb * Math.sin(gamma);
        let y = yb * Math.cos(gamma) + xb * Math.sin(gamma);
    
        return {
            x: x,
            y: y
        }
    }

    start() {
        this.intervalId = window.setInterval(() => {this.step()}, 1000 * this.dt);
    }

    stop() {
        if (!this.intervalId) {
            return;
        }
        window.clearInterval(this.intervalId);
		this.intervalId = null;
    }

    drawControl() {
        if (this.intervalId == null) {
            this.intervalId = window.setInterval(() => {this.step()}, 1000 * this.dt);
        } else {
            window.clearInterval(this.intervalId);
		    this.intervalId = null;
        }
    }
}


class Weather {
	date;
	cloudCover;
	sunshine;
	globalRadiation;
	maxTemperature;
	meanTemperature;
	minTemperature;
	precipitation;
	pressure;

	constructor(date, cloudCover, sunshine, globalRadiation, maxTemperature, meanTemperature, minTemperature, precipitation, pressure){
		this.date = date;
		this.cloudCover = cloudCover;
		this.sunshine = sunshine;
		this.globalRadiation = globalRadiation;
		this.maxTemperature = maxTemperature;
		this.meanTemperature = meanTemperature;
		this.minTemperature = minTemperature;
		this.precipitation = precipitation;
		this.pressure = pressure;

        let helper = this.getParameters(this.sunshine);
        this.temperatureHarmonograph = new Harmonograph(null, null, null, null, 
                                                        this.maxTemperature, this.minTemperature, null, null, 
                                                        null, null, null, null, parseFloat("0.00" + (parseFloat(this.meanTemperature)+ 10)), null);

        this.sunHarmonograph = new Harmonograph(null, helper.paperposition, null, null, helper.amplitude, helper.amplitude,
                                                parseFloat("0." + this.globalRadiation), null, parseFloat("0.00" + this.cloudCover),
                                                parseFloat("0.00" + this.sunshine), null, null, null, null);

        this.rainHarmonograph = new Harmonograph(null, null, null, null, null, parseFloat(this.sunshine), parseFloat("0." + this.cloudCover) * 0.1, parseFloat("0.0" + this.pressure),
                                                null, null, null, null, parseFloat("0.0" + parseFloat(this.precipitation) * 10), null);


        this.temperatureHarmonograph.setCanvas('temperatureHarmonograph');
        this.sunHarmonograph.setCanvas('sunHarmonograph');
        this.rainHarmonograph.setCanvas('rainHarmonograph');
	}

    getParameters(sunshine) {
        
        let sunshineFactored = Math.floor(parseFloat(sunshine)) * 25;

        let offset = Math.abs( (8*25) - sunshineFactored);

        let percentage = offset / (16 * 25);

        return {
            amplitude: 10 - (percentage * 10),
            paperposition: 480 + sunshineFactored,
        }
    }

    startDrawing() {
        this.temperatureHarmonograph.start();
        this.sunHarmonograph.start();
        this.rainHarmonograph.start();
    }

    stopDrawing() {
        this.temperatureHarmonograph.stop();
        this.sunHarmonograph.stop();
        this.rainHarmonograph.stop();
    }

    clearDrawing() {
        this.temperatureHarmonograph.output.clear();
        this.sunHarmonograph.output.clear();
        this.rainHarmonograph.output.clear();

        this.resetDrawing();
    }

    resetDrawing() {
        this.temperatureHarmonograph.reset();
        this.sunHarmonograph.reset();
        this.rainHarmonograph.reset();
    }

    isDrawing() {
        return this.temperatureHarmonograph.intervalId &&
                this.sunHarmonograph.intervalId &&
                this.rainHarmonograph.intervalId;
    }

    getDate() {
        return this.date;
    }
}

const weathers = [];

let currentDay = '';

function parseText(text) {
	let lines = text.split(newlineSeprator);
	let str = '';
	for(let i = 1 ; i < lines.length ; i++) {
		let elements = lines[i].split(',');
		let weather = new Weather(elements[0], elements[1], elements[2], elements[3], elements[4],
			elements[5], elements[6], elements[7], elements[8]);
		
		str += `<option value="${elements[0]}"></option>`
		weathers.push(weather);
	}

	$("#days").html(str);
}

$('#daystyped').on('change', function() {

    stopDrawing();
    clearDrawing();

    for (let i = 0; i < weathers.length; i++) {
        if (weathers[i].getDate() == this.value) {
            weathers[i].startDrawing();
            break;
        }
    }

    currentDay = this.value;
});

$('#drawctrl').on('click', function() {
    if (currentDay != '') {
        for (let i = 0; i < weathers.length; i++) {
            if (weathers[i].getDate() === currentDay) {
                if (weathers[i].isDrawing()){
                    weathers[i].stopDrawing();
                } else {
                    weathers[i].startDrawing();
                }
                
                break;
            }
        }
    }
});

$('#clear').on('click', function() {
    for (let i = 0; i < weathers.length; i++) {
        if (weathers[i].getDate() == currentDay) {
            weathers[i].clearDrawing();
            break;
        }
    }
});

function stopDrawing() {
    for (let i = 0 ; i < weathers.length; i++) {
        weathers[i].stopDrawing();
    }
}

function clearDrawing() {
    for (let i = 0 ; i < weathers.length; i++) {
        weathers[i].clearDrawing();
    }
}

fetch('data.csv')
  .then(response => response.text())
  .then(text => parseText(text));