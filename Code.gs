const VP = Object.freeze({
  SPREADSHEET_ID: '1qY8_eXX34Gsxf6vyBRl0Krdy9NiRYGZ6a7KZscSHz2o',
  SHEETS: { PRODUCTS: '03_PRODUKTY', SALES: '04_SPRZEDAŻ', EXPENSES: '08_WYDATKI', DICTS: '11_SŁOWNIKI', SETTINGS: '12_USTAWIENIA', USERS: '13_UŻYTKOWNICY', LOG: '14_LOG' },
  VERSION: '1.0.1-dev'
});

function onOpen() {
  SpreadsheetApp.getUi().createMenu('VINTAGE PRO')
    .addItem('Otwórz panel', 'showApp')
    .addItem('Sprawdź konfigurację', 'checkConfiguration')
    .addToUi();
}

function doGet() {
  return HtmlService.createTemplateFromFile('Mobile').evaluate()
    .setTitle('Vintage PRO').addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function showApp() {
  SpreadsheetApp.getUi().showSidebar(
    HtmlService.createTemplateFromFile('Mobile').evaluate().setTitle('Vintage PRO')
  );
}

function checkConfiguration() {
  const result = getBootstrapData();
  SpreadsheetApp.getUi().alert('Vintage PRO', `Zalogowano: ${result.user}\nDostęp: aktywny`, SpreadsheetApp.getUi().ButtonSet.OK);
}

function getBootstrapData() {
  const user = assertAuthorized_();
  const d = getDictionaries_();
  return { user, stores: d[0], categories: d[1], origins: d[3], styles: d[4], conditions: d[5], defects: d[8], costStatuses: d[9], payments: d[12], discounts: d[13], version: VP.VERSION };
}

function addProduct(input) {
  const user = assertAuthorized_();
  input = input || {};
  require_(input.store, 'Wybierz sklep.');
  require_(input.name, 'Wpisz nazwę produktu.');
  require_(input.category, 'Wybierz kategorię.');
  const tagPrice = money_(input.tagPrice);
  if (tagPrice < 0) throw new Error('Cena z metki nie może być ujemna.');

  const lock = LockService.getDocumentLock();
  lock.waitLock(20000);
  try {
    const sh = sheet_(VP.SHEETS.PRODUCTS);
    const id = nextProductId_(input.store, sh);
    const now = new Date();
    const purchase = optionalMoney_(input.purchaseCost);
    const materials = optionalMoney_(input.materialCost);
    const labor = optionalMoney_(input.laborCost);
    const costStatus = input.costStatus || ((purchase === '' && materials === '' && labor === '') ? 'Nieznany' : 'Potwierdzony');
    const totalCost = costStatus === 'Nieznany' ? '' : numberOrZero_(purchase) + numberOrZero_(materials) + numberOrZero_(labor);
    const defect = Boolean(input.hasDefect);
    if (defect && !String(input.defectDescription || '').trim()) throw new Error('Opisz wadę produktu.');
    const location = input.store;
    const photo = input.imageDataUrl ? saveImage_(input.imageDataUrl, id, 'produkt') : null;
    const row = [
      id, input.store, clean_(input.name), clean_(input.brand), input.category, clean_(input.subcategory), input.origin || 'Vintage – zakupiony',
      clean_(input.style), clean_(input.materials), clean_(input.composition), clean_(input.size), clean_(input.color), input.condition || 'Nieoceniony',
      defect, clean_(input.defectType), clean_(input.defectDescription), Boolean(input.defectInPrice), tagPrice, purchase, costStatus,
      materials, labor, totalCost, location, '', 'Dostępny', input.intakeDate ? new Date(input.intakeDate) : now, '', '', clean_(input.comment),
      Boolean(input.important), now, user, now, user, true, searchKey_(input),
      photo ? photo.url : '', photo ? photo.id : '', photo ? now : '', photo ? user : '', photo ? 'Dodane' : 'Brak zdjęcia'
    ];
    sh.appendRow(row);
    appendLog_(user, 'mobile/web', 'DODAJ_PRODUKT', 'produkt', id, '', JSON.stringify({name: input.name, store: input.store}), input.comment || '');
    return { ok: true, id, message: `Dodano produkt ${id}.` };
  } finally { lock.releaseLock(); }
}

function searchProducts(query, store) {
  assertAuthorized_();
  const q = normalize_(query);
  if (q.length < 2) return [];
  const sh = sheet_(VP.SHEETS.PRODUCTS);
  const last = sh.getLastRow();
  if (last < 2) return [];
  const rows = sh.getRange(2, 1, last - 1, 42).getValues();
  return rows.filter(r => {
    const allowedStatus = r[25] === 'Dostępny' || r[25] === 'Na targach' || r[25] === 'Zarezerwowany';
    return r[0] && allowedStatus && (!store || store === 'Oba sklepy' || r[1] === store) && normalize_([r[0],r[2],r[3],r[4],r[7],r[8],r[10],r[11],r[12],r[14],r[15],r[29],r[36]].join(' ')).includes(q);
  }).slice(0, 30).map(r => ({
    id:r[0], store:r[1], name:r[2], brand:r[3], category:r[4], style:r[7], materials:r[8], size:r[10], color:r[11], condition:r[12],
    hasDefect:r[13], defect:r[15], tagPrice:r[17], location:r[23], eventId:r[24], status:r[25], comment:r[29], important:r[30], photoUrl:r[37] || ''
  }));
}

function sellProduct(input) {
  const user = assertAuthorized_();
  input = input || {};
  require_(input.productId, 'Wybierz produkt.');
  require_(input.payment, 'Wybierz formę płatności.');
  const finalPrice = money_(input.finalPrice);
  if (finalPrice < 0) throw new Error('Cena sprzedaży nie może być ujemna.');

  const lock = LockService.getDocumentLock();
  lock.waitLock(20000);
  try {
    const products = sheet_(VP.SHEETS.PRODUCTS);
    const hit = products.getRange(2, 1, Math.max(products.getLastRow() - 1, 1), 42).getValues().findIndex(r => String(r[0]) === String(input.productId));
    if (hit < 0) throw new Error('Nie znaleziono produktu.');
    const rowNo = hit + 2;
    const r = products.getRange(rowNo, 1, 1, 42).getValues()[0];
    if (!['Dostępny','Na targach','Zarezerwowany'].includes(r[25])) throw new Error(`Produkt ma status „${r[25]}” i nie może zostać sprzedany.`);
    const channel = input.channel || (r[25] === 'Na targach' ? 'Targi' : 'Sklep stacjonarny');
    if (channel === 'Targi' && !r[24] && !input.eventId) throw new Error('Sprzedaż targowa wymaga wskazania wydarzenia.');
    const now = new Date();
    const saleId = uniqueId_('SALE');
    const tagPrice = numberOrZero_(r[17]);
    const discountValue = Math.max(0, tagPrice - finalPrice);
    const totalCost = r[22];
    const margin = r[19] === 'Nieznany' || totalCost === '' ? '' : finalPrice - Number(totalCost);
    const saleRow = [saleId, now, now, r[1], r[0], r[2], r[3], r[4], channel, input.eventId || r[24] || '', tagPrice,
      input.discountType || (discountValue ? 'Cena negocjowana' : 'Brak'), optionalNumber_(input.declaredDiscount), discountValue, finalPrice,
      input.payment, totalCost, r[19], margin, clean_(input.comment), 'Aktywna', user, now, '', ''];
    sheet_(VP.SHEETS.SALES).appendRow(saleRow);
    if (input.imageDataUrl && !r[37]) {
      const photo = saveImage_(input.imageDataUrl, r[0], 'sprzedaż');
      products.getRange(rowNo, 38, 1, 5).setValues([[photo.url, photo.id, now, user, 'Dodane przy sprzedaży']]);
    }
    products.getRange(rowNo, 24, 1, 13).setValues([[channel === 'Targi' ? r[23] : r[1], r[24], channel === 'Targi' ? 'Sprzedany na targach' : 'Sprzedany w sklepie', r[26], now, saleId, r[29], r[30], r[31], r[32], now, user, r[35]]]);
    appendLog_(user, 'mobile/web', 'SPRZEDAJ_PRODUKT', 'produkt', r[0], r[25], channel === 'Targi' ? 'Sprzedany na targach' : 'Sprzedany w sklepie', input.comment || '');
    return { ok:true, saleId, discountValue, message:`Sprzedano ${r[2]} za ${finalPrice.toFixed(2)} zł.` };
  } finally { lock.releaseLock(); }
}

function quickSellProduct(input) {
  assertAuthorized_();
  input = input || {};
  const created = addProduct({
    store: input.store, name: input.name, brand: input.brand, category: input.category,
    origin: input.origin || 'Vintage – zakupiony', style: input.style, materials: input.materials,
    condition: input.condition || 'Nieoceniony', tagPrice: input.tagPrice,
    purchaseCost: input.purchaseCost, costStatus: input.costStatus || 'Nieznany',
    hasDefect: input.hasDefect, defectType: input.defectType, defectDescription: input.defectDescription,
    comment: input.productComment, important: input.important, imageDataUrl: input.imageDataUrl
  });
  try {
    return sellProduct({ productId: created.id, finalPrice: input.finalPrice, discountType: input.discountType,
      payment: input.payment, channel: input.channel, eventId: input.eventId, comment: input.saleComment });
  } catch (e) {
    throw new Error(`Produkt ${created.id} został dodany do stanu, ale sprzedaż nie została zapisana: ${e.message}`);
  }
}

function addPhotoToProduct(productId, imageDataUrl) {
  const user = assertAuthorized_();
  require_(productId, 'Brak ID produktu.');
  require_(imageDataUrl, 'Nie wybrano zdjęcia.');
  const sh = sheet_(VP.SHEETS.PRODUCTS), last = sh.getLastRow();
  const ids = sh.getRange(2,1,Math.max(last-1,1),1).getDisplayValues().flat();
  const index = ids.indexOf(String(productId));
  if (index < 0) throw new Error('Nie znaleziono produktu.');
  const photo = saveImage_(imageDataUrl, productId, 'produkt');
  sh.getRange(index + 2, 38, 1, 5).setValues([[photo.url, photo.id, new Date(), user, 'Dodane']]);
  appendLog_(user, 'mobile/web', 'DODAJ_ZDJĘCIE', 'produkt', productId, '', photo.id, '');
  return {ok:true, url:photo.url, message:'Zdjęcie zostało zapisane.'};
}

function addExpense(input) {
  const user = assertAuthorized_();
  input = input || {};
  require_(input.description, 'Wpisz opis wydatku.');
  require_(input.paidBy, 'Wybierz, kto zapłacił.');
  const gross = money_(input.grossAmount);
  const shareTP = optionalNumber_(input.shareTP) === '' ? 0.5 : Number(input.shareTP);
  const shareVV = optionalNumber_(input.shareVV) === '' ? 0.5 : Number(input.shareVV);
  if (Math.abs(shareTP + shareVV - 1) > 0.0001) throw new Error('Udziały kosztu muszą sumować się do 100%.');
  const id = uniqueId_('EXP'), now = new Date();
  const costTP = Math.round(gross * shareTP * 100) / 100, costVV = Math.round(gross * shareVV * 100) / 100;
  const reimbursement = input.costType === 'Wspólny' ? (String(input.paidBy).toLowerCase().includes('lana') ? costVV : costTP) : 0;
  sheet_(VP.SHEETS.EXPENSES).appendRow([id,input.date?new Date(input.date):now,input.month||'',clean_(input.description),input.category||'Inne',input.costType||'Wspólny',input.accountingClass||'Do potwierdzenia',
    optionalMoney_(input.netAmount),optionalMoney_(input.vatAmount),gross,input.paidBy,input.payment||'',shareTP,shareVV,costTP,costVV,reimbursement,input.settlementStatus||'Nierozliczone',0,'','',input.documentType||'',clean_(input.invoiceTo),input.taxCost||'Do potwierdzenia',input.eventId||'','','',clean_(input.comment),user,now]);
  appendLog_(user,'mobile/web','DODAJ_WYDATEK','wydatek',id,'',JSON.stringify({gross,paidBy:input.paidBy}),input.comment||'');
  return {ok:true,id,message:`Dodano wydatek ${gross.toFixed(2)} zł.`};
}

function assertAuthorized_() {
  const email = Session.getActiveUser().getEmail();
  if (!email) throw new Error('Nie udało się rozpoznać konta Google. Otwórz aplikację po zalogowaniu.');
  const sh = sheet_(VP.SHEETS.USERS);
  const last = sh.getLastRow();
  const users = last < 2 ? [] : sh.getRange(2,1,last-1,5).getValues();
  const allowed = users.some(r => String(r[0]).toLowerCase() === email.toLowerCase() && r[3] === true && r[4] === true);
  if (!allowed) throw new Error(`Brak dostępu dla konta ${email}. Dodaj je w zakładce 13_UŻYTKOWNICY.`);
  return email;
}

function getDictionaries_() {
  const sh = sheet_(VP.SHEETS.DICTS), values = sh.getRange(2,1,Math.max(sh.getLastRow()-1,1),16).getDisplayValues();
  return Array.from({length:16},(_,c)=>values.map(r=>r[c]).filter(Boolean));
}
function getSetting_(key) {
  const sh = sheet_(VP.SHEETS.SETTINGS), values = sh.getRange(2,1,Math.max(sh.getLastRow()-1,1),2).getDisplayValues();
  const hit = values.find(r => r[0] === key); return hit ? hit[1] : '';
}
function saveImage_(dataUrl, productId, context) {
  const folderId = getSetting_('FOLDER_ZDJĘCIA_ID');
  if (!folderId) throw new Error('Najpierw wpisz ID wspólnego folderu zdjęć w 12_USTAWIENIA.');
  const match = String(dataUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) throw new Error('Nieprawidłowy format zdjęcia.');
  const ext = match[1].includes('png') ? 'png' : 'jpg';
  const blob = Utilities.newBlob(Utilities.base64Decode(match[2]), match[1], `${productId}-${context}-${Date.now()}.${ext}`);
  if (blob.getBytes().length > 2500000) throw new Error('Zdjęcie jest zbyt duże. Spróbuj ponownie.');
  const file = DriveApp.getFolderById(folderId).createFile(blob);
  return {id:file.getId(),url:file.getUrl()};
}
function nextProductId_(store, sh) {
  const prefix = store === 'TWINS PICK' ? 'TP' : 'VV';
  const ids = sh.getLastRow()<2 ? [] : sh.getRange(2,1,sh.getLastRow()-1,1).getDisplayValues().flat();
  const max = ids.reduce((m,id)=>{ const x=String(id).match(new RegExp(`^${prefix}-(\\d+)$`)); return x?Math.max(m,Number(x[1])):m; },0);
  return `${prefix}-${String(max+1).padStart(6,'0')}`;
}
function appendLog_(user, channel, operation, object, id, before, after, comment) {
  sheet_(VP.SHEETS.LOG).appendRow([uniqueId_('LOG'),new Date(),user,channel,operation,object,id,before,after,comment,'OK','',VP.VERSION,'']);
}
function sheet_(name){ const sh=SpreadsheetApp.openById(VP.SPREADSHEET_ID).getSheetByName(name); if(!sh) throw new Error(`Brak zakładki ${name}.`); return sh; }
function uniqueId_(prefix){ return `${prefix}-${Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Europe/Warsaw','yyyyMMdd-HHmmss')}-${Utilities.getUuid().slice(0,8)}`; }
function clean_(v){ return String(v==null?'':v).trim(); }
function normalize_(v){ return clean_(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' '); }
function searchKey_(x){ return normalize_([x.name,x.brand,x.category,x.subcategory,x.style,x.materials,x.composition,x.size,x.color,x.condition,x.defectType,x.defectDescription,x.comment].join(' ')); }
function require_(v,m){ if(!clean_(v)) throw new Error(m); }
function money_(v){ const n=Number(String(v==null?'':v).replace(',','.').replace(/\s/g,'')); if(!Number.isFinite(n)) throw new Error('Wpisz prawidłową kwotę.'); return Math.round(n*100)/100; }
function optionalMoney_(v){ return clean_(v)===''?'':money_(v); }
function optionalNumber_(v){ if(clean_(v)==='') return ''; const n=Number(String(v).replace(',','.')); return Number.isFinite(n)?n:''; }
function numberOrZero_(v){ return v===''||v==null?0:Number(v)||0; }
