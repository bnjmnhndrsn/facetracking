let App = {
    timerCallback: function() {
        if (this.video.paused || this.video.ended) {
            this.idx = 0;
            this.playbackCallback();
            return;
        }

        this.computeFrame();
        let self = this;
        setTimeout(function () {
            self.timerCallback();
        }, 100);
    },

    playbackCallback: function(){
        var frame = this.finished[this.idx];
        if (!frame) {
            return;
        }
        this.idx++;
        this.drawImage(frame);
        var self = this;
        setTimeout(function () {
            self.playbackCallback();
        }, 100);
    },

    init: function() {
        this.video = document.getElementById("video");
        let self = this;

        this.tracker = new tracking.ObjectTracker('face');
        this.canvas1 = document.getElementById("canvas1");
        this.ctx1 = this.canvas1.getContext("2d");

        this.canvas2 = document.getElementById("canvas2");
        this.ctx2 = this.canvas2.getContext("2d");

        this.video.addEventListener("play", function() {
            self.width = self.video.width;
            self.height = self.video.height;
            self.timerCallback();
        }, false);

        this.queue = [];
        this.finished = [];
    },

    tryTracking: function(){
        if (this.isTracking || !this.queue.length) {
            return;
        }

        this.isTracking = true;
        let self = this;
        this.tracker.once('track', function(event) {
            self.finished.push({
                data: event.data,
                image: frame
            });
            self.isTracking = false;
            self.tryTracking();
        });
        var frame = this.queue.shift();
        this.tracker.track(frame.data, this.width, this.height);
    },
    computeFrame: function() {
        this.ctx1.drawImage(this.video, 0, 0, this.width, this.height);
        let frame = this.ctx1.getImageData(0, 0, this.width, this.height);
        this.queue.push(frame);
        this.tryTracking();
    },
    drawImage: function(frame){
        var self = this;
        self.ctx2.clearRect(0, 0, self.canvas2.width, self.canvas2.height);
        self.ctx2.putImageData(frame.image, 0, 0);
        frame.data.forEach(function(rect) {
            var x = rect.x + rect.width / 2;
            var y = rect.y + rect.height / 2;
            self.ctx2.beginPath();
            self.ctx2.arc(x, y, 5, 0, 2 * Math.PI, false);
            self.ctx2.fillStyle = 'green';
            self.ctx2.fill();
            self.ctx2.lineWidth = 5;
            self.ctx2.strokeStyle = '#003300';
            self.ctx2.stroke();
        });
    }
};

App.init();
