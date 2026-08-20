import type { CommercialOffer } from '../types/commercialOffers';
import { WEDEF_LOGO_BASE64, NOKK_SIGNATURE_STAMP_BASE64 } from './pdfAssets';

export type PdfLanguage = 'uz' | 'ru' | 'en';

export interface PdfTranslations {
  docTitle: string;
  offerNo: string;
  date: string;
  validity: string;
  validityDays: string;
  companySubtitle: string;
  companyAddress: string;
  routeTitle: string;
  originLabel: string;
  destinationLabel: string;
  clientInfoTitle: string;
  contactPerson: string;
  companyName: string;
  cargoSpecsTitle: string;
  cargoDesc: string;
  weight: string;
  volume: string;
  pricingTableTitle: string;
  colService: string;
  colRoute: string;
  colPriceUsd: string;
  colPriceLocal: string;
  itemFreightTitle: string;
  totalProposal: string;
  includedServices: string;
  excludedServices: string;
  defaultInclusions: string[];
  defaultExclusions: string[];
  termsTitle: string;
  defaultTerms: string;
  sigSignerName: string;
  sigRepresentative: string;
  sigCompanyRole: string;
  footerText: string;
}

export const PDF_TRANSLATIONS: Record<PdfLanguage, PdfTranslations> = {
  en: {
    docTitle: 'COMMERCIAL OFFER',
    offerNo: 'Offer No',
    date: 'Date',
    validity: 'Validity Period',
    validityDays: '30 Days from Issue',
    companySubtitle: 'INTERNATIONAL LOGISTICS & FREIGHT FORWARDING',
    companyAddress:
      '14 A. Temur Avenue, Tashkent 100000, Uzbekistan • Tel: +998 71 200 00 00 • info@wedef.uz',
    routeTitle: 'FREIGHT ROUTE PROPOSAL',
    originLabel: 'Origin Location',
    destinationLabel: 'Destination Location',
    clientInfoTitle: 'CLIENT INFORMATION',
    contactPerson: 'Contact Person:',
    companyName: 'Company Name:',
    cargoSpecsTitle: 'CARGO SPECIFICATIONS',
    cargoDesc: 'Cargo Description:',
    weight: 'Gross Weight:',
    volume: 'Total Volume:',
    pricingTableTitle: 'COMMERCIAL PRICING BREAKDOWN',
    colService: 'Service Description',
    colRoute: 'Route Scope',
    colPriceUsd: 'Price (USD)',
    colPriceLocal: 'Price (UZS)',
    itemFreightTitle: 'International Freight Transportation',
    totalProposal: 'TOTAL COMMERCIAL PROPOSAL',
    includedServices: '✓ Included Services',
    excludedServices: '✗ Excluded Services',
    defaultInclusions: [
      'Standard international freight transportation',
      'Cargo dispatch and real-time status updates',
      'Basic carrier liability insurance coverage',
      'Handling of transport documents (CMR / Waybill)',
    ],
    defaultExclusions: [
      'Customs duties, taxes, and terminal storage fees beyond free days',
      'Unloading at recipient destination facility unless requested',
      'Specialized cargo insurance against force majeure risks',
    ],
    termsTitle: 'Terms & Conditions / Payment Policy',
    defaultTerms:
      'Payment is due within 5 banking days upon issuance of invoice. Rates remain fixed and valid for 30 calendar days from offer date. Demurrage and detention fees will apply as per carrier standard rates after free period.',
    sigSignerName: 'Ochilov. F',
    sigRepresentative: 'Wedef Logistics Representative',
    sigCompanyRole: 'Commercial Operations Department',
    footerText:
      'Wedef Logistics & Freight Operations • Tashkent, Uzbekistan • Official Commercial Proposal',
  },
  ru: {
    docTitle: 'КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ',
    offerNo: 'Предложение №',
    date: 'Дата выдачи',
    validity: 'Срок действия',
    validityDays: '30 дней с даты выдачи',
    companySubtitle: 'МЕЖДУНАРОДНАЯ ЛОГИСТИКА И ГРУЗОПЕРЕВОЗКИ',
    companyAddress:
      'Узбекистан, г. Ташкент, пр. А. Темура 14 • Тел: +998 71 200 00 00 • info@wedef.uz',
    routeTitle: 'МАРШРУТ И ПАРАМЕТРЫ ТРАНСПОРТИРОВКИ',
    originLabel: 'Пункт отправления',
    destinationLabel: 'Пункт назначения',
    clientInfoTitle: 'СВЕДЕНИЯ О КЛИЕНТЕ',
    contactPerson: 'Контактное лицо:',
    companyName: 'Организация клиента:',
    cargoSpecsTitle: 'ХАРАКТЕРИСТИКИ ГРУЗА',
    cargoDesc: 'Описание груза:',
    weight: 'Вес брутто:',
    volume: 'Объем груза:',
    pricingTableTitle: 'РАСЧЕТ СТОИМОСТИ УСЛУГ',
    colService: 'Наименование услуги',
    colRoute: 'Маршрут перевозки',
    colPriceUsd: 'Стоимость (USD)',
    colPriceLocal: 'Стоимость (UZS)',
    itemFreightTitle: 'Услуги международной грузоперевозки',
    totalProposal: 'ИТОГОВАЯ СТОИМОСТЬ ПРЕДЛОЖЕНИЯ',
    includedServices: '✓ Включенные услуги',
    excludedServices: '✗ Не включено в стоимость',
    defaultInclusions: [
      'Стандартная международная перевозка груза',
      'Мониторинг движения груза по всему маршруту',
      'Базовое страхование ответственности перевозчика',
      'Оформление транспортных документов (CMR / Коносамент)',
    ],
    defaultExclusions: [
      'Таможенные пошлины, налоги и сверхнормативное хранение',
      'Погрузочно-разгрузочные работы на складе получателя',
      'Дополнительное страхование от рисков форс-мажора',
    ],
    termsTitle: 'Условия оплаты и порядок выполнения',
    defaultTerms:
      'Оплата производится в течение 5 банковских дней после выставления счета. Ставки действительны в течение 30 календарных дней. Сверхнормативный простой оплачивается согласно стандартным тарифам перевозчика.',
    sigSignerName: 'Ochilov. F',
    sigRepresentative: 'Уполномоченный представитель Wedef',
    sigCompanyRole: 'Департамент коммерческих операций',
    footerText: 'Wedef Logistics • Ташкент, Узбекистан • Официальное коммерческое предложение',
  },
  uz: {
    docTitle: 'TIJORAT TAKLIFI',
    offerNo: 'Taklif №',
    date: 'Berilgan sana',
    validity: 'Amal qilish muddati',
    validityDays: 'Berilgan sanadan 30 kun',
    companySubtitle: 'XALQARO LOGISTIKA VA YUK TASHISH',
    companyAddress:
      "O'zbekiston, Toshkent sh., A. Temur shoh ko'chasi 14 • Tel: +998 71 200 00 00 • info@wedef.uz",
    routeTitle: "YUK TASHISH YO'NALISHI VA TAKLIF",
    originLabel: "Jo'nash manzili",
    destinationLabel: 'Yetib borish manzili',
    clientInfoTitle: "MIJOZ MA'LUMOTLARI",
    contactPerson: "Mas'ul shaxs:",
    companyName: 'Mijoz tashkiloti:',
    cargoSpecsTitle: 'YUK XUSUSIYATLARI',
    cargoDesc: 'Yuk tavsifi:',
    weight: 'Brutto vazni:',
    volume: 'Umumiy hajmi:',
    pricingTableTitle: 'XIZMATLAR QIYMATI HISOBI',
    colService: 'Xizmat nomi',
    colRoute: "Tashish yo'nalishi",
    colPriceUsd: 'Narxi (USD)',
    colPriceLocal: 'Narxi (UZS)',
    itemFreightTitle: 'Xalqaro yuk tashish xizmatlari',
    totalProposal: 'TIJORAT TAKLIFINING UMUMIY QIYMATI',
    includedServices: '✓ Narxga kiritilgan xizmatlar',
    excludedServices: '✗ Kiritilmagan xizmatlar',
    defaultInclusions: [
      'Standard xalqaro yuk tashish xizmati',
      'Yuk harakatini muntazam kuzatib borish (tracking)',
      "Tashuvchining mas'uliyatini bazaviy sug'urtalash",
      'Hujjatlarni rasmiylashtirish (CMR / Konosament)',
    ],
    defaultExclusions: [
      "Bojxona to'lovlari va belgilangan muddatdan ortiq saqlash xarajatlari",
      'Qabul qiluvchi omborida yukni tushirish ishlari',
      "Fors-major xavflaridan qo'shimcha sug'urta qilish",
    ],
    termsTitle: "To'lov shartlari va tartibi",
    defaultTerms:
      "To'lov hisob-faktura taqdim etilgandan so'ng 5 bank kuni ichida amalga oshiriladi. Narxlar 30 kalendar kun davomida amal qiladi. Bekorga turib qolish vaqti tashuvchi tariflariga muvofiq to'lanadi.",
    sigSignerName: 'Ochilov. F',
    sigRepresentative: "Wedef Logistics mas'ul vakili",
    sigCompanyRole: 'Tijorat operatsiyalari departamenti',
    footerText: "Wedef Logistics • Toshkent, O'zbekiston • Rasmiy tijorat taklifi",
  },
};

