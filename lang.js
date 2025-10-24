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
            {name:"message.start_failed",value:"Unable to start voice capture."},
            {name:"message.stop_failed",value:"Unable to stop voice capture."},
            {name:"message.language_update_failed",value:"Updating the language failed."},
            {name:"message.unsupported_api",value:"Speech recognition is not supported in this browser."},
            {name:"message.reload_required",value:"Please reload the scoreboard tab and try again."},
            {name:"message.no_active_tab",value:"Open a Nakka match tab to use Voice Darts."},
            {name:"label.lang",value:"Language"},
            {name:"label.dialect",value:"Dialect"},
            {name:"label.app",value:"Application"},
            {name:"toggle.on",value:"Stop listening"},
            {name:"toggle.off",value:"Start listening"},
            {name:"status.ready",value:""},
            {name:"status.loading",value:"Preparing voice capture..."},
            {name:"status.listening",value:"Listening for scores..."},
            {name:"status.blocked",value:"Open the supported scoreboard to enable voice input."},
            {name:"tagline.app",value:"Hands-free scoring for your next leg."},
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
