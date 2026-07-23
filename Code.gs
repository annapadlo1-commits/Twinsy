const VP = Object.freeze({
  SPREADSHEET_ID: '1qY8_eXX34Gsxf6vyBRl0Krdy9NiRYGZ6a7KZscSHz2o',
  SHEETS: { PRODUCTS: '03_PRODUKTY', SALES: '04_SPRZEDAŻ', DAILY: '05_RAPORTY_DZIENNE', FAIRS: '06_TARGI', MOVES: '07_RUCHY_TOWARU', EXPENSES: '08_WYDATKI', FINANCE: '09_ROZLICZENIA', ANALYTICS: '10_ANALITYKA', DICTS: '11_SŁOWNIKI', SETTINGS: '12_USTAWIENIA', USERS: '13_UŻYTKOWNICY', LOG: '14_LOG', SETTLEMENTS: '15_ROZLICZENIA_WZAJEMNE' },
  VERSION: '2.1.2'
});
let VP_BOOK_;

function onOpen() {
  bindDatabase_();
  SpreadsheetApp.getUi().createMenu('VINTAGE PRO')
    .addItem('Otwórz panel', 'showApp')
    .addItem('Pokaż link aplikacji mobilnej', 'showMobileAppUrl')
    .addItem('Sprawdź konfigurację', 'checkConfiguration')
    .addSeparator()
    .addItem('Przygotuj paczkę 2.1.2 — podgląd zdjęć', 'installFinalVersion')
    .addItem('Odśwież analitykę', 'refreshAnalyticsSheet')
    .addToUi();
}

