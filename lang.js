const Langs = [
    {
        name: "en-us",
        error: "Failed to load correct language",
        text_name: "English",
        keys: [
            {name:"texts.def",value:"Default"},
            {name:"message.unsupported_switch",value:"Unsupported website, can't turn on"},
            {name:"message.unsupported_website",value:"Unsupported website"},
            {name:"message.unsupported_app",value:"This application is unsupported yet."},
            {name:"label.lang",value:"Language"},
            {name:"label.dialect",value:"Dialect"},
            {name:"label.app",value:"Application"},
        ]
    }
]
const LangSettings = {
    default: "en-us",
    active: "en-us",
    error: "Failed to load correct language"
}
function LangString(id) {
    if(Langs.find(o => o.name == LangSettings.active) == undefined) {
        return LangSettings.error;
    }else {
        var l = Langs.find(o => o.name == LangSettings.active);
        if(l.keys.find(o => o.name == id) == undefined) {
            return l.error;
        }else {
            return l.keys.find(o => o.name == id).value;
        }
    }
}