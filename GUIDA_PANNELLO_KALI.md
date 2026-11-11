# Guida rapida — WiFiAudit Launcher su Kali

## Dashboard 1.7: primo uso

Nuovo: NetPwn in demo esterna dal pannello, con preparazione dedicata e arresto circoscritto. Segui `GUIDA_NETPWN.md` per la prova su Kali.

1. Avvia il pannello senza sudo con `./avvia_pannello.sh`.
2. Attiva **Simula i prossimi avvii** e premi Doctor: vedrai il comando e un'attività SIMULATA, senza avviare programmi.
3. Disattiva Simula per un'esecuzione reale. Stato e durata sono aggiornati nel pannello; i messaggi completi restano nel terminale.
4. Per lo storico importa un CSV di airodump-ng. Importane un secondo e scegli Prima/Dopo per confrontare canale, sicurezza, segnale e nome. Un AP non osservato non è necessariamente scomparso.
5. Scegli uno snapshot in Dopo e premi **Scarica rapporto PDF**. Se manca ReportLab, installa `python3-reportlab` dal Centro installazioni.
6. Per Kismet avvia prima il programma e configura un'API key readonly dalla sua interfaccia. Inserisci la chiave nel pannello e premi **Leggi AP da Kismet**. La chiave non viene salvata e il connettore non avvia acquisizioni.
7. **Carica esempio dimostrativo** mostra due scansioni sintetiche in memoria e un PDF di esempio. Premi Aggiorna attività per tornare allo storico reale.

Il registro contiene gli avvii fatti dal pannello. COMPLETATA descrive il codice di uscita del processo, non un recupero certo della password. La simulazione riguarda il comando di avvio, non tutte le operazioni interne del motore. Interrompi con Ctrl+C nel terminale.

Le sessioni sudo possono trovarsi in `/root/wifiaudit_results`, non leggibile da un utente normale. Il catalogo richiede una cartella accessibile e non modifica i permessi dei vecchi risultati. Le password del motore rimangono nei suoi file protetti: non vengono importate nel registro della dashboard.

## Risorse aggiunte

- CyberChef: https://gchq.github.io/CyberChef/
- GTFOBins: https://gtfobins.org/
- explainshell: https://explainshell.com/
- HackTricks: https://book.hacktricks.wiki/
- OWASP Cheat Sheet Series: https://cheatsheetseries.owasp.org/

I collegamenti aprono siti esterni. Il pannello non invia automaticamente file, log, password o catture a questi servizi.

## Avvio

Estrarre tutto lo ZIP in una cartella. I file non devono essere separati.

```bash
chmod +x avvia_pannello.sh
./avvia_pannello.sh
```

Il pannello usa solo `127.0.0.1`: non è pubblicato sulla rete. Va avviato come utente normale. Quando una funzione richiede privilegi, apre un terminale e Kali chiede la password. Il pannello non riceve e non salva quella password.

Per aggiungere il collegamento al menu applicazioni dell'utente:

```bash
./avvia_pannello.sh --install
```

## Comandi principali

| Comando | Spiegazione |
|---|---|
| `sudo bash wifiaudit.sh --menu` | Apre tutte le funzioni. `sudo` è necessario per monitor mode e operazioni radio. |
| `bash wifiaudit.sh --doctor` | Elenca dipendenze e interfacce senza avviare un audit. |
| `bash wifiaudit.sh --self-test` | Esegue i controlli interni senza root e senza scheda Wi-Fi. |
| `sudo bash wifiaudit.sh --guided` | Procedura mirata Wifite per un solo BSSID. |
| `bash wifiaudit.sh --inspect FILE` | Riconosce e controlla una cattura senza provare password. |
| `sudo bash wifiaudit.sh --auto-recover FILE --auto-seconds 600` | Esegue il recupero offline con un budget globale di 10 minuti. |
| `sudo bash wifiaudit.sh --resume CARTELLA` | Riprende una sessione valida saltando le fasi completate. |
| `bash wifiaudit.sh --catalog "$HOME/wifiaudit_results"` | Mostra il catalogo delle sessioni locali. |

Mentre si digita la password `sudo`, sullo schermo non compaiono asterischi o pallini: è il comportamento normale di Linux.

## Utilità integrate nel pannello

- **Double Commander**: alternativa grafica a Total Commander, con due pannelli e schede. È la scelta consigliata.
- **Krusader**: file manager a due pannelli, particolarmente integrato con KDE.
- **Midnight Commander (`mc`)**: file manager a due pannelli nel terminale, leggero e utile anche senza ambiente grafico.
- **Wireshark**: analisi dettagliata delle catture; non trova automaticamente una password.
- **Wavemon**: mostra segnale e dati dell'interfaccia wireless nel terminale.
- **Sniffnet**: visualizzazione del traffico di rete; è un complemento diagnostico, non un motore per password Wi-Fi.

I pulsanti **Installa** usano solo nomi di pacchetto predefiniti. Viene aperto un terminale con `apt-get install`; la modifica parte soltanto dopo la conferma e l'autenticazione `sudo`.

