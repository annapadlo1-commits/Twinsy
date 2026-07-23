# Testy odbiorcze Vintage PRO 2.0.0

Testuj na kopii arkusza. Przy każdym punkcie sprawdź także wpis w `14_LOG`.

1. Zaloguj się do aplikacji na komputerze i telefonie; nieuprawnione konto ma otrzymać odmowę.
2. Dodaj produkt TP ze zdjęciem, marką, materiałem, stanem, wadą, kosztem i komentarzem. Sprawdź ID `TP-...` oraz plik na Dysku.
3. Dodaj analogiczny produkt VV. Wyszukaj oba po nazwie, marce, materiale i ID.
4. Sprzedaj produkt z rabatem 10% kartą. Spróbuj sprzedać go ponownie — operacja musi zostać zablokowana.
5. Wykonaj szybką sprzedaż produktu nieobecnego w bazie wraz ze zdjęciem.
6. Utwórz targi, wydaj produkt, sprzedaj drugi na targach, zwróć niesprzedany i zamknij wydarzenie.
7. Zapisz raport dnia dla obu sklepów; celowo wprowadź różnicę, dodaj wyjaśnienie i zamknij raport.
8. Dodaj wspólny wydatek 100 zł — koszt TP i VV musi wynieść po 50 zł. Dodaj także koszt indywidualny.
9. Zapisz częściowe i pełne rozliczenie Lana ↔ Twinsy; nadpłata i błędny kierunek mają być zablokowane.
10. Anuluj błędną sprzedaż, a osobno wykonaj zwrot klienta. Sprawdź stan produktu i ujemną korektę.
11. Porównaj panel i analizy dla sklepu, targów, dnia, miesiąca i pory roku.
12. Sprawdź stawki VAT/podatku, brakujące raporty i blokadę zamknięcia niekompletnego miesiąca.
13. Utwórz backup, wykonaj podgląd importów i import. Powtórz import — liczba nowych rekordów ma wynieść zero.
14. Uruchom diagnostykę: wymagany wynik to 0 błędów; ostrzeżenia muszą być świadomie zaakceptowane.
15. W Analizach sprawdź wykres trendu, siedem dni tygodnia, porównanie sklepów, kanały, płatności, rabaty i wiek magazynu dla co najmniej dwóch różnych zakresów.
16. Kliknij `Zapisz widok w 10_ANALITYKA` i sprawdź dwa natywne wykresy oraz zgodność ich sum z panelem aplikacji.

Odbiór jest zakończony dopiero po przejściu wszystkich scenariuszy na telefonie i komputerze przez co najmniej jedną osobę z każdego sklepu.
# Testy wydajności 2.2.0

1. Sprzedaj produkt bez zdjęcia i zapisz czas pokazany w zielonym komunikacie.
2. Sprzedaj produkt ze zdjęciem — ten wariant może potrwać dłużej ze względu na przesłanie pliku na Dysk.
3. Sprawdź, czy po sprzedaży produkt ma status „Sprzedany w sklepie” albo „Sprzedany na targach”.
4. Sprawdź, czy transakcja pojawiła się w `04_SPRZEDAŻ`, ruch w `07_RUCHY_TOWARU`, a operacja w `14_LOG`.
5. Otwórz Finanse i potwierdź, że bieżący miesiąc został przeliczony z nową sprzedażą.
6. Dla sprzedaży targowej otwórz moduł Targi i potwierdź odświeżenie statystyk wydarzenia.
7. Kliknij „Zatwierdź sprzedaż” szybko dwa razy — powinna zostać zapisana tylko jedna transakcja.
