let content_injector =
{
    inject_script:function(url,callback)
    {
        let target = document.getElementsByTagName("head")[0] || document.getElementsByTagName("html")[0];
        let temp   = document.createElement('script');

        temp.setAttribute('type','text/javascript');
        temp.src    = get_extension_url(url);
        temp.async  = false;
        temp.onload = function()
        {
            target.removeChild(this);

            if(callback){
                callback();
            }
        };
        if(target)
        {
            if(target.prepend){
                target.prepend(temp);
            }else{
                target.appendChild(temp);
            }
        }
    },
    inject_css:function(url,target,callback)
    {
        if(!target){
            target = document.getElementsByTagName("head")[0] || document.getElementsByTagName("html")[0];
        }
        var link = document.createElement("link");

        link.href = get_extension_url(url);
        link.type = "text/css";
        link.rel = "stylesheet";
        link.onload = callback;
        target.appendChild(link);
    }

}