## Centro installazioni

Il pannello riconosce con `dpkg-query` i pacchetti già presenti e propone solo quelli mancanti. Sono disponibili otto gruppi:

1. **WiFiAudit completo:** aircrack-ng, hcxdumptool/hcxtools, hashcat, John, Reaver/Pixiewps, Crunch, Wifite, TShark/tcpdump, macchanger, hostapd, dnsmasq e iptables.
2. **Archivi:** zip, unzip, 7zip e unar per ZIP, 7z, RAR, CAB, ISO e altri formati.
3. **PDF:** poppler-utils, qpdf, Ghostscript ed Evince.
4. **DOCX:** LibreOffice Writer, Pandoc e Antiword.
5. **Gestione file:** Double Commander, Krusader e Midnight Commander.
6. **Sistema e sviluppo:** Git, curl, wget, jq, Zenity, xclip, Python, ShellCheck e Bats.
7. **Analisi e rete:** Kismet, Nmap, Wireshark e Hydra.
8. **Laboratorio avanzato:** Airgeddon, Bettercap, Fern, MDK4, Wifiphisher e WiFiPumpkin3.

Il pulsante **Aggiorna indici APT** esegue soltanto `apt-get update`. Ogni pulsante **Installa mancanti** mostra l'elenco prima di aprire il terminale. Non vengono aggiunti repository esterni.

## Pubblicazione su GitHub Pages

La pagina pubblicata mostra la grafica cyberpunk, la guida, i comandi copiabili e il download del pacchetto. I collegamenti CSS/JavaScript sono relativi alla cartella del repository, quindi funzionano anche in un indirizzo come `https://utente.github.io/Kali_html/`.

GitHub Pages è un servizio statico: non può avviare terminali, `sudo`, Bash o gli strumenti radio del computer. Per quelle operazioni bisogna scaricare il pacchetto ed eseguire `./avvia_pannello.sh` su Kali. La pagina pubblica può essere installata come PWA e consultata offline dopo il primo caricamento.

## Toolchain principale

- **Aircrack-ng:** cattura e verifica 802.11, handshake e WEP; è usato direttamente dal motore.
- **Kismet:** rilevamento passivo, monitoraggio, wardriving e rilevamento intrusioni wireless.
- **Hashcat:** recupero offline rapido, eventualmente con GPU.
- **John the Ripper:** recupero offline alternativo con wordlist, regole e maschere.
- **Wireshark/TShark:** ispezione delle catture e dei protocolli; TShark viene usato anche dalle diagnostiche.
- **Nmap:** inventario di host, porte e versioni dei servizi dopo avere ottenuto accesso autorizzato alla rete.
- **Hydra:** verifica delle credenziali di servizi come SSH o HTTP. Non serve a trovare direttamente la password WPA/WPA2 e non è avviato automaticamente da WiFiAudit.

Nmap e Hydra devono essere usati soltanto sugli indirizzi e sui servizi inclusi nello scope scritto dell’audit.

## Strumenti aggiuntivi e confini

- **hcxdumptool / hcxtools:** acquisizione e conversione di PMKID/EAPOL; sono già usati dal motore.
- **Reaver / Pixiewps:** verifica WPS; Pixiewps lavora offline sui parametri raccolti.
- **Wifite:** orchestratore esterno richiamato dalla procedura mirata, con BSSID e limiti espliciti.
- **tcpdump:** lettura e filtraggio testuale delle catture.
- **Bettercap:** potente framework di ricognizione e MITM; il pannello apre solo la guida locale e non prepara target o moduli.
- **Airgeddon, Fern, MDK4, Wifiphisher, WiFiPumpkin3:** installabili dal gruppo laboratorio, ma non avviati automaticamente dal flusso WiFiAudit.
- **Pyrit:** escluso perché rimosso da Kali nel 2020 per la dipendenza da Python 2.
- **Fluxion e Hakku:** non installati automaticamente perché non sono trattati come pacchetti verificati del catalogo corrente.

Rogue AP, MITM, phishing, deauth e flood possono interrompere servizi o raccogliere dati. Per questi strumenti serve un laboratorio isolato o uno scope scritto specifico; l'autorizzazione generica alla scansione non basta.

## Problemi comuni

- **Il browser si apre ma un pulsante non fa nulla:** controllare che un emulatore di terminale sia installato e premere **Aggiorna** nello stato ambiente.
- **Pacchetto incompleto:** mantenere insieme `wifiaudit.sh`, `wifiaudit_v6.sh`, `wifiaudit_tools.py`, `launcher.py`, HTML, CSS e JavaScript.
- **Scheda non visibile:** eseguire prima Doctor e verificare driver e supporto monitor mode.
- **Nessun risultato:** non significa che la password non esista; significa soltanto che i tentativi effettuati non l'hanno recuperata.
- **Sniffnet non installabile dal pannello:** seguire il metodo ufficiale adatto alla propria versione di Kali, senza aggiungere repository non verificati.
