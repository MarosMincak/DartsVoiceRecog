var langs =
[['Afrikaans',       ['af-ZA']],
 ['Bahasa Indonesia',['id-ID']],
 ['Bahasa Melayu',   ['ms-MY']],
 ['Català',          ['ca-ES']],
 ['Čeština',         ['cs-CZ']],
 ['Deutsch',         ['de-DE']],
 ['English',         ['en-AU', 'Australia'],
                     ['en-CA', 'Canada'],
                     ['en-IN', 'India'],
                     ['en-NZ', 'New Zealand'],
                     ['en-ZA', 'South Africa'],
                     ['en-GB', 'United Kingdom'],
                     ['en-US', 'United States']],
 ['Español',         ['es-AR', 'Argentina'],
                     ['es-BO', 'Bolivia'],
                     ['es-CL', 'Chile'],
                     ['es-CO', 'Colombia'],
                     ['es-CR', 'Costa Rica'],
                     ['es-EC', 'Ecuador'],
                     ['es-SV', 'El Salvador'],
                     ['es-ES', 'España'],
                     ['es-US', 'Estados Unidos'],
                     ['es-GT', 'Guatemala'],
                     ['es-HN', 'Honduras'],
                     ['es-MX', 'México'],
                     ['es-NI', 'Nicaragua'],
                     ['es-PA', 'Panamá'],
                     ['es-PY', 'Paraguay'],
                     ['es-PE', 'Perú'],
                     ['es-PR', 'Puerto Rico'],
                     ['es-DO', 'República Dominicana'],
                     ['es-UY', 'Uruguay'],
                     ['es-VE', 'Venezuela']],
 ['Euskara',         ['eu-ES']],
 ['Français',        ['fr-FR']],
 ['Galego',          ['gl-ES']],
 ['Hrvatski',        ['hr_HR']],
 ['IsiZulu',         ['zu-ZA']],
 ['Íslenska',        ['is-IS']],
 ['Italiano',        ['it-IT', 'Italia'],
                     ['it-CH', 'Svizzera']],
 ['Magyar',          ['hu-HU']],
 ['Nederlands',      ['nl-NL']],
 ['Norsk bokmål',    ['nb-NO']],
 ['Polski',          ['pl-PL']],
 ['Português',       ['pt-BR', 'Brasil'],
                     ['pt-PT', 'Portugal']],
 ['Română',          ['ro-RO']],
 ['Slovenčina',      ['sk-SK']],
 ['Suomi',           ['fi-FI']],
 ['Svenska',         ['sv-SE']],
 ['Türkçe',          ['tr-TR']],
 ['български',       ['bg-BG']],
 ['Pусский',         ['ru-RU']],
 ['Српски',          ['sr-RS']],
 ['한국어',            ['ko-KR']],
 ['中文',             ['cmn-Hans-CN', '普通话 (中国大陆)'],
                     ['cmn-Hans-HK', '普通话 (香港)'],
                     ['cmn-Hant-TW', '中文 (台灣)'],
                     ['yue-Hant-HK', '粵語 (香港)']],
 ['日本語',           ['ja-JP']],
 ['Lingua latīna',   ['la']]];

// pass message to content.js
function passMessageToDialect(data){    
  chrome.storage.local.set(data, function () {
      chrome.scripting.executeScript({
          file: "content.js"
      });
  });
}

function appendOptions(select, text, value){
  var el = document.createElement("option");
  el.textContent = text;
  el.value = value;
  // no other dialects
  if(text === "Default") {
    el.readonly = true;
  }
  
  select.appendChild(el);
}

function removeOptions(selectElement) {
  var i, L = selectElement.options.length - 1;
  for(i = L; i >= 0; i--) {
     selectElement.remove(i);
  }
}