function doGet() {
  return HtmlService.createTemplateFromFile('Mobile').evaluate()
    .setTitle('Vintage PRO').addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function showApp() {
  const html=HtmlService.createTemplateFromFile('Mobile').evaluate().setTitle('Vintage PRO').setWidth(1180).setHeight(780);
  SpreadsheetApp.getUi().showModelessDialog(html,'Vintage PRO');
}

function showMobileAppUrl(){const url=ScriptApp.getService().getUrl();if(!url){SpreadsheetApp.getUi().alert('Vintage PRO','Nie ma aktywnego wdrożenia typu „Aplikacja internetowa”. Utwórz je przez Wdróż → Nowe wdrożenie.',SpreadsheetApp.getUi().ButtonSet.OK);return;}SpreadsheetApp.getUi().alert('Link aplikacji mobilnej',`${url}\n\nSkopiuj dokładnie ten adres. Powinien kończyć się /exec.`,SpreadsheetApp.getUi().ButtonSet.OK);}

function checkConfiguration() {
  const result = getBootstrapData();
  SpreadsheetApp.getUi().alert('Vintage PRO', `Zalogowano: ${result.user}\nDostęp: aktywny`, SpreadsheetApp.getUi().ButtonSet.OK);
}

function getBootstrapData() {
  const user = assertAuthorized_();
  const d = getDictionaries_();
  return { user, stores: d[0], categories: d[1], origins: d[3], styles: d[4], conditions: d[5], defects: d[8], costStatuses: d[9], payments: d[12], discounts: d[13], expenseCategories: d[14], movementTypes: d[15], fairs: listFairs_(), version: VP.VERSION };
}

function installVersion110() {
  const user=assertAuthorized_();
  ensureSetting_('WERSJA',VP.VERSION,'Aktualna wersja aplikacji');
  ensureSetting_('STAWKA_PODATKU_TP',0,'Szacunkowa stawka podatku TWINS PICK, np. 0,12');
  ensureSetting_('STAWKA_PODATKU_VV',0,'Szacunkowa stawka podatku VILANA VINTAGE, np. 0,12');
  ensureSetting_('PODSTAWA_PODATKU','Wynik potwierdzony','Estymacja orientacyjna; ustawienia wymagają potwierdzenia księgowej');
  ensureSetting_('PRÓG_STAREGO_TOWARU_DNI',180,'Po ilu dniach produkt ma trafić do alertu starego stanu');
  refreshAnalyticsSheet();
  appendLog_(user,'arkusz','AKTUALIZACJA','aplikacja',VP.VERSION,'',VP.VERSION,'');
  SpreadsheetApp.getUi().alert('Vintage PRO',`Aktualizacja ${VP.VERSION} została przygotowana.`,SpreadsheetApp.getUi().ButtonSet.OK);
}

function installVersion120() {
  installVersion110();
}

function installFinalVersion() {
  bindDatabase_();const user=assertAuthorized_();
  ensureSetting_('WERSJA',VP.VERSION,'Aktualna wersja aplikacji');
  ensureSetting_('STAWKA_PODATKU_TP',0.03,'Stawka estymacji podatku TWINS PICK');
  ensureSetting_('STAWKA_PODATKU_VV',0.03,'Stawka estymacji podatku VILANA VINTAGE');
  ensureSetting_('STAWKA_VAT_TP',0.23,'Stawka VAT TWINS PICK');
  ensureSetting_('STAWKA_VAT_VV',0.23,'Stawka VAT VILANA VINTAGE');
  ensureSetting_('PODSTAWA_PODATKU','Przychód netto po VAT','Przychód brutto / Przychód netto po VAT / Wynik potwierdzony');
  ensureSetting_('LEGACY_EXPENSE_SPREADSHEET_ID','1z7OT3vFHh4N0397YcpAVnY1yr0OkUhbfoRsqcneTzRM','Źródłowy plik historycznych wydatków');
  ensureSetting_('LEGACY_EXPENSE_START_YEAR',2025,'Rok pierwszego miesiąca w historycznym pliku kosztów');
  ensureSetting_('FOLDER_BACKUP_ID','','Opcjonalny folder kopii bezpieczeństwa');
  ensureSetting_('PRÓG_STAREGO_TOWARU_DNI',180,'Próg alertu starego stanu');
  refreshAnalyticsSheet();
  appendLog_(user,'arkusz','INSTALACJA_FINALNA','aplikacja',VP.VERSION,'',VP.VERSION,'');
  SpreadsheetApp.getUi().alert('Vintage PRO',`Wersja finalna ${VP.VERSION} jest przygotowana. Przed importem historii utwórz kopię bezpieczeństwa w zakładce Administracja.`,SpreadsheetApp.getUi().ButtonSet.OK);
}

function getDashboardData(input) {
  assertAuthorized_(); input=input||{};
  const range=reportRange_(input), salesSheet=sheet_(VP.SHEETS.SALES), expenseSheet=sheet_(VP.SHEETS.EXPENSES), productSheet=sheet_(VP.SHEETS.PRODUCTS);
  const cache=CacheService.getDocumentCache(), cacheKey=['DASH202',range.dateFrom,range.dateTo,range.store,range.channel,salesSheet.getLastRow(),expenseSheet.getLastRow(),productSheet.getLastRow()].join('|'), cached=cache.get(cacheKey); if(cached)return JSON.parse(cached);
  const sales=filteredSales_(range,salesSheet), expenses=filteredExpenses_(range,expenseSheet), products=dataRows_(productSheet,38).filter(r=>r[0]&&r[35]!==false);
  const revenue=round2_(sum_(sales,14)), discounts=round2_(sum_(sales,13)), confirmed=sales.filter(r=>r[17]==='Potwierdzony'&&r[18]!==''), margin=round2_(sum_(confirmed,18));
  const expense=round2_(expenses.reduce((s,r)=>s+allocatedExpense_(r,range.store),0)), result=round2_(margin-expense);
  const storeRows=['TWINS PICK','VILANA VINTAGE'].filter(s=>range.store==='Oba sklepy'||range.store===s).map(store=>dashboardStore_(store,sales,expenses));
  const available=products.filter(r=>r[25]==='Dostępny'&&(range.store==='Oba sklepy'||r[1]===range.store));
  const onFair=products.filter(r=>r[25]==='Na targach'&&(range.store==='Oba sklepy'||r[1]===range.store));
  const noPhoto=available.filter(r=>!r[37]).length, unknownCost=available.filter(r=>r[19]==='Nieznany'||r[22]==='').length;
  const oldDays=Math.max(1,numberOrZero_(getSetting_('PRÓG_STAREGO_TOWARU_DNI'))||180), cutoff=new Date(); cutoff.setDate(cutoff.getDate()-oldDays);
  const oldStock=available.filter(r=>r[26] instanceof Date&&r[26]<cutoff).length;
  const highDiscount=Number(optionalNumber_(getSetting_('PRÓG_WYSOKIEGO_RABATU'))||0.2), highDiscountSales=sales.filter(r=>numberOrZero_(r[10])>0&&numberOrZero_(r[13])/numberOrZero_(r[10])>=highDiscount).length;
  const publicRange={dateFrom:range.dateFrom,dateTo:range.dateTo,store:range.store,channel:range.channel},units=sales.reduce((s,r)=>s+saleUnits_(r),0),confirmedUnits=confirmed.reduce((s,r)=>s+saleUnits_(r),0),resultData={range:publicRange,summary:{revenue,count:units,average:units>0?round2_(revenue/units):0,discounts,margin,expenses:expense,result,confirmedShare:units>0?Math.max(0,Math.min(1,confirmedUnits/units)):1},stores:storeRows,
    channels:groupMoney_(sales,8,14),payments:groupMoney_(sales,15,14),stock:{available:available.length,tagValue:round2_(sum_(available,17)),onFair:onFair.length,noPhoto,unknownCost,oldStock},
    alerts:[noPhoto?`${noPhoto} produktów bez zdjęcia`:'',unknownCost?`${unknownCost} dostępnych produktów bez potwierdzonego kosztu`:'',oldStock?`${oldStock} produktów na stanie dłużej niż ${oldDays} dni`:'',highDiscountSales?`${highDiscountSales} sprzedaży z wysokim rabatem`:''].filter(Boolean)};
  const json=JSON.stringify(resultData); if(json.length<90000)cache.put(cacheKey,json,600); return resultData;
}

function getAnalyticsData(input) {
  assertAuthorized_();const range=reportRange_(input||{}),sh=sheet_(VP.SHEETS.SALES),last=sh.getLastRow(),ps=sheet_(VP.SHEETS.PRODUCTS),cache=CacheService.getDocumentCache(),cacheKey=['ANA210',range.dateFrom,range.dateTo,range.store,range.channel,last,ps.getLastRow()].join('|'),cached=cache.get(cacheKey);if(cached)return JSON.parse(cached);
  const rows=last<2?[]:sh.getRange(2,1,last-1,25).getValues(),start=range.start.getTime(),end=range.end.getTime()+86399999,maps={categories:{},products:{},brands:{},days:{},weekdays:{},months:{},seasons:{},channels:{},payments:{},fairs:{},stores:{},discounts:{}},weekdayNames=['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota'];let total=0,revenue=0,discounts=0;
  const add=(map,label,r)=>{label=clean_(label);if(!label)return;const x=map[label]||(map[label]={label,count:0,revenue:0,discount:0});x.count+=saleUnits_(r);x.revenue+=numberOrZero_(r[14]);x.discount+=numberOrZero_(r[13]);};
  rows.forEach(r=>{if(!r[0]||r[20]==='Anulowana')return;const d=r[2]||r[1],date=d instanceof Date?d:new Date(d);if(isNaN(date.getTime())||date.getTime()<start||date.getTime()>end)return;if(range.store!=='Oba sklepy'&&r[3]!==range.store)return;if(range.channel!=='Wszystkie'&&r[8]!==range.channel)return;const units=saleUnits_(r),price=numberOrZero_(r[14]),disc=numberOrZero_(r[13]);total+=units;revenue+=price;discounts+=disc;const day=localDateKey_(date),month=day.slice(0,7),m=date.getMonth()+1,season=m===12||m<=2?'Zima':m<=5?'Wiosna':m<=8?'Lato':'Jesień',pct=numberOrZero_(r[10])?disc/numberOrZero_(r[10]):0,bucket=pct<=0?'Bez rabatu':pct<=.10?'Do 10%':pct<=.15?'11–15%':pct<=.20?'16–20%':'Powyżej 20%';add(maps.categories,r[7],r);add(maps.products,r[5],r);add(maps.brands,r[6],r);add(maps.days,day,r);add(maps.weekdays,weekdayNames[date.getDay()],r);add(maps.months,month,r);add(maps.seasons,season,r);add(maps.channels,r[8],r);add(maps.payments,r[15],r);add(maps.fairs,r[9],r);add(maps.stores,r[3],r);add(maps.discounts,bucket,r);});
  const finish=(map,max,sort=true)=>{const out=Object.values(map).map(x=>({label:x.label,count:x.count,revenue:round2_(x.revenue),average:x.count>0?round2_(x.revenue/x.count):0,discount:round2_(x.discount)}));if(sort)out.sort((a,b)=>b.revenue-a.revenue||b.count-a.count);return out.slice(0,max);},dayCounts={};for(let d=new Date(range.start);d<=range.end;d.setDate(d.getDate()+1)){const n=weekdayNames[d.getDay()];dayCounts[n]=(dayCounts[n]||0)+1;}const weekdayPerformance=['Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota','Niedziela'].map(label=>{const x=maps.weekdays[label]||{count:0,revenue:0,discount:0};return{label,count:x.count,revenue:round2_(x.revenue),occurrences:dayCounts[label]||0,sellingDays:Object.keys(maps.days).filter(day=>weekdayNames[new Date(`${day}T12:00:00`).getDay()]===label).length,averageCalendarDay:dayCounts[label]?round2_(x.revenue/dayCounts[label]):0,averageSale:x.count?round2_(x.revenue/x.count):0};}),productRows=dataRows_(ps,28).filter(r=>r[0]&&(range.store==='Oba sklepy'||r[1]===range.store)&&['Dostępny','Na targach','Zarezerwowany'].includes(r[25])),now=new Date(),aging={'0–30 dni':0,'31–90 dni':0,'91–180 dni':0,'Powyżej 180 dni':0,'Brak daty':0};productRows.forEach(r=>{if(!(r[26] instanceof Date)){aging['Brak daty']++;return;}const days=Math.floor((now-r[26])/86400000);aging[days<=30?'0–30 dni':days<=90?'31–90 dni':days<=180?'91–180 dni':'Powyżej 180 dni']++;});const publicRange={dateFrom:range.dateFrom,dateTo:range.dateTo,store:range.store,channel:range.channel},analysis={range:publicRange,total,summary:{revenue:round2_(revenue),count:total,average:total?round2_(revenue/total):0,discounts:round2_(discounts),discountShare:revenue+discounts?discounts/(revenue+discounts):0},topCategories:finish(maps.categories,10),topProducts:finish(maps.products,10),topBrands:finish(maps.brands,10),days:finish(maps.days,366),dailyTrend:finish(maps.days,366,false).sort((a,b)=>a.label.localeCompare(b.label)),weekdays:finish(maps.weekdays,7),weekdayPerformance,months:finish(maps.months,24,false).sort((a,b)=>a.label.localeCompare(b.label)),seasons:finish(maps.seasons,4),channels:finish(maps.channels,10),payments:finish(maps.payments,10),fairs:finish(maps.fairs,20),stores:finish(maps.stores,2),discountBuckets:finish(maps.discounts,5,false),stockAging:Object.keys(aging).map(label=>({label,count:aging[label]}))};
  const json=JSON.stringify(analysis);if(json.length<90000)cache.put(cacheKey,json,600);return analysis;
}

function saveTaxSettings(input) {
  const user=assertAuthorized_(); input=input||{};
  const tp=rate_(input.rateTP), vv=rate_(input.rateVV),vatTP=rate_(input.vatTP),vatVV=rate_(input.vatVV),base=input.base||'Przychód netto po VAT'; if(!['Przychód brutto','Przychód netto po VAT','Wynik potwierdzony'].includes(base))throw new Error('Nieprawidłowa podstawa estymacji podatku.');
  setSetting_('STAWKA_PODATKU_TP',tp);setSetting_('STAWKA_PODATKU_VV',vv);setSetting_('STAWKA_VAT_TP',vatTP);setSetting_('STAWKA_VAT_VV',vatVV);setSetting_('PODSTAWA_PODATKU',base);
  appendLog_(user,'mobile/web','ZMIANA_USTAWIEŃ_PODATKU','ustawienia','PODATEK','',JSON.stringify({tp,vv,vatTP,vatVV,base}),'Estymacja orientacyjna');
  return {ok:true,message:'Ustawienia estymacji zostały zapisane.',rates:{tp,vv,vatTP,vatVV},base};
}

function getMonthCloseData(period) {
  assertAuthorized_(); period=normalizePeriod_(period); const finance=refreshMonthlyFinance_(period), reports=dataRows_(sheet_(VP.SHEETS.DAILY),19).filter(r=>r[0]&&monthKey_(r[1])===period), openReports=reports.filter(r=>!r[18]).length;
  const saleDays=[...new Set(dataRows_(sheet_(VP.SHEETS.SALES),25).filter(r=>r[0]&&r[20]!=='Anulowana'&&monthKey_(r[2]||r[1])===period).map(r=>dateKey_(r[2]||r[1])))];
  const missingReports=saleDays.filter(day=>{const same=reports.filter(r=>dateKey_(r[1])===day&&r[18]);return !same.some(r=>r[2]==='Oba sklepy')&&!(same.some(r=>r[2]==='TWINS PICK')&&same.some(r=>r[2]==='VILANA VINTAGE'));});
  const rates={tp:rateFromSetting_('STAWKA_PODATKU_TP'),vv:rateFromSetting_('STAWKA_PODATKU_VV'),vatTP:rateFromSetting_('STAWKA_VAT_TP'),vatVV:rateFromSetting_('STAWKA_VAT_VV')},base=getSetting_('PODSTAWA_PODATKU')||'Przychód netto po VAT';
  const stores=finance.map(x=>{const rate=x.store==='TWINS PICK'?rates.tp:rates.vv,vatRate=x.store==='TWINS PICK'?rates.vatTP:rates.vatVV,vatEstimate=vatRate?round2_(Math.max(0,x.revenue)*vatRate/(1+vatRate)):0,netRevenue=round2_(x.revenue-vatEstimate),taxBase=base==='Przychód brutto'?x.revenue:base==='Wynik potwierdzony'?x.result:netRevenue;return Object.assign({},x,{taxRate:rate,vatRate,vatEstimate,netRevenue,taxBase:round2_(Math.max(0,taxBase)),taxEstimate:round2_(Math.max(0,taxBase)*rate),ready:x.status==='Kompletne'||x.status==='Zamknięte'});});
  return {period,stores,openReports,missingReports,rates,base,ready:openReports===0&&missingReports.length===0&&stores.every(x=>x.ready),warning:'Estymacja VAT i podatku jest orientacyjna i wymaga potwierdzenia przez księgowość.'};
}

function closeMonth(period) {
  const user=assertAuthorized_(), data=getMonthCloseData(period); if(data.stores.length&&data.stores.every(x=>x.status==='Zamknięte')) throw new Error('Ten miesiąc jest już zamknięty.'); if(!data.ready) throw new Error('Nie można zamknąć miesiąca: uzupełnij koszty produktów i zamknij raporty dzienne.');
  const sh=sheet_(VP.SHEETS.FINANCE), rows=dataRows_(sh,20), now=new Date(); rows.forEach((r,i)=>{if(r[0]===data.period)sh.getRange(i+2,19,1,2).setValues([[now,'Zamknięte']]);});
  appendLog_(user,'mobile/web','ZAMKNIJ_MIESIĄC','okres',data.period,'Otwarte','Zamknięte',''); return {ok:true,message:`Miesiąc ${data.period} został zamknięty.`,data:getMonthCloseData(data.period)};
}

function refreshAnalyticsSheet(input) {
  const user=assertAuthorized_(), end=new Date(), start=new Date(end.getFullYear(),end.getMonth()-11,1), data=getAnalyticsData(input||{dateFrom:dateKey_(start),dateTo:dateKey_(end),store:'Oba sklepy'}), sh=sheet_(VP.SHEETS.ANALYTICS||'10_ANALITYKA');
  sh.getCharts().forEach(c=>sh.removeChart(c));if(sh.getMaxRows()<250)sh.insertRowsAfter(sh.getMaxRows(),250-sh.getMaxRows());if(sh.getMaxColumns()<20)sh.insertColumnsAfter(sh.getMaxColumns(),20-sh.getMaxColumns());sh.getRange(1,1,250,20).clearContent();
  sh.getRange('A1:T1').breakApart().merge().setValue(`VINTAGE PRO — ANALITYKA · ${data.range.dateFrom}–${data.range.dateTo}`).setFontWeight('bold').setBackground('#eadde4');
  sh.getRange('A2:H2').setValues([['Przychód',data.summary.revenue,'Sprzedaż',data.summary.count,'Średnia',data.summary.average,'Rabaty',data.summary.discounts]]).setFontWeight('bold');sh.getRangeList(['B2','F2','H2']).setNumberFormat('#,##0.00 "zł"');sh.getRange('D2').setNumberFormat('#,##0');
  writeRanking_(sh,3,1,'NAJLEPSZE KATEGORIE',data.topCategories); writeRanking_(sh,3,6,'NAJLEPSZE NAZWY PRODUKTÓW',data.topProducts); writeRanking_(sh,3,11,'NAJLEPSZE MARKI',data.topBrands); writeRanking_(sh,3,16,'DNI TYGODNIA',data.weekdays);
  writeRanking_(sh,20,1,'NAJLEPSZE DNI',data.days); writeRanking_(sh,20,6,'MIESIĄCE',data.months); writeRanking_(sh,20,11,'PORY ROKU',data.seasons); writeRanking_(sh,20,16,'KANAŁY',data.channels);
  const base=50;sh.getRange(base,1,1,5).setValues([['Dzień tygodnia','Przychód','Liczba','Liczba dni','Średnia / dzień']]).setFontWeight('bold').setBackground('#eadde4');sh.getRange(base+1,1,7,5).setValues(data.weekdayPerformance.map(x=>[x.label,x.revenue,x.count,x.occurrences,x.averageCalendarDay]));sh.getRange(base+1,2,7,1).setNumberFormat('#,##0.00 "zł"');sh.getRange(base+1,5,7,1).setNumberFormat('#,##0.00 "zł"');
  const trendStart=60,trend=data.dailyTrend.slice(-180);sh.getRange(trendStart,1,1,3).setValues([['Data','Przychód','Liczba']]).setFontWeight('bold').setBackground('#eadde4');if(trend.length)sh.getRange(trendStart+1,1,trend.length,3).setValues(trend.map(x=>[x.label,x.revenue,x.count]));
  const chart1=sh.newChart().asColumnChart().addRange(sh.getRange(base,1,8,5)).setPosition(base,7,0,0).setOption('title','Średni przychód według dnia tygodnia').setOption('legend',{position:'bottom'}).build();sh.insertChart(chart1);if(trend.length){const chart2=sh.newChart().asLineChart().addRange(sh.getRange(trendStart,1,trend.length+1,2)).setPosition(trendStart,7,0,0).setOption('title','Trend sprzedaży dziennej').setOption('legend',{position:'none'}).build();sh.insertChart(chart2);}
  sh.autoResizeColumns(1,20); appendLog_(user,'arkusz','ODŚWIEŻ_ANALITYKĘ','arkusz','10_ANALITYKA','',JSON.stringify(data.range),'Wykresy 2.1.0'); return {ok:true,message:'Analityka i wykresy zostały odświeżone.',data};
}

function getDailySummary(dateText, scope) {
  assertAuthorized_();
  const day = parseDate_(dateText);
  scope = scope || 'Oba sklepy';
  const rows = dataRows_(sheet_(VP.SHEETS.SALES), 25).filter(r => r[0] && r[20] !== 'Anulowana' && sameDay_(r[2] || r[1], day) && (scope === 'Oba sklepy' || r[3] === scope));
  const byPayment = rows.reduce((a,r) => { const key = clean_(r[15]) || 'Inna'; a[key] = (a[key] || 0) + numberOrZero_(r[14]); return a; }, {});
  const cash = byPayment['Gotówka'] || 0, card = byPayment['Karta'] || 0;
  const total = rows.reduce((s,r) => s + numberOrZero_(r[14]), 0);
  const other = total - cash - card;
  const existing = dataRows_(sheet_(VP.SHEETS.DAILY), 19).find(r => r[0] && sameDay_(r[1], day) && r[2] === scope);
  return { date: dateKey_(day), scope, count: rows.reduce((s,r)=>s+saleUnits_(r),0), total: round2_(total), cash: round2_(cash), card: round2_(card), other: round2_(other),
    existing: existing ? { paper:existing[7], terminal:existing[8], actualCash:existing[9], status:existing[13], comment:existing[14], closed:Boolean(existing[18]) } : null };
}

function saveDailyReport(input) {
  const user = assertAuthorized_();
  input = input || {};
  const day = parseDate_(input.date), scope = input.scope || 'Oba sklepy';
  if (isMonthClosed_(monthKey_(day))) throw new Error('Ten miesiąc finansowy jest już zamknięty.');
  if (!['Oba sklepy','TWINS PICK','VILANA VINTAGE'].includes(scope)) throw new Error('Nieprawidłowy zakres raportu.');
  const summary = getDailySummary(dateKey_(day), scope);
  const paper = money_(input.paper), terminal = money_(input.terminal), actualCash = money_(input.actualCash);
  const diffPaper = round2_(paper - summary.total), diffTerminal = round2_(terminal - summary.card), diffCash = round2_(actualCash - summary.cash);
  const tolerance = Math.max(0, optionalNumber_(getSetting_('TOLERANCJA_RAPORTU')) === '' ? 0.01 : Number(optionalNumber_(getSetting_('TOLERANCJA_RAPORTU'))));
  const status = Math.max(Math.abs(diffPaper),Math.abs(diffTerminal),Math.abs(diffCash)) <= tolerance ? 'Zgodny' : 'Do wyjaśnienia';
  const sh = sheet_(VP.SHEETS.DAILY), rows = dataRows_(sh, 19);
  const index = rows.findIndex(r => r[0] && sameDay_(r[1], day) && r[2] === scope);
  if (index >= 0 && Boolean(rows[index][18])) throw new Error('Ten raport został już zamknięty i nie można go nadpisać.');
  const now = new Date(), id = index >= 0 ? rows[index][0] : uniqueId_('DAY');
  const row = [id,day,scope,summary.total,summary.cash,summary.card,summary.other,paper,terminal,actualCash,diffPaper,diffTerminal,diffCash,status,clean_(input.comment),user,index >= 0 ? rows[index][16] : now,now,Boolean(input.closed)];
  if (index >= 0) sh.getRange(index + 2,1,1,19).setValues([row]); else sh.appendRow(row);
  appendLog_(user,'mobile/web',index >= 0 ? 'AKTUALIZUJ_RAPORT_DZIENNY' : 'DODAJ_RAPORT_DZIENNY','raport',id,'',JSON.stringify({date:dateKey_(day),scope,status}),input.comment||'');
  return {ok:true,id,status,differences:{paper:diffPaper,terminal:diffTerminal,cash:diffCash},message:`Raport ${scope} zapisany: ${status}.`};
}

function createFair(input) {
  const user = assertAuthorized_(); input = input || {};
  require_(input.name,'Wpisz nazwę wydarzenia.'); require_(input.dateFrom,'Wybierz datę rozpoczęcia.');
  const from = parseDate_(input.dateFrom), to = input.dateTo ? parseDate_(input.dateTo) : from;
  if (to < from) throw new Error('Data zakończenia nie może być wcześniejsza niż rozpoczęcia.');
  const id = uniqueId_('FAIR'), now = new Date();
  sheet_(VP.SHEETS.FAIRS).appendRow([id,clean_(input.name),from,to,clean_(input.place),input.status||'Planowane',optionalMoney_(input.sharedCost),optionalMoney_(input.costTP),optionalMoney_(input.costVV),0,0,0,0,0,0,clean_(input.comment),user,now]);
  appendLog_(user,'mobile/web','DODAJ_TARGI','targi',id,'',input.name,input.comment||'');
  return {ok:true,id,message:`Utworzono wydarzenie ${input.name}.`,fairs:listFairs_()};
}

function getFairs() { assertAuthorized_(); return listFairs_(); }

function moveProductToFair(input) {
  return moveProduct_(input, true);
}

function returnProductFromFair(input) {
  return moveProduct_(input, false);
}

function moveProduct_(input, outbound) {
  const user = assertAuthorized_(); input = input || {};
  require_(input.productId,'Wybierz produkt.'); require_(input.eventId,'Wybierz targi.');
  const lock = LockService.getDocumentLock(); lock.waitLock(20000);
  try {
    const fair = findFair_(input.eventId); if (!fair) throw new Error('Nie znaleziono wydarzenia targowego.');
    if (['Zakończone','Anulowane'].includes(fair.status)) throw new Error('To wydarzenie jest już zamknięte.');
    const sh = sheet_(VP.SHEETS.PRODUCTS), rows = dataRows_(sh,42), index = rows.findIndex(r => String(r[0]) === String(input.productId));
    if (index < 0) throw new Error('Nie znaleziono produktu.');
    const r = rows[index], now = new Date(), rowNo = index + 2;
    if (outbound && r[25] !== 'Dostępny') throw new Error(`Produkt ma status „${r[25]}” i nie może zostać wydany.`);
    if (!outbound && (r[25] !== 'Na targach' || String(r[24]) !== String(input.eventId))) throw new Error('Produkt nie znajduje się na wybranych targach.');
    const source = r[23], target = outbound ? `Targi: ${fair.name}` : r[1];
    sh.getRange(rowNo,24,1,13).setValues([[target,outbound ? input.eventId : '',outbound ? 'Na targach' : 'Dostępny',r[26],r[27],r[28],r[29],r[30],r[31],r[32],now,user,r[35]]]);
    const moveId = uniqueId_('MOVE');
    sheet_(VP.SHEETS.MOVES).appendRow([moveId,now,r[0],r[1],outbound?'Wydanie na targi':'Powrót z targów',source,target,input.eventId,'Nie dotyczy',clean_(input.comment),user,now,input.eventId]);
    refreshFairStats_(input.eventId);
    appendLog_(user,'mobile/web',outbound?'WYDANIE_NA_TARGI':'POWRÓT_Z_TARGÓW','produkt',r[0],source,target,input.comment||'');
    return {ok:true,moveId,message:outbound?`Przeniesiono ${r[2]} na ${fair.name}.`:`Przywrócono ${r[2]} do ${r[1]}.`};
  } finally { lock.releaseLock(); }
}

function closeFair(eventId) {
  const user = assertAuthorized_(); require_(eventId,'Wybierz targi.');
  const sh = sheet_(VP.SHEETS.PRODUCTS), remaining = dataRows_(sh,42).filter(r => r[25] === 'Na targach' && String(r[24]) === String(eventId));
  if (remaining.length) throw new Error(`Najpierw zwróć ${remaining.length} niesprzedanych produktów z targów.`);
  const fairs = sheet_(VP.SHEETS.FAIRS), rows = dataRows_(fairs,18), index = rows.findIndex(r => String(r[0]) === String(eventId));
  if (index < 0) throw new Error('Nie znaleziono wydarzenia.');
  refreshFairStats_(eventId); fairs.getRange(index+2,6).setValue('Zakończone');
  appendLog_(user,'mobile/web','ZAMKNIJ_TARGI','targi',eventId,rows[index][5],'Zakończone','');
  return {ok:true,message:'Targi zostały zamknięte.',fairs:listFairs_()};
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
    hasDefect:r[13], defect:r[15], tagPrice:r[17], location:r[23], eventId:r[24], status:r[25], comment:r[29], important:r[30],
    photoUrl:r[37] || '', photoId:r[38] || '', photoThumb:photoThumb_(r[38],r[37]), photoStatus:r[41] || ''
  }));
}

