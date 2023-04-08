const debug = false;

var supported_langs =
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

/* Browsher API */
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

/* UI Functions */
function removeOptions(selectElement) {
  var i, L = selectElement.options.length - 1;
  for(i = L; i >= 0; i--) {
     selectElement.remove(i);
  }
}
function appendOptions(select, text, value){
  var el = document.createElement("option");
  el.textContent = text;
  el.value = value;
  // no other dialects
  if(text === LangString("texts.def")) {
    el.readonly = true;
  }
  
  select.appendChild(el);
}
function findLang(id) {
  for(let i = 0; i < supported_langs.length; i++) {
    if(id.startsWith(supported_langs[i][1][0].substring(0, 3))) {
      for(let j = 1; j < supported_langs[i].length; j++) {
        if(supported_langs[i][j][0] == id) {
          let dialect = "Default";
          if(supported_langs[i][j][1] != undefined) {dialect = supported_langs[i][j][1];}
          return {
            name: supported_langs[i][0],
            dialect: dialect,
            id: supported_langs[i][j][0]
          }
        }
      }
    }
  }
  return {
    name: "Slovak",
    dialect: "Default",
    id: "sk-sk"
  }
}
function findLangId(string_id) {
  for(let i = 0; i < supported_langs.length; i++) {
    if(string_id.startsWith(supported_langs[i][1][0].substring(0, 3))) {
      return i;
    }
  }
  return 0;
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

/* Custom Functions */
function IsSupportedURL(url) {
  if(url.startsWith("https://nakka.com/") || url.startsWith("http://nakka.com/")) {
    return true;
  }
  return false;
}

/* Variables */
let switch_state = false;
let switch_inanim = false;
let speechSwitch = document.getElementById('mainswitch');
let activetab = 0;
let url = "";
let blocked = false;

/* Component Functions */
function OnMainSwitch(action) {
  if(blocked) {WarnMsg(LangString("message.unsupported_switch"), "fatal"); return;}
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
  if(action) {
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
}

/* Main Functions */
async function Load() {
  var speechSwitch = document.getElementById('mainswitch');
  activetab = await getActiveTabID();
  url = await getActiveTabURL();
  var countrySwitch = document.getElementById('select_language'),
      dialectSelect =  document.getElementById('select_dialect');
  if(!IsSupportedURL(url)) {
    blocked = true;
    WarnMsg(LangString("message.unsupported_website"), "fatal");
  }
  chrome.runtime.sendMessage("getwindow "+activetab, (res) => {
    if(res.status == true) {
      speechSwitch.classList = "csswitchbody active";
      switch_state = true;
    }
    if(res.lang != "") {
      var obj = findLang(res.lang);
      countrySwitch.value = findLangId(res.lang);
      for(var i = 1; i < supported_langs[countrySwitch.value].length; i++) {
        var code = supported_langs[countrySwitch.value][i][0],
            text = supported_langs[countrySwitch.value][i][1] || LangString("texts.def"); 
        // append countries
        appendOptions(dialectSelect, text, code)
      }
      dialectSelect.value = obj.id;
    }
  });

  speechSwitch.addEventListener('click', () => {OnMainSwitch(true)});

  //On app change
  document.getElementById("select_darts_application").addEventListener("change", (event) => {
    var value = event.target.value;
    if(value != "nakka") {
      WarnMsg(LangString("message.unsupported_app"), "warn");
      document.getElementById("select_darts_application").value = "nakka";
    }
  })

  for(var i = 0; i < supported_langs.length; i++) {
      // append countries
      appendOptions(countrySwitch, supported_langs[i][0], i)
  }
  // trigger change country
  countrySwitch.dispatchEvent(new Event('change'))

  countrySwitch.addEventListener('change', function(event) {
    var value = event.target.value
    // clear all dialect options
    removeOptions(dialectSelect)
    // append dialect by country - loop through dialects
    for(var i = 1; i < supported_langs[value].length; i++) {
      var code = supported_langs[value][i][0],
          text = supported_langs[value][i][1] || LangString("texts.def"); 
      // append countries
      appendOptions(dialectSelect, text, code)
    }


    dialectSelect.dispatchEvent(new Event('change'))
  });

  dialectSelect.addEventListener('change', function(event) {
    OnCountrySwitch(event, false);
  })

  document.getElementById("label_lang").innerText = LangString("label.lang")
  document.getElementById("label_dialect").innerText = LangString("label.dialect")
  document.getElementById("label_app").innerText = LangString("label.app")
} 

/* Register Events */
document.addEventListener("DOMContentLoaded", Load);

if(!debug) {
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  })
}

function OnCountrySwitch(event, force) {
  var value = event.target.value

  chrome.runtime.sendMessage("setdata window lang " + activetab + " " + value, (res) => {
    if(res == true) {
      if(!force) {
        chrome.scripting.executeScript({
          target: {tabId: activetab},
          function: () => {
            window.dartsvoice.stop();
          }
        });
        if(switch_state) {
          OnMainSwitch(false);
        }
      }
    }
  })
}