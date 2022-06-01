import {Worker} from 'worker_threads';

const runService = workerData => new Promise((res, rej) => {
    const worker = new Worker('./sample.workerthread.js', {workerData});
    worker.on('message', res);
    worker.on('error', rej);
    worker.on('exit', (code) => {
        if (code !== 0)
            rej(new Error(`Worker stopped with exit code ${code}`));
    });
})

const run = async () => {
    const result = await runService(
        'hello world'
    );
    console.log(result);
}

run().catch(err => console.error(err));

