let window = self;
importScripts('../node_modules/tracking/build/tracking.js', '../node_modules/tracking/build/data/face.js');

const tracker = new tracking.ObjectTracker('face');

onmessage = function(e) {
    trackData(e.data);
}

function trackData(data){
    tracker.once('track', function(event) {
        postMessage({
            index: data.index,
            rectanges: event.data
        });
    });

    tracker.track(data.frame.data, data.frame.width, data.frame.height);
}