function searchInventory(query, store, status) {
  assertAuthorized_(); const q=normalize_(query), rows=dataRows_(sheet_(VP.SHEETS.PRODUCTS),42);
  return rows.filter(r=>r[0]&&r[35]!==false&&(!store||store==='Oba sklepy'||r[1]===store)&&(!status||status==='Wszystkie'||r[25]===status)&&(!q||normalize_([r[0],r[2],r[3],r[4],r[7],r[8],r[10],r[11],r[12],r[15],r[23],r[25],r[29]].join(' ')).includes(q))).slice(0,100).map(productDto_);
}

function getProductPhoto(productId) {
  assertAuthorized_();
  require_(productId, 'Brak ID produktu.');
  const rows = dataRows_(sheet_(VP.SHEETS.PRODUCTS), 42);
  const row = rows.find(r => clean_(r[0]) === clean_(productId));
  if (!row) throw new Error('Nie znaleziono produktu.');
  const fileId = clean_(row[38]) || ((clean_(row[37]).match(/[-\w]{20,}/) || [])[0] || '');
  if (!fileId) return { ok:false, message:'Ten produkt nie ma zapisanego zdjęcia.' };
  try {
    const blob = DriveApp.getFileById(fileId).getBlob();
    const mime = blob.getContentType() || 'image/jpeg';
    if (!/^image\//i.test(mime)) throw new Error('Zapisany plik nie jest obrazem.');
    return { ok:true, dataUrl:`data:${mime};base64,${Utilities.base64Encode(blob.getBytes())}`, url:row[37] || '' };
  } catch (e) {
    throw new Error(`Nie udało się pobrać zdjęcia produktu: ${e.message}`);
  }
}

function getRecentSales(query, store, limit) {
  assertAuthorized_(); const q=normalize_(query), rows=dataRows_(sheet_(VP.SHEETS.SALES),25), max=Math.min(Math.max(Number(limit)||50,1),100);
  return rows.filter(r=>r[0]&&(!store||store==='Oba sklepy'||r[3]===store)&&(!q||normalize_([r[0],r[4],r[5],r[6],r[7],r[19],r[24]].join(' ')).includes(q))).sort((a,b)=>new Date(b[1])-new Date(a[1])).slice(0,max).map(r=>({id:r[0],date:dateKey_(r[2]||r[1]),dateTime:r[1] instanceof Date?r[1].toISOString():String(r[1]),store:r[3],productId:r[4],name:r[5],brand:r[6],category:r[7],channel:r[8],eventId:r[9],tagPrice:numberOrZero_(r[10]),discount:numberOrZero_(r[13]),price:numberOrZero_(r[14]),payment:r[15],margin:r[18],comment:r[19],status:r[20],correctionTo:r[23],reason:r[24]}));
}

function changeProductStatus(input) {
  const user=assertAuthorized_(); input=input||{}; require_(input.productId,'Wybierz produkt.'); require_(input.status,'Wybierz nowy status.');
  const transitions={Dostępny:['Zarezerwowany','Do naprawy','Wycofany','Zagubiony / brak'],Zarezerwowany:['Dostępny','Wycofany'],Zwrócony:['Dostępny','Do naprawy','Wycofany'],'Do naprawy':['Dostępny','Wycofany'],'Zagubiony / brak':['Dostępny','Wycofany']};
  const lock=LockService.getDocumentLock();lock.waitLock(20000);try{const sh=sheet_(VP.SHEETS.PRODUCTS), rows=dataRows_(sh,42), i=rows.findIndex(r=>String(r[0])===String(input.productId));if(i<0)throw new Error('Nie znaleziono produktu.');const r=rows[i],allowed=transitions[r[25]]||[];if(!allowed.includes(input.status))throw new Error(`Zmiana „${r[25]}” → „${input.status}” nie jest dozwolona.`);const now=new Date(),comment=[clean_(r[29]),clean_(input.comment)].filter(Boolean).join(' | ');sh.getRange(i+2,24,1,13).setValues([[input.status==='Dostępny'?r[1]:r[23],input.status==='Dostępny'?'':r[24],input.status,r[26],r[27],r[28],comment,r[30],r[31],r[32],now,user,r[35]]]);sheet_(VP.SHEETS.MOVES).appendRow([uniqueId_('MOVE'),now,r[0],r[1],statusMoveType_(r[25],input.status),r[23],input.status==='Dostępny'?r[1]:input.status,r[24],'Nie dotyczy',clean_(input.comment),user,now,'']);appendLog_(user,'mobile/web','ZMIANA_STATUSU','produkt',r[0],r[25],input.status,input.comment||'');return{ok:true,message:`Status produktu zmieniono na „${input.status}”.`};}finally{lock.releaseLock();}
}

function updateProduct(input) {
  const user=assertAuthorized_();input=input||{};require_(input.productId,'Brak ID produktu.');require_(input.name,'Nazwa produktu jest wymagana.');require_(input.category,'Kategoria jest wymagana.');
  const lock=LockService.getDocumentLock();lock.waitLock(20000);try{const sh=sheet_(VP.SHEETS.PRODUCTS),rows=dataRows_(sh,42),i=rows.findIndex(r=>String(r[0])===String(input.productId));if(i<0)throw new Error('Nie znaleziono produktu.');const r=rows[i],now=new Date(),defect=Boolean(input.hasDefect);if(defect&&!clean_(input.defectDescription))throw new Error('Opisz wadę produktu.');const purchase=optionalMoney_(input.purchaseCost),materials=optionalMoney_(input.materialCost),labor=optionalMoney_(input.laborCost),costStatus=input.costStatus||'Nieznany',total=costStatus==='Nieznany'?'':numberOrZero_(purchase)+numberOrZero_(materials)+numberOrZero_(labor);const fields=[clean_(input.name),clean_(input.brand),input.category,clean_(input.subcategory),input.origin||r[6],clean_(input.style),clean_(input.materials),clean_(input.composition),clean_(input.size),clean_(input.color),input.condition||r[12],defect,clean_(input.defectType),clean_(input.defectDescription),Boolean(input.defectInPrice),money_(input.tagPrice),purchase,costStatus,materials,labor,total];sh.getRange(i+2,3,1,21).setValues([fields]);sh.getRange(i+2,30,1,8).setValues([[clean_(input.comment),Boolean(input.important),r[31],r[32],now,user,r[35],searchKey_(input)]]);appendLog_(user,'mobile/web','EDYTUJ_PRODUKT','produkt',r[0],JSON.stringify({name:r[2],price:r[17]}),JSON.stringify({name:input.name,price:input.tagPrice}),input.comment||'');return{ok:true,message:`Zapisano zmiany produktu ${r[0]}.`};}finally{lock.releaseLock();}
}

function cancelSale(input) { return reverseSale_(input,false); }
function returnSale(input) { return reverseSale_(input,true); }

function reverseSale_(input,isReturn) {
  const user=assertAuthorized_();input=input||{};require_(input.saleId,'Wybierz transakcję.');require_(input.reason,'Wpisz powód operacji.');const now=new Date();if(isMonthClosed_(monthKey_(now)))throw new Error('Bieżący miesiąc finansowy jest zamknięty.');
  const lock=LockService.getDocumentLock();lock.waitLock(20000);try{const sales=sheet_(VP.SHEETS.SALES),rows=dataRows_(sales,25),i=rows.findIndex(r=>String(r[0])===String(input.saleId));if(i<0)throw new Error('Nie znaleziono transakcji.');const s=rows[i];if(!isReturn&&isMonthClosed_(monthKey_(s[2]||s[1])))throw new Error('Nie można anulować wpisu z zamkniętego miesiąca. Użyj zwrotu klienta w bieżącym okresie.');if(s[20]!=='Aktywna')throw new Error(`Transakcja ma status „${s[20]}” i nie może zostać zmieniona.`);if(s[23])throw new Error('Nie można korygować wiersza korekty.');const products=sheet_(VP.SHEETS.PRODUCTS),pr=dataRows_(products,42),pi=pr.findIndex(r=>String(r[0])===String(s[4]));if(pi<0)throw new Error('Nie znaleziono produktu powiązanego ze sprzedażą.');const p=pr[pi];if(String(p[28])!==String(s[0]))throw new Error('Produkt nie jest już powiązany z tą transakcją. Operacja została zatrzymana.');
    if(isReturn){const correctionId=uniqueId_('CORR'),cost=s[16]===''?'':-numberOrZero_(s[16]),margin=s[18]===''?'':-numberOrZero_(s[18]);sales.getRange(i+2,21).setValue('Skorygowana');sales.appendRow([correctionId,now,now,s[3],s[4],s[5],s[6],s[7],s[8],s[9],0,'Zwrot klienta','',0,-numberOrZero_(s[14]),s[15],cost,s[17],margin,clean_(input.reason),'Aktywna',user,now,s[0],clean_(input.reason)]);products.getRange(pi+2,24,1,13).setValues([[s[3],'','Zwrócony',p[26],now,correctionId,[clean_(p[29]),`Zwrot: ${clean_(input.reason)}`].filter(Boolean).join(' | '),true,p[31],p[32],now,user,p[35]]]);sheet_(VP.SHEETS.MOVES).appendRow([uniqueId_('MOVE'),now,p[0],p[1],'Zwrot klienta','Klient','Kontrola zwrotu','', 'Nie dotyczy',clean_(input.reason),user,now,correctionId]);appendLog_(user,'mobile/web','ZWROT_KLIENTA','sprzedaż',s[0],'Aktywna','Skorygowana',input.reason);refreshMonthlyFinance_(monthKey_(now));return{ok:true,message:`Zapisano zwrot ${moneyText_(s[14])}. Produkt oczekuje na kontrolę.`};}
    sales.getRange(i+2,21,1,5).setValues([['Anulowana',s[21],s[22],s[23],clean_(input.reason)]]);products.getRange(pi+2,24,1,13).setValues([[p[1],'','Dostępny',p[26],'','',p[29],p[30],p[31],p[32],now,user,p[35]]]);sheet_(VP.SHEETS.MOVES).appendRow([uniqueId_('MOVE'),now,p[0],p[1],'Korekta','Klient',p[1],'','Nie dotyczy',clean_(input.reason),user,now,s[0]]);appendLog_(user,'mobile/web','ANULUJ_SPRZEDAŻ','sprzedaż',s[0],'Aktywna','Anulowana',input.reason);refreshMonthlyFinance_(monthKey_(s[2]||s[1]));return{ok:true,message:'Sprzedaż została anulowana, a produkt wrócił do stanu.'};
  }finally{lock.releaseLock();}
}

function sellProduct(input) {
  const user = assertAuthorized_();
  input = input || {};
  require_(input.productId, 'Wybierz produkt.');
  require_(input.payment, 'Wybierz formę płatności.');
  const finalPrice = money_(input.finalPrice);
  if (isMonthClosed_(monthKey_(new Date()))) throw new Error('Bieżący miesiąc finansowy jest zamknięty.');
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
    const saleEventId = input.eventId || r[24] || '';
    const saleLocation = channel === 'Targi' ? (r[25] === 'Na targach' ? r[23] : `Targi: ${(findFair_(saleEventId)||{}).name||saleEventId}`) : r[1];
    products.getRange(rowNo, 24, 1, 13).setValues([[saleLocation, saleEventId, channel === 'Targi' ? 'Sprzedany na targach' : 'Sprzedany w sklepie', r[26], now, saleId, r[29], r[30], r[31], r[32], now, user, r[35]]]);
    sheet_(VP.SHEETS.MOVES).appendRow([uniqueId_('MOVE'),now,r[0],r[1],'Sprzedaż',r[23],'Klient',input.eventId||r[24]||'','Nie dotyczy',clean_(input.comment),user,now,saleId]);
    if (channel === 'Targi') refreshFairStats_(saleEventId);
    appendLog_(user, 'mobile/web', 'SPRZEDAJ_PRODUKT', 'produkt', r[0], r[25], channel === 'Targi' ? 'Sprzedany na targach' : 'Sprzedany w sklepie', input.comment || '');
    refreshMonthlyFinance_(monthKey_(now));
    return { ok:true, saleId, discountValue, message:`Sprzedano ${r[2]} za ${finalPrice.toFixed(2)} zł.` };
  } finally { lock.releaseLock(); }
}