/**
 * Generates an HTML-based printable document string formatted with Wedef Logistics corporate branding,
 * wedef_logo.jpg, authentic signature and stamp (nokk_signature_and_stamp.png), pricing tables,
 * inclusions, exclusions, terms, and signature blocks in UZ, RU, or EN.
 */
export function generateCommercialOfferPdfHtml(
  offer: CommercialOffer,
  lang: PdfLanguage = 'ru'
): string {
  const t = PDF_TRANSLATIONS[lang] || PDF_TRANSLATIONS.ru;

  const formattedUsd = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(offer.price_usd);
  const formattedLocal = new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    maximumFractionDigits: 0,
  }).format(offer.price_local);

  const dateLocaleMap: Record<PdfLanguage, string> = {
    en: 'en-GB',
    ru: 'ru-RU',
    uz: 'uz-UZ',
  };

  const dateStr = new Date(offer.created_at || Date.now()).toLocaleDateString(
    dateLocaleMap[lang] || 'ru-RU',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );

  const inclusionsList =
    offer.inclusions && offer.inclusions.length > 0 ? offer.inclusions : t.defaultInclusions;
  const exclusionsList =
    offer.exclusions && offer.exclusions.length > 0 ? offer.exclusions : t.defaultExclusions;

  const inclusionsHtml = inclusionsList
    .map(
      (inc) =>
        `<li style="margin-bottom: 6px; font-size: 12px; color: #0f172a; line-height: 1.4;"><span style="color: #10b981; font-weight: bold; margin-right: 6px;">✓</span>${escapeHtml(inc)}</li>`
    )
    .join('');

  const exclusionsHtml = exclusionsList
    .map(
      (exc) =>
        `<li style="margin-bottom: 6px; font-size: 12px; color: #64748b; line-height: 1.4;"><span style="color: #ef4444; font-weight: bold; margin-right: 6px;">✗</span>${escapeHtml(exc)}</li>`
    )
    .join('');

  const termsText = offer.terms ? offer.terms : t.defaultTerms;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${t.docTitle} - ${offer.offer_number}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page-container {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px 48px;
      position: relative;
      border: 1px solid #cbd5e1;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2.5px solid #0E1B2E;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .logo-block {
      display: flex;
      flex-direction: column;
      max-width: 60%;
    }
    .logo-img {
      height: 64px;
      width: auto;
      object-fit: contain;
      margin-bottom: 8px;
      align-self: flex-start;
    }
    .company-tagline {
      font-size: 10px;
      font-weight: 700;
      color: #C5A86E;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .company-address {
      font-size: 9.5px;
      color: #64748b;
      margin-top: 4px;
      line-height: 1.35;
    }
    .offer-badge {
      text-align: right;
    }
    .doc-title {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 1px;
      color: #0E1B2E;
      text-transform: uppercase;
    }
    .offer-number {
      font-size: 15px;
      font-weight: 700;
      color: #C5A86E;
      margin-top: 3px;
    }
    .meta-item {
      font-size: 11px;
      color: #475569;
      margin-top: 3px;
    }

    .route-card {
      background: linear-gradient(135deg, #0E1B2E 0%, #1E293B 100%);
      color: #ffffff;
      border-radius: 14px;
      padding: 20px 24px;
      margin-bottom: 24px;
      position: relative;
      overflow: hidden;
      border-left: 5px solid #C5A86E;
    }
    .route-header {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #C5A86E;
      margin-bottom: 12px;
    }
    .route-flow {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .route-point {
      flex: 1;
    }
    .route-label {
      font-size: 10px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .route-city {
      font-size: 18px;
      font-weight: 800;
      color: #ffffff;
      margin-top: 2px;
    }
    .route-arrow-container {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 12px;
    }
    .route-line {
      height: 2px;
      width: 60px;
      background: linear-gradient(90deg, rgba(197, 168, 110, 0.3), #C5A86E, rgba(197, 168, 110, 0.3));
    }
    .route-arrow {
      font-size: 20px;
      color: #C5A86E;
      font-weight: bold;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .info-block {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 18px;
    }
    .block-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #0E1B2E;
      margin-bottom: 10px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 6px;
    }
    .info-row:last-child {
      margin-bottom: 0;
    }
    .info-label { color: #64748b; font-weight: 500; }
    .info-val { color: #0f172a; font-weight: 700; }

    .table-custom {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .table-custom th {
      background: #0E1B2E;
      color: #ffffff;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 10px 14px;
      text-align: left;
    }
    .table-custom td {
      padding: 12px 14px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
      color: #1e293b;
    }
    .price-total-row {
      background: #f1f5f9;
    }
    .price-usd { font-size: 16px; color: #0E1B2E; font-weight: 900; }
    .price-local { font-size: 13px; color: #64748b; font-weight: 700; }

    .inc-exc-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .inc-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 16px 18px;
    }
    .exc-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 12px;
      padding: 16px 18px;
    }
    .inc-title { font-size: 12px; font-weight: 800; color: #166534; margin-bottom: 8px; text-transform: uppercase; }
    .exc-title { font-size: 12px; font-weight: 800; color: #991b1b; margin-bottom: 8px; text-transform: uppercase; }
    ul { margin: 0; padding: 0; list-style: none; }

    .terms-section {
      background: #fafafa;
      border-left: 4px solid #C5A86E;
      padding: 14px 18px;
      border-radius: 0 12px 12px 0;
      margin-bottom: 28px;
    }
    .terms-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0E1B2E; margin-bottom: 4px; }
    .terms-text { font-size: 11px; color: #475569; line-height: 1.5; }

    .signature-area {
      display: flex;
      justify-content: flex-start;
      margin-top: 36px;
      padding-top: 16px;
    }
    .sig-block {
      width: 44%;
      position: relative;
    }
    .sig-wrapper {
      position: relative;
      height: 120px;
    }
    .sig-stamp-img {
      height: 185px;
      width: auto;
      object-fit: contain;
      position: absolute;
      bottom: -12px;
      left: -10px;
      z-index: 10;
      pointer-events: none;
      filter: drop-shadow(0px 2px 6px rgba(0,0,0,0.12));
    }
    .sig-line {
      border-bottom: 1.5px solid #0E1B2E;
      margin-bottom: 6px;
      position: relative;
      z-index: 5;
    }
    .sig-name { font-size: 13px; font-weight: 800; color: #0E1B2E; }
    .sig-title { font-size: 10.5px; color: #475569; margin-top: 2px; }

    .footer {
      position: absolute;
      bottom: 24px;
      left: 48px;
      right: 48px;
      text-align: center;
      font-size: 9.5px;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <!-- Header -->
    <div class="header">
      <div class="logo-block">
        <img src="${WEDEF_LOGO_BASE64}" class="logo-img" alt="Wedef Logo" />
        <div class="company-tagline">${t.companySubtitle}</div>
        <div class="company-address">${t.companyAddress}</div>
      </div>
      <div class="offer-badge">
        <div class="doc-title">${t.docTitle}</div>
        <div class="offer-number">${offer.offer_number}</div>
        <div class="meta-item">${t.date}: <strong>${dateStr}</strong></div>
        <div class="meta-item">${t.validity}: ${t.validityDays}</div>
      </div>
    </div>

    <!-- Route Visual Banner -->
    <div class="route-card">
      <div class="route-header">${t.routeTitle}</div>
      <div class="route-flow">
        <div class="route-point">
          <div class="route-label">${t.originLabel}</div>
          <div class="route-city">${escapeHtml(offer.origin)}</div>
        </div>
        <div class="route-arrow-container">
          <div class="route-line"></div>
          <div class="route-arrow">➔</div>
          <div class="route-line"></div>
        </div>
        <div class="route-point" style="text-align: right;">
          <div class="route-label">${t.destinationLabel}</div>
          <div class="route-city">${escapeHtml(offer.destination)}</div>
        </div>
      </div>
    </div>

    <!-- Details Grid -->
    <div class="grid-2">
      <!-- Client Information -->
      <div class="info-block">
        <div class="block-title">${t.clientInfoTitle}</div>
        <div class="info-row">
          <span class="info-label">${t.contactPerson}</span>
          <span class="info-val">${escapeHtml(offer.client_name)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">${t.companyName}</span>
          <span class="info-val">${escapeHtml(offer.client_company)}</span>
        </div>
      </div>

      <!-- Cargo Specifications -->
      <div class="info-block">
        <div class="block-title">${t.cargoSpecsTitle}</div>
        <div class="info-row">
          <span class="info-label">${t.cargoDesc}</span>
          <span class="info-val">${escapeHtml(offer.cargo_description || 'General Freight')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">${t.weight}</span>
          <span class="info-val">${offer.cargo_weight !== null && offer.cargo_weight !== undefined ? offer.cargo_weight + ' kg' : 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">${t.volume}</span>
          <span class="info-val">${offer.cargo_volume !== null && offer.cargo_volume !== undefined ? offer.cargo_volume + ' m³' : 'N/A'}</span>
        </div>
      </div>
    </div>

    <!-- Commercial Pricing Table -->
    <table class="table-custom">
      <thead>
        <tr>
          <th>${t.colService}</th>
          <th>${t.colRoute}</th>
          <th style="text-align: right;">${t.colPriceUsd}</th>
          <th style="text-align: right;">${t.colPriceLocal}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${t.itemFreightTitle}</strong><br>
            <span style="font-size: 11px; color: #64748b;">${escapeHtml(offer.cargo_description || 'Freight Transport')}</span>
          </td>
          <td>${escapeHtml(offer.origin)} ➔ ${escapeHtml(offer.destination)}</td>
          <td style="text-align: right; font-weight: 700;">${formattedUsd}</td>
          <td style="text-align: right; color: #475569;">${formattedLocal}</td>
        </tr>
        <tr class="price-total-row">
          <td colspan="2" style="font-weight: 900; font-size: 13px; color: #0E1B2E;">${t.totalProposal}</td>
          <td style="text-align: right;" class="price-usd">${formattedUsd}</td>
          <td style="text-align: right;" class="price-local">${formattedLocal}</td>
        </tr>
      </tbody>
    </table>

    <!-- Inclusions & Exclusions -->
    <div class="inc-exc-grid">
      <div class="inc-box">
        <div class="inc-title">${t.includedServices}</div>
        <ul>${inclusionsHtml}</ul>
      </div>
      <div class="exc-box">
        <div class="exc-title">${t.excludedServices}</div>
        <ul>${exclusionsHtml}</ul>
      </div>
    </div>

    <!-- Terms & Payment Policy -->
    <div class="terms-section">
      <div class="terms-title">${t.termsTitle}</div>
      <div class="terms-text">${escapeHtml(termsText)}</div>
    </div>

    <!-- Signatures & Authentic Stamp -->
    <div class="signature-area">
      <!-- Provider Representative Signature with Stamp -->
      <div class="sig-block">
        <div class="sig-wrapper">
          <img src="${NOKK_SIGNATURE_STAMP_BASE64}" class="sig-stamp-img" alt="Signature & Stamp" />
        </div>
        <div class="sig-line"></div>
        <div class="sig-name">${t.sigSignerName}</div>
        <div class="sig-title">${t.sigRepresentative}</div>
        <div class="sig-title" style="font-size: 9.5px; color: #94a3b8; margin-top: 1px;">${t.sigCompanyRole}</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      ${t.footerText} • ${offer.offer_number}
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text?: string | null): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Triggers a direct browser download of the commercial offer as an HTML printable file
 * in the requested language (uz, ru, or en).
 */
export function downloadCommercialOfferPdfBlob(
  offer: CommercialOffer,
  lang: PdfLanguage = 'ru'
): void {
  const htmlContent = generateCommercialOfferPdfHtml(offer, lang);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${offer.offer_number}_${lang.toUpperCase()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Opens a print dialog window for the commercial offer in the requested language
 */
export function openCommercialOfferPdfPrintWindow(
  offer: CommercialOffer,
  lang: PdfLanguage = 'ru'
): void {
  const htmlContent = generateCommercialOfferPdfHtml(offer, lang);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  }
}
