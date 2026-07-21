# Vintage PRO 1.0.1 — moduł operacyjny i zdjęcia

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

Przed użyciem produkcyjnym należy przeprowadzić testy na przykładowych produktach w kopii roboczej.