function quickSellProduct(input) {
  assertAuthorized_();
  if (isMonthClosed_(monthKey_(new Date()))) throw new Error('Bieżący miesiąc finansowy jest zamknięty.');
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
  require_(input.category, 'Wybierz kategorię wydatku.');
  const gross = money_(input.grossAmount);
  if (gross <= 0) throw new Error('Kwota wydatku musi być większa od zera.');
  const costType = input.costType || 'Wspólny';
  if (costType === 'Indywidualny' && !input.store) throw new Error('Wskaż sklep, którego dotyczy koszt indywidualny.');
  const shareTP = costType === 'Wspólny' ? 0.5 : (input.store === 'TWINS PICK' ? 1 : 0);
  const shareVV = costType === 'Wspólny' ? 0.5 : (input.store === 'VILANA VINTAGE' ? 1 : 0);
  if (Math.abs(shareTP + shareVV - 1) > 0.0001) throw new Error('Udziały kosztu muszą sumować się do 100%.');
  const id = uniqueId_('EXP'), now = new Date();
  const costTP = Math.round(gross * shareTP * 100) / 100, costVV = Math.round(gross * shareVV * 100) / 100;
  const reimbursement = input.paidBy === 'Lana' ? costTP : (input.paidBy === 'Twinsy' ? costVV : 0);
  const attachment = input.attachmentDataUrl ? saveAttachment_(input.attachmentDataUrl,id,input.attachmentName) : null;
  const period = input.month || monthKey_(input.date ? parseDate_(input.date) : now);
  if (isMonthClosed_(period)) throw new Error('Ten miesiąc finansowy jest już zamknięty.');
  const settlementStatus = reimbursement > 0 ? 'Nierozliczone' : 'Nie wymaga rozliczenia';
  sheet_(VP.SHEETS.EXPENSES).appendRow([id,input.date?parseDate_(input.date):now,period,clean_(input.description),input.category,costType,input.accountingClass||'Do potwierdzenia',
    optionalMoney_(input.netAmount),optionalMoney_(input.vatAmount),gross,input.paidBy,input.payment||'',shareTP,shareVV,costTP,costVV,reimbursement,settlementStatus,0,'','',input.documentType||'',clean_(input.invoiceTo),input.taxCost||'Do potwierdzenia',input.eventId||'','','',clean_(input.comment),user,now]);
  const rowNo = sheet_(VP.SHEETS.EXPENSES).getLastRow();
  sheet_(VP.SHEETS.EXPENSES).getRange(rowNo,18).setValue(settlementStatus);
  if (attachment) sheet_(VP.SHEETS.EXPENSES).getRange(rowNo,26,1,2).setValues([[attachment.url,attachment.id]]);
  appendLog_(user,'mobile/web','DODAJ_WYDATEK','wydatek',id,'',JSON.stringify({gross,paidBy:input.paidBy}),input.comment||'');
  refreshMonthlyFinance_(period);
  return {ok:true,id,reimbursement,message:`Dodano wydatek ${gross.toFixed(2)} zł${reimbursement?` · do rozliczenia ${reimbursement.toFixed(2)} zł`:''}.`};
}

