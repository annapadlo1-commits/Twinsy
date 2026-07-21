# Instrukcja awaryjna

## Aplikacja nie otwiera się

Sprawdź logowanie na właściwe konto Google, wpis użytkownika w `13_UŻYTKOWNICY` oraz czy używany adres kończy się `/exec`. Następnie w Apps Script utwórz nową wersję aktywnego wdrożenia.

## Panel długo się ładuje

Zawęź zakres dat, odśwież stronę i uruchom diagnostykę. Dashboard i analityka mają limit oczekiwania 45 sekund i pamięć podręczną. Nie klikaj wielokrotnie przycisku zapisu.

## Błędny wpis

Nie kasuj ręcznie wierszy. Użyj `Transakcje → Anuluj błędny wpis` albo `Zwrot klienta`. Dla pozostałych danych zachowaj kopię i skontaktuj się z opiekunem pliku.

## Nieudany import

Nie poprawiaj częściowo zaimportowanych wierszy ręcznie. Import ma stabilne identyfikatory, więc po usunięciu przyczyny można uruchomić go ponownie. Jeżeli dane są niespójne, przerwij pracę i wróć do kopii utworzonej bezpośrednio przed importem.

## Przywrócenie kopii

Otwórz link backupu zapisany w `14_LOG`. Nie zastępuj od razu pliku produkcyjnego: najpierw porównaj liczbę produktów, sprzedaży, wydatków i raportów. Po akceptacji ustaw ID właściwego arkusza w `VP.SPREADSHEET_ID`, utwórz nową wersję wdrożenia i wykonaj test kontrolny.

## Bezpieczeństwo

Nie usuwaj zakładek systemowych, nie zmieniaj kolejności kolumn i nie udostępniaj folderów zdjęć publicznie. Przed migracją, większą korektą lub aktualizacją zawsze wykonaj backup.
