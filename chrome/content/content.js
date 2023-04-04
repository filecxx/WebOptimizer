'use strict';

var injected_script_loaded   = false;
var injected_script_callback = null;
var is_in_empty_frame        = function(){
    var protocol = window.location.protocol;

    return (!(window === window.parent || window.opener)) && (!protocol || !protocol.toLowerCase().startsWith("http"));
}();

if(!is_in_empty_frame)
{
    content_injector.inject_script("content/content_injected.js",function()
    {
        injected_script_loaded = true;

        if(injected_script_callback){
            injected_script_callback();
        }
    });
}


///--------------------------
/*
 * todo:
 * remove result from search engine
 * remove cookie policy element
 * super prefetch
 *
*/

chrome.storage.local.get({settings:config.settings,replace_words:config.replace_words},(values)=>
{
    if(is_in_empty_frame){
        return;
    }
    config.settings      = values.settings;
    config.replace_words = values.replace_words;

    content_replace_words.word_count = Object.keys(config.replace_words).length;

    var status = {
        ui_loaded:false,
        ui_onload:null,
        ad_blocker_layer_removed:false,
        body_overflow_removed:false
    }
    var runtime_events =
    {
        auto_click:function(data)
        {
            element_selector.select(function(selector){
                load_ui(function(){
                    content_auto_click.create_rule(selector);
                });
            },data.from_popup === true);
        },
        ui_loaded:function()
        {
            Std.ui.status.zIndex = 9999;
            status.ui_onload();
        }
    }
    var load_ui = function(callback)
    {
        status.ui_onload = callback;

        if(status.ui_loaded){
            return status.ui_onload();
        }
        content_injector.inject_css("../libs/ui/theme/all.css");
        chrome.runtime.sendMessage({type:"load_ui"});
    }
    var init_mutation_observer = function()
    {
        var container = document.documentElement || document.body;
        var observer  = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

        container.addEventListener("DOMNodeInserted",function(e)
        {
            var target = e.target;

            if(target.nodeType === 3){
                content_replace_words.replace_text_node(target);
            }else if(target.nodeType === 1){
                content_auto_click.exec_once(target);
            }
        });
        container.addEventListener("DOMCharacterDataModified",function(e)
        {
            var target = e.target;

            if(target.nodeType === 3 && e.newValue !== e.prevValue){
                content_replace_words.replace_text_node(target);
            }
        });
        content_replace_words.replace_title();
    }

    document.onmouseover = function(e)
    {
        var target        = e.target;
        var relatedTarget = e.relatedTarget;

        var unset_user_select = function(element)
        {
            if(element && get_element_style(element,"user-select") === "none"){
                element.style["user-select"] = "text";
            }
        }
        if(config.settings.unlock_text_select_restriction)
        {
            unset_user_select(target);

            if(target !== relatedTarget){
                unset_user_select(relatedTarget);
            }
        }
        if(config.settings.remove_anti_ad_blocker_layer)
        {
            var html                 = target.innerHTML;
            var body_overflow_hidden = get_element_style(document.body,"overflow") === "hidden";

            var check_text = function(text){
                if(!text){
                    return false;
                }
                text = target.innerHTML.toLowerCase();

                return text.indexOf("ad") !== -1 && text.indexOf("blocker") !== -1
            }
            if(body_overflow_hidden && (check_text(html) || check_text(target.className)))
            {
                var element = target;
                var latest  = null;

                do{
                    if(element === document.body || element === document.documentElement){
                        break;
                    }
                    if(parseInt(get_element_style(element,"width")) >= document.body.offsetWidth - 4){
                        latest = element;
                    }
                }while(element = element.parentNode);

                if(latest){
                    status.ad_blocker_layer_removed = true;
                    status.body_overflow_removed = true;
                    latest.parentNode.removeChild(latest);
                    document.body.style["overflow"] = "visible";
                }
            }
            if(body_overflow_hidden && status.body_overflow_removed) {
                document.body.style["overflow"] = "visible";
            }
        }
    }
    window.onload = function()
    {
        function replace_text_nodes(elem)
        {
            if(!elem){
                return;
            }
            for(var nodes = elem.childNodes, i = nodes.length; i--;)
            {
                var node     = nodes[i];
                var nodeType = node.nodeType;

                if(nodeType === 3){
                    content_replace_words.replace_text_node(node);
                }else if (nodeType === 1 || nodeType === 9 || nodeType === 11){
                    replace_text_nodes(node)
                }
            }
        }
        if(content_replace_words.word_count !== 0 && document.body){
            replace_text_nodes(document.body);
        }
        init_mutation_observer();
        content_auto_click.exec_once();
    }
    ///--------------------------
    //replace keywords


    //----------------
    var sync_to_injected_script = function() {
        window.postMessage({prefix:"@web_optimizer_settings",settings:config.settings});
    }
    var on_runtime_message = function(request,sender,sendResponse)
    {
        if(request && (request.type in runtime_events)){
            runtime_events[request.type](request,sender,sendResponse);
        }
    }
    var interval_handle = setInterval(function(){
        content_replace_words.weak_set = new WeakSet;
    },500);


    chrome.runtime.onMessage.addListener(on_runtime_message);
    chrome.runtime.connect().onDisconnect.addListener(() => {
        clearInterval(interval_handle);
        chrome.runtime.onMessage.removeListener(on_runtime_message);
    });
    chrome.storage.onChanged.addListener(function(changes,namespace)
    {
        if(changes.settings)
        {
            for(let [key,{oldValue,newValue}] of Object.entries(changes))
            {
                if(oldValue === newValue){
                    continue;
                }
                config.settings[key] = newValue;

                switch(key)
                {
                case "unlock_text_select_restriction":
                case "unlock_copy_restriction":
                case "block_popup_windows":
                    //skipped
                    break;
                }
            }
            sync_to_injected_script();
        }else if(changes.replace_words){
            config.replace_words = changes.replace_words;
            content_replace_words.word_count = Object.keys(config.replace_words).length;
        }
    });
    chrome.runtime.sendMessage({type:"query_content_auto_clicks",url:window.location.href},function(response){
        if(response){
            content_auto_click.update_rules(response);
        }
    });

    if(injected_script_loaded){
        sync_to_injected_script();
    }else{
        injected_script_callback = sync_to_injected_script;
    }

});