function getSettlementSummary(period) {
  assertAuthorized_();
  period = normalizePeriod_(period);
  const expenses = dataRows_(sheet_(VP.SHEETS.EXPENSES),30).filter(r=>r[0] && normalizePeriod_(r[2] || monthKey_(r[1])) === period);
  const settlements = dataRows_(sheet_(VP.SHEETS.SETTLEMENTS),20).filter(r=>r[0] && normalizePeriod_(r[2]) === period && r[11] === 'Aktywne');
  const expenseBalance = expenses.reduce((s,r)=>{
    const open=Math.max(0,numberOrZero_(r[16])-numberOrZero_(r[18]));
    return s+(r[10]==='Lana'?open:r[10]==='Twinsy'?-open:0);
  },0);
  const balance=round2_(expenseBalance), direction=balance>0?'Twinsy → Lana':balance<0?'Lana → Twinsy':'Rozliczone';
  const total=expenses.reduce((s,r)=>s+numberOrZero_(r[9]),0), shared=expenses.filter(r=>r[5]==='Wspólny').reduce((s,r)=>s+numberOrZero_(r[9]),0);
  return {period,count:expenses.length,total:round2_(total),shared:round2_(shared),costTP:round2_(expenses.reduce((s,r)=>s+numberOrZero_(r[14]),0)),costVV:round2_(expenses.reduce((s,r)=>s+numberOrZero_(r[15]),0)),paidLana:round2_(expenses.filter(r=>r[10]==='Lana').reduce((s,r)=>s+numberOrZero_(r[9]),0)),paidTwinsy:round2_(expenses.filter(r=>r[10]==='Twinsy').reduce((s,r)=>s+numberOrZero_(r[9]),0)),balance,direction,finance:refreshMonthlyFinance_(period),settlements:settlements.map(r=>({id:r[0],date:dateKey_(r[1]),payer:r[3],recipient:r[4],amount:numberOrZero_(r[5]),method:r[6],comment:r[10]}))};
}

function addSettlement(input) {
  const user=assertAuthorized_(); input=input||{}; const period=normalizePeriod_(input.period), summary=getSettlementSummary(period), amount=money_(input.amount);
  require_(input.payer,'Wybierz płatnika.'); require_(input.recipient,'Wybierz odbiorcę.');
  if(input.payer===input.recipient) throw new Error('Płatnik i odbiorca muszą być różni.');
  if(amount<=0) throw new Error('Kwota rozliczenia musi być większa od zera.');
  const expectedPayer=summary.balance>0?'Twinsy':summary.balance<0?'Lana':'', expectedRecipient=summary.balance>0?'Lana':summary.balance<0?'Twinsy':'';
  if(!expectedPayer) throw new Error('Ten okres jest już rozliczony.');
  if(input.payer!==expectedPayer || input.recipient!==expectedRecipient) throw new Error(`Aktualny kierunek rozliczenia to ${summary.direction}.`);
  if(amount>Math.abs(summary.balance)+0.01) throw new Error(`Kwota przekracza saldo ${Math.abs(summary.balance).toFixed(2)} zł.`);
  const id=uniqueId_('SET'), now=new Date(), after=round2_(Math.abs(summary.balance)-amount);
  sheet_(VP.SHEETS.SETTLEMENTS).appendRow([id,input.date?parseDate_(input.date):now,period,input.payer,input.recipient,amount,input.method||'Przelew','',Math.abs(summary.balance),after,clean_(input.comment),'Aktywne',user,now,'','','','',Boolean(input.approved),input.approved?user:'']);
  allocateSettlement_(period,input.recipient,amount,input.method,now);
  appendLog_(user,'mobile/web','DODAJ_ROZLICZENIE','rozliczenie',id,summary.balance,after,input.comment||'');
  return {ok:true,id,message:`Zapisano rozliczenie ${amount.toFixed(2)} zł (${input.payer} → ${input.recipient}).`,summary:getSettlementSummary(period)};
}

function allocateSettlement_(period, creditor, amount, method, date) {
  const sh=sheet_(VP.SHEETS.EXPENSES), rows=dataRows_(sh,30); let left=amount;
  rows.forEach((r,i)=>{
    if(left<=0 || !r[0] || normalizePeriod_(r[2]||monthKey_(r[1]))!==period || r[10]!==creditor) return;
    const due=Math.max(0,numberOrZero_(r[16])-numberOrZero_(r[18])); if(!due) return;
    const applied=Math.min(left,due), returned=round2_(numberOrZero_(r[18])+applied), status=returned+0.01>=numberOrZero_(r[16])?'Rozliczone':'Częściowo rozliczone';
    sh.getRange(i+2,18,1,4).setValues([[status,returned,date,method||'Przelew']]); left=round2_(left-applied);
  });
}

function refreshMonthlyFinance_(period) {
  period=normalizePeriod_(period); const now=new Date();
  const sales=dataRows_(sheet_(VP.SHEETS.SALES),25).filter(r=>r[0]&&r[20]!=='Anulowana'&&monthKey_(r[2]||r[1])===period);
  const expenses=dataRows_(sheet_(VP.SHEETS.EXPENSES),30).filter(r=>r[0]&&normalizePeriod_(r[2]||monthKey_(r[1]))===period);
  const sh=sheet_(VP.SHEETS.FINANCE), existing=dataRows_(sh,20), output=[];
  ['TWINS PICK','VILANA VINTAGE'].forEach(store=>{
    const ss=sales.filter(r=>r[3]===store), known=ss.filter(r=>r[17]==='Potwierdzony'&&r[16]!==''), unknown=ss.filter(r=>r[17]!=='Potwierdzony'||r[16]==='');
    const revenue=round2_(ss.reduce((s,r)=>s+numberOrZero_(r[14]),0)), discounts=round2_(ss.reduce((s,r)=>s+numberOrZero_(r[13]),0));
    const cogs=round2_(known.reduce((s,r)=>s+numberOrZero_(r[16]),0)), unknownRevenue=round2_(unknown.reduce((s,r)=>s+numberOrZero_(r[14]),0)), margin=round2_(known.reduce((s,r)=>s+numberOrZero_(r[18]),0));
    const col=store==='TWINS PICK'?14:15, individual=round2_(expenses.filter(r=>r[5]==='Indywidualny').reduce((s,r)=>s+numberOrZero_(r[col]),0)), shared=round2_(expenses.filter(r=>r[5]==='Wspólny').reduce((s,r)=>s+numberOrZero_(r[col]),0));
    const result=round2_(margin-individual-shared), shop=round2_(ss.filter(r=>r[8]==='Sklep stacjonarny').reduce((s,r)=>s+numberOrZero_(r[14]),0)), fairs=round2_(ss.filter(r=>r[8]==='Targi').reduce((s,r)=>s+numberOrZero_(r[14]),0));
    const cash=round2_(ss.filter(r=>r[15]==='Gotówka').reduce((s,r)=>s+numberOrZero_(r[14]),0)), card=round2_(ss.filter(r=>r[15]==='Karta').reduce((s,r)=>s+numberOrZero_(r[14]),0)), other=round2_(revenue-cash-card);
    const old=existing.find(r=>r[0]&&normalizePeriod_(r[0])===period&&r[1]===store), status=old&&old[19]==='Zamknięte'?'Zamknięte':unknown.length?'Niepełne':'Kompletne';
    const units=ss.reduce((s,r)=>s+saleUnits_(r),0),knownUnits=known.reduce((s,r)=>s+saleUnits_(r),0),safeUnits=Math.max(0,units),complete=safeUnits?Math.max(0,Math.min(1,knownUnits/safeUnits)):1;
    const row=[period,store,revenue,discounts,cogs,unknownRevenue,margin,individual,shared,result,units,shop,fairs,cash,card,other,complete,unknown.length?`${unknown.length} zapisów bez potwierdzonego kosztu`:'',now,status];
    const index=existing.findIndex(r=>r[0]&&normalizePeriod_(r[0])===period&&r[1]===store); if(index>=0)sh.getRange(index+2,1,1,20).setValues([row]);else sh.appendRow(row);
    output.push({store,revenue,discounts,cogs,unknownRevenue,margin,individual,shared,result,count:units,shop,fairs,cash,card,other,completeness:complete,status:row[19]});
  }); return output;
}

