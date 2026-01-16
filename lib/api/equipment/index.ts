/**
 * Equipment API Module
 * Export all equipment-related functions
 */

// Types (from types.ts only)
export * from "./types";

// Validation (schemas only, not type exports)
export {
    equipmentStatusSchema,
    createEquipmentSchema,
    updateEquipmentSchema,
    equipmentFiltersSchema,
    paginationSchema,
    createCategorySchema,
    updateCategorySchema,
} from "./validation";

// Queries
export {
    getEquipments,
    getEquipmentById,
    getEquipmentByQrCode,
    getEquipmentByCode,
    getEquipmentStats,
    getEquipmentDetailStats,
    getEquipmentCategories,
    getCategoryById,
    getEquipmentLocations,
    getEquipmentFloors,
    isEquipmentCodeExists,
    isSerialNumberExists,
    checkEquipmentPermissions,
} from "./queries";

// Mutations
export {
    createEquipment,
    updateEquipment,
    updateEquipmentStatus,
    assignResponsiblePerson,
    retireEquipment,
    deleteEquipment,
    createCategory,
    updateCategory,
    deleteCategory,
    bulkUpdateStatus,
    bulkAssignResponsible,
    generateQrCodeImage,
} from "./mutations";
