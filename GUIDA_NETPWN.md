# NetPwn nel pannello WiFiAudit 1.7

1. Estrai il pacchetto Kali completo e avvia `bash avvia_pannello.sh` come utente normale.
2. Nella nuova sezione **NETPWN // DEMO LAB**, premi **Prepara NetPwn**. Conferma il download e attendi nel terminale il messaggio di completamento.
3. Premi **Avvia demo**. Il terminale resta aperto e Mission Control mostra l'attività in corso.
4. Quando il terminale mostra che il server è pronto, premi **Apri dashboard**. La porta locale è 8877, distinta dal pannello WiFiAudit.
5. Esplora gli host fittizi, la topologia e gli eventi. I moduli reali vengono disabilitati dalla modalità demo di NetPwn.
6. Premi **Ferma demo** oppure Ctrl+C nel terminale della demo. La chiusura della scheda browser non ferma il processo.

Il pannello resta un utente normale. Non usare sudo per questi passaggi. La pagina pubblicata su GitHub mostra la guida, ma gli avvii richiedono il pannello locale.

## Preparazione e percorsi

Servono Python 3.11+, git, python3-venv e Internet durante la prima preparazione. Se mancano, installali dal Centro installazioni. Per eventuali errori di compilazione delle dipendenze, conserva l'errore del terminale e invialo per la diagnosi: il pannello non aggiunge repository APT.

NetPwn viene scaricato da https://github.com/letox4/netpwn.git alla revisione `c409bda64590dcba1cef2ee66188607ab14c723a`. Il sorgente e il venv sono conservati in `~/.local/share/wifiaudit-netpwn/REVISIONE/`. Le dipendenze rispettano requirements.txt di quella revisione; quelle transitive non sono bloccate, quindi possono variare tra installazioni. Nessun aggiornamento upstream viene applicato automaticamente.

Se la preparazione fallisce, non viene cancellato nulla. Il terminale indica la cartella incompleta: rinominala per conservarla e riprova. Una preparazione completata può essere riutilizzata da successive estrazioni di WiFiAudit.

## Avvio diretto equivalente

```bash
python3 netpwn_bridge.py install
python3 netpwn_bridge.py demo
# In un secondo terminale, per fermare:
python3 netpwn_bridge.py stop
```

La simulazione di WiFiAudit mostra questi comandi senza eseguirli. Per prepararli e avviarli davvero, disattiva **Simula i prossimi avvii**.

## Confini e prova su Kali

Questa versione aggiunge l'avvio esterno della demo; non è una fusione tra i due backend e non aggiunge modalità reale, nuove funzioni radio o importazione dei dati NetPwn. Il programma esterno mantiene la propria interfaccia e licenza GPL-3.0, scaricata con il sorgente. Il bridge è codice indipendente.

La porta è fissata su 127.0.0.1:8877. Se è occupata, l'avvio fallisce e non termina altri programmi. Il pulsante Ferma verifica utente, PID, tempo di avvio e comando del wrapper prima di inviare il segnale. Il wrapper pulisce il proprio gruppo di processi; non usa pkill né ripulisce firewall globali. SIGKILL e spegnimenti improvvisi possono richiedere controllo manuale.

La modalità demo non è una sandbox: rimane codice di terzi eseguito con i permessi dell'utente. Non sono importati credenziali, catture o eventi nel database WiFiAudit. Non aprire contemporaneamente la demo con un'altra copia manuale di NetPwn sulla stessa porta.

Collaudo richiesto sul tuo Kali: preparazione delle dipendenze, apertura della pagina, topologia visibile, aggiornamenti live, arresto e secondo avvio. Il manuale PDF incluso descrive il motore 6.0 e il pannello 1.6; questa guida documenta l'aggiunta 1.7.
