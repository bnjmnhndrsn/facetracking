const Renderer = {
    showView(view){
        if (this._view) {
            this._view.remove();
        }

        this._view = view;
        const container = document.getElementById('container');
        container.innerHTML = view.render();
        view.onRender();
    }
};

class WorkerPool {
    constructor({count, onMessage}){
        this.workers = [];
        this.currentIdx = 0;
        this.pendingMessages = 0;
        this.completed = [];

        for (var i = 0; i < count; i++) {
            const worker = new self.Worker('w.js');
            worker.onmessage = this.bindOnMessage();
            this.workers.push(worker);
        }
    }

    bindOnMessage(){
        return (e) => {
            this.pendingMessages--;
            this.onMessage(e.data);
        }
    }

    sendMessage(msg){
        this.pendingMessages++;
        this.workers[this.currentIdx].postMessage(msg);
        this.currentIdx = (this.currentIdx + 1) % this.workers.length;
    }

    onMessage(data){
        this.completed[data.index] = data.rectangles;
        if (!this.pendingMessages) {
            this.onProcessingFinish();
        }
    }

    onProcessingFinish(){
        postMessage(this.completed);
    }
}

class Facetracker {
    constructor({onComplete}){
        this.worker = new Worker('src/parent.js');
        this.worker.onmessage = (e) => onComplete(e.data);
    }

    sendMessage(frame){
        this.worker.postMessage({frame: frame.frame});
    }

}

class LoadingController {
    constructor({videoUrl}){
        this.videoUrl = videoUrl;
        this.frames = [];
    }

    render(){
        this.view = new LoadingView({
            videoUrl: this.videoUrl,
            onStart: this.onStart.bind(this),
            onStop: this.onStop.bind(this),
            addFrame: this.onUpdate.bind(this)
        });

        Renderer.showView(this.view);
    }
}

class LoadingView {
    constructor({videoUrl, onStart, onStop, onUpdate}){
        this.videoUrl = videoUrl;
        this.onStart = onStart;
        this.onStop = onStop;
        this.onUpdate = onUpdate;
    }

    render(){
        return  `\
            <div>\
            <video autoplay muted style="display:none;"><source src="${this.videoUrl}"/></video>\
            <canvas style="display:none;" id="blitCanvas"></canvas>\
            <canvas id="displayCanvas"></canvas> \
            <button id="stop">Stop</button> \
            </div>\
        `;
    }

    onRender(){
        this.video = this.el.querySelector('video');
        this.blitCanvas = this.el.querySelector('#blitCanvas');
        this.blitCtx = this.blitCanvas.getContext("2d");
        this.displayCanvas = this.el.querySelector('#displayCanvas');
        this.displayCtx = this.displayCanvas.getContext("2d");
        this.button = this.el.querySelector('#stop');

        this.video.addEventListener('play', () => {
            this.videoWidth = this.video.videoWidth;
            this.videoHeight  = this.video.videoHeight;
            this.blitCanvas.style.height = `${this.videoHeight}px`;
            this.blitCanvas.style.width = `${this.videoWidth}px`;
            this.displayCanvas.style.height = `${this.videoHeight}px`;
            this.displayCanvas.style.width = `${this.videoWidth}px`;
            this.startCapturing();
        }, false);

        this.video.addEventListener('ended', () => {
            this.stopCapturing();
        }, false);

        this.button.addEventListener('click', (e) => {
            this.stopCapturing();
        }, false);
    }

    startCapturing(){
        this._isCapturing = true;
        this._startTime = new Date();
        this.faceTracker = new Facetracker({onFacetrackingComplete: this.onFacetrackingComplete.bind(this)});
        this.captureFrame();
    }

    captureFrame(){
        if (!this._isCapturing) {
            return;
        }

        this.blitCtx.drawImage(this.video, 0, 0, this.videoWidth, this.videoHeight);
        const frame = this.blitCtx.getImageData(0, 0, this.videoWidth, this.videoHeight);
        this.frames.push({frame});
        this.drawImage(frame);
        this.sendMessage();

        requestAnimationFrame(() => {
            this.captureFrame();
        });

    }

    stopCapturing(){
        this._isCapturing = false;
    }

    onFacetrackingComplete(data){
        data.forEach((datum, i) => {
            this.frames[i].reactangles = datum;
        });

        this.onProcessingFinish();
    }

    onProcessingFinish(){
        console.log(this.frames);
        console.log(new Date() - this._startTime);
    }

    drawImage(frame){
        this.displayCtx.clearRect(0, 0, this.displayCanvas.width, this.displayCanvas.height);
        this.displayCtx.putImageData(frame, 0, 0);
        // frame.data.forEach(function(rect) {
        //     var x = rect.x + rect.width / 2;
        //     var y = rect.y + rect.height / 2;
        //     self.ctx2.beginPath();
        //     self.ctx2.arc(x, y, 5, 0, 2 * Math.PI, false);
        //     self.ctx2.fillStyle = 'green';
        //     self.ctx2.fill();
        //     self.ctx2.lineWidth = 5;
        //     self.ctx2.strokeStyle = '#003300';
        //     self.ctx2.stroke();
        // });
    }

    sendMessage(){
        const frame = this.frames[this.frames.length - 1];
        const index = this.frames.length - 1;
        this.faceTracker.sendMessage({frame: frame.frame, index});
    }
};

const App = {
    init: function(){
        const container = document.getElementById('container');
        const view = new LoadingView({videoUrl: 'assets/video.ogv'});
        container.appendChild(view.render());
        view.onRender();
    }
}
