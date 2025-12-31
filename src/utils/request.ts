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
            success: (res) => {
                // Handle common backend response structure if needed (e.g. res.data.code)
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    // If backend returns { code: 200, data: ... } wrapper, you might want to return res.data.data
                    // For now returning full data object
                    resolve(res.data);
                } else {
                    reject(res);
                }
            },
            fail: (err) => {
                reject(err);
            }
        });
    });
};

export default request;