function getActiveTabID() {
  return new Promise(resolve => {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      var currTab = tabs[0];
      if (currTab != undefined) { 
        resolve(currTab.id);
      }else {
        resolve(0);
      }
    });
  })
}
function getActiveTabURL() {
  return new Promise(resolve => {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      var currTab = tabs[0];
      if (currTab != undefined) { 
        resolve(currTab.url);
      }else {
        resolve(0);
      }
    });
  })
}

function WarnMsg(msg, type) {
  if(type == "fatal" || type == undefined) {
    document.getElementById("warnbox").classList = "warnbox fatal";
  }else if(type == "warn") {
    document.getElementById("warnbox").classList = "warnbox warn";
  } else {
    document.getElementById("warnbox").classList = "warnbox fatal";
  }
  document.getElementById("warnbox-msg").innerText = msg;
}

let switch_state = false;
let switch_inanim = false;
let speechSwitch = document.getElementById('mainswitch');
let activetab = 0;
let url = "";
let blocked = false;

function OnMainSwitch() {
  if(blocked) {WarnMsg("Unsupported website, cann't turn on", "fatal"); return;}
  if(switch_inanim) {return;}
  if(switch_state) {
    switch_state = false;
    switch_inanim = true;
    speechSwitch.classList = "csswitchbody animoff";
    setTimeout(() => {
      speechSwitch.classList = "csswitchbody";
      switch_inanim = false;
    }, 740);
  }else {
    speechSwitch.classList = "csswitchbody animon";
    switch_state = true;
    switch_inanim = true;
    setTimeout(() => {
      speechSwitch.classList = "csswitchbody active";
      switch_inanim = false;
    }, 730);
  }
  if (switch_state) {
    chrome.scripting.executeScript({
      target: {tabId: activetab},
      args: [activetab, false],
      function: (a, f) => {
        window.dartsvoice.load(a, f);
      }
    });
  } else {
    // Stop speech recognition
    chrome.scripting.executeScript({
      target: {tabId: activetab},
      function: () => {
        window.dartsvoice.stop();
      }
    });
  }
}
function IsSupportedURL(url) {
  if(url.startsWith("https://nakka.com/") || url.startsWith("http://nakka.com/")) {
    return true;
  }
  return false;
}

async function Load() {
  var speechSwitch = document.getElementById('mainswitch');
  activetab = await getActiveTabID();
  url = await getActiveTabURL();
  if(!IsSupportedURL(url)) {
    blocked = true;
    WarnMsg("Unsupported website", "fatal");
  }
  chrome.runtime.sendMessage("getdata window status "+activetab, (res) => {
    if(res == true) {
      speechSwitch.classList = "csswitchbody active";
      switch_state = true;
    }
  });

  // V3 manifest
  speechSwitch.addEventListener('click', OnMainSwitch);

  //On app change
  document.getElementById("select_darts_application").addEventListener("change", (event) => {
    var value = event.target.value;
    if(value != "nakka") {
      WarnMsg("This application is unsupported yet.", "warn");
      document.getElementById("select_darts_application").value = "nakka";
    }
  })

  var countrySwitch = document.getElementById('select_language'),
      dialectSelect =  document.getElementById('select_dialect');

  for(var i = 0; i < langs.length; i++) {
      // append countries
      appendOptions(countrySwitch, langs[i][0], i)
  }
  // trigger change country
  countrySwitch.dispatchEvent(new Event('change'))

  countrySwitch.addEventListener('change', function(event) {
    var value = event.target.value
    // clear all dialect options
    removeOptions(dialectSelect)
    // append dialect by country - loop through dialects
    for(var i = 1; i < langs[value].length; i++) {
      var code = langs[value][i][0],
          text = langs[value][i][1] || "Default"; 
      // append countries
      appendOptions(dialectSelect, text, code)
    }


    dialectSelect.dispatchEvent(new Event('change'))
  });

  dialectSelect.addEventListener('change', function(event) {
    var value = event.target.value

    if(value){
      // send dialect to content.js
      passMessageToDialect({
        dialectCode: value
      })
    }
  })
} 

document.addEventListener("DOMContentLoaded", Load);