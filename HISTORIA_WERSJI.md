# Historia wersji

## 2.0.3

Importer sprawdza przed zapisem wszystkie listy walidacyjne arkusza. Wartość historyczna, której nie można jednoznacznie dopasować do aktualnego słownika, pozostaje pusta zamiast zatrzymywać cały import błędem komórki.

## 2.0.2

Naprawiono import produktów historycznych blokowany przez walidację kolumny stanu. Usunięto wielokrotne, kosztowne przeliczanie miesięcy podczas importu. Dashboard i analityka używają lżejszego odczytu, wspólnej pamięci podręcznej i nie zależą już od rozmiaru dziennika operacji.

## 2.0.1

Naprawiono zapisywanie do niewłaściwej kopii arkusza: aplikacja automatycznie wiąże bazę z arkuszem, z którego uruchomiono instalator. Backup używa tego samego powiązania, diagnostyka pokazuje nazwę i ID bazy, a import rozpoznaje także kwoty zapisane tekstowo z przecinkiem lub symbolem zł.

## 2.0.0 FINAL

Panel administracyjny, diagnostyka integralności, backup przed migracją, powtarzalny import starej sprzedaży i wydatków, poprawne wydzielenie VAT z ceny brutto, konfigurowalna podstawa podatku, pełna dokumentacja wdrożeniowa i testy odbiorcze.

## 1.2.0

Magazyn, edycja produktu, statusy, anulowania i zwroty z korektami.

## 1.1.x

Dashboard, analityka, zamknięcie miesiąca, szeroki panel i optymalizacja wydajności.

## 1.0.x

Produkty, sprzedaż, zdjęcia, raporty dobowe, targi, wydatki i rozliczenia.
