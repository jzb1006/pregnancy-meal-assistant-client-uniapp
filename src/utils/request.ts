const BASE_URL = 'http://localhost:8080/api';

interface RequestOptions extends UniApp.RequestOptions {
    // Add any custom options here
}

export const request = (options: RequestOptions) => {
    return new Promise((resolve, reject) => {
        uni.request({
            ...options,
            url: options.url?.startsWith('http') ? options.url : `${BASE_URL}${options.url}`,
            header: {
                ...options.header,
                // 'Authorization': 'Bearer ' + token // If needed
            },
            success: (res: any) => {
                // Global Error Handling for User Not Found
                if (res.data && res.data.code === 500 && res.data.message && res.data.message.includes('用户不存在')) {
                    uni.showToast({ title: '账户不存在，请重新登录或注册', icon: 'none' });
                    setTimeout(() => {
                        uni.reLaunch({ url: '/pages/login/login' });
                    }, 1500);
                    reject(res.data);
                    return;
                }

                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(res.data);
                } else {
                    // Pass the full response to catch block so we can read res.data.message
                    reject(res);
                }
            },
            fail: (err) => {
                reject(err);
            }
        });
    });
};



export const streamRequest = (options: RequestOptions, onChunk: (text: string) => void) => {
    return new Promise((resolve, reject) => {
        // @ts-ignore
        const decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;

        const requestTask = uni.request({
            ...options,
            url: options.url?.startsWith('http') ? options.url : `${BASE_URL}${options.url}`,
            enableChunked: true,
            header: {
                ...options.header,
            },
            success: (res) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(res);
                } else {
                    reject(res);
                }
            },
            fail: (err) => {
                reject(err);
            }
        });

        requestTask.onChunkReceived((response) => {
            const arrayBuffer = response.data;
            if (decoder) {
                const text = decoder.decode(arrayBuffer, { stream: true });
                if (text) onChunk(text);
            } else {
                // Fallback for environments without TextDecoder (might break multi-byte chars)
                // @ts-ignore
                const text = String.fromCharCode.apply(null, new Uint8Array(arrayBuffer));
                // Decode utf-8 manually if needed, but for now this is best effort
                // A better fallback is needed for production if TextDecoder is missing
                // For MVP/Demo we assume TextDecoder exists (H5/Modern App)
                // Simple UTF8 decode logic is too complex to inline here without library
                // Let's assume most environments have TextDecoder or at least support basic chars
                // For Chinese, manual decoding is required if TextDecoder is missing.
                // But most likely it is present.
                if (text) onChunk(decodeURIComponent(escape(text))); // Try this hack for UTF8
            }
        });
    });
};

export default request;
