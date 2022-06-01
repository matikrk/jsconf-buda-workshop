import {Worker} from "worker_threads";

import {AsyncResource} from "async_hooks";

import {EventEmitter} from "events";

import path from "path";

const taskInfo = Symbol('taskInfo');
const workerFreedEvent = Symbol('workerFreedEvent');

class WorkerPoolTask extends AsyncResource {
    private callback: any;

    constructor(callback) {
        super('WorkerPoolTask');
        this.callback = callback;
    }

    done(err, res) {
        this.runInAsyncScope(this.callback, null, err, res);
        this.emitDestroy();
    }
}

export class WorkerPool extends EventEmitter {
    workers: Worker[] = [];
    freeWorkers: Worker[] = []
    private numThreads = 0;
    private workerFile: string;

    constructor(numThreads, workerFile) {

        super();
        this.numThreads = numThreads;
        this.workerFile = workerFile;
        this.fillWorkersPool();
    }

    fillWorkersPool() {
        for (let i = 0; i < this.numThreads; i++) {
            this.addWorker();
        }
    }


    addWorker() {
        const worker = new Worker(path.resolve(this.workerFile));
        worker.on('message', (result) => {
            console.log('worker message: 1')

            if (!worker[taskInfo]) {
                console.log('worker message: 1a');
                return
            }

            worker[taskInfo].done(null, result);
            worker[taskInfo] = null;
            console.log('worker message: 2')

            this.freeWorkers.push(worker);
            this.emit(workerFreedEvent);
        });
        worker.on('error', (err) => {
            if (worker[taskInfo]) {
                worker[taskInfo].done(err, null);
            } else {
                this.emit('error', err);
            }
            this.workers.splice((this.workers.indexOf(worker)), 1);
            this.addWorker()
        });
        // worker.on('exit', this.onExit.bind(this));
        this.workers.push(worker);
        this.freeWorkers.push(worker);

    }


    runTask(task, callback) {
        console.log('runTask : 1')
        if (this.freeWorkers.length === 0) {
            console.log('no free workers')
            this.once(workerFreedEvent, () => this.runTask(task, callback));
            return;
        }
        console.log('runTask : 2')

        const worker = this.freeWorkers.pop();
        if (!worker) {
            return
        }
        console.log('runTask : 3')

        worker[taskInfo] = new WorkerPoolTask(callback);
        worker.postMessage(task);
    }

    close() {
        this.workers.forEach(worker => worker.terminate());
    }

}