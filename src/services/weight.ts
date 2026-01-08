import { request } from '@/utils/request';
import type {
    WeightRecord,
    WeightRecordRequest,
    PrePregnancyWeight,
    WeightStats
} from '@/types/weight';

/**
 * 体重管理服务
 */
export const WeightService = {
    /**
     * 保存体重记录
     * @param record 体重记录请求
     * @returns 保存后的完整记录
     */
    saveWeightRecord: async (record: WeightRecordRequest): Promise<WeightRecord> => {
        try {
            const response = await request({
                url: '/v1/weight/record',
                method: 'POST',
                data: record
            }) as any;

            if (response.code === 200 && response.data) {
                return response.data;
            }

            throw new Error(response.message || '保存体重记录失败');
        } catch (error: any) {
            console.error('[WeightService] 保存体重记录失败:', error);
            throw error;
        }
    },

    /**
     * 获取体重历史记录
     * @param startDate 开始日期 (可选)
     * @param endDate 结束日期 (可选)
     * @param limit 返回条数限制 (可选)
     * @returns 体重记录列表
     */
    getWeightHistory: async (
        startDate?: string,
        endDate?: string,
        limit?: number
    ): Promise<WeightRecord[]> => {
        try {
            const params: any = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            if (limit) params.limit = limit;

            const response = await request({
                url: '/v1/weight/history',
                method: 'GET',
                data: params
            }) as any;

            if (response.code === 200 && response.data) {
                return response.data;
            }

            return [];
        } catch (error: any) {
            console.error('[WeightService] 获取体重历史失败:', error);
            // 返回空数组而不是抛出错误,避免页面崩溃
            return [];
        }
    },

    /**
     * 获取孕前体重
     * @returns 孕前体重(kg)
     */
    getPrePregnancyWeight: async (): Promise<number> => {
        try {
            const response = await request({
                url: '/v1/weight/pre-pregnancy',
                method: 'GET'
            }) as any;

            if (response.code === 200 && response.data) {
                const data: PrePregnancyWeight = response.data;
                return Number(data.weight) || 50.0;
            }

            return 50.0; // 默认值
        } catch (error: any) {
            console.error('[WeightService] 获取孕前体重失败:', error);
            return 50.0; // 返回默认值
        }
    },

    /**
     * 获取体重统计信息
     * @returns 体重统计数据
     */
    getWeightStats: async (): Promise<WeightStats | null> => {
        try {
            const response = await request({
                url: '/v1/weight/stats',
                method: 'GET'
            }) as any;

            if (response.code === 200 && response.data) {
                const data = response.data;
                // 转换BigDecimal为number
                return {
                    currentWeight: Number(data.currentWeight) || 0,
                    prePregnancyWeight: Number(data.prePregnancyWeight) || 0,
                    weightGain: Number(data.weightGain) || 0,
                    currentWeek: data.currentWeek || 0,
                    bmi: Number(data.bmi) || 0,
                    bmiCategory: data.bmiCategory || 'NORMAL'
                };
            }

            return null;
        } catch (error: any) {
            console.error('[WeightService] 获取体重统计失败:', error);
            return null;
        }
    },

    /**
     * 删除体重记录
     * @param id 记录ID
     */
    deleteWeightRecord: async (id: number): Promise<void> => {
        try {
            const response = await request({
                url: `/v1/weight/record/${id}`,
                method: 'DELETE'
            }) as any;

            if (response.code !== 200) {
                throw new Error(response.message || '删除失败');
            }
        } catch (error: any) {
            console.error('[WeightService] 删除体重记录失败:', error);
            throw error;
        }
    }
};

