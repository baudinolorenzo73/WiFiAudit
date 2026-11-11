"use strict";

const token = document.querySelector('meta[name="wifiaudit-token"]').content;
const appVersion = document.querySelector('meta[name="wifiaudit-version"]').content;
const activity = document.querySelector(".activity");
const activityText = document.getElementById("activityText");
const LOCAL_MODE = /^[a-f0-9]{64}$/.test(token);
const WEB_PREVIEW = !LOCAL_MODE;

function message(text, error = false) {
  activityText.textContent = text;
  activity.classList.toggle("error", error);
}

async function copyText(text, button = null) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.append(area);
      area.select();
      if (!document.execCommand("copy")) throw new Error("copy");
      area.remove();
    }
    if (button) {
      const old = button.textContent;
      button.textContent = "Copiato";
      setTimeout(() => { button.textContent = old; }, 1100);
    }
    message("Comando copiato negli appunti.");
  } catch (_) {
    message("Copia non disponibile: seleziona il comando manualmente.", true);
  }
}

function localOnlyMessage() {
  message("Questa azione richiede il pannello locale su Kali: scarica lo ZIP e avvia ./avvia_pannello.sh.", true);
  document.getElementById("webPreview")?.scrollIntoView({behavior: "smooth", block: "center"});
}

async function api(payload, button = null) {
  if (WEB_PREVIEW) {
    if (payload.action === "manual") {
      window.open("./Manuale_wifiaudit_v6.0_Kali.pdf", "_blank", "noopener");
      message("Apertura del manuale PDF.");
      return;
    }
    localOnlyMessage();
    return;
  }
  if (button) button.disabled = true;
  message("Avvio in corso…");
  try {
    payload.dry_run = Boolean(document.getElementById('dryRun')?.checked);
    const response = await fetch("./api/action", {
      method: "POST",
      headers: {"Content-Type": "application/json", "X-WiFiAudit-Token": token},
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || "Operazione non riuscita");
    message(result.message);
    if (result.command) {
      const preview = document.getElementById('commandPreview');
      preview.hidden = false;
      preview.textContent = 'Comando previsto (argomenti separati):\n' + JSON.stringify(result.command, null, 2);
    }
    window.dispatchEvent(new Event('wifiaudit-job'));
    if (payload.action === "install_utility") setTimeout(refreshStatus, 1200);
  } catch (error) {
    message(error.message || "Errore di comunicazione", true);
  } finally {
    if (button) button.disabled = false;
  }
}

document.querySelectorAll("[data-action]").forEach(button => button.addEventListener("click", () => {
  if (!WEB_PREVIEW && button.dataset.action === "apt_update" && !window.confirm("Aggiornare gli indici dei repository APT configurati in Kali?")) return;
  if (!WEB_PREVIEW && button.dataset.action === 'netpwn_install' && !window.confirm('Scaricare NetPwn da GitHub e installare le dipendenze Python in un ambiente separato? Richiede Internet e può richiedere alcuni minuti.')) return;
  api({action: button.dataset.action}, button);
}));

document.getElementById('netpwnOpen').addEventListener('click', () => {
  if (WEB_PREVIEW) return localOnlyMessage();
  window.open('http://' + location.hostname + ':8877', '_blank', 'noopener,noreferrer');
  message('Apertura demo NetPwn: attendi che il terminale mostri il server pronto.');
});

document.getElementById("inspectBtn").addEventListener("click", event => api({action: "inspect", path: document.getElementById("capturePath").value}, event.currentTarget));
document.getElementById("recoverBtn").addEventListener("click", event => api({action: "recover", path: document.getElementById("capturePath").value, seconds: document.getElementById("seconds").value}, event.currentTarget));
document.getElementById("resumeBtn").addEventListener("click", event => api({action: "resume", path: document.getElementById("sessionPath").value}, event.currentTarget));
document.querySelectorAll("[data-copy]").forEach(button => button.addEventListener("click", () => copyText(button.dataset.copy, button)));

function packageItem(name, description) {
  return {name, description, installed: false};
}

const STATIC_PACKAGE_GROUPS = {
  wifi: {
    label: "WiFiAudit completo",
    description: "Radio, catture, conversione, recupero e report.",
    packages: [
      packageItem("aircrack-ng", "Suite 802.11"), packageItem("hcxdumptool", "Acquisizione PMKID/EAPOL"),
      packageItem("hcxtools", "Conversione catture"), packageItem("hashcat", "Recupero GPU/CPU"),
      packageItem("john", "John the Ripper"), packageItem("reaver", "Verifica WPS"),
      packageItem("pixiewps", "Verifica offline WPS Pixie Dust"),
      packageItem("crunch", "Generazione wordlist"), packageItem("wifite", "Procedura guidata"),
      packageItem("tshark", "Analisi da terminale"), packageItem("macchanger", "Cambio MAC opzionale"),
      packageItem("hostapd", "Access point di laboratorio"), packageItem("dnsmasq", "DHCP/DNS di laboratorio"),
      packageItem("iptables", "Regole di rete"), packageItem("tcpdump", "Analisi catture da terminale")
    ]
  },
  archives: {
    label: "Archivi ZIP / 7z / RAR", description: "Creazione, estrazione e controllo degli archivi più comuni.",
    packages: [packageItem("zip", "Crea archivi ZIP"), packageItem("unzip", "Estrae file ZIP"), packageItem("7zip", "Archivi 7z ad alta compressione"), packageItem("unar", "Estrae RAR, CAB, ISO e altri formati")]
  },
  pdf: {
    label: "PDF", description: "Lettura, informazioni, conversione, unione e riparazione.",
    packages: [packageItem("poppler-utils", "pdfinfo, pdftotext, pdfimages e pdfunite"), packageItem("qpdf", "Ispezione e trasformazione PDF"), packageItem("ghostscript", "Conversione e ottimizzazione"), packageItem("evince", "Visualizzatore grafico")]
  },
  documents: {
    label: "DOCX e documenti", description: "Apertura, modifica e conversione di Word e documenti testuali.",
    packages: [packageItem("libreoffice-writer", "Apre e modifica DOC/DOCX"), packageItem("pandoc", "Conversione tra formati"), packageItem("antiword", "Estrazione testo da vecchi DOC")]
  },
  files: {
    label: "Gestione file", description: "File manager a due pannelli in stile Total Commander.",
    packages: [packageItem("doublecmd-gtk", "Double Commander grafico"), packageItem("krusader", "File manager KDE a due pannelli"), packageItem("mc", "Midnight Commander da terminale")]
  },
  system: {
    label: "Sistema e sviluppo", description: "Download, JSON, finestre di dialogo, test e script.",
    packages: [
      packageItem("git", "Repository e aggiornamenti"), packageItem("curl", "Download e API"),
      packageItem("wget", "Download da terminale"), packageItem("jq", "Lettura JSON"),
      packageItem("zenity", "Finestre grafiche per script"), packageItem("xclip", "Appunti X11"),
      packageItem("python3", "Runtime del pannello"), packageItem("python3-venv", "Ambienti Python isolati"),
      packageItem("python3-pip", "Gestione pacchetti Python"), packageItem("shellcheck", "Controllo script Bash"),
      packageItem("bats", "Test automatici Bash"),
      packageItem("python3-reportlab", "Rapporti PDF della dashboard"),
      packageItem("fonts-dejavu-core", "Caratteri incorporati nei PDF"),
      packageItem("iw", "Capacità e interfacce wireless"),
      packageItem("iproute2", "Stato delle interfacce di rete")
    ]
  },
  network: {
    label: "Analisi e rete", description: "Monitoraggio wireless, inventario host, pacchetti e verifica servizi autorizzata.",
    packages: [packageItem("kismet", "Rilevamento passivo e WIDS"), packageItem("nmap", "Inventario host, porte e servizi"), packageItem("wireshark", "Analisi grafica delle catture"), packageItem("hydra", "Verifica credenziali dei servizi autorizzati")]
  },
  advanced: {
    label: "Laboratorio avanzato", description: "Strumenti potenti installabili, senza workflow di attacco automatico nel pannello.",
    packages: [
      packageItem("airgeddon", "Framework Bash per laboratori wireless"),
      packageItem("bettercap", "Ricognizione e MITM in ambienti autorizzati"),
      packageItem("fern-wifi-cracker", "Interfaccia grafica di audit Wi-Fi"),
      packageItem("mdk4", "Test di robustezza 802.11 ad alto impatto"),
      packageItem("wifiphisher", "Rogue AP e simulazioni di phishing autorizzate"),
      packageItem("wifipumpkin3", "Framework rogue AP per laboratorio")
    ]
  }
};

const STATIC_UTILITIES = {
  aircrack: {label: "Aircrack-ng", installed: false, installable: true, package: "aircrack-ng"},
  kismet: {label: "Kismet", installed: false, installable: true, package: "kismet"},
  hashcat: {label: "Hashcat", installed: false, installable: true, package: "hashcat"},
  john: {label: "John the Ripper", installed: false, installable: true, package: "john"},
  hydra: {label: "Hydra", installed: false, installable: true, package: "hydra"},
  nmap: {label: "Nmap", installed: false, installable: true, package: "nmap"},
  doublecmd: {label: "Double Commander", installed: false, installable: true, package: "doublecmd-gtk"},
  krusader: {label: "Krusader", installed: false, installable: true, package: "krusader"},
  mc: {label: "Midnight Commander", installed: false, installable: true, package: "mc"},
  wireshark: {label: "Wireshark", installed: false, installable: true, package: "wireshark"},
  wavemon: {label: "Wavemon", installed: false, installable: true, package: "wavemon"},
  sniffnet: {label: "Sniffnet", installed: false, installable: false, package: null},
  wifite: {label: "Wifite (guida)", installed: false, installable: true, package: "wifite"},
  tcpdump: {label: "tcpdump (guida)", installed: false, installable: true, package: "tcpdump"},
  pixiewps: {label: "Pixiewps (guida)", installed: false, installable: true, package: "pixiewps"},
  bettercap: {label: "Bettercap (guida)", installed: false, installable: true, package: "bettercap"}
};

function renderUtility(id, info) {
  const article = document.createElement("article");
  article.className = "utility";
  const body = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = info.label;
  const state = document.createElement("p");
  state.textContent = WEB_PREVIEW ? "Utilità per Kali" : (info.installed ? "Installata e pronta" : (info.installable ? "Non installata" : "Installazione esterna"));
  body.append(title, state);
  const buttons = document.createElement("div");
  buttons.className = "button-row compact";

  if (WEB_PREVIEW) {
    if (info.package) {
      const copy = document.createElement("button");
      copy.className = "button secondary";
      copy.textContent = "Copia installazione";
      copy.addEventListener("click", () => copyText(`sudo apt install ${info.package}`, copy));
      buttons.append(copy);
    } else {
      const external = document.createElement("button");
      external.className = "button secondary";
      external.textContent = "Guida esterna";
      external.disabled = true;
      buttons.append(external);
    }
  } else {
    const open = document.createElement("button");
    open.className = "button secondary";
    open.textContent = "Apri";
    open.disabled = !info.installed;
    open.addEventListener("click", () => api({action: "open_utility", utility: id}, open));
    buttons.append(open);
    if (!info.installed && info.installable) {
      const install = document.createElement("button");
      install.className = "button";
      install.textContent = "Installa";
      install.addEventListener("click", () => {
        if (window.confirm(`Installare ${info.label} dai repository configurati in Kali?`)) api({action: "install_utility", utility: id}, install);
      });
      buttons.append(install);
    }
  }
  article.append(body, buttons);
  return article;
}

function renderPackageGroup(id, group) {
  const card = document.createElement("article");
  card.className = "package-card";
  const header = document.createElement("div");
  header.className = "package-head";
  const titleWrap = document.createElement("div");
  const code = document.createElement("span");
  code.className = "hud-code";
  code.textContent = `MOD://${id.toUpperCase()}`;
  const title = document.createElement("h3");
  title.textContent = group.label;
  const desc = document.createElement("p");
  desc.textContent = group.description;
  titleWrap.append(code, title, desc);

  const missing = group.packages.filter(item => !item.installed);
  const count = document.createElement("span");
  count.className = "package-count " + (missing.length ? "warn" : "ready");
  count.textContent = WEB_PREVIEW ? `${group.packages.length} pacchetti` : (missing.length ? `${missing.length} mancanti` : "COMPLETO");
  header.append(titleWrap, count);

  const list = document.createElement("ul");
  list.className = "package-list";
  group.packages.forEach(item => {
    const row = document.createElement("li");
    const state = document.createElement("span");
    state.className = "pkg-state " + (item.installed ? "installed" : "missing");
    state.textContent = item.installed ? "●" : "○";
    const name = document.createElement("code");
    name.textContent = item.name;
    const description = document.createElement("span");
    description.textContent = item.description;
    row.append(state, name, description);
    list.append(row);
  });

  const install = document.createElement("button");
  install.className = "button install-group";
  if (WEB_PREVIEW) {
    install.textContent = "Copia comando installazione";
    install.addEventListener("click", () => copyText(`sudo apt install ${group.packages.map(item => item.name).join(" ")}`, install));
  } else {
    install.disabled = missing.length === 0;
    install.textContent = missing.length ? `Installa mancanti (${missing.length})` : "Tutto installato";
    install.addEventListener("click", () => {
      const names = missing.map(item => item.name);
      if (window.confirm(`Installare ${names.length} pacchetti del gruppo “${group.label}”?\n\n${names.join(" ")}`)) api({action: "install_packages", packages: names}, install);
    });
  }
  card.append(header, list, install);
  return card;
}

function renderStatus(status) {
  const state = document.getElementById("serverState");
  const grid = document.getElementById("toolGrid");
  const utilityGrid = document.getElementById("utilityGrid");
  const packageGroups = document.getElementById("packageGroups");

  if (WEB_PREVIEW) {
    state.textContent = "anteprima web";
    state.className = "pill ok";
  } else {
    state.textContent = status.package ? "pacchetto pronto" : "pacchetto incompleto";
    state.className = "pill " + (status.package ? "ok" : "bad");
  }

  const entries = WEB_PREVIEW
    ? [["GitHub Pages", true], ["Tema cyberpunk", true], ["Guida offline", true], ["Comandi locali", false]]
    : [["Pacchetto v6", status.package], ["Terminale", Boolean(status.terminal)], ["Manuale PDF", status.manual], ...Object.entries(status.tools)];

  grid.replaceChildren(...entries.map(([name, available]) => {
    const item = document.createElement("div");
    item.className = "tool";
    const label = document.createElement("span");
    label.textContent = name;
    const value = document.createElement("span");
    value.className = available ? "yes" : "no";
    value.textContent = available ? "OK" : "solo Kali";
    item.append(label, value);
    return item;
  }));
  utilityGrid.replaceChildren(...Object.entries(status.utilities).map(([id, info]) => renderUtility(id, info)));
  packageGroups.replaceChildren(...Object.entries(status.package_groups).map(([id, group]) => renderPackageGroup(id, group)));
}

async function refreshStatus() {
  if (WEB_PREVIEW) {
    renderStatus({utilities: STATIC_UTILITIES, package_groups: STATIC_PACKAGE_GROUPS});
    message(`Anteprima web v${appVersion}: grafica e guida disponibili; le azioni di sistema richiedono Kali locale.`);
    return;
  }
  try {
    const response = await fetch("./api/status", {cache: "no-store", headers: {'X-WiFiAudit-Token': token}});
    const status = await response.json();
    if (!response.ok) throw new Error("Stato non disponibile");
    renderStatus(status);
  } catch (_) {
    document.getElementById("serverState").textContent = "non raggiungibile";
    document.getElementById("serverState").className = "pill bad";
    message("Il server locale non risponde.", true);
  }
}

if (WEB_PREVIEW) {
  document.body.classList.add("web-mode");
  document.getElementById("webPreview").hidden = false;
  if ("serviceWorker" in navigator && window.isSecureContext) {
    navigator.serviceWorker.register("./sw.js", {scope: "./"}).catch(() => {});
  }
}

document.getElementById("refreshBtn").addEventListener("click", refreshStatus);
refreshStatus();

