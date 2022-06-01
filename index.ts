
import {WorkerPool} from "./worker_pool";


import path from "path";
import os from "os";
import koa from 'koa'


const pool = new WorkerPool(os.cpus().length, path.resolve(__dirname, "./worker.js"));



console.log('os.cpus().length', os.cpus().length)
const app = new koa()


app.use(async (ctx, next) => {
console.log('ctx.request.url', ctx.request.url)
if(ctx.request.url === '/favicon.ico'){
    return
}
    const {value} = ctx.query
    console.log('value', value, ctx.query)
    const result = await new Promise((res, rej) => {
        pool.runTask({value}, (err, result) => {
            console.log('inside pool task', err, result)
            if (err) {
                return rej(err)
            }
            return res(result)
        })
    })
    console.log('xxx')
    ctx.body = result
    ctx.status = 201

});

app.listen('8080' )