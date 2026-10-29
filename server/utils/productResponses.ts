interface InventoryUnitRecord {
  id: string;
  product_id: string;
  stock_tag: string;
  imei?: string | null;
  status: string;
  sale_price_inr: number | null;
  inspection?: unknown;
  created_at: Date | string;
  updated_at?: Date | string;
}

interface PublicInventoryUnitResponse {
  status: string;
  salePriceInr: number | null;
}

interface StaffInventoryUnitResponse extends PublicInventoryUnitResponse {
  id: string;
  productId: string;
  stockTag: string;
  imei: string | null | undefined;
  inspection: unknown;
  createdAt: Date | string;
  updatedAt: Date | string | undefined;
}

export function serializeInventoryUnit(unit: InventoryUnitRecord, includeStaffDetails: true): StaffInventoryUnitResponse;
export function serializeInventoryUnit(unit: InventoryUnitRecord, includeStaffDetails: false): PublicInventoryUnitResponse;
export function serializeInventoryUnit(
  unit: InventoryUnitRecord,
  includeStaffDetails: boolean,
): StaffInventoryUnitResponse | PublicInventoryUnitResponse;
export function serializeInventoryUnit(unit: InventoryUnitRecord, includeStaffDetails: boolean) {
  const response = {
    status: unit.status,
    salePriceInr: unit.sale_price_inr,
  };
  if (!includeStaffDetails) return response;

  return {
    id: unit.id,
    productId: unit.product_id,
    stockTag: unit.stock_tag,
    imei: unit.imei,
    status: unit.status,
    salePriceInr: unit.sale_price_inr,
    inspection: unit.inspection,
    createdAt: unit.created_at,
    updatedAt: unit.updated_at,
  };
}

export function serializeProductInspection(
  inspection: { overall_pass: boolean; physical_condition: string; created_at: Date | string } | undefined,
  includeStaffDetails: boolean,
) {
  if (!includeStaffDetails || !inspection) return undefined;
  return {
    overallPass: inspection.overall_pass,
    physicalCondition: inspection.physical_condition,
    inspectedAt: inspection.created_at,
  };
}
