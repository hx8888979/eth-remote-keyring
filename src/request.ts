const timeout_cb = (timeout:number) => new Promise((resolve)=>setTimeout(resolve, timeout));

export class Request {
    readonly url: string

    constructor(url: string) {
        this.url = url;
    }

    async request(body: Object, timeout: number = 10000): Promise<Object> {
        const requestBody = JSON.stringify(body);

        return await new Promise((resolve, reject) => {
            const ws = new WebSocket(this.url);
            ws.addEventListener('open', () => {
                ws.addEventListener('message', ({data}) => {
                    ws.close();
                    resolve(JSON.parse(data.toString()));
                });
                ws.send(requestBody);
                timeout_cb(timeout).then(()=>{
                    reject(new Error("timeout, no response received."));
                });
            });
            ws.addEventListener('error', (error) => {
                reject(error);
            });
        });
    }
}
