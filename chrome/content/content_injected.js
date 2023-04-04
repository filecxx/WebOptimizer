(function()
{
    var preventDefault_old = null;
    var onbeforeunload_old = null;
    var settings           = {};

    var beforeunload = function(e){
        if(settings.disable_leave_site_alert){
            e.stopPropagation();
        }
    }
    var bind_beforeunload = function()
    {
        if(settings.disable_leave_site_alert && !onbeforeunload_old){
            onbeforeunload_old = window.onbeforeunload;
            window.onbeforeunload = beforeunload;
            window.__defineSetter__("onbeforeunload",function(){});
        }
    }
    var remove_mouse_restriction = function(element)
    {
        if(settings.unlock_text_select_restriction && element.hasAttributes("onselectstart")){
            element.removeAttribute("onselectstart");
            element.__defineSetter__("onselectstart",function(){});
        }
        if(settings.unlock_copy_restriction && element.hasAttributes("oncopy")){
            element.removeAttribute("oncopy");
            element.oncopy = null;
            element.__defineSetter__("oncopy",function(){});
        }
    }
    window.addEventListener("message",function(e)
    {
        if(typeof e !== "object" || typeof e.data !== "object" || e.data.prefix !== "@web_optimizer_settings"){
            return;
        }
        settings = e.data.settings;

        if(document.body){
            remove_mouse_restriction(document.body);
        }
        bind_beforeunload();
    });

    document.addEventListener("beforeunload",beforeunload,true);
    document.addEventListener("copy",function (e){
        if(settings.unlock_copy_restriction){
            e.stopPropagation();
            return false;
        }
    },true);

    document.addEventListener("mouseover",function(e)
    {
        var element = e.target;

        remove_mouse_restriction(element);

        var contextmenu = function(e){
            if(settings.unlock_contextmenu){
                e.stopPropagation();
                return false;
            }
        };
        var mouseup = function(e)
        {
            if(preventDefault_old){
                Event.prototype.preventDefault = preventDefault_old;
            }
            element.removeEventListener("mouseup",mouseup,true);
            element.removeEventListener("mousedown",mousedown,true);
            element.removeEventListener("contextmenu",contextmenu,true);
        }
        var mousedown = function(e)
        {
            if(settings.unlock_contextmenu){
                preventDefault_old = Event.prototype.preventDefault;
                Event.prototype.preventDefault = function(){};
            }
            element.addEventListener("mouseup",mouseup,true);
            element.addEventListener("contextmenu",contextmenu,true);
        }
        element.addEventListener("mousedown",mousedown,true);
    });
    document.addEventListener("visibilitychange",function(e)
    {
        if(settings.prevent_visibility_detection && document.visibilityState === "hidden"){
            e.stopPropagation();
            return false;
        }
    },true);

})();
