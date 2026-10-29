export type InventoryStatus = 'available' | 'reserved' | 'sold' | 'retired';

export const validInventoryTransitions: Record<InventoryStatus, readonly InventoryStatus[]> = {
  available: ['reserved', 'sold', 'retired'],
  reserved: ['available', 'sold'],
  sold: ['available'],
  retired: ['available'],
};

export function canTransitionInventoryStatus(from: InventoryStatus, to: InventoryStatus) {
  return validInventoryTransitions[from]?.includes(to) ?? false;
}

export function assertInventoryTransition(from: InventoryStatus, to: InventoryStatus): void {
  if (!canTransitionInventoryStatus(from, to)) {
    throw new Error(`INVALID_TRANSITION: ${from} -> ${to}`);
  }
}
