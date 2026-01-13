import { useUserStore } from '@/stores/user';

// const BASE_URL = 'http://www.hjkj.chat/api';
const BASE_URL = 'http://203.195.202.54/api';

interface RequestOptions extends UniApp.RequestOptions {
    // Add any custom options here
    skipAuth?: boolean; // 是否跳过认证（用于登录接口）
}

// 登录状态处理标志，防止重复触发登录
let isRefreshingToken = false;

export const request = (options: RequestOptions) => {
    return new Promise((resolve, reject) => {
        const userStore = useUserStore();

        // 构建请求头
        const headers: any = {
            ...options.header,
            'Content-Type': 'application/json'
        };

        // 自动添加 Authorization 请求头（登录接口除外）
        const isLoginApi = options.url?.includes('/v1/auth/wx/login');
        if (!isLoginApi && !options.skipAuth) {
            const token = userStore.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
                console.log('[Request] 携带 token:', token.substring(0, 20) + '...');
            } else {
                console.warn('[Request] 未找到 token，但仍继续请求:', options.url);
            }
        }

        uni.request({
            ...options,
            url: options.url?.startsWith('http') ? options.url : `${BASE_URL}${options.url}`,
            header: headers,
            success: (res: any) => {
                console.log('[Request] 响应:', options.url, 'status:', res.statusCode);

                // 处理认证失败 (401/403)
                if (res.statusCode === 401 || res.statusCode === 403) {
                    console.error('[Request] 认证失败 401/403');

                    // 只清除 token，不要触发 reLaunch
                    // 让用户手动重试或刷新页面
                    userStore.clearAuth();

                    reject({
                        code: res.statusCode,
                        message: '登录已过期，请下拉刷新页面'
                    });
                    return;
                }

                // Global Error Handling for User Not Found
                if (res.data && res.data.code === 500 && res.data.message && res.data.message.includes('用户不存在')) {
                    uni.showToast({ title: '用户档案不存在，请完善档案', icon: 'none' });
                    setTimeout(() => {
                        uni.navigateTo({ url: '/pages/profile/profile' });
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
                console.error('[Request] 请求失败:', err);
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
