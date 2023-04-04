
var lang   = chrome.i18n.getMessage;
var config = {
    software_name:lang("appname") || "WebOptimizer",
    settings:{
        unlock_text_select_restriction:true,
        unlock_copy_restriction:true,
        unlock_contextmenu:false,
        remove_anti_ad_blocker_layer:true,
        block_notification:true,
        prevent_webrtc_ip_leaks:true,
        prevent_visibility_detection:true,
        disable_geolocation:false,
        disable_third_party_cookies:true,
        enable_do_not_track:true,
        block_popup_windows:true,
        disable_leave_site_alert:false,
    },
    auto_clicks:{},
    replace_words:{},
};

var get_extension_url = function(url)
{
    if(chrome.extension && chrome.extension.getURL){
        return chrome.extension.getURL(url);
    }
    return chrome.runtime.getURL(url);
}
