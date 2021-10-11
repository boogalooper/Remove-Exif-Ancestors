///////////////////////////////////////////////////////////////////////////////
// Batch document ancestors remover ver. 0.1
// jazz-y@ya.ru
///////////////////////////////////////////////////////////////////////////////

/*
<javascriptresource>
<category>jazzy</category>
</javascriptresource>
*/

#target photoshop

var allFiles = [], junkedFiles = [], filter;
var w = buildWindow(), result = w.show();

if (result != 2) {
    app.doProgress("", "removeMetadata(result)")
    alert("Успешно!")
}

function buildWindow() {
    var w = new Window("dialog")
    w.text = "Document ancestors remover"
    w.orientation = "column"
    w.alignChildren = ["fill", "top"]

    var pnSource = w.add("panel")
    pnSource.text = "Источник:"
    pnSource.orientation = "column"
    pnSource.alignChildren = ["left", "top"]
    pnSource.alignment = ["fill", "top"]

    var grBrowse = pnSource.add("group")
    grBrowse.orientation = "row"
    grBrowse.alignChildren = ["left", "center"]

    var etPath = grBrowse.add('edittext {properties: {readonly: true}}')
    etPath.preferredSize.width = 300

    var bnBrowse = grBrowse.add("button", undefined, "Обзор...")

    var chSubfolders = pnSource.add("checkbox")
    chSubfolders.text = "учитывать подкаталоги"
    chSubfolders.value = true

    var stTotalFiles = pnSource.add("statictext")

    var pnTarget = w.add("panel")
    pnTarget.text = "Document ancestors:"
    pnTarget.orientation = "column"
    pnTarget.alignChildren = ["left", "top"]
    pnTarget.alignment = ["fill", "top"]

    var stTotalMetadata = pnTarget.add("statictext")

    var grFilter = pnTarget.add("group")
    grFilter.orientation = "row"
    grFilter.alignChildren = ["left", "center"]

    var stFilter = grFilter.add("statictext")
    stFilter.text = "обрабатывать следующие типы файлов:"

    var dlFilter = grFilter.add("dropdownlist")
    dlFilter.preferredSize.width = 100

    var stSize = pnTarget.add("statictext")

    var grExport = pnTarget.add("group")
    grExport.orientation = "row"
    grExport.alignChildren = ["left", "center"]
    grExport.alignment = ["center", "top"]

    var bnExport = grExport.add("button", undefined, "Экспорт списка файлов в CSV")

    var grButtons = w.add("group")
    grButtons.orientation = "row"
    grButtons.alignChildren = ["center", "center"]

    var ok = grButtons.add("button", undefined, "Удалить метаданные", { name: "ok" })
    var cancel = grButtons.add("button", undefined, "Отмена", { name: "cancel" })

    stTotalFiles.setText = function (s) { this.text = "общее количество файлов: " + s }
    stTotalMetadata.setText = function (s) { this.text = "количество файлов с метаданными: " + s }
    stSize.setText = function (s) { this.text = "примерная оценка занимаемого места: " + s + " МБ" }

    chSubfolders.onClick = function (s) { enumFiles(etPath.text) }

    bnBrowse.onClick = function () {
        var fol = new Folder()
        currentFolder = fol.selectDlg()
        enumFiles(currentFolder)
    }

    dlFilter.onChange = function () {
        if (!w.visible) return

        filter = this.selection.text

        if (junkedFiles.length > 0) {
            var len = junkedFiles.length,
                mCounter = 0,
                fCounter = 0
            for (var i = 0; i < len; i++) {
                if (isFileOneOfThese(junkedFiles[i].file, filter)) {
                    mCounter += junkedFiles[i].junkRecords
                    fCounter++
                }
            }

            stTotalMetadata.setText(fCounter)
            stSize.setText(Number(mCounter / 10000 * 0.7).toFixed(4))
        }
    }

    bnExport.onClick = function () {
        var fle = new File("DocumentAncestors.csv"),
            pth = fle.saveDlg("Сохранить список файлов на диск", "*.csv")
        try {
            if (pth) {
                pth.open("w", "TEXT", "????")
                var len = junkedFiles.length,
                    output = [];
                for (var i = 0; i < len; i++) {
                    if (isFileOneOfThese(junkedFiles[i].file, filter)) {
                        var msg = junkedFiles[i].junkRecords == 0 ? "" : ";" + junkedFiles[i].junkRecords
                        output.push(junkedFiles[i].file.toString() + msg)
                    }
                }

                pth.write(output.join('\n'))
                pth.close

                alert("Успешно!")
            }
        } catch (e) { alert(e, "", 1) }
    }

    ok.onClick = function () {
        msg = "Выберите вариант обработки:\n\n\[ДА] - удалить метаданные из файлов, не открывая их в фотошопе\n(быстрее, изменение размера файла не гарантируется)\
        \n[НЕТ] - удалить метаданные и сохранить файлы в фотошопе\n(медленнее, размер файла будет обновлен)"
        if (confirm(msg)) { w.close(1) } else { w.close(-1) }
    }

    w.onShow = function () {
            stTotalFiles.size.width = stFilter.size.width = stSize.size.width = stTotalMetadata.size.width = 300
            stTotalFiles.setText(0)
            stTotalMetadata.setText(0)
            pnTarget.enabled = ok.enabled = false
            dlFilter.add("item", "все файлы"); dlFilter.selection = 0
    }

    function enumFiles(currentFolder) {

        if (currentFolder) {
            allFiles = []
            etPath.text = currentFolder.fsName
            findAllFiles(etPath.text, allFiles, chSubfolders.value)
            var len = allFiles.length
            stTotalFiles.setText(len)
            countMetadata = len > 100 ? confirm("В выбранном каталоге " + len + " файлов\nПодсчитать количество записей DocumentAncestors и их приблизительный размер\n(эта операция может занять несколько минут)?") : true
            stSize.visible = countMetadata
            app.doProgress("", "checkMetadata (countMetadata)")
        }
    }

    function checkMetadata(countMetadata) {
        var len = allFiles.length
        if (len > 0) {
            if (ExternalObject.AdobeXMPScript == undefined) ExternalObject.AdobeXMPScript = new ExternalObject("lib:AdobeXMPScript")
            junkedFiles = []

            for (var i = 0; i < len; i++) {
                app.updateProgress(i+1, len)
                app.changeProgressText(allFiles[i])
                try {
                    var xmpFile = new XMPFile(allFiles[i], XMPConst.UNKNOWN, XMPConst.OPEN_FOR_READ),
                        xmp = xmpFile.getXMP();

                    if (xmp.doesPropertyExist(XMPConst.NS_PHOTOSHOP, "DocumentAncestors")) {
                        var shift = 0
                        if (countMetadata) {
                            do {
                                shift++
                                if (!xmp.doesArrayItemExist(XMPConst.NS_PHOTOSHOP, "DocumentAncestors", shift)) break;
                            } while (true)
                        }
                        junkedFiles.push({ file: allFiles[i], junkRecords: shift })
                    }
                } catch (e) { }
            }


            if (junkedFiles.length > 0) {
                pnTarget.enabled = ok.enabled = true
                dlFilter.removeAll()
                var ext = buildShortcutList(junkedFiles)
                for (var i = 0; i < ext.length; i++) dlFilter.add("item", ext[i])
                dlFilter.selection = 0

            } else pnTarget.enabled = ok.enabled = false
        }
    }

    return w
}

