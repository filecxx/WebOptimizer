Std.ui.module("HelpIcon",{
    parent:"Image",
    option:{
        width:16,
        height: 16
    },
    main:function(that,opts){
        var tooltip = {
            arrow:false,
            theme:"black",
            side:"left-center"
        };
        if(opts.text){
            tooltip.html = opts.text;
        }
        if(opts.image){
            var dom = newDom("img");
            dom.attr("src","images/" + opts.image + ".png");
            dom.on("load",function(){

            });
            tooltip.html = dom;
        }
        that.src("icons/help.png");
        that.plugin("ToolTip",tooltip);
    }
});

Std.dom.behaviorScript["text/init_lang"] = function()
{
    var replace_text = function(content)
    {
        var index  = 0;
        var result = "";
        var end    = 0;

        while((index = content.indexOf("${",index)) !== -1)
        {
            result += content.substring(end,index);

            if((end = content.indexOf("}",index)) === -1){
                end = index;
                break;
            }
            var key = content.substring(index + 2,end);
            result += lang(key);
            index = end;
            end++;
        }
        result += content.substring(end);

        return result;
    }
    Std.doms('script[type="text/std-ui"]').each(function(i,dom){
        dom.text(replace_text(dom.text()));
    });
}

chrome.storage.local.get({settings:config.settings,replace_words:config.replace_words},(values)=>
{
    if(chrome.runtime.lastError) {
        return;
    }
    config.settings      = values.settings;
    config.replace_words = values.replace_words;

    var send_tabs_message = function(message,callback,frame_id)
    {
        chrome.tabs.query({
            currentWindow: true,
            active: true
        },function(tabs){
            let receiver = function(response){
                if(!chrome.runtime.lastError && callback){
                    callback(response);
                }
            };
            if(typeof frame_id === "number"){
                chrome.tabs.sendMessage(tabs[0].id,message,{frameId:frame_id},receiver);
                return
            }
            chrome.webNavigation.getAllFrames({tabId: tabs[0].id},function(frames){
                for(let frame of frames){
                    chrome.tabs.sendMessage(tabs[0].id,message,{frameId:frame.frameId},receiver);
                }
            });
        });
    }
    var save_settings = function(name,value)
    {
        config.settings[name] = value;
        chrome.storage.local.set({settings:config.settings});
    };
    let create_settings_layout = function()
    {
        let rule = Std.ui.build("settings");

        for(let name in rule.dataMap)
        {
            let widget = rule.dataMap[name];

            if(widget.ui === "Button"){
                continue;
            }
            if(widget.ui === "ToggleBox"){
                widget.on("change",function(value){
                    save_settings(name,value);
                })
            }
            widget.value(config.settings[name]);
        }
        rule.dataMap["auto_click"].on("click",function(){
            send_tabs_message({type:"auto_click",from_popup:true});
            this.enable(false)
        });
        return rule.data[0];
    }
    var replace_word_add = function()
    {
        let rule   = Std.ui.build("replace_words_add");
        var add    = function(){
            var origin   = rule.dataMap["origin"].value().trim();
            var replaced = rule.dataMap["replaced"].value().trim();

            if(origin === replaced){
                return;
            }
            replace_words_grid.appendRow({cells:[origin,replaced]});
            config.replace_words[origin] = replaced;
            chrome.storage.local.set({replace_words:config.replace_words});
            window.close();
        }
        let window = Std.ui("Window",{
            title:lang("add"),
            width:300,
            height:132,
            layout: rule.data[0],
            toolBar:{
                iconWidth:24,
                iconHeight:24,
                items:[
                    {text:lang("save"),icon:"icons/save.png",click:add}
                ]
            }
        })
        return rule.data[0];
    }
    var replace_word_remove = function()
    {
        replace_words_grid.removeRow(replace_words_grid.selectedRows());

        let result = {};

        for(let i=0;i<replace_words_grid.rowCount();++i) {
            let data = replace_words_grid.row(i).cells;
            result[data[0]] = data[1];
        }
        chrome.storage.local.set({replace_words:config.replace_words = result});
    }
    var auto_click_remove = function()
    {
        var result        = [];
        var selected_rows = auto_click_grid.selectedRows();

        for(let i=0;i<selected_rows.length;++i)
        {
            let data = auto_click_grid.row(selected_rows[i]).cells;

            result.push({
                host:data[0],
                selector:data[1],
                path:data[2]
            })
        }
        if(result.length > 0){
            auto_click_grid.removeRow(selected_rows);
            chrome.runtime.sendMessage({type:"remove_auto_clicks",items:result},function(response){});
        }
    }
    var auto_click_show_all = function()
    {
        var query_all = this.checked ? this.checked() : false;

        auto_click_grid.clearRows();

        chrome.tabs.query({active:true,currentWindow:true},function(tabs)
        {
            let url       = new URL(tabs[0].url);
            let add_rules = function(rules)
            {
                for(let i=0;i<rules.length;++i){
                    let item = rules[i];
                    auto_click_grid.appendRow({
                        cells:[item.host,item.selector,item.path,lang(item.once ? "yes" : "no"),lang(item.loop ? "yes" : "no"),item.interval,item.total]
                    })
                }
            }
            chrome.runtime.sendMessage({type:"query_auto_clicks",host:query_all ? null : url.host},function(response)
            {
                if(response instanceof Array) {
                    add_rules(response);
                }else if(typeof(response) === "object"){
                    for(var name in response){
                        add_rules(response[name]);
                    }
                }
            });
        });
    }
    var copy_auto_clicks = function()
    {
        var rows   = auto_click_grid.selectedRows();
        var values = "";
        var add    = function(row)
        {
            values += JSON.stringify({
                host:auto_click_grid.cell(row,0),
                selector:auto_click_grid.cell(row,1),
                path:auto_click_grid.cell(row,2),
                once:auto_click_grid.cell(row, 3) === lang("yes"),
                loop:auto_click_grid.cell(row,4) === lang("yes"),
                interval:auto_click_grid.cell(row,5),
                total:auto_click_grid.cell(row,6)
            }) + "\r\n";
        }
        if(rows.length === 0){
            for(var i=0;i<auto_click_grid.rowCount();++i){
                add(i);
            }
        }else{
            for(var i=0;i<rows.length;++i){
                add(rows[i]);
            }
        }
        copy_to_clipboard(values.length !== 0 ? values : "");
    }
    var paste_auto_clicks = function()
    {
        var values = [];
        var on_ok  = function()
        {
            var rules = this.value().trim().split("\n");

            for(var i=0;i<rules.length;++i)
            {
                try{
                    var rule = JSON.parse(rules[i] = rules[i].trim());

                    if(typeof(rule) === "object" && rule.host && rule.path && typeof(rule.selector) === "string"){
                        values.push(rule);
                    }
                }catch(e){
                    console.log(e)
                }
            }
            if(values.length !== 0){
                chrome.runtime.sendMessage({type:"add_auto_clicks",values:values});

                Std.ui("Notify").success({
                    title:lang("paste"),
                    theme:"white",
                    text:"OK",
                    timeout:"2s"
                });
            }
        }
        Std.ui("MessageBox",{
            title:lang("paste"),
            text:lang("paste"),
            inputType:"TextEdit",
            inputWidth:280,
            inputHeight:100,
            on:{
                ok:on_ok
            }
        });
    }
    var replace_words_toolbar = Std.ui("ToolBar",{
        items:[
            {text:lang("add"),icon:"icons/add.png",click:replace_word_add},
            {text:lang("remove"),icon:"icons/remove.png",click:replace_word_remove}
        ]
    });
    var replace_words_grid = Std.ui("Grid",{
        cellEditable:false,
        rowNumbers:true,
        columnDroppable:true,
        columnResizable:true,
        columnSortable:true,
        stripeRows:true,
        rowResizable:true,
        selectionMode:"rows",
        hoverMode:"cell",
        valueType:"map",
        columns:[
            {
                name:"origin",
                text:lang("origin"),
                width:160
            },
            {
                name:"replaced",
                text:lang("replaced"),
                width:160
            }
        ]
    });
    var auto_click_toolbar = Std.ui("ToolBar",{
        iconWidth:16,
        iconHeight:16,
        items:[
            {text:lang("remove"),icon:"icons/remove.png",click:auto_click_remove},
            {ui:"sep"},
            {text:lang("copy"),icon:"icons/copy.png",click:copy_auto_clicks},
            {text:lang("paste"),icon:"icons/paste.png",click:paste_auto_clicks},
            {ui:"sep"},
            {text:lang("show_all"),checkable:true,icon:"icons/links.png",click:auto_click_show_all},
        ]
    });
    var auto_click_grid = Std.ui("Grid",{
        cellEditable:false,
        rowNumbers:true,
        columnDroppable:true,
        columnResizable:true,
        columnSortable:true,
        stripeRows:true,
        rowResizable:true,
        selectionMode:"rows",
        hoverMode:"cell",
        valueType:"map",
        columns:[
            {
                name:"host",
                text:lang("host"),
                width:120
            },
            {
                name:"selector",
                text:"CSS " + lang("selector"),
                width:180
            },
            {
                name:"path",
                text:lang("path"),
                width:160
            },
            {
                name:"once",
                text:lang("once"),
                width:80
            },
            {
                name:"loop",
                text:lang("loop"),
                width:80
            },
            {
                name:"interval",
                text:lang("interval"),
                width:80
            },
            {
                name:"total",
                text:lang("total"),
                width:80
            }
        ]
    });
    Std.main(function()
    {
        let tab_panel = Std.ui("TabPanel",
        {
            items:[
                {
                    button:{
                        text:lang("settings"),
                        icon:"icons/settings.png",
                        iconWidth:16,
                        iconHeight:16,
                        styleType:"textBesideIcon"
                    },
                    content:{
                        layout:create_settings_layout()
                    }
                },
                {
                    button:{
                        text:lang("auto_clicks"),
                        icon:"icons/cursor.png",
                        iconWidth:16,
                        iconHeight:16,
                        styleType:"textBesideIcon"
                    },
                    content:{
                        layout:{
                            ui:"VBoxLayout",
                            items:[
                                auto_click_toolbar,
                                auto_click_grid
                            ]
                        }
                    }
                },
                {
                    button:{
                        text:lang("replace_words"),
                        icon:"icons/text.png",
                        iconWidth:16,
                        iconHeight:16,
                        styleType:"textBesideIcon"
                    },
                    content:{
                        layout:{
                            ui:"VBoxLayout",
                            items:[
                                replace_words_toolbar,
                                replace_words_grid
                            ]
                        }
                    }
                }
            ]
        });
        let main_widget = Std.ui("widget",{
            width:420,
            height:420,
            renderTo:"body",
            layout:{
                ui:"VBoxLayout",
                items:[tab_panel]
            }
        });
        auto_click_show_all()

        for(let origin in config.replace_words){
            replace_words_grid.appendRow({cells:[origin,config.replace_words[origin]]});
        }
    });
});


