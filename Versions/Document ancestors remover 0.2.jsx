///////////////////////////////////////////////////////////////////////////////
// Document ancestors remover ver. 0.2
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
            if (xmp.doesPropertyExist(XMPConst.NS_PHOTOSHOP, "DocumentAncestors")) {
                xmp.deleteProperty(XMPConst.NS_PHOTOSHOP, "DocumentAncestors")
                app.activeDocument.xmpMetadata.rawData = xmp.serialize()
            }
        }
        break;
    case "bridge":
        var contextMenuGroup = MenuElement.create("menu", "Document ancestors", "at the end of Thumbnail", "context/ancestors")
        var contextMenuDelete = MenuElement.create("command", "Remove from selected files", "at the end of context/ancestors")
        var contextMenuCheck = MenuElement.create("command", "Check selected files", "at the end of context/ancestors")
        var toolMenuGroup = MenuElement.create("menu", "Document ancestors", "at the end of Tools", "tools/ancestors")
        var toolMenuDelete = MenuElement.create("command", "Remove from selected files", "at the end of tools/ancestors")
        var toolMenuCheck = MenuElement.create("command", "Check selected files", "at the end of tools/ancestors")

        contextMenuDelete.onSelect = function () {
            if (ExternalObject.AdobeXMPScript == undefined) ExternalObject.AdobeXMPScript = new ExternalObject("lib:AdobeXMPScript")
            var sel = app.document.selections
            for (var i = 0; i < sel.length; i++) {
                if (sel[i].type == "file") {
                    var xmpFile = new XMPFile(sel[i].path, undefined, XMPConst.OPEN_FOR_UPDATE)
                    var xmp = xmpFile.getXMP()
                    if (xmp.doesPropertyExist(XMPConst.NS_PHOTOSHOP, "DocumentAncestors")) {
                        xmp.deleteProperty(XMPConst.NS_PHOTOSHOP, "DocumentAncestors")
                        if (xmpFile.canPutXMP(xmp)) xmpFile.putXMP(xmp)
                    }
                    xmpFile.closeFile(XMPConst.CLOSE_UPDATE_SAFELY)
                }
            }
        }

        contextMenuCheck.onSelect = function () {
            var sel = app.document.selections, names = [], counter = 0;
            for (var i = 0; i < sel.length; i++) {
                if (sel[i].type == "file") {
                    try {
                    var md = sel[i].synchronousMetadata
                    md.namespace = "http://ns.adobe.com/photoshop/1.0/"
                    var len = md.DocumentAncestors.length
                    if (len > 0) { names.push(sel[i].name); counter += len }} catch (e) {}
                }
            }

            if (names.length > 0) {
                var msg = names.length > 20 ? "Найдено " + names.length + " документов." : "Найдены следующие документы:\n" + names.join('\n')
                alert(msg + "\n\nОбщее количество записей document ancestors: " + counter + "\nПримерный размер метаданных: " + counter / 10000 + " МБ")
            } else { alert("В выбранных документах не найдены данные document ancestors!") }
        }
        toolMenuDelete.onSelect = function () { contextMenuDelete.onSelect() }
        toolMenuCheck.onSelect = function () { contextMenuCheck.onSelect() }

        break;
}