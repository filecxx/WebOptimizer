var module_fs    = require("fs");
var module_path  = require("path");
var StdJSBuilder = require("StdJSBuilder");

function copyFolderSync(from, to) {
    module_fs.mkdirSync(to);
    module_fs.readdirSync(from).forEach(element => {
        var target_name = element;
        if(element[0] === "." || element === "manifest_mv3.json"){
            return;
        }else if(element === "manifest_mv2.json"){
            target_name = "manifest.json";
        }
        if (module_fs.lstatSync(module_path.join(from, element)).isFile()) {
            module_fs.copyFileSync(module_path.join(from, element), module_path.join(to, target_name));
        } else {
            copyFolderSync(module_path.join(from, element), module_path.join(to, element));
        }
    });
}

Std.main(function()
{
    var distPath = "../chrome_dist/";

    if(module_fs.existsSync(distPath)){
        StdJSBuilder.remove(distPath)
    }
    copyFolderSync("../chrome",distPath);

    var compress_directory = function(dir_name)
    {
        let directory = distPath + dir_name;

        Std.each(module_fs.readdirSync(directory),function(i,fileName)
        {
            if(fileName[0] === '.'){
                return;
            }
            var filePath = directory + module_path.sep + fileName;
            var stat     = module_fs.statSync(filePath);
            var url      = Std.url(filePath);
            var suffix   = url.suffix.toLowerCase();

            if(stat.isFile() && suffix === "css"){
                StdJSBuilder.buildCSSFile(filePath,filePath,true,false);
            }else if(stat.isFile() && suffix === "js"){
                StdJSBuilder.buildJSFile(filePath,filePath,true,false);
            }
        });
    }
    
    compress_directory("parser");
    compress_directory("libs");
    compress_directory("content");
    compress_directory("background");
    compress_directory("");
});