function previewLegacySales() {
  assertAuthorized_(); const ss=book_(), existing=new Set(dataRows_(sheet_(VP.SHEETS.SALES),25).map(r=>String(r[0]))), details=[];let total=0,already=0,invalid=0;
  ss.getSheets().filter(sh=>/^Sprzedaż\s+(?!wzór)/i.test(sh.getName())).forEach(sh=>{const rows=sh.getDataRange().getValues();let count=0,old=0,bad=0,lastDate=null;for(let i=2;i<rows.length;i++){const r=rows[i];if(r[0])lastDate=validDate_(r[0]);[['TP',1,2],['VV',4,5]].forEach(x=>{if(!clean_(r[x[1]]))return;const id=`LEGSALE-${sh.getSheetId()}-${i+1}-${x[0]}`;if(existing.has(id)){old++;already++;return;}if(!lastDate||legacyAmount_(r[x[2]])===null){bad++;invalid++;return;}count++;total++;});}details.push({sheet:sh.getName(),newRows:count,alreadyImported:old,invalid:bad});});return{total,already,invalid,details};
}

function importLegacySales() {
  const user=assertAuthorized_();assertRecentBackup_();const lock=LockService.getDocumentLock();lock.waitLock(30000);try{const ss=book_(),salesSh=sheet_(VP.SHEETS.SALES),productsSh=sheet_(VP.SHEETS.PRODUCTS),existingSales=new Set(dataRows_(salesSh,25).map(r=>String(r[0]))),productIds=dataRows_(productsSh,42).map(r=>String(r[0])),counters={TP:maxNumericId_(productIds,'TP'),VV:maxNumericId_(productIds,'VV')},productRows=[],saleRows=[],periods=new Set(),now=new Date(),limit=100;
    ss.getSheets().filter(sh=>/^Sprzedaż\s+(?!wzór)/i.test(sh.getName())).forEach(sh=>{
      const rows=sh.getDataRange().getValues();let lastDate=null;
      for(let i=2;i<rows.length;i++){
        const r=rows[i];if(r[0])lastDate=validDate_(r[0]);
        [['TP','TWINS PICK',1,2,3],['VV','VILANA VINTAGE',4,5,6]].forEach(x=>{
          if(saleRows.length>=limit)return;const name=clean_(r[x[2]]),price=legacyAmount_(r[x[3]]);if(!name)return;
          const saleId=`LEGSALE-${sh.getSheetId()}-${i+1}-${x[0]}`;if(existingSales.has(saleId)||!lastDate||price===null)return;
          const productId=`${x[0]}-${String(++counters[x[0]]).padStart(6,'0')}`,category=inferCategory_(name),payment=normalizePayment_(r[x[4]]),source=`${sh.getName()} · wiersz ${i+1}`;
          productRows.push(legacyProductRow_(productId,x[1],name,category,price,lastDate,saleId,user,now,source));
          saleRows.push([saleId,lastDate,lastDate,x[1],productId,name,'',category,'Sklep stacjonarny','',price,'Brak','',0,price,payment,'','Nieznany','',`Import historyczny: ${source}`,'Aktywna',user,now,'','']);
          existingSales.add(saleId);periods.add(monthKey_(lastDate));
        });
      }
    });
    appendRows_(productsSh,productRows,42);appendRows_(salesSh,saleRows,25);SpreadsheetApp.flush();const remaining=previewLegacySales().total,done=remaining===0,reports=done?rebuildLegacyDailyReports_(user):0;appendLog_(user,'arkusz','IMPORT_HISTORII_SPRZEDAŻY_PARTIA','import','legacy-sales','',JSON.stringify({sales:saleRows.length,products:productRows.length,remaining,periods:[...periods]}),'Import partiami');return{ok:true,batch:saleRows.length,remaining,done,message:done?`Import zakończony. Ostatnia partia: ${saleRows.length}; raporty archiwalne: ${reports}.`:`Zaimportowano partię ${saleRows.length} rekordów. Pozostało około ${remaining}.`};
  }finally{lock.releaseLock();}
}

function rebuildLegacyDailyReports_(user){
  const rows=dataRows_(sheet_(VP.SHEETS.SALES),25).filter(r=>String(r[0]).startsWith('LEGSALE-')&&r[20]!=='Anulowana'),daily={};rows.forEach(r=>{const day=dateKey_(r[2]||r[1]),payment=r[15],price=numberOrZero_(r[14]);if(!day)return;daily[day]=daily[day]||{date:r[2]||r[1],total:0,cash:0,card:0,other:0};daily[day].total+=price;if(payment==='Gotówka')daily[day].cash+=price;else if(payment==='Karta')daily[day].card+=price;else daily[day].other+=price;});
  const sh=sheet_(VP.SHEETS.DAILY),existing=dataRows_(sh,19),now=new Date(),append=[];Object.keys(daily).forEach(day=>{const d=daily[day],row=[uniqueId_('DAY'),d.date,'Oba sklepy',round2_(d.total),round2_(d.cash),round2_(d.card),round2_(d.other),round2_(d.total),round2_(d.card),round2_(d.cash),0,0,0,'Zgodny','Automatyczny raport z importu historycznego',user,now,now,true],i=existing.findIndex(r=>r[0]&&dateKey_(r[1])===day&&r[2]==='Oba sklepy'&&String(r[14]).includes('importu historycznego'));if(i>=0){row[0]=existing[i][0];sh.getRange(i+2,1,1,19).setValues([row]);}else append.push(row);});appendRows_(sh,append,19);return Object.keys(daily).length;
}

function previewLegacyExpenses() {
  assertAuthorized_();const sourceId=getSetting_('LEGACY_EXPENSE_SPREADSHEET_ID');if(!sourceId)throw new Error('Brak LEGACY_EXPENSE_SPREADSHEET_ID w ustawieniach.');const sh=SpreadsheetApp.openById(sourceId).getSheets()[0],rows=sh.getDataRange().getValues(),existing=new Set(dataRows_(sheet_(VP.SHEETS.EXPENSES),30).map(r=>String(r[0])));let total=0,already=0,invalid=0;for(let i=2;i<rows.length;i++){const r=rows[i],id=`LEGEXP-${String(i+1).padStart(6,'0')}`;if(!clean_(r[2]))continue;if(existing.has(id)){already++;continue;}if(!polishMonth_(r[1])||legacyAmount_(r[3])===null){invalid++;continue;}total++;}return{sheet:sh.getName(),total,already,invalid};
}

function importLegacyExpenses() {
  const user=assertAuthorized_();assertRecentBackup_();const lock=LockService.getDocumentLock();lock.waitLock(30000);try{const sourceId=getSetting_('LEGACY_EXPENSE_SPREADSHEET_ID');if(!sourceId)throw new Error('Brak identyfikatora pliku historycznych wydatków.');const source=SpreadsheetApp.openById(sourceId).getSheets()[0],rows=source.getDataRange().getValues(),target=sheet_(VP.SHEETS.EXPENSES),existing=new Set(dataRows_(target,30).map(r=>String(r[0]))),startYear=Number(getSetting_('LEGACY_EXPENSE_START_YEAR'))||2025,now=new Date(),out=[],periods=new Set();let year=startYear,previous=0;
    for(let i=2;i<rows.length;i++){const r=rows[i],description=clean_(r[2]),month=polishMonth_(r[1]),gross=legacyAmount_(r[3]),id=`LEGEXP-${String(i+1).padStart(6,'0')}`;if(!description||existing.has(id)||!month||gross===null)continue;if(previous&&month<previous)year++;previous=month;const period=`${year}-${String(month).padStart(2,'0')}`,date=new Date(year,month-1,1,12),paidBy=normalizePayer_(r[5]),settled=normalize_(r[6])==='tak',costTP=round2_(gross/2),costVV=round2_(gross-costTP),reimbursement=paidBy==='Lana'?costTP:paidBy==='Twinsy'?costVV:0,returned=settled?reimbursement:0,status=!reimbursement?'Nie wymaga rozliczenia':settled?'Rozliczone':'Nierozliczone',note=clean_(r[7]),legacyVat=legacyAmount_(r[8]),comment=[`Import historyczny: ${source.getName()} wiersz ${i+1}`,note,legacyVat!==null?`W starym pliku pole „podatek -23%”: ${legacyVat.toFixed(2)} zł — do weryfikacji księgowej.`:''].filter(Boolean).join(' | ');out.push([id,date,period,description,inferExpenseCategory_(description),'Wspólny',inferAccountingClass_(description),'','',gross,paidBy,'',0.5,0.5,costTP,costVV,reimbursement,status,returned,settled?date:'',settled?'Import historyczny':'','',note,'Do potwierdzenia','','','',comment,user,now]);periods.add(period);existing.add(id);}
    appendRows_(target,out,30);periods.forEach(p=>refreshMonthlyFinance_(p));appendLog_(user,'arkusz','IMPORT_HISTORII_WYDATKÓW','import','legacy-expenses','',JSON.stringify({expenses:out.length}),'');return{ok:true,message:`Zaimportowano ${out.length} historycznych wydatków.`};
  }finally{lock.releaseLock();}
}

function runHealthCheck() {
  const user=assertAuthorized_(),checks=[],add=(status,label,detail)=>checks.push({status,label,detail});let ss;try{ss=book_();add('OK','Połączenie z bazą',`${ss.getName()} · ID: ${ss.getId()}`);}catch(e){add('BŁĄD','Połączenie z bazą',e.message);return{version:VP.VERSION,checks};}
  Object.values(VP.SHEETS).forEach(name=>add(ss.getSheetByName(name)?'OK':'BŁĄD',`Zakładka ${name}`,ss.getSheetByName(name)?'Dostępna':'Brak zakładki'));
  const products=dataRows_(sheet_(VP.SHEETS.PRODUCTS),42),sales=dataRows_(sheet_(VP.SHEETS.SALES),25),pids=products.filter(r=>r[0]).map(r=>String(r[0])),sids=sales.filter(r=>r[0]).map(r=>String(r[0])),dupP=duplicateCount_(pids),dupS=duplicateCount_(sids),pSet=new Set(pids),orphans=sales.filter(r=>r[0]&&r[4]&&!pSet.has(String(r[4]))).length;add(dupP?'BŁĄD':'OK','Unikatowe ID produktów',dupP?`${dupP} duplikatów`:'Bez duplikatów');add(dupS?'BŁĄD':'OK','Unikatowe ID sprzedaży',dupS?`${dupS} duplikatów`:'Bez duplikatów');add(orphans?'BŁĄD':'OK','Powiązania sprzedaży',orphans?`${orphans} transakcji bez produktu`:'Wszystkie transakcje mają produkt');
  const users=dataRows_(sheet_(VP.SHEETS.USERS),8).filter(r=>r[0]&&r[3]===true&&r[4]===true).length;add(users?'OK':'BŁĄD','Użytkownicy aplikacji',users?`${users} aktywnych kont`:'Brak aktywnego konta z dostępem mobilnym');['FOLDER_ZDJĘCIA_ID','FOLDER_DOKUMENTY_ID'].forEach(key=>{const id=getSetting_(key);if(!id||['ADDS','DOCS'].includes(id)){add('UWAGA',key,'Nie skonfigurowano prawidłowego ID folderu');return;}try{DriveApp.getFolderById(id).getName();add('OK',key,'Folder dostępny');}catch(e){add('BŁĄD',key,'Brak dostępu lub nieprawidłowe ID');}});add('OK','Wersja kodu',VP.VERSION);appendLog_(user,'arkusz','DIAGNOSTYKA','aplikacja',VP.VERSION,'',JSON.stringify(checks.map(x=>x.status)),'');return{version:VP.VERSION,checks,summary:{errors:checks.filter(x=>x.status==='BŁĄD').length,warnings:checks.filter(x=>x.status==='UWAGA').length}};
}

