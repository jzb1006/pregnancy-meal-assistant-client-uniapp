/**
 * 日期工具函数
 * 提供跨平台兼容的日期处理功能
 */

/**
 * 安全解析日期字符串,兼容 iOS 平台
 * 
 * iOS 只支持以下格式:
 * - "yyyy/MM/dd"
 * - "yyyy/MM/dd HH:mm:ss"
 * - "yyyy-MM-dd"
 * - "yyyy-MM-ddTHH:mm:ss"
 * - "yyyy-MM-ddTHH:mm:ss+HH:mm"
 * 
 * 本函数会自动将 "yyyy-MM-dd HH:mm:ss" 转换为 "yyyy/MM/dd HH:mm:ss"
 * 
 * @param dateStr - 日期字符串或时间戳
 * @returns Date 对象,解析失败时返回当前时间
 */
export function safeParseDate(dateStr: string | number): Date {
    if (!dateStr) return new Date()
    if (typeof dateStr === 'number') return new Date(dateStr)

    // iOS 兼容性处理: 将 "YYYY-MM-DD HH:mm:ss" 转换为 "YYYY/MM/DD HH:mm:ss"
    const normalizedStr = dateStr.replace(/-/g, '/')
    const date = new Date(normalizedStr)

    // 验证日期有效性,无效时返回当前时间作为降级处理
    return isNaN(date.getTime()) ? new Date() : date
}
