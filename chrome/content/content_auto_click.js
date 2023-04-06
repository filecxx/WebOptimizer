var content_auto_click =
{
    rules:[],
    rules_once:[],
    loop_handlers:{},

    path:function(){
        var url = new URL(document.location.href);
        return url.pathname + url.search;
    }(),
    match_path:function(path)
    {
        if(path === "" || path === content_auto_click.path){
            return true;
        }
        return false;
    },
    add_loop:function(rule)
    {
        var clicked = 0;
        var handler = setInterval(function()
        {
            content_auto_click.exec(rule.selector);
            
            if(++clicked >= rule.total){
                clearInterval(handler);
                delete content_auto_click.loop_handlers[rule.selector];
            }
        },Math.max(10,rule.interval));

        content_auto_click.loop_handlers[rule.selector] = handler;
    },
    update_rules:function(rules)
    {
        for(var i=0;i<rules.length;++i)
        {
            var rule = rules[i];

            if(!content_auto_click.match_path(rule.path)){
                continue;
            }
            if(rule.loop){
                content_auto_click.add_loop(rule);
            }
            if(rule.once){
                content_auto_click.rules_once.push(rule);
            }
        }
        content_auto_click.rules = rules;
    },
    exec:function(selector)
    {
        try{
            var elements = document.querySelectorAll(selector);

            for(var i=0;i<elements.length;++i){
                trigger_click(elements[i]);
            }
        }catch(e){}
    },
    exec_once:function(target)
    {
        var rules = content_auto_click.rules_once;

        for(var i=0;i<rules.length;++i){
            if(!target){
                content_auto_click.exec(rules[i].selector);
            }else if(target.matches && target.matches(rules[i].selector)){
                trigger_click(target);
            }
        }
    },
    add:function(values)
    {
        chrome.runtime.sendMessage({type:"add_auto_click",values:values});
    },
    create_rule:function(selector)
    {
        var dialog = null;
        var new_label = function(text) {
            return Std.ui("Label",{text:text,css:{wordBreak:"keep-all",whiteSpace:"nowrap"}})
        }
        var btn_cancel = {
            ui:"Button",
            styleType:"textBesideIcon",
            icon:get_extension_url("icons/close.png"),
            text:lang("cancel"),
            click:function (){
                dialog.close();
            }
        }
        var btn_test = {
            ui:"Button",
            styleType:"textBesideIcon",
            icon:get_extension_url("icons/cursor.png"),
            text:lang("test"),
            click:function(){
                content_auto_click.exec(selector_edit.value());
            }
        }
        var btn_add = Std.ui.create("Button",{
            styleType:"textBesideIcon",
            icon:get_extension_url("icons/add.png"),
            text:lang("add"),
            click:function(){
                content_auto_click.add({
                    host:host.value(),
                    path:path.value(),
                    selector:selector_edit.value(),
                    once:mode_once.value(),
                    loop:mode_loop.value(),
                    interval:interval.value(),
                    total:total.value(),
                });
                dialog.close();
            }
        })
        var host = Std.ui("LineEdit",{
            value:window.location.host
        });
        var path =  Std.ui("LineEdit",{
            placeHolder:lang("empty_allowed"),
            value:function(){
                var ret = new URL(document.location.href);
                return ret.pathname + ret.search;
            }()
        })

        var selector_edit = Std.ui("TextEdit",{
            value:selector
        })
        var enable_button = function() {
            btn_add.enable(mode_once.value() || mode_loop.value());
        }
        var mode_once = Std.ui("ToggleBox",{
            value:1,
            on:{
                change:enable_button
            }
        })
        var mode_loop = Std.ui("ToggleBox",{
            value:0,
            on:{
                change:function(value)
                {
                    enable_button();
                    interval.enable(value);
                    total.enable(value);
                }
            }
        })
        var interval = Std.ui("SpinBox",{
            value:1000,
            min:10,
            type:"int",
            enable:false
        })
        var total = Std.ui("SpinBox",{
            value:1,
            min:1,
            type:"int",
            enable:false
        })

        var layout = {
            ui:"VBoxLayout",
            items:[
                {
                    ui:"GridLayout",
                    columnCount:2,
                    items:[
                        new_label(lang("host") + ": "),
                        host,
                        new_label(lang("path") + ": "),
                        path,
                    ]
                },
                new_label("CSS " + lang("selector") + ": "),
                selector_edit,
                {
                    ui:"HBoxLayout",
                    items:[
                        new_label(lang("once") + ": "),
                        mode_once,
                        new_label(lang("loop") + ": "),
                        mode_loop,
                        new_label(lang("interval") + "(ms): "),
                        interval,
                        new_label(lang("total") + ": "),
                        total,
                    ]
                },
                {
                    ui:"HBoxLayout",
                    items:[btn_cancel,{ui:"stretch",level:3},btn_test,btn_add]
                }
            ]
        };
        var shadow      = newDiv().appendTo("body").css({});
        var shadow_root = shadow.dom.attachShadow({mode: 'open'});

        content_injector.inject_css("libs/ui/theme/all.css",shadow_root,function()
        {
            dialog = Std.ui("Window",{
                layout:layout,
                title:lang("auto_click"),
                renderTo:shadow_root,
                height:300,
                resizable:false,
                css:{
                    position:"fixed"
                },
                on:{
                    destroy:function(){
                        shadow.remove();
                    }
                }
            });
        })
    }
}