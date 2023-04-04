var content_replace_words =
{
    /*
     * word count
    */
    word_count:0,
    /*
     * timeStamp
    */
    timeStamp:0,
    /*
     * weak set
    */
    weak_set:new WeakSet,
    /*
     * replace content
    */
    replace_content:function(content)
    {
        var total = 0;

        for(var origin in config.replace_words)
        {
            var replace  = function(origin,replaced){
                content = content.replaceAll(origin,function(text){
                    total++;
                    return replaced;
                });
            }
            replace(origin,config.replace_words[origin]);
        }
        return {total:total,text:content};
    },
    /*
     * replace text node
    */
    replace_text_node:function(element)
    {
        if(!element || content_replace_words.word_count === 0 || content_replace_words.weak_set.has(element)){
            return;
        }
        content_replace_words.weak_set.add(element);
        var result = content_replace_words.replace_content(element.textContent || "");

        if(result.total > 0){
            element.textContent = result.text;
        }
    },
    /*
     * replace text node
    */
    replace_title:function()
    {
        if(content_replace_words.word_count === 0){
            return;
        }
        var result = content_replace_words.replace_content(document.title);

        if(result.total > 0){
            document.title = result.text;
        }
    }

}