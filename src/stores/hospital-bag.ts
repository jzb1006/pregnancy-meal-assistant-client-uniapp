import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface BagItem {
    id: string;
    name: string;
    desc?: string;
    isChecked: boolean;
    categoryId: string;
}

export interface BagCategory {
    id: string;
    name: string;
    icon?: string;
}

const STORAGE_KEY = 'pregnancy-meal-hospital-bag-data';

export const useHospitalBagStore = defineStore('hospitalBag', () => {
    // --- State ---
    const categories = ref<BagCategory[]>([
        { id: 'mom', name: '妈妈用品', icon: 'woman' },
        { id: 'baby', name: '宝宝用品', icon: 'baby' },
        { id: 'partner', name: '陪产人士', icon: 'man' },
        { id: 'docs', name: '重要证件', icon: 'folder' },
    ]);

    const items = ref<BagItem[]>([]);

    // --- Getters ---
    const getItemsByCategory = (categoryId: string) => {
        return items.value.filter(item => item.categoryId === categoryId);
    };

    const totalCount = computed(() => items.value.length);
    const checkedCount = computed(() => items.value.filter(item => item.isChecked).length);
    const progressPercentage = computed(() => {
        if (totalCount.value === 0) return 0;
        return Math.round((checkedCount.value / totalCount.value) * 100);
    });

    // 预设数据常量
    const DEFAULT_ITEMS: BagItem[] = [
        // 证件类
        { id: 'doc-1', name: '身份证', desc: '夫妻双方身份证原件及复印件', isChecked: false, categoryId: 'docs' },
        { id: 'doc-2', name: '医保卡/就诊卡', desc: '用于尤其是医保报销', isChecked: false, categoryId: 'docs' },
        { id: 'doc-3', name: '产检本/小卡', desc: '整个孕期的检查记录', isChecked: false, categoryId: 'docs' },
        { id: 'doc-4', name: '准生证', desc: '部分地区需要', isChecked: false, categoryId: 'docs' },
        { id: 'doc-5', name: '银行卡/现金', desc: '以备不时之需', isChecked: false, categoryId: 'docs' },

        // 妈妈用品
        { id: 'mom-1', name: '产褥垫', desc: '准备大号和中号，用于恶露', isChecked: false, categoryId: 'mom' },
        { id: 'mom-2', name: '卫生巾/安心裤', desc: '产后专用超长夜用', isChecked: false, categoryId: 'mom' },
        { id: 'mom-3', name: '一次性内裤', desc: '产后多汗、恶露多，方便更换', isChecked: false, categoryId: 'mom' },
        { id: 'mom-4', name: '哺乳内衣', desc: '方便哺乳', isChecked: false, categoryId: 'mom' },
        { id: 'mom-5', name: '吸奶器', desc: '开奶或涨奶时使用', isChecked: false, categoryId: 'mom' },
        { id: 'mom-6', name: '防溢乳垫', desc: '防止漏奶弄湿衣服', isChecked: false, categoryId: 'mom' },
        { id: 'mom-7', name: '出院衣物', desc: '保暖舒适，帽子围巾（视季节）', isChecked: false, categoryId: 'mom' },
        { id: 'mom-8', name: '洗漱用品', desc: '毛巾、牙刷（软毛）、牙膏、洗面奶', isChecked: false, categoryId: 'mom' },
        { id: 'mom-9', name: '弯头吸管杯', desc: '产房躺着喝水必备', isChecked: false, categoryId: 'mom' },
        { id: 'mom-10', name: '巧克力/红牛', desc: '分娩时补充能量', isChecked: false, categoryId: 'mom' },
        { id: 'mom-11', name: '脸盆', desc: '医院通常需要自备（洗脸/擦身）', isChecked: false, categoryId: 'mom' },
        { id: 'mom-12', name: '卷纸/抽纸', desc: '医院通常不提供，多备几包', isChecked: false, categoryId: 'mom' },
        { id: 'mom-13', name: '马桶垫', desc: '公共卫生间卫生', isChecked: false, categoryId: 'mom' },

        // 陪产人士
        { id: 'ptr-1', name: '折叠床/睡袋', desc: '陪夜休息用', isChecked: false, categoryId: 'partner' },
        { id: 'ptr-2', name: '舒适拖鞋', desc: '在病房穿', isChecked: false, categoryId: 'partner' },
        { id: 'ptr-3', name: '充电宝/充电器', desc: '长期陪护手机电量很重要', isChecked: false, categoryId: 'partner' },
        { id: 'ptr-4', name: '干粮/水', desc: '半夜饿了可以吃', isChecked: false, categoryId: 'partner' },
        { id: 'ptr-5', name: '换洗衣物', desc: '陪护多天需要', isChecked: false, categoryId: 'partner' },

        // 宝宝用品
        { id: 'baby-1', name: '纸尿裤', desc: 'NB码，准备一包', isChecked: false, categoryId: 'baby' },
        { id: 'baby-2', name: '婴儿湿巾/棉柔巾', desc: '清理宝宝便便和屁屁', isChecked: false, categoryId: 'baby' },
        { id: 'baby-3', name: '和尚服/连体衣', desc: '准备 2-3 套，方便穿脱', isChecked: false, categoryId: 'baby' },
        { id: 'baby-4', name: '包被', desc: '根据季节厚薄准备 1-2 条', isChecked: false, categoryId: 'baby' },
        { id: 'baby-5', name: '小毛巾/纱布巾', desc: '洗脸、洗屁屁、溢奶用', isChecked: false, categoryId: 'baby' },
        { id: 'baby-6', name: '护臀膏', desc: '预防红屁屁', isChecked: false, categoryId: 'baby' },
        { id: 'baby-7', name: '奶粉', desc: '备一小罐，防备母乳不足', isChecked: false, categoryId: 'baby' },
        { id: 'baby-8', name: '奶瓶', desc: '准备一个新生儿小奶瓶', isChecked: false, categoryId: 'baby' },
    ];

    // --- Actions ---
    const initData = () => {
        const savedData = uni.getStorageSync(STORAGE_KEY);
        if (savedData) {
            const cachedItems: BagItem[] = JSON.parse(savedData);
            // 合并逻辑：保留缓存中已存在的项状态，补充缓存中缺失的新预设项
            const mergedItems = [...cachedItems];

            // 找出 DEFAULT_ITEMS 中有但 cachedItems 中没有的项
            DEFAULT_ITEMS.forEach(defaultItem => {
                const exists = cachedItems.some(ci => ci.id === defaultItem.id);
                if (!exists) {
                    mergedItems.push(defaultItem);
                }
            });

            items.value = mergedItems;

            // 如果有合并发生（长度不一样），更新一下缓存
            if (mergedItems.length !== cachedItems.length) {
                saveToStorage();
            }
        } else {
            // 默认预设数据
            items.value = JSON.parse(JSON.stringify(DEFAULT_ITEMS));
            saveToStorage();
        }
    };

    const toggleItem = (id: string) => {
        const item = items.value.find(i => i.id === id);
        if (item) {
            item.isChecked = !item.isChecked;
            saveToStorage();
            uni.vibrateShort({
                success: function () {
                    console.log('success');
                }
            });
        }
    };

    const saveToStorage = () => {
        uni.setStorageSync(STORAGE_KEY, JSON.stringify(items.value));
    };

    const resetData = () => {
        uni.removeStorageSync(STORAGE_KEY);
        initData();
    }

    return {
        categories,
        items,
        getItemsByCategory,
        checkedCount,
        totalCount,
        progressPercentage,
        initData,
        toggleItem,
        resetData
    };
});
