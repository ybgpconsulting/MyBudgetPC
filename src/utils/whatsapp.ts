import { PhoneItem } from '../types';
import { SITE_CONFIG, formatINR } from '../config/siteConfig';
import { CartLine, EnquiryCustomer, getProductVariant } from './storefront';

export function createWhatsAppUrl(message: string, phone = SITE_CONFIG.whatsappNumber): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) return null;
  const url = new URL(`https://wa.me/${digits}`);
  url.searchParams.set('text', message);
  return url.toString();
}

export function buildProductEnquiryMessage(
  product: PhoneItem,
  quantity: number,
  productUrl: string,
): string {
  return [
    `Hello ${SITE_CONFIG.storeName}, I would like to enquire about this product.`,
    '',
    `Product: ${product.brand} ${product.model}`,
    `SKU / model: ${product.stockTag || product.id}`,
    `Selected configuration: ${getProductVariant(product)}`,
    `Quantity: ${quantity}`,
    `Unit price: ${product.price > 0 ? formatINR(product.price) : 'Please confirm price'}`,
    `Product link: ${productUrl}`,
    '',
    'Please confirm availability and final pricing.',
  ].join('\n');
}

export function buildCartEnquiryMessage(
  lines: CartLine[],
  products: PhoneItem[],
  customer: EnquiryCustomer,
  storeUrl: string,
): string {
  const byId = new Map(products.map((product) => [product.id, product]));
  let knownSubtotal = 0;
  let hasUnpricedItem = false;
  const itemMessages = lines.map((line, index) => {
    const product = byId.get(line.productId);
    if (!product) {
      return `${index + 1}. Product no longer listed (SKU / model: ${line.productId})\nQuantity: ${line.quantity}\nPlease confirm whether this item is still available.`;
    }

    const subtotal = product.price > 0 ? product.price * line.quantity : null;
    if (subtotal === null) hasUnpricedItem = true;
    else knownSubtotal += subtotal;

    return [
      `${index + 1}. ${product.brand} ${product.model}`,
      `SKU / model: ${product.stockTag || product.id}`,
      `Selected configuration: ${getProductVariant(product)}`,
      `Quantity: ${line.quantity}`,
      `Unit price: ${product.price > 0 ? formatINR(product.price) : 'Pending confirmation'}`,
      `Subtotal: ${subtotal !== null ? formatINR(subtotal) : 'Pending confirmation'}`,
    ].join('\n');
  });
  const subtotalText = hasUnpricedItem
    ? `${formatINR(knownSubtotal)} for priced items; remaining item prices pending confirmation`
    : formatINR(knownSubtotal);
  const deliveryDetails = customer.deliveryPreference === 'delivery'
    ? [
      'Preference: Delivery',
      `Delivery address: ${customer.address}`,
      `PIN code: ${customer.pinCode}`,
      'Delivery charges: Pending confirmation',
    ]
    : ['Preference: Pickup'];

  return [
    `Hello ${SITE_CONFIG.storeName}, please review this product enquiry.`,
    '',
    `Customer name: ${customer.name}`,
    `Customer phone: ${customer.phone}`,
    '',
    'Items:',
    ...itemMessages,
    '',
    `Cart subtotal: ${subtotalText}`,
    ...deliveryDetails,
    `Additional notes: ${customer.notes.trim() || 'None'}`,
    '',
    `Storefront: ${storeUrl}`,
    'Please confirm current availability and final pricing. This is an enquiry, not a confirmed order.',
  ].join('\n');
}

export function buildSimpleEnquiryMessage(productName?: string, price?: number): string {
  return [
    `Hello ${SITE_CONFIG.storeName}, I would like to enquire${productName ? ` about ${productName}` : ''}.`,
    ...(price && price > 0 ? [`Listed price: ${formatINR(price)} (please confirm).`] : []),
    'Please confirm current availability and final pricing.',
  ].join('\n');
}
