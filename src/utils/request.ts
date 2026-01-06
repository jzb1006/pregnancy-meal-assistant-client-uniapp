const BASE_URL = 'http://192.168.4.20:8080/api';

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
        let requestTask: any;

        // Use native wx.request if available to ensure we get ArrayBuffer and avoid UniApp wrapper interference
        // @ts-ignore
        if (typeof wx !== 'undefined' && wx.request) {
            // @ts-ignore
            requestTask = wx.request({
                ...options,
                url: options.url?.startsWith('http') ? options.url : `${BASE_URL}${options.url}`,
                enableChunked: true,
                responseType: 'text',
                header: {
                    ...options.header,
                },
                success: (res: any) => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(res);
                    } else {
                        reject(res);
                    }
                },
                fail: (err: any) => {
                    reject(err);
                }
            });
        } else {
            requestTask = uni.request({
                ...options,
                url: options.url?.startsWith('http') ? options.url : `${BASE_URL}${options.url}`,
                enableChunked: true,
                responseType: 'text',
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
        }

        requestTask.onChunkReceived((response: any) => {
            // With responseType: 'text', response.data is already a UTF-8 decoded string
            if (response.data && typeof response.data === 'string') {
                console.log('[StreamRequest] Received chunk, length:', response.data.length);
                console.log('[StreamRequest] Chunk preview:', response.data.substring(0, 100));
                onChunk(response.data);
            } else {
                console.warn('[StreamRequest] Unexpected data type:', typeof response.data);
            }
        });
    });
};

// 添加默认导出以确保文件被依赖分析识别
export default request;
