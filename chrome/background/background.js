'use strict';

const manifest_version = chrome.runtime.getManifest().manifest_version;

if(manifest_version === 3){

    try{
        importScripts("../config.js","../libs/functions.js");
    }catch(e){
        console.log(e);
    }
}

chrome.storage.local.get({settings:config.settings,auto_clicks:config.auto_clicks,replace_words:config.replace_words},(values)=>
{

    config.settings      = values.settings;
    config.auto_clicks   = values.auto_clicks;
    config.replace_words = values.replace_words;

    function last_error_check(response){
        if(!chrome.runtime.lastError){}
    }
    function load_ui(tab_id,frame_id)
    {
        let ui_modules  = [
            "Label","Button","Edit","Panel","Item","Menu","ComboBox","SpinBox","List",
            "Image","Window","MessageBox","Notify","SwitchBox","ToggleBox","Grid",
        ];
        let index       = 0;
        let load_module = (results)=>{
            if(chrome.runtime.lastError || !results || !results.length) {
                console.log(chrome.runtime.lastError);
                return;
            }
            if(index < ui_modules.length){
                if(manifest_version === 3){
                    chrome.scripting.executeScript({target: {tabId: tab_id}, files: ["libs/ui/ui." + ui_modules[index++] + ".js"]},load_module);
                }else{
                    chrome.tabs.executeScript(tab_id,{file:"libs/ui/ui." + ui_modules[index++] + ".js"},load_module)
                }
            }else{
                chrome.tabs.sendMessage(tab_id,{type:"ui_loaded"},{frameId:frame_id},last_error_check);
            }
        };
        if(manifest_version === 3){
            chrome.scripting.executeScript({target:{tabId: tab_id},files: ["libs/std.min.js"]},load_module);
        }else{
            chrome.tabs.executeScript(tab_id,{file:"libs/std.min.js"},load_module);
        }
    }
    function prevent_webrtc_ip_leaks(val)
    {
        try{
            if(chrome.privacy.network.webRTCIPHandlingPolicy){
                chrome.privacy.network.webRTCIPHandlingPolicy.set({
                    value: val ? 'disable_non_proxied_udp' : "default"
                });
            }
            if(chrome.privacy.network.webRTCMultipleRoutesEnabled){
                chrome.privacy.network.webRTCMultipleRoutesEnabled.set({
                    value: !val,
                    scope: 'regular'
                });
            }
        }catch(e){}
    }
    function disable_third_party_cookies(val)
    {
        try{
            if(chrome.privacy.websites.thirdPartyCookiesAllowed){
                chrome.privacy.websites.thirdPartyCookiesAllowed.set({value: !val});
            }
        }catch(e){
            console.log(e)
        }
    }
    function enable_do_not_track(val)
    {
        try{
            if(chrome.privacy.websites.doNotTrackEnabled){
                chrome.privacy.websites.doNotTrackEnabled.set({value: val});
            }
        }catch(e){
            console.log(e)
        }
    }
    function block_notification(val)
    {
        if(chrome.contentSettings){
            chrome.contentSettings['notifications'].set({primaryPattern: '<all_urls>', setting: val ? "block" : "ask"});
        }else if(chrome.browserSettings){
            chrome.browserSettings.webNotificationsDisabled.set({value: val})
        }
    }
    function add_auto_click(values)
    {
        if(!config.auto_clicks[values.host]){
            config.auto_clicks[values.host] = [];
        }
        config.auto_clicks[values.host].push(values);
    }

    if(config.settings.prevent_webrtc_ip_leaks){
        prevent_webrtc_ip_leaks(true);
    }
    if(config.settings.enable_do_not_track){
        enable_do_not_track(true);
    }
    if(config.settings.disable_third_party_cookies){
        disable_third_party_cookies(true);
    }
    if(config.settings.block_notification){
        block_notification(true);
    }
    /*
     * init context menu
    */
    var init_context_menu = function()
    {
        if(manifest_version === 3)
        {
            chrome.contextMenus.removeAll(function()
            {
                chrome.contextMenus.create(
                {
                    id:"web_optimizer_auto_click",
                    title: lang ? lang("auto_click") : "Auto click",
                    contexts: ["all"],
                    documentUrlPatterns: ['*://*/*']
                });
                chrome.contextMenus.onClicked.addListener(function(e, tab)
                {
                    if(e.menuItemId === "web_optimizer_auto_click"){
                        chrome.tabs.sendMessage(tab.id,{type:"auto_click"},{frameId: e.frameId},last_error_check);
                    }
                });
            });
        }else{

            chrome.contextMenus.create(
            {
                title: lang("auto_click"),
                contexts: ["all"],
                documentUrlPatterns: ['*://*/*'],
                onclick:function(e,tab) {
                    chrome.tabs.sendMessage(tab.id,{type:"auto_click"},{frameId: e.frameId},last_error_check);
                }
            });
        }
    }
    chrome.storage.onChanged.addListener(function (changes,namespace)
    {
        if(changes.settings)
        {
            for(let [key,{oldValue,newValue}] of Object.entries(changes))
            {
                config.settings[key] = newValue;

                switch(key)
                {
                case "prevent_webrtc_ip_leaks":
                    prevent_webrtc_ip_leaks(newValue);
                    break;
                case "enable_do_not_track":
                    enable_do_not_track(newValue);
                    break;
                case "disable_third_party_cookies":
                    disable_third_party_cookies(newValue);
                    break;
                case "block_notification":
                    block_notification(newValue);
                    break;
                }
            }
        }
    });
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) =>
    {
        if(request.type === "load_ui"){
            load_ui(sender.tab.id,sender.frameId);
        }else if(request.type === "add_auto_click"){
            add_auto_click(request.values);
            chrome.storage.local.set({auto_clicks:config.auto_clicks});
        }else if(request.type === "add_auto_clicks"){
            for(var i=0;i<request.values.length;++i){
                add_auto_click(request.values[i]);
            }
            chrome.storage.local.set({auto_clicks:config.auto_clicks});
        }else if(request.type === "query_auto_clicks"){
            if(request.host){
                sendResponse(config.auto_clicks[request.host]);
            }else{
                sendResponse(config.auto_clicks);
            }
        }else if(request.type === "query_content_auto_clicks"){
            var url = new URL(request.url);

            if(url.host && config.auto_clicks[url.host]){
                sendResponse(config.auto_clicks[url.host]);
            }else{
                sendResponse(null);
            }
        }else if(request.type === "remove_auto_clicks")
        {
            for(var i=0;i<request.items.length;++i)
            {
                var item       = request.items[i];
                var host_items = config.auto_clicks[item.host];

                if(host_items)
                {
                    var temp_array = [];

                    for(var y=0;y<host_items.length;++y)
                    {
                        var host_item = host_items[y];

                        if(!(host_item.selector === item.selector && host_item.path === item.path)){
                            temp_array.push(host_item);
                        }
                    }
                    config.auto_clicks[item.host] = temp_array;
                }
            }
            chrome.storage.local.set({auto_clicks:config.auto_clicks});
        }
    });
    chrome.runtime.onConnect.addListener((port) => {
        port.onMessage.addListener((msg) => {});
    });

    init_context_menu();


    /*
    chrome.browserAction.setBadgeBackgroundColor({
        color: "red"
    });

    chrome.browserAction.setBadgeText({
        tabId,
        text
    });*/
});

