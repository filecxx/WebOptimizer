var element_selector =
{
    find_unique_id:function(element)
    {
        while(element = element.parentNode)
        {
            if(typeof(element.id) === "string" && element.id.length > 0 && !(element.id[0] >= '0' && element.id[0] <= '9')){
                if(document.querySelectorAll("#" + element.id).length === 1){
                    return element.id;
                }
            }
        }
        return null;
    },
    make_unique_selector:function(element,child_selector,root_id)
    {
        var current  = "";
        var selector = "";

        if(element.id){
            current = "#" + element.id;
        }else if(typeof(element.className) === "string"){
            current = element_selector.make_class_selector(element);
        }else{
            current = element.nodeName.toLowerCase();
        }
        if(child_selector){
            selector = current + ">" + child_selector;
        }else{
            selector = current;
        }
        if(document.querySelectorAll(selector).length === 1){
            return {selector:selector,unique:true};
        }else if(root_id)
        {
            var temp_selector = "#" + root_id + " " + selector;
            var elements      = document.querySelectorAll(temp_selector);

            if(elements.length === 1){
                return {selector:temp_selector,unique:true};
            }
        }
        var nth = element_selector.make_selector_index(element,current);

        if(nth !== 0)
        {
            if(typeof(nth) === "string"){
                current = nth;
            }else{
                current += ":nth-child(" + nth + ")";
            }
            if(child_selector){
                selector = current + ">" + child_selector;
            }else{
                selector = current;
            }
        }
        return {selector:selector,unique:document.querySelectorAll(selector).length === 1};
    },
    make_selector_index:function(element,selector)
    {
        var parent = element.parentNode;
        var index  = 0;
        var nth    = 0;

        if(!parent || parent.children.length === 0){
            return index;
        }
        if(parent.children.length === 1 && parent.children[0] === element){
            return selector;
        }else if(element === parent.children[0]){
            return selector + ":first-child";
        }else if(element === parent.children[parent.children.length - 1]){
            return selector + ":last-child";
        }
        for(var i=0;i<parent.children.length;++i)
        {
            index++;

            if(nth !== 0){
                break;
            }else if(element === parent.children[i]){
                nth = index;

                if(index > 1){
                    break;
                }
            }
        }
        return index > 1 ? nth : 0;
    },
    make_class_selector:function(element)
    {
        var items    = element.className.trim().split(' ');
        var selector = element.nodeName.toLowerCase();

        for(var i=0;i<items.length;++i)
        {
            var text = items[i].trim();

            if(text.length > 0){
                selector += "." + text;
            }
        }
        return selector;
    },
    make_selector:function(element)
    {
        var result = element_selector.make_unique_selector(element);

        if(result.unique){
            return result.selector;
        }
        var root_id  = element_selector.find_unique_id(element);
        var selector = result.selector;

        while(element = element.parentNode)
        {
            result   = element_selector.make_unique_selector(element,selector,root_id);
            selector = result.selector;

            if(result.unique){
                break;
            }
        }
        return selector;
    },
    select:function(callback,from_popup)
    {
        var styles = {
            "background":"red",
            "opacity":"0.4",
            "position": "absolute",
            "margin":"0",
            "padding":"0",
            "pointer-events":"none",
            "z-index":"2147483646",
            "border":"1px dashed #660d29"
        }
        if(from_popup){
            styles.top    = 0;
            styles.left   = 0;
            styles.width  = (document.body.offsetWidth - 2)+ "px";
            styles.height = "100%";
        }

        var elem = document.createElement("div");
        var mousedown = function(e)
        {
            e.preventDefault();
            e.stopPropagation();
            document.removeEventListener("mousedown",mousedown,true);

            return false;
        }
        var click = function(e)
        {
            e.preventDefault();
            e.stopPropagation();

            document.body.removeChild(elem);
            document.removeEventListener("mouseover",mouseover,true);
            document.removeEventListener("click",click,true);
            callback(element_selector.make_selector(e.target));

            return false;
        }
        var mouseover = function(e)
        {
            var offset = get_element_offset(e.target);

            elem.style["left"]   = offset.left + "px";
            elem.style["top"]    = offset.top + "px";
            elem.style["width"]  = (e.target.offsetWidth - 2) + "px";
            elem.style["height"] = (e.target.offsetHeight - 2) + "px";

            e.preventDefault();
            e.stopPropagation();

            return false;
        }
        for(var name in styles){
            elem.style[name] = styles[name];
        }
        document.body.appendChild(elem);
        document.addEventListener("mouseover",mouseover,true);
        document.addEventListener("mousedown",mousedown,true);
        document.addEventListener("click",click,true);
    }
}