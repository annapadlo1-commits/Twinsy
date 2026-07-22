# Historia wersji

## 2.0.9

Autoryzacja prywatnych kont Gmail korzysta z aktywnego użytkownika, a gdy Google nie udostępnia tej wartości — z użytkownika wykonującego skrypt. Adres nadal musi znajdować się na aktywnej liście `13_UŻYTKOWNICY` z dostępem mobilnym.

## 2.0.8

Dashboard i Analizy zwracają do interfejsu wyłącznie dane możliwe do bezpiecznej serializacji. Daty techniczne `Date` zostały zastąpione tekstem `YYYY-MM-DD`, dzięki czemu zakończone obliczenie dociera do panelu zamiast pozostawiać komunikat ładowania.

## 2.0.7

Analityka agreguje wszystkie rankingi w jednym przebiegu danych i przechowuje wynik przez 10 minut. Dashboard nie uruchamia się automatycznie podczas startu aplikacji, dzięki czemu nie blokuje równoległej analizy. Interfejs kończy oczekiwanie po 30 sekundach czytelnym komunikatem.

## 2.0.6

Przed zapisem każdej partii importer sprawdza fizyczne wymiary zakładki i automatycznie dodaje brakujące wiersze lub kolumny. Usuwa to błąd „Współrzędne zakresu wykraczają poza wymiary arkusza”.

## 2.0.5

Importer tymczasowo zdejmuje walidację wyłącznie z docelowej partii, zapisuje sprawdzone dane i natychmiast przywraca reguły, co eliminuje blokady typu E5920. Menu arkusza pokazuje właściwy adres wdrożenia mobilnego zakończony `/exec`.

## 2.0.4

Import sprzedaży działa automatycznie w partiach po 100 rekordów, pokazuje postęp i wznawia się bez duplikatów. Każda komórka partii jest sprawdzana według własnej reguły walidacyjnej. Raporty archiwalne są budowane dopiero po zakończeniu wszystkich partii, dzięki czemu zachowują pełne sumy dzienne.

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
