
import request, { streamRequest } from '@/utils/request';

// DTOs (Simplified for Frontend)
export interface FoodCheckResponse {
    food_name: string;
    safety_level: 'RED' | 'YELLOW' | 'GREEN';
    short_conclusion: string;
    risk_analysis: string;
    suggested_amount: string;
}

export interface MealVO {
    id: number;
    dishName: string;
    reason: string;
    tags: string[];
    safety: string;
    cookTime: string;
    ingredients: string[];
    steps: string[];
    husbandTask: string;
    nutrition: {
        calories: number;
        protein: number;
        fat: number;
        carbohydrate: number;
    };
}

// Helper to unwrap Result<T>
const unwrap = async (promise: Promise<any>) => {
    try {
        const res = await promise;
        // Standard success check
        if (res && res.code === 200) {
            return res.data;
        }
        // If code is not 200, but logic returned (unlikely with uni.request fail callback unless handled)
        // If it's a structural error from backend (like 500 but with Result body)
        if (res && res.message) {
            throw new Error(res.message);
        }
        return res.data || res;
    } catch (error: any) {
        // Handle uni.request fail or rejected promise
        // Check if error has data.message (backend error structure often in error.data if status != 2xx)
        if (error.data && error.data.message) {
            throw new Error(error.data.message);
        }
        if (error.errMsg) {
            throw new Error(error.errMsg);
        }
        throw error;
    }
};

// Food Safety API
export const checkFoodSafety = (openId: string, query: string, onChunk: (text: string) => void) => {
    return streamRequest({
        url: '/v1/food/check',
        method: 'GET',
        data: { openId, query }
    }, onChunk);
};

export const getNutritionTip = (openId: string) => {
    return unwrap(request({
        url: '/v1/food/tip',
        method: 'GET',
        data: { openId }
    }));
};

// Daily Meal API
export const getDailyRecommendation = (openId: string, onChunk: (text: string) => void) => {
    return streamRequest({
        url: '/v1/daily-meal/recommend',
        method: 'GET',
        data: { openId }
    }, onChunk);
};

export const swapRecommendation = (openId: string, onChunk: (text: string) => void) => {
    return streamRequest({
        url: `/v1/daily-meal/swap?openId=${openId}`,
        method: 'POST',
        data: {}
    }, onChunk);
};
