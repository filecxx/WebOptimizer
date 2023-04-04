'use strict';

String.prototype.hashCode = function()
{
    let hash = 0, i = 0, len = this.length;

    while ( i < len ) {
        hash  = ((hash << 5) - hash + this.charCodeAt(i++)) << 0;
    }
    return hash;
};

/*
 * float
*/
function float(data,check)
{
    let f = parseFloat(data);

    if(check === true){
        return Math.ceil(f) - f != 0;
    }
    return f;
}

/*
 * is numeric
*/
function is_numeric(data)
{
    return !isNaN(float(data)) && isFinite(data);
}

/*
 * is object
*/
function is_object(data)
{
    return typeof data === "object";
}

/*
 * is number
*/
function is_number(data)
{
    return typeof data === "number";
}

/*
 * is string
*/
function is_string(data)
{
    return typeof data === "string";
}

/*
 * is array
*/
function is_array(data)
{
    return data instanceof Array;
}


/*
 * extract url suffix
*/
function extract_url_suffix(url)
{
    let path = url.pathname;

    if(path.length > 0)
    {
        let index = path.lastIndexOf('.');

        if(index !== -1){
            return path.substr(index + 1).toLowerCase();
        }
    }
    return "";
}

/*
 * extract file name
*/
function extract_file_name(text)
{
    let filename = text;
    let index    = filename.lastIndexOf('/');

    if(index === -1){
        index = filename.lastIndexOf('\\');
    }
    if(index !== -1){
        filename = filename.substr(index + 1);
    }
    return filename;
}

/*
 * create element
*/
let create_element = function(name,className)
{
    let element = document.createElement(name);

    if(className){
        element.className = className;
    }
    return element;
}

/*
 * trigger click
*/
var trigger_click = function(element)
{
    if(typeof(element.click) === "function"){
        element.click();
    }else{
        var e = document.createEvent("MouseEvents");
        e.initEvent('click',false,true);
        element.dispatchEvent(e);
    }
}

/*
 * get element offset
*/
function get_element_offset(element)
{
    var top  = element.offsetTop;
    var left = element.offsetLeft;

    while(element = element.offsetParent)
    {
        top += element.offsetTop;
        left += element.offsetLeft;
    }
    return {left:left,top:top};
}

/*
 * get element style
*/
var get_element_style = function(element,styleName,fromElementStyle)
{
    var elementStyle = element.style;

    if(fromElementStyle !== false && elementStyle && elementStyle[styleName]){
        return elementStyle[styleName];
    }else if(element.currentStyle){
        return element.currentStyle[styleName];
    }else if(getComputedStyle){
        try{
            return getComputedStyle(element,null).getPropertyValue(styleName);
        }catch(e){}
    }
    return "";
}

/*
 * is transparent element
*/
function is_transparent_element(element)
{

}


/*
 * copy to clipboard
*/
function copy_to_clipboard(text)
{
    const input = document.createElement('textarea');
    input.style.position = 'fixed';
    input.style.opacity = 0;
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('Copy');
    document.body.removeChild(input);
}