function findAllFiles(srcFolder, destArray, useSubfolders) {
    var fileFolderArray = Folder(srcFolder).getFiles();
    var subfolderArray = []

    for (var i = 0; i < fileFolderArray.length; i++) {
        var fileFoldObj = fileFolderArray[i];

        if (fileFoldObj instanceof File) {
            if (!fileFoldObj.hidden) destArray.push(fileFoldObj.fsName)
        } else if (useSubfolders) {
            subfolderArray.push(fileFoldObj)
        }
    }

    if (useSubfolders) {
        for (var i = 0; i < subfolderArray.length; i++) findAllFiles(subfolderArray[i], destArray, useSubfolders)
    }
}

function buildShortcutList(srcArray) {
    var typeObject = {}, len = srcArray.length

    for (var i = 0; i < len; i++) {
        var fle = srcArray[i].file.toUpperCase()
        var lastDot = fle.lastIndexOf(".")
        if (lastDot == -1) continue;
        var extension = fle.substr(lastDot + 1, fle.length - lastDot)
        typeObject[extension] = "ok"
    }

    var reflect = typeObject.reflect.properties
    var output = ["все файлы"]

    len = reflect.length
    for (var i = 0; i < len; i++) {
        if (typeObject[reflect[i].name] == "ok") output.push(reflect[i].name)
    }
    return output
}

function isFileOneOfThese(fileName, ext) {
    if (ext == "все файлы") return true
    var fle = fileName.toString().toUpperCase()
    var lastDot = fle.lastIndexOf(".")
    if (lastDot == -1) return false
    if (fle.substr(lastDot + 1, fle.length - lastDot) == ext) return true
    return false
}

function removeMetadata(mode) {
    if (ExternalObject.AdobeXMPScript == undefined) ExternalObject.AdobeXMPScript = new ExternalObject("lib:AdobeXMPScript")

    var len = junkedFiles.length, target = [];
    for (var i = 0; i < len; i++) {
        if (isFileOneOfThese(junkedFiles[i].file, filter)) {
            target.push(junkedFiles[i].file)
        }
    }
    len = target.length

    switch (mode) {
        case 1:
            for (var i = 0; i < len; i++) {
                app.updateProgress(i+1, len)
                app.changeProgressText(target[i])
                try {
                    var xmpFile = new XMPFile(target[i], XMPConst.UNKNOWN, XMPConst.OPEN_FOR_UPDATE)
                    var xmp = xmpFile.getXMP()
                    if (xmp.doesPropertyExist(XMPConst.NS_PHOTOSHOP, "DocumentAncestors")) {
                        xmp.deleteProperty(XMPConst.NS_PHOTOSHOP, "DocumentAncestors")
                        if (xmpFile.canPutXMP(xmp)) xmpFile.putXMP(xmp)
                    }
                    xmpFile.closeFile(XMPConst.CLOSE_UPDATE_SAFELY)
                } catch (e) { }
            }
            break;
        case -1:
            for (var i = 0; i < len; i++) {
                try {
                    app.updateProgress(i+1, len)
                    app.changeProgressText(target[i])
                    app.open(File(target[i]))
                    var xmp = new XMPMeta(app.activeDocument.xmpMetadata.rawData)
                    if (xmp.doesPropertyExist(XMPConst.NS_PHOTOSHOP, "DocumentAncestors")) {
                        xmp.deleteProperty(XMPConst.NS_PHOTOSHOP, "DocumentAncestors")
                        app.activeDocument.xmpMetadata.rawData = xmp.serialize()
                    }
                    closeDocument(true)
                } catch (e) { }
            }
            break;
    }
}

function closeDocument(save) {
    save = save != true ? s2t("no") : s2t("yes")
    var desc = new ActionDescriptor();
    desc.putEnumerated(s2t("saving"), s2t("yesNo"), save)
    executeAction(s2t("close"), desc, DialogModes.NO)
    function s2t(s) { return stringIDToTypeID(s) }
}