function createBackup() {
  const user=assertAuthorized_(),file=DriveApp.getFileById(book_().getId()),name=`Vintage PRO BACKUP ${Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Europe/Warsaw','yyyy-MM-dd HH-mm')}`,folderId=getSetting_('FOLDER_BACKUP_ID');let copy;if(folderId){copy=file.makeCopy(name,DriveApp.getFolderById(folderId));}else copy=file.makeCopy(name);PropertiesService.getScriptProperties().setProperty('LAST_BACKUP_AT',String(Date.now()));appendLog_(user,'arkusz','KOPIA_BEZPIECZEŃSTWA','plik',copy.getId(),'',copy.getUrl(),'');return{ok:true,name,url:copy.getUrl(),message:`Utworzono kopię „${name}”.`};
}

function assertRecentBackup_(){const t=Number(PropertiesService.getScriptProperties().getProperty('LAST_BACKUP_AT'));if(!t||Date.now()-t>86400000)throw new Error('Przed importem utwórz kopię bezpieczeństwa. Backup jest ważny przez 24 godziny.');}
function validDate_(v){if(!v)return null;const d=v instanceof Date?new Date(v):new Date(v);if(isNaN(d.getTime()))return null;d.setHours(12,0,0,0);return d;}
function legacyAmount_(v){if(v===null||v===''||typeof v==='undefined')return null;if(typeof v==='number')return Number.isFinite(v)?round2_(v):null;const n=Number(String(v).replace(/\s/g,'').replace(/zł/ig,'').replace(',','.').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?round2_(n):null;}
function maxNumericId_(ids,prefix){return ids.reduce((m,id)=>{const x=String(id).match(new RegExp(`^${prefix}-(\\d+)$`));return x?Math.max(m,Number(x[1])):m;},0);}
function appendRows_(sh,rows,width){
  if(!rows.length)return;
  const start=sh.getLastRow()+1,requiredLastRow=start+rows.length-1;if(requiredLastRow>sh.getMaxRows())sh.insertRowsAfter(sh.getMaxRows(),requiredLastRow-sh.getMaxRows());if(width>sh.getMaxColumns())sh.insertColumnsAfter(sh.getMaxColumns(),width-sh.getMaxColumns());
  const target=sh.getRange(start,1,rows.length,width),rules=target.getDataValidations(),cache=new Map(),allowedFor=rule=>{
    if(!rule)return null;const type=rule.getCriteriaType(),values=rule.getCriteriaValues();let key,list;
    if(type===SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST){key=`L:${JSON.stringify(values[0]||[])}`;if(cache.has(key))return cache.get(key);list=(values[0]||[]).map(normalize_);cache.set(key,list);return list;}
    if(type===SpreadsheetApp.DataValidationCriteria.VALUE_IN_RANGE){const range=values[0];key=`R:${range.getSheet().getSheetId()}:${range.getA1Notation()}`;if(cache.has(key))return cache.get(key);list=range.getDisplayValues().flat().filter(Boolean).map(normalize_);cache.set(key,list);return list;}
    return null;
  };
  const safe=rows.map((row,r)=>row.map((value,col)=>{const list=allowedFor(rules[r][col]);if(!list||value===''||value===null)return value;return list.includes(normalize_(value))?value:'';}));
  target.clearDataValidations();
  try{target.setValues(safe);}finally{target.setDataValidations(rules);}
}
function duplicateCount_(values){const seen=new Set();let n=0;values.forEach(v=>{if(seen.has(v))n++;else seen.add(v);});return n;}
function normalizePayment_(v){const n=normalize_(v);if(n.includes('got'))return'Gotówka';if(n.includes('kart')||n.includes('terminal'))return'Karta';if(n.includes('blik'))return'BLIK';if(n.includes('przelew'))return'Przelew';return'Inna';}
function inferCategory_(name){const n=normalize_(name),rules=[['Sukienki',['sukien']],['Biżuteria',['naszyj','kolczy','branso','pierscion','bizuter']],['Spodnie',['spodni','jeans']],['Spódnice',['spodnic']],['Koszule i bluzki',['koszul','bluzk']],['Kurtki i płaszcze',['kurtk','plaszcz']],['Swetry',['swetr','kardigan']],['Torebki',['toreb']],['Buty',['but','kozaki','sandaly']],['Akcesoria',['pasek','apaszk','szal','czapk']]];const hit=rules.find(x=>x[1].some(k=>n.includes(k)));return hit?hit[0]:'Inne';}
function legacyProductRow_(id,store,name,category,price,date,saleId,user,now,source){return[id,store,name,'',category,'','','','','','','','',false,'','',false,price,'','Nieznany','','','',store,'','Sprzedany w sklepie',date,date,saleId,`Import historyczny: ${source}`,false,user,now,user,now,'','','','','','','Brak zdjęcia'];}
function polishMonth_(v){const n=normalize_(v),months=['styczen','luty','marzec','kwiecien','maj','czerwiec','lipiec','sierpien','wrzesien','pazdziernik','listopad','grudzien'];const i=months.findIndex(m=>n.startsWith(m));return i<0?0:i+1;}
function normalizePayer_(v){const n=normalize_(v);if(n.includes('lana'))return'Lana';if(n.includes('twin'))return'Twinsy';return'Inne';}
function inferExpenseCategory_(v){const n=normalize_(v);if(n.includes('czynsz'))return'Czynsz';if(n.includes('prad')||n.includes('energia')||n.includes('media')||n.includes('internet'))return'Media';if(n.includes('podatek'))return'Podatki';if(n.includes('towar'))return'Zakup towaru';if(n.includes('targ'))return'Targi';if(n.includes('reklam')||n.includes('marketing'))return'Marketing';return'Inne';}
function inferAccountingClass_(v){const n=normalize_(v);if(n.includes('kaucj'))return'Kaucja zwrotna';if(n.includes('podatek'))return'Podatek';if(n.includes('towar'))return'Zakup towaru';if(n.includes('wyposaz')||n.includes('remont'))return'Inwestycja / wyposażenie';return'Do potwierdzenia';}

function assertAuthorized_() {
  const active=clean_(Session.getActiveUser().getEmail()),effective=clean_(Session.getEffectiveUser().getEmail()),email=(active||effective).toLowerCase();
  if (!email) throw new Error('Nie udało się rozpoznać konta Google. Wdrożenie musi działać jako „Użytkownik uzyskujący dostęp do aplikacji”.');
  const sh = sheet_(VP.SHEETS.USERS);
  const last = sh.getLastRow();
  const users = last < 2 ? [] : sh.getRange(2,1,last-1,5).getValues();
  const allowed = users.some(r => clean_(r[0]).toLowerCase() === email && r[3] === true && r[4] === true);
  if (!allowed) throw new Error(`Brak dostępu dla konta ${email}. Dodaj je w zakładce 13_UŻYTKOWNICY.`);
  return email;
}

function getDictionaries_() {
  const sh = sheet_(VP.SHEETS.DICTS), values = sh.getRange(2,1,Math.max(sh.getLastRow()-1,1),16).getDisplayValues();
  return Array.from({length:16},(_,c)=>values.map(r=>r[c]).filter(Boolean));
}
function listFairs_() {
  return dataRows_(sheet_(VP.SHEETS.FAIRS),18).filter(r=>r[0]).map(r=>({
    id:String(r[0]),name:r[1],dateFrom:dateKey_(r[2]),dateTo:dateKey_(r[3]),place:r[4],status:r[5],
    takenTP:numberOrZero_(r[9]),takenVV:numberOrZero_(r[10]),soldTP:numberOrZero_(r[11]),soldVV:numberOrZero_(r[12]),revenueTP:numberOrZero_(r[13]),revenueVV:numberOrZero_(r[14])
  })).sort((a,b)=>b.dateFrom.localeCompare(a.dateFrom));
}
function findFair_(eventId) { return listFairs_().find(x=>String(x.id)===String(eventId)); }
function refreshFairStats_(eventId) {
  if (!eventId) return;
  const fairs = sheet_(VP.SHEETS.FAIRS), fairRows = dataRows_(fairs,18), index = fairRows.findIndex(r=>String(r[0])===String(eventId));
  if (index < 0) return;
  const moves = dataRows_(sheet_(VP.SHEETS.MOVES),13).filter(r=>String(r[7])===String(eventId) && r[4]==='Wydanie na targi');
  const takenTP = moves.filter(r=>r[3]==='TWINS PICK').length, takenVV = moves.filter(r=>r[3]==='VILANA VINTAGE').length;
  const sales = dataRows_(sheet_(VP.SHEETS.SALES),25).filter(r=>r[20]!=='Anulowana' && String(r[9])===String(eventId));
  const salesTP = sales.filter(r=>r[3]==='TWINS PICK'), salesVV = sales.filter(r=>r[3]==='VILANA VINTAGE');
  fairs.getRange(index+2,10,1,6).setValues([[takenTP,takenVV,salesTP.reduce((s,r)=>s+saleUnits_(r),0),salesVV.reduce((s,r)=>s+saleUnits_(r),0),round2_(salesTP.reduce((s,r)=>s+numberOrZero_(r[14]),0)),round2_(salesVV.reduce((s,r)=>s+numberOrZero_(r[14]),0))]]);
}
function getSetting_(key) {
  const sh = sheet_(VP.SHEETS.SETTINGS), values = sh.getRange(2,1,Math.max(sh.getLastRow()-1,1),2).getDisplayValues();
  const hit = values.find(r => r[0] === key); return hit ? hit[1] : '';
}
function setSetting_(key,value) { const sh=sheet_(VP.SHEETS.SETTINGS), rows=dataRows_(sh,3), i=rows.findIndex(r=>r[0]===key); if(i>=0)sh.getRange(i+2,2).setValue(value);else sh.appendRow([key,value,'']); }
function ensureSetting_(key,value,description) { const sh=sheet_(VP.SHEETS.SETTINGS), rows=dataRows_(sh,3), i=rows.findIndex(r=>r[0]===key); if(i>=0){if(key==='WERSJA')sh.getRange(i+2,2).setValue(value);return;} sh.appendRow([key,value,description]); }
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
function saveAttachment_(dataUrl, objectId, originalName) {
  const folderId=getSetting_('FOLDER_DOKUMENTY_ID')||getSetting_('FOLDER_ZDJĘCIA_ID');
  if(!folderId) throw new Error('Wpisz ID folderu dokumentów lub zdjęć w 12_USTAWIENIA.');
  const match=String(dataUrl).match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/); if(!match) throw new Error('Nieprawidłowy format załącznika.');
  if(!/^image\//.test(match[1]) && match[1]!=='application/pdf') throw new Error('Dozwolone są zdjęcia i pliki PDF.');
  const ext=match[1]==='application/pdf'?'pdf':match[1].includes('png')?'png':'jpg';
  const safe=clean_(originalName).replace(/[^a-zA-Z0-9._-]+/g,'-').slice(-60)||`dokument.${ext}`;
  const blob=Utilities.newBlob(Utilities.base64Decode(match[2]),match[1],`${objectId}-${Date.now()}-${safe}`);
  if(blob.getBytes().length>5000000) throw new Error('Załącznik jest większy niż 5 MB.');
  const file=DriveApp.getFolderById(folderId).createFile(blob); return {id:file.getId(),url:file.getUrl()};
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
function bindDatabase_(){const active=SpreadsheetApp.getActiveSpreadsheet();if(!active)return'';PropertiesService.getScriptProperties().setProperty('DATABASE_SPREADSHEET_ID',active.getId());VP_BOOK_=active;return active.getId();}
function book_(){if(VP_BOOK_)return VP_BOOK_;const active=SpreadsheetApp.getActiveSpreadsheet(),saved=PropertiesService.getScriptProperties().getProperty('DATABASE_SPREADSHEET_ID');if(active&&(!saved||active.getId()===saved)){VP_BOOK_=active;return VP_BOOK_;}const id=saved||(active&&active.getId())||VP.SPREADSHEET_ID;if(!id)throw new Error('Nie skonfigurowano arkusza bazy danych. Otwórz arkusz i uruchom instalator z menu VINTAGE PRO.');VP_BOOK_=SpreadsheetApp.openById(id);return VP_BOOK_;}
function sheet_(name){ const sh=book_().getSheetByName(name); if(!sh) throw new Error(`Brak zakładki ${name}.`); return sh; }
function uniqueId_(prefix){ return `${prefix}-${Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Europe/Warsaw','yyyyMMdd-HHmmss')}-${Utilities.getUuid().slice(0,8)}`; }
function clean_(v){ return String(v==null?'':v).trim(); }
function normalize_(v){ return clean_(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' '); }
function searchKey_(x){ return normalize_([x.name,x.brand,x.category,x.subcategory,x.style,x.materials,x.composition,x.size,x.color,x.condition,x.defectType,x.defectDescription,x.comment].join(' ')); }
function require_(v,m){ if(!clean_(v)) throw new Error(m); }
function money_(v){ const n=Number(String(v==null?'':v).replace(',','.').replace(/\s/g,'')); if(!Number.isFinite(n)) throw new Error('Wpisz prawidłową kwotę.'); return Math.round(n*100)/100; }
function optionalMoney_(v){ return clean_(v)===''?'':money_(v); }
function optionalNumber_(v){ if(clean_(v)==='') return ''; const n=Number(String(v).replace(',','.')); return Number.isFinite(n)?n:''; }
function numberOrZero_(v){ return v===''||v==null?0:Number(v)||0; }
function moneyText_(v){return `${numberOrZero_(v).toFixed(2)} zł`;}
function round2_(v){ return Math.round(numberOrZero_(v)*100)/100; }
function saleUnits_(r){return r[23]&&numberOrZero_(r[14])<0?-1:1;}
function photoThumb_(fileId,url){const id=clean_(fileId)||(clean_(url).match(/[-\w]{20,}/)||[])[0]||'';return id?`https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w500`:'';}
function productDto_(r){return{id:r[0],store:r[1],name:r[2],brand:r[3],category:r[4],subcategory:r[5],origin:r[6],style:r[7],materials:r[8],composition:r[9],size:r[10],color:r[11],condition:r[12],hasDefect:Boolean(r[13]),defectType:r[14],defect:r[15],defectInPrice:Boolean(r[16]),tagPrice:numberOrZero_(r[17]),purchaseCost:r[18],costStatus:r[19],materialCost:r[20],laborCost:r[21],totalCost:r[22],location:r[23],eventId:r[24],status:r[25],intakeDate:dateKey_(r[26]),saleDate:dateKey_(r[27]),saleId:r[28],comment:r[29],important:Boolean(r[30]),photoUrl:r[37]||'',photoId:r[38]||'',photoThumb:photoThumb_(r[38],r[37]),photoStatus:r[41]||''};}
function statusMoveType_(before,after){if(after==='Zarezerwowany')return'Rezerwacja';if(before==='Zarezerwowany'&&after==='Dostępny')return'Zwolnienie rezerwacji';if(after==='Wycofany')return'Wycofanie';if(after==='Dostępny')return'Korekta';return after;}
function dataRows_(sh,width){ const last=sh.getLastRow(); return last<2?[]:sh.getRange(2,1,last-1,width).getValues(); }
function parseDate_(v){ const s=clean_(v); if(!s) throw new Error('Wybierz datę.'); const m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/); const d=m?new Date(Number(m[1]),Number(m[2])-1,Number(m[3])):new Date(v); if(isNaN(d.getTime())) throw new Error('Nieprawidłowa data.'); d.setHours(12,0,0,0); return d; }
function dateKey_(v){ if(!v) return ''; const d=v instanceof Date?v:new Date(v); return isNaN(d.getTime())?'':Utilities.formatDate(d,Session.getScriptTimeZone()||'Europe/Warsaw','yyyy-MM-dd'); }
function localDateKey_(d){return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function sameDay_(a,b){ return dateKey_(a)===dateKey_(b); }
function monthKey_(v){ if(!v) return ''; const d=v instanceof Date?v:new Date(v); return isNaN(d.getTime())?'':Utilities.formatDate(d,Session.getScriptTimeZone()||'Europe/Warsaw','yyyy-MM'); }
function normalizePeriod_(v){ const s=clean_(v); const m=s.match(/^(\d{4})[-./](\d{1,2})$/); if(m) return `${m[1]}-${String(Number(m[2])).padStart(2,'0')}`; const d=new Date(v); if(!isNaN(d.getTime())) return monthKey_(d); throw new Error('Wybierz prawidłowy miesiąc rozliczeniowy.'); }
function isMonthClosed_(period){period=normalizePeriod_(period);return dataRows_(sheet_(VP.SHEETS.FINANCE),20).some(r=>r[0]&&normalizePeriod_(r[0])===period&&r[19]==='Zamknięte');}
function reportRange_(input){const end=input.dateTo?parseDate_(input.dateTo):parseDate_(dateKey_(new Date())),start=input.dateFrom?parseDate_(input.dateFrom):new Date(end.getFullYear(),end.getMonth(),1);if(start>end)throw new Error('Data od nie może być późniejsza niż data do.');return{dateFrom:dateKey_(start),dateTo:dateKey_(end),start,end,store:input.store||'Oba sklepy',channel:input.channel||'Wszystkie'};}
function filteredSales_(range,sh){return dataRows_(sh||sheet_(VP.SHEETS.SALES),25).filter(r=>{if(!r[0]||r[20]==='Anulowana')return false;const d=r[2]||r[1];return dateKey_(d)>=range.dateFrom&&dateKey_(d)<=range.dateTo&&(range.store==='Oba sklepy'||r[3]===range.store)&&(range.channel==='Wszystkie'||r[8]===range.channel);});}
function filteredExpenses_(range,sh){return dataRows_(sh||sheet_(VP.SHEETS.EXPENSES),30).filter(r=>r[0]&&dateKey_(r[1])>=range.dateFrom&&dateKey_(r[1])<=range.dateTo);}
function allocatedExpense_(r,store){if(store==='TWINS PICK')return numberOrZero_(r[14]);if(store==='VILANA VINTAGE')return numberOrZero_(r[15]);return numberOrZero_(r[14])+numberOrZero_(r[15]);}
function dashboardStore_(store,sales,expenses){const ss=sales.filter(r=>r[3]===store),known=ss.filter(r=>r[17]==='Potwierdzony'&&r[18]!==''),col=store==='TWINS PICK'?14:15,revenue=round2_(sum_(ss,14)),expense=round2_(expenses.reduce((s,r)=>s+numberOrZero_(r[col]),0)),margin=round2_(sum_(known,18)),units=ss.reduce((s,r)=>s+saleUnits_(r),0),knownUnits=known.reduce((s,r)=>s+saleUnits_(r),0);return{store,revenue,count:units,average:units>0?round2_(revenue/units):0,discounts:round2_(sum_(ss,13)),margin,expenses:expense,result:round2_(margin-expense),confirmedShare:units>0?Math.max(0,Math.min(1,knownUnits/units)):1};}
function sum_(rows,col){return rows.reduce((s,r)=>s+numberOrZero_(r[col]),0);}
function groupMoney_(rows,keyCol,valueCol){const m={};rows.forEach(r=>{const k=clean_(r[keyCol])||'Brak';m[k]=round2_((m[k]||0)+numberOrZero_(r[valueCol]));});return Object.keys(m).map(k=>({label:k,value:m[k]})).sort((a,b)=>b.value-a.value);}
function rankSales_(rows,key,max){const m={};rows.forEach(r=>{const k=clean_(typeof key==='function'?key(r):r[key]);if(!k)return;const x=m[k]||(m[k]={label:k,count:0,revenue:0,discount:0});x.count+=saleUnits_(r);x.revenue+=numberOrZero_(r[14]);x.discount+=numberOrZero_(r[13]);});return Object.values(m).map(x=>({label:x.label,count:x.count,revenue:round2_(x.revenue),average:x.count>0?round2_(x.revenue/x.count):0,discount:round2_(x.discount)})).sort((a,b)=>b.revenue-a.revenue||b.count-a.count).slice(0,max||10);}
function weekday_(v){const d=v instanceof Date?v:new Date(v);return['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota'][d.getDay()];}
function season_(v){const d=v instanceof Date?v:new Date(v),m=d.getMonth()+1;return m===12||m<=2?'Zima':m<=5?'Wiosna':m<=8?'Lato':'Jesień';}
function rate_(v){const n=Number(String(v==null?'':v).replace(',','.').replace('%','').trim());if(!Number.isFinite(n)||n<0)throw new Error('Wpisz prawidłową stawkę podatku.');const r=n>1?n/100:n;if(r>1)throw new Error('Stawka podatku nie może przekraczać 100%.');return r;}
function rateFromSetting_(key){const v=getSetting_(key);return clean_(v)===''?0:rate_(v);}
function writeRanking_(sh,row,col,title,data){sh.getRange(row,col,1,5).setValues([[title,'Liczba','Przychód','Średnia','Rabaty']]).setFontWeight('bold').setBackground('#eadde4');if(data.length){sh.getRange(row+1,col,data.length,5).setValues(data.map(x=>[x.label,x.count,x.revenue,x.average,x.discount]));sh.getRange(row+1,col+2,data.length,3).setNumberFormat('#,##0.00 "zł"');}}
