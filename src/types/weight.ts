/**
 * BMI分类枚举
 */
export enum BmiCategory {
    UNDERWEIGHT = 'UNDERWEIGHT', // 偏瘦
    NORMAL = 'NORMAL',           // 标准
    OVERWEIGHT = 'OVERWEIGHT',   // 微胖
    OBESE = 'OBESE',             // 肥胖
    ALL = 'ALL'                  // 全部
}

/**
 * BMI分类描述映射
 */
export const BmiCategoryLabels: Record<BmiCategory, string> = {
    [BmiCategory.UNDERWEIGHT]: '偏瘦',
    [BmiCategory.NORMAL]: '标准',
    [BmiCategory.OVERWEIGHT]: '微胖',
    [BmiCategory.OBESE]: '肥胖',
    [BmiCategory.ALL]: '全部'
};

/**
 * BMI分类建议映射
 */
export const BmiCategoryAdvice: Record<BmiCategory, string> = {
    [BmiCategory.UNDERWEIGHT]: '建议适当增加营养，多吃优质蛋白和健康脂肪',
    [BmiCategory.NORMAL]: '保持均衡饮食，营养充足但不过量',
    [BmiCategory.OVERWEIGHT]: '注意控制总热量，选择低脂高蛋白食物',
    [BmiCategory.OBESE]: '需要控制体重增长，少油少糖，多吃蔬菜',
    [BmiCategory.ALL]: '适用所有体重分类'
};

/**
 * 体重记录
 */
export interface WeightRecord {
    id?: number;        // 记录ID (后端返回)
    date: string;       // 记录日期 (yyyy-MM-dd)
    weight: number;     // 体重(kg)
    week?: number;      // 孕周 (后端自动计算)
    note?: string;      // 备注
}

/**
 * 体重记录请求 (保存时使用)
 */
export interface WeightRecordRequest {
    date: string;       // 记录日期 (yyyy-MM-dd)
    weight: number;     // 体重(kg)
    note?: string;      // 备注 (可选,最多500字)
}

/**
 * 孕前体重信息
 */
export interface PrePregnancyWeight {
    weight: number;     // 孕前体重(kg)
    source: string;     // 数据来源 (如 user_profile)
}

/**
 * 体重统计信息
 */
export interface WeightStats {
    currentWeight: number;        // 当前体重(kg)
    prePregnancyWeight: number;   // 孕前体重(kg)
    weightGain: number;           // 体重增量(kg)
    currentWeek: number;          // 当前孕周
    bmi: number;                  // BMI指数
    bmiCategory: BmiCategory;     // BMI分类
}
