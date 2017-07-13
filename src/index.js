class LoadingView {
    constructor({videoUrl}){
        this.videoUrl = videoUrl;
        this.frames = [];
    }

    render(){
        this.el = document.createElement('div');

        this.el.innerHTML = `
            <div>\
            <video autoplay muted style="display:none;"><source src="${this.videoUrl}"/></video>\
            <canvas style="display:none;" id="blitCanvas"></canvas>\
            <canvas id="displayCanvas"></canvas> \
            <button id="stop">Stop</button> \
            </div>\
        `;

        return this.el;

    }

    onRender(){
        this.video = this.el.querySelector('video');
        this.blitCanvas = this.el.querySelector('#blitCanvas');
        this.blitCtx = this.blitCanvas.getContext("2d");
        this.displayCanvas = this.el.querySelector('#displayCanvas');
        this.displayCtx = this.displayCanvas.getContext("2d");
        this.button = this.el.querySelector('#stop');

        this.video.addEventListener("play", () => {
            this.videoWidth = this.video.videoWidth;
            this.videoHeight  = this.video.videoHeight;
            this.blitCanvas.style.height = `${this.videoHeight}px`;
            this.blitCanvas.style.width = `${this.videoWidth}px`;
            this.displayCanvas.style.height = `${this.videoHeight}px`;
            this.displayCanvas.style.width = `${this.videoWidth}px`;
            this.startCapturing();
        }, false);

        this.video.addEventListener("end", () => {
            this.stopCapturing();
        }, false);

        this.button.addEventListener('click', (e) => {
            this.stopCapturing();
        }, false);
    }

    startCapturing(){
        this._isCapturing = true;
        this.worker = new Worker('src/w.js');
        this.worker.onmessage = (e) => {
            this.frames[e.data.index].rectangles = e.data.rectangles;
        }
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
        console.log(this.frames);
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
        this.worker.postMessage({frame: frame.frame, index});
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
