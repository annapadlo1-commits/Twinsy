# Vintage PRO 1.1.0 — większe wdrożenie

Pakiet jest przygotowany dla arkusza „Vintage PRO 1.0 — KOPIA ROBOCZA”.

## Instalacja

1. W arkuszu otwórz **Rozszerzenia → Apps Script**.
2. Zastąp zawartość pliku `Code.gs` kodem z tego pakietu.
3. Dodaj plik HTML o nazwie dokładnie `Mobile` i wklej zawartość `Mobile.html`.
4. W ustawieniach projektu włącz wyświetlanie pliku manifestu i zastąp `appsscript.json` wersją z pakietu.
5. W zakładce `13_UŻYTKOWNICY` wpisz adresy Google uprawnionych właścicieli i menedżerów. Zaznacz `Aktywny` i `Telefon – dostęp`.
6. Utwórz wspólny folder Google Drive na zdjęcia, udostępnij go wszystkim użytkownikom aplikacji i wklej jego ID do `12_USTAWIENIA` przy `FOLDER_ZDJĘCIA_ID`.
7. Odśwież arkusz i zaakceptuj wymagane uprawnienia.
8. Wybierz **Wdróż → Nowe wdrożenie → Aplikacja internetowa**. Uruchamianie: użytkownik korzystający z aplikacji. Dostęp: użytkownicy z kontem Google.
9. Otwórz otrzymany link na telefonie i dodaj go do ekranu początkowego.

## Aktualizacja z wersji 1.0.3

1. W projekcie Apps Script zastąp zawartość `Code.gs` i `Mobile.html` plikami z paczki.
2. Kliknij **Wdróż → Zarządzaj wdrożeniami**.
3. Otwórz aktywne wdrożenie, kliknij ikonę ołówka i wybierz **Nowa wersja**.
4. Kliknij **Wdróż**. Adres aplikacji zakończony `/exec` pozostaje ten sam.
5. Odśwież arkusz, wybierz z menu **VINTAGE PRO → Przygotuj aktualizację 1.1.0** i zaakceptuj wykonanie.

## Zakres tego etapu

- autoryzacja kont z zakładki `13_UŻYTKOWNICY`;
- automatyczne ID `TP-000001` / `VV-000001`;
- mobilne i komputerowe dodawanie produktów;
- wyszukiwanie po nazwie, marce, kategorii, stylu, materiałach, rozmiarze, kolorze, stanie, wadzie i komentarzu;
- sprzedaż z ceną końcową, rabatem, formą płatności i kanałem;
- blokada równoczesnej sprzedaży tego samego produktu;
- aktualizacja stanu magazynu;
- zapis autora, czasu operacji i logu.
- uruchamianie aparatu telefonu podczas dodawania i sprzedaży;
- kompresja zdjęcia przed wysłaniem oraz zapis w Google Drive;
- szybka sprzedaż produktu, którego nie ma jeszcze w bazie;
- utworzenie karty produktu i sprzedaży w jednym przepływie;
- rozszerzony rejestr wydatków i wzajemnych rozliczeń.
- wspólne i sklepowe raporty dzienne z automatycznym podsumowaniem sprzedaży;
- porównanie aplikacji z raportem papierowym, terminalem i faktyczną gotówką;
- wykrywanie różnic i opcjonalne nieodwracalne zamknięcie raportu;
- tworzenie wydarzeń targowych;
- wydawanie produktów na targi i zwrot niesprzedanych produktów;
- osobne liczniki i przychody targowe TWINS PICK oraz VILANA VINTAGE;
- blokada zamknięcia targów, dopóki niesprzedane produkty nie wrócą do sklepów;
- pełny rejestr ruchów towaru i log operacji.
- mobilne dodawanie wydatków i dokumentów kosztowych;
- załączniki w formie zdjęcia lub PDF zapisywane na Google Drive;
- automatyczny podział kosztów wspólnych 50/50;
- przypisywanie 100% kosztu indywidualnego do wybranego sklepu;
- obliczanie kwoty należnej na podstawie osoby, która faktycznie zapłaciła;
- miesięczne saldo wzajemne Lana ↔ Twinsy;
- częściowe i pełne rozliczenia z blokadą błędnego kierunku lub nadpłaty;
- automatyczne wyniki miesięczne osobno dla TWINS PICK i VILANA VINTAGE;
- przychód, rabaty, koszt sprzedanych produktów, wydatki indywidualne i udział kosztów wspólnych;
- rozdzielenie sprzedaży stacjonarnej i targowej oraz form płatności;
- wskaźnik kompletności kosztów produktów.
- mobilny panel właścicielski z filtrem dat, sklepu i kanału;
- przychód, liczba sprzedaży, średnia cena, rabaty, wydatki i wynik potwierdzony;
- porównanie obu sklepów oraz sprzedaży stacjonarnej i targowej;
- bieżąca liczba i wartość metkowa produktów dostępnych i znajdujących się na targach;
- alerty produktów bez zdjęcia, kosztu oraz długo zalegających na stanie;
- rankingi kategorii, nazw produktów, marek, dni, miesięcy i pór roku;
- analityka kanałów, płatności oraz wydarzeń targowych;
- automatyczne zestawienie w zakładce `10_ANALITYKA`;
- konfigurowalne stawki orientacyjnej estymacji podatku dla każdego sklepu;
- kontrola kompletności przed zamknięciem miesiąca;
- wykrywanie brakujących i niezamkniętych raportów dziennych;
- blokada sprzedaży, raportów i wydatków po zamknięciu miesiąca;
- kreator aktualizacji oraz nowe pozycje menu arkusza.

Jeśli dokumenty wydatków mają trafiać do innego folderu niż zdjęcia produktów, dodaj w `12_USTAWIENIA` pozycję `FOLDER_DOKUMENTY_ID`. Gdy jej nie ma, aplikacja wykorzysta folder `FOLDER_ZDJĘCIA_ID`.

Estymacja podatku jest narzędziem pomocniczym. Stawki należy ustawić zgodnie z informacją od księgowości; aplikacja nie wybiera samodzielnie formy opodatkowania.

Przed użyciem produkcyjnym należy przeprowadzić testy na przykładowych produktach w kopii roboczej.
