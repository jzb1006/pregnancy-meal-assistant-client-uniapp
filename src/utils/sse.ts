
export class SSEClient {
    private url: string;
    private eventSource: EventSource | null = null;
    private requestTask: UniApp.RequestTask | null = null;
    private listeners: Record<string, Function[]> = {};

    constructor(url: string) {
        this.url = url;
    }

    // 添加事件监听
    addEventListener(event: string, callback: Function) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    // 触发事件
    private dispatchEvent(event: string, data: any) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb({ data }));
        }
        // Also support 'message' for generic messages if needed, currently mimicking EventSource structure
        if (event === 'message' && this.listeners['message']) {
            // this.listeners['message'].forEach(cb => cb({ data }));
        }
    }

    // 连接
    connect() {
        // #ifdef H5
        this.connectH5();
        // #endif

        // #ifndef H5
        this.connectMP();
        // #endif
    }

    // 关闭
    close() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        if (this.requestTask) {
            this.requestTask.abort();
            this.requestTask = null;
        }
    }

    // H5 实现
    private connectH5() {
        this.eventSource = new EventSource(this.url);

        this.eventSource.onopen = () => {
            // console.log('SSE H5 Open');
        };

        // 代理所有标准事件
        this.eventSource.addEventListener('start', (e: any) => this.dispatchEvent('start', e.data));
        this.eventSource.addEventListener('chunk', (e: any) => this.dispatchEvent('chunk', e.data));
        this.eventSource.addEventListener('complete', (e: any) => this.dispatchEvent('complete', e.data));
        this.eventSource.addEventListener('error', (e: any) => {
            this.dispatchEvent('error', e);
            this.close();
        });

        this.eventSource.onerror = (e) => {
            this.dispatchEvent('error', e);
            this.close();
        }
    }

    // 小程序实现 (uni.request outline)
    private connectMP() {
        this.requestTask = uni.request({
            url: this.url,
            method: 'GET',
            enableChunked: true, // 关键：开启分块接收
            responseType: 'text', // 尝试 text，如果乱码则用 arraybuffer 自己解
            success: (res) => {
                // 请求完成
            },
            fail: (err) => {
                this.dispatchEvent('error', err);
            }
        });

        // @ts-ignore
        (this.requestTask as any).onHeadersReceived((res: any) => {
            // console.log('Headers Received', res);
        });

        // @ts-ignore
        (this.requestTask as any).onChunkReceived((res: any) => {
            // res.data is ArrayBuffer
            const text = this.arrayBufferToString(res.data);
            this.parseSSEData(text);
        });
    }

    private buffer: string = '';

    // 简单的 SSE 解析器 (处理分块边界)
    private parseSSEData(chunk: string) {
        this.buffer += chunk;
        const lines = this.buffer.split('\n\n');

        // 保留最后一个可能不完整的块
        this.buffer = lines.pop() || '';

        lines.forEach(block => {
            if (!block.trim()) return;

            const lines = block.split('\n');
            let event = 'message';
            let data = '';

            lines.forEach(line => {
                if (line.startsWith('event:')) {
                    event = line.replace('event:', '').trim();
                } else if (line.startsWith('data:')) {
                    data += line.replace('data:', '').trim();
                    // 注意：实际 SSE data 可能包含换行，这里简化处理，假设 data 在一行或多行 data: 前缀
                }
            });

            if (event && data) {
                this.dispatchEvent(event, data);
            }
        });
    }

    // ArrayBuffer 转 String
    private arrayBufferToString(buffer: ArrayBuffer) {
        // #ifdef MP-WEIXIN
        // 微信小程序通常支持 TextDecoder，或者使用 hack
        // @ts-ignore
        if (typeof TextDecoder !== 'undefined') {
            // @ts-ignore
            return new TextDecoder('utf-8').decode(buffer, { stream: true });
        }
        // #endif

        // Fallback for simple ASCII/UTF8 (simplified)
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        // 处理 UTF8 中文可能会乱码，这里是一个简单 Polyfill 占位
        // 实际生产环境建议引入 fast-text-encoding 等库
        // 但为保持轻量，假设小程序环境现代支持 TextDecoder
        try {
            return decodeURIComponent(escape(binary));
        } catch (e) {
            return binary;
        }
    }
}
