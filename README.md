# Vintage PRO 2.0.6 — automatyczne rozszerzanie bazy

Bezpłatna aplikacja Google Sheets + Apps Script dla TWINS PICK i VILANA VINTAGE. Obsługuje komputer i telefon, magazyn produktów jednostkowych, sprzedaż, targi, raporty dobowe, wydatki, rozliczenia 50/50, analitykę, korekty, zdjęcia i migrację danych historycznych.

## Instalacja / aktualizacja

1. Otwórz docelowy arkusz i wybierz **Rozszerzenia → Apps Script**.
2. Zastąp `Code.gs`, `Mobile.html` i `appsscript.json` plikami z paczki (plik HTML musi nazywać się `Mobile`).
3. Zapisz projekt, odśwież arkusz i wybierz **VINTAGE PRO → Przygotuj / napraw wersję 2.0.6**. Ta czynność wiąże wdrożenie z aktualnie otwartym arkuszem.
4. W `13_UŻYTKOWNICY` dodaj konta Google; pola `Aktywny` i `Telefon – dostęp` muszą być zaznaczone.
5. W `12_USTAWIENIA` wpisz prawdziwe ID folderów `FOLDER_ZDJĘCIA_ID` i `FOLDER_DOKUMENTY_ID`; opcjonalnie `FOLDER_BACKUP_ID`.
6. Wybierz **Wdróż → Zarządzaj wdrożeniami**, edytuj wdrożenie aplikacji internetowej, wybierz **Nowa wersja** i kliknij **Wdróż**. Zachowaj adres zakończony `/exec`.
7. Otwórz panel, przejdź do **Administracja**, uruchom diagnostykę i usuń wszystkie błędy.
8. Utwórz backup. Najpierw wykonaj podgląd, a potem — po sprawdzeniu liczb — import starej sprzedaży i wydatków.
9. Wykonaj scenariusze z `TESTY_ODBIORCZE.md`. Dopiero potem rozpocznij pracę produkcyjną.

## Najważniejsze reguły

- Każdy produkt ma unikatowe ID, ale można go wyszukiwać po nazwie i metadanych.
- Koszty wspólne są dzielone 50/50; przychody i koszty indywidualne pozostają osobne.
- Sprzedaż targowa jest raportowana osobno, a ruch produktu jest rejestrowany.
- Import jest powtarzalny i pomija już przeniesione rekordy. Wymaga backupu z ostatnich 24 godzin.
- Zamknięty miesiąc chroni dane; późniejszy zwrot jest zapisywany jako korekta w bieżącym okresie.
- Wyliczenia VAT i podatku są estymacją. Stawki i podstawę musi zatwierdzić księgowość.

Pełna instrukcja awaryjna znajduje się w `INSTRUKCJA_AWARYJNA.md`, a lista funkcji w `ZAKRES_PRODUKTU.md`.
