/**
 * 产检相关类型定义
 * 对应后端 VO/DTO 类
 */

/**
 * 产检项目
 */
export interface PrenatalCheckItemVO {
    /** 项目编码 */
    id: string;
    /** 孕周范围 */
    week: string;
    /** 产检名称 */
    title: string;
    /** 简短描述 */
    shortDesc: string;
    /** 详细说明 */
    details: string;
    /** 注意事项 */
    tips?: string;
    /** 是否完成 */
    done: boolean;
    /** 实际检查日期 */
    checkDate?: string;
    /** 是否为当前孕周 */
    isActive?: boolean;
    /** 前端UI状态: 是否展开详情 */
    expanded?: boolean;
}

/**
 * 产检分组
 */
export interface PrenatalCheckGroupVO {
    /** 阶段 */
    stage: string;
    /** 阶段标题 */
    title: string;
    /** 阶段图标 */
    icon: string;
    /** 产检项目列表 */
    items: PrenatalCheckItemVO[];
}

/**
 * 产检时光轴
 */
export interface PrenatalCheckTimelineVO {
    /** 当前孕周 */
    currentWeek: number;
    /** 产检分组列表 */
    groups: PrenatalCheckGroupVO[];
}

/**
 * 下次产检信息
 */
export interface NextPrenatalCheckVO {
    /** 项目编码 */
    id: string;
    /** 孕周范围 */
    week: string;
    /** 产检名称 */
    title: string;
    /** 是否完成 */
    done: boolean;
    /** 距离建议检查时间还有多少天 */
    daysUntil?: number;
}

/**
 * 产检完成状态切换请求
 */
export interface PrenatalCheckToggleRequest {
    /** 产检项目编码 */
    templateCode: string;
    /** 是否完成 */
    done: boolean;
    /** 实际检查日期 (格式: yyyy-MM-dd) */
    checkDate?: string;
    /** 备注 */
    note?: string;
}
