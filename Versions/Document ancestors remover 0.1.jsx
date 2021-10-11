///////////////////////////////////////////////////////////////////////////////
// Document ancestors remover ver. 0.1
// jazz-y@ya.ru
///////////////////////////////////////////////////////////////////////////////

/*
<javascriptresource>
<category>jazzy</category>
<enableinfo>true</enableinfo>
</javascriptresource>
*/

switch (BridgeTalk.appName) {
    case "photoshop":
        if (app.documents.length) {
            if (ExternalObject.AdobeXMPScript == undefined) ExternalObject.AdobeXMPScript = new ExternalObject("lib:AdobeXMPScript")
            var xmp = new XMPMeta(app.activeDocument.xmpMetadata.rawData)
            xmp.deleteProperty(XMPConst.NS_PHOTOSHOP, "DocumentAncestors")
            app.activeDocument.xmpMetadata.rawData = xmp.serialize()
        }
        break;
    case "bridge":
        var toolMenu = MenuElement.create("command", "Document ancestors remover", "at the end of Tools")
        var contextMenu = MenuElement.create("command", "Remove document ancestors", "at the end of Thumbnail")
        contextMenu.onSelect = function () {
            var sel = app.document.selections
            for (var i = 0; i < sel.length; i++) {
                if (sel[i].type == "file") {
                    var md = sel[i].synchronousMetadata
                    md.namespace = "http://ns.adobe.com/photoshop/1.0/"
                    md.DocumentAncestors = ""
                }
            }
        }
        toolMenu.onSelect = function () {
            var sel = app.document.selections, names = [], counter = 0;
            for (var i = 0; i < sel.length; i++) {
                if (sel[i].type == "file") {
                    var md = sel[i].synchronousMetadata
                    md.namespace = "http://ns.adobe.com/photoshop/1.0/"
                    var len = md.DocumentAncestors.length
                    if (len > 1) { names.push(sel[i].name); counter += len }
                }
            }

            if (names.length > 0) {
                var msg = names.length > 20 ? "Найдено " + names.length + " документов." : "Найдены следующие документы:\n" + names.join('\n')
                if (confirm(msg + '\n\n' + "Общее количество записей document ancestors: " + counter + '\n\n' + "Удалить их?")) {
                    for (var i = 0; i < sel.length; i++) {
                        if (sel[i].type == "file") {
                            var md = sel[i].synchronousMetadata
                            md.namespace = "http://ns.adobe.com/photoshop/1.0/"
                            md.DocumentAncestors = ""
                        }
                    }
                }
            }
        }
        break;
}