const {workerData, parentPort} = require( 'worker_threads');


console.log('start worker.js')
parentPort.postMessage({message: workerData})

parentPort.on('message', (message) => {
    console.log('on message', message)

parentPort.postMessage((message))
});