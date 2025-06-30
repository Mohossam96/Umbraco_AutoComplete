function BlockRteController(
    $element, $scope, $q, $timeout, $interpolate, assetsService, editorService, clipboardService,
    localizationService, overlayService, blockEditorService, udiService, serverValidationManager,
    angularHelper, eventsService, $attrs, tinyMceAssets, tinyMceService, $http, $rootScope, notificationsService
) {
    var modelObject, unsubscribe = [], liveEditing = true, vm = this;

    function onServerValueChanged(newVal, oldVal) {
        ensurePropertyValue(newVal);
        if (modelObject) modelObject.update(vm.model.value.blocks, $scope);
        onLoaded();
    }
   

    function ensurePropertyValue(newVal) {
        if (typeof newVal !== "object" || newVal == null) {
            vm.model.value = {
                markup: vm.model.value ? vm.model.value : "",
                blocks: {}
            };
        } else if (newVal.markup) {
            if (!newVal.blocks) vm.model.value.blocks = {};
        } else {
            vm.model.value.markup = "";
        }
    }

    function setDirty() {
        if (vm.propertyForm) vm.propertyForm.$setDirty();
    }

    function onLoaded() {
        try {
            vm.layout = modelObject.getLayout([]);
            var invalidLayoutItems = [];
            vm.layout.forEach(entry => {
                if (!entry.$block || !entry.$block.data) {
                    var block = getBlockObject(entry);
                    if (block !== null) entry.$block = block;
                    else invalidLayoutItems.push(entry);
                } else {
                    updateBlockObject(entry.$block);
                }
            });
            invalidLayoutItems.forEach(entry => {
                var index = vm.layout.findIndex(x => x === entry);
                if (index >= 0) vm.layout.splice(index, 1);
            });
            vm.availableContentTypesAliases = modelObject.getAvailableAliasesForBlockContent();
            vm.availableBlockTypes = modelObject.getAvailableBlocksForBlockPicker();
            updateClipboard(true);
            vm.blocksLoading = false;
            vm.updateLoading();
            $scope.$evalAsync();


            // check if rich text has value if so store it in local storage
            if (vm.model.value.markup && vm.model.value.markup.trim() !== "") {
                const localStorageKey = `umbraco-rte-${vm.model.alias}`;
                localStorage.setItem(localStorageKey, vm.model.value.markup);
            }
        } catch (e) {
            
            vm.blocksLoading = false;
            vm.updateLoading();
        }
    }

    function ensureCultureData(content) {
        if (!content) return;
        if (vm.umbVariantContent && vm.umbVariantContent.editor && vm.umbVariantContent.editor.content.language) {
            content.language = vm.umbVariantContent.editor.content.language;
        }
        if (content.variants && content.variants[0] && content.variants[0].tabs) {
            content.variants[0].tabs.forEach(tab => {
                tab.properties.forEach(prop => {
                    if (vm.umbProperty && vm.umbProperty.property) {
                        prop.culture = vm.umbProperty.property.culture;
                    }
                });
            });
        }
        if (vm.umbVariantContent && vm.umbVariantContent.content) {
            content.allowedActions = vm.umbVariantContent.content.allowedActions;
            content.variants.forEach(variant => {
                variant.allowedActions = vm.umbVariantContent.editor.content.allowedActions;
            });
        }
    }

    function getBlockObject(entry) {
        var block = modelObject.getBlockObject(entry);
        if (block === null) return null;
        block.view = block.config.view ? block.config.view : (
            block.config.unsupported
                ? "views/propertyeditors/rte/blocks/blockrteentryeditors/unsupportedblock/unsupportedblock.editor.html"
                : "views/propertyeditors/rte/blocks/blockrteentryeditors/labelblock/rtelabelblock.editor.html"
        );
        block.showValidation = !!block.config.view;
        block.hideContentInOverlay = !!block.config.forceHideContentEditorInOverlay;
        block.showContent = !block.hideContentInOverlay && block.content && block.content.variants && block.content.variants[0] && block.content.variants[0].tabs && block.content.variants[0].tabs.some(tab => tab.properties.length);
        block.showSettings = block.config.settingsElementTypeKey != null;
        block.showCopy = vm.supportCopy && block.config.contentElementTypeKey != null;
        block.index = 0;
        block.setParentForm = function (parentForm) { this._parentForm = parentForm; };
        block.activate = function () { this._activate(); };
        block.edit = function () { this._edit(); };
        block.editSettings = function () { this._editSettings(); };
        block.requestDelete = function () { this._requestDelete(); };
        block.delete = function () { this._delete(); };
        block.copy = function () { this._copy(); };
        updateBlockObject(block);
        return block;
    }

    function updateBlockObject(block) {
        ensureCultureData(block.content);
        ensureCultureData(block.settings);
        block._activate = activateBlock.bind(null, block);
        block._edit = function () {
            var blockIndex = vm.layout.indexOf(this.layout);
            editBlock(this, false, blockIndex, this._parentForm);
        };
        block._editSettings = function () {
            var blockIndex = vm.layout.indexOf(this.layout);
            editBlock(this, true, blockIndex, this._parentForm);
        };
        block._requestDelete = requestDeleteBlock.bind(null, block);
        block._delete = deleteBlock.bind(null, block);
        block._copy = copyBlock.bind(null, block);
    }

    function addNewBlock(index, contentElementTypeKey) {
        var layoutEntry = modelObject.create(contentElementTypeKey);
        if (layoutEntry === null) return false;
        var blockObject = getBlockObject(layoutEntry);
        if (blockObject === null) return false;
        layoutEntry.$block = blockObject;
        vm.layout.splice(index, 0, layoutEntry);
        vm.setBlockFocus(blockObject);
        setDirty();
        return true;
    }

    function deleteBlock(block) {
        var layoutIndex = vm.layout.findIndex(entry => entry.contentUdi === block.layout.contentUdi);
        if (layoutIndex === -1) throw new Error("Could not find layout entry of block with udi: " + block.layout.contentUdi);
        setDirty();
        var removed = vm.layout.splice(layoutIndex, 1);
        removed.forEach(x => {
            var blockElementsOfThisUdi = vm.tinyMceEditor.dom.select(`umb-rte-block[data-content-udi='${x.contentUdi}'], umb-rte-block-inline[data-content-udi='${x.contentUdi}']`);
            blockElementsOfThisUdi.forEach(blockElement => {
                vm.tinyMceEditor.dom.remove(blockElement);
            });
            var guids = [udiService.getKey(x.contentUdi), x.settingsUdi ? udiService.getKey(x.settingsUdi) : null];
            guids.forEach(guid => {
                if (guid) serverValidationManager.removePropertyError(guid, vm.umbProperty.property.culture, vm.umbProperty.property.segment, "", { matchType: "contains" });
            });
        });
        if (removed.length > 0) {
            vm.model.value.markup = vm.tinyMceEditor.getContent();
            $scope.$evalAsync();
        }
        modelObject.removeDataAndDestroyModel(block);
    }

    function activateBlock(blockObject) { blockObject.active = true; }

    function editBlock(blockObject, openSettings, blockIndex, parentForm, options) {
        options = options || vm.options;
        if (blockIndex === undefined) throw "blockIndex was not specified on call to editBlock";
        var wasNotActiveBefore = blockObject.active !== true;
        if ((openSettings || !blockObject.hideContentInOverlay) && (!openSettings || blockObject.config.settingsElementTypeKey)) {
            activateBlock(blockObject);
            var blockContentClone = Utilities.copy(blockObject.content),
                blockSettingsClone = null;
            if (blockObject.config.settingsElementTypeKey) blockSettingsClone = Utilities.copy(blockObject.settings);
            var blockEditorModel = {
                $parentScope: $scope,
                $parentForm: parentForm || vm.propertyForm,
                hideContent: blockObject.hideContentInOverlay,
                openSettings: openSettings === true,
                createFlow: options.createFlow === true,
                liveEditing: liveEditing,
                title: blockObject.label,
                view: "views/common/infiniteeditors/blockeditor/blockeditor.html",
                size: blockObject.config.editorSize || "medium",
                hideSubmitButton: vm.readonly,
                submit: function (blockEditorModel) {
                    if (!liveEditing) blockObject.retrieveValuesFrom(blockEditorModel.content, blockEditorModel.settings);
                    setDirty();
                    blockObject.active = false;
                    editorService.close();
                },
                close: function (blockEditorModel) {
                    if (blockEditorModel.createFlow) deleteBlock(blockObject);
                    else {
                        if (liveEditing) blockObject.retrieveValuesFrom(blockContentClone, blockSettingsClone);
                        if (wasNotActiveBefore) blockObject.active = false;
                    }
                    editorService.close();
                }
            };
            if (liveEditing) {
                blockEditorModel.content = blockObject.content;
                blockEditorModel.settings = blockObject.settings;
            } else {
                blockEditorModel.content = blockContentClone;
                blockEditorModel.settings = blockSettingsClone;
            }
            editorService.open(blockEditorModel);
        }
    }

    function showCreateDialog(createIndex, openClipboard, addedCallback) {
        if (vm.blockTypePicker) return;
        if (vm.availableBlockTypes.length !== 0) {
            if (createIndex === undefined) createIndex = vm.layout.length - 1;
            var amountOfAvailableTypes = vm.availableBlockTypes.length,
                blockPickerModel = {
                    $parentScope: $scope,
                    $parentForm: vm.propertyForm,
                    availableItems: vm.availableBlockTypes,
                    title: vm.labels.blockEditor_insertBlock,
                    openClipboard: openClipboard,
                    orderBy: "$index",
                    view: "views/common/infiniteeditors/blockpicker/blockpicker.html",
                    size: amountOfAvailableTypes > 8 ? "medium" : "small",
                    filter: amountOfAvailableTypes > 8,
                    clickPasteItem: function (item, mouseEvent) {
                        if (Array.isArray(item.pasteData)) {
                            const BlocksThatGotPasted = [];
                            var indexIncrementor = 0;
                            item.pasteData.forEach(function (entry) {
                                const wasAdded = requestPasteFromClipboard(createIndex + indexIncrementor, entry, item.type);
                                if (wasAdded) {
                                    const newBlock = vm.layout[createIndex + indexIncrementor].$block;
                                    BlocksThatGotPasted.push(newBlock);
                                    indexIncrementor++;
                                }
                            });
                            if (BlocksThatGotPasted.length > 0) addedCallback(BlocksThatGotPasted);
                        } else {
                            const wasAdded = requestPasteFromClipboard(createIndex, item.pasteData, item.type);
                            if (wasAdded && vm.layout[createIndex]) {
                                const newBlock = vm.layout[createIndex].$block;
                                addedCallback(newBlock);
                            }
                        }
                        if (!mouseEvent.ctrlKey && !mouseEvent.metaKey) blockPickerModel.close();
                    },
                    submit: function (blockPickerModel, mouseEvent) {
                        var wasAdded = false;
                        if (blockPickerModel && blockPickerModel.selectedItem && (wasAdded = addNewBlock(createIndex, blockPickerModel.selectedItem.blockConfigModel.contentElementTypeKey)) && vm.layout[createIndex]) {
                            const newBlock = vm.layout[createIndex].$block;
                            addedCallback(newBlock);
                        }
                        if (!mouseEvent.ctrlKey && !mouseEvent.metaKey) {
                            editorService.close();
                            if (wasAdded) userFlowWhenBlockWasCreated(createIndex);
                        }
                    },
                    close: function () {
                        if (createIndex < vm.layout.length) vm.setBlockFocus(vm.layout[Math.max(createIndex - 1, 0)].$block);
                        editorService.close();
                    },
                    clickClearClipboard: function ($event) {
                        clipboardService.clearEntriesOfType(clipboardService.TYPES.ELEMENT_TYPE, vm.availableContentTypesAliases);
                        clipboardService.clearEntriesOfType(clipboardService.TYPES.BLOCK, vm.availableContentTypesAliases);
                    }
                };
            blockPickerModel.clipboardItems = vm.clipboardItems;
            editorService.open(blockPickerModel);
        } else {
            alert("No Blocks configured for this data-type");
        }
    }

    function userFlowWhenBlockWasCreated(createIndex) {
        if (vm.layout.length > createIndex) {
            var blockObject = vm.layout[createIndex].$block;
            if (!blockObject.hideContentInOverlay && blockObject.content.variants[0].tabs.find(tab => tab.properties.length > 0)) {
                vm.options.createFlow = true;
                blockObject.edit();
                vm.options.createFlow = false;
            }
        }
    }

    function updateClipboard(firstTime) {
        vm.clipboardItems = [];
        var entriesForPaste = clipboardService.retrieveEntriesOfType(clipboardService.TYPES.ELEMENT_TYPE, vm.availableContentTypesAliases);
        entriesForPaste.forEach(function (entry) {
            var pasteEntry = {
                type: clipboardService.TYPES.ELEMENT_TYPE,
                date: entry.date,
                pasteData: entry.data,
                elementTypeModel: {
                    name: entry.label,
                    icon: entry.icon
                }
            };
            if (!Array.isArray(entry.data)) {
                var scaffold = modelObject.getScaffoldFromAlias(entry.alias);
                if (scaffold) pasteEntry.blockConfigModel = modelObject.getBlockConfiguration(scaffold.contentTypeKey);
            }
            vm.clipboardItems.push(pasteEntry);
        });
        entriesForPaste = clipboardService.retrieveEntriesOfType(clipboardService.TYPES.BLOCK, vm.availableContentTypesAliases);
        entriesForPaste.forEach(function (entry) {
            var pasteEntry = {
                type: clipboardService.TYPES.BLOCK,
                date: entry.date,
                pasteData: entry.data,
                elementTypeModel: {
                    name: entry.label,
                    icon: entry.icon
                }
            };
            if (!Array.isArray(entry.data)) pasteEntry.blockConfigModel = modelObject.getBlockConfiguration(entry.data.data.contentTypeKey);
            vm.clipboardItems.push(pasteEntry);
        });
        vm.clipboardItems.sort((a, b) => b.date - a.date);
    }

    function copyBlock(block) {
        clipboardService.copy(clipboardService.TYPES.BLOCK, block.content.contentTypeAlias, {
            layout: block.layout,
            data: block.data,
            settingsData: block.settingsData
        }, block.label, block.content.icon, block.content.udi);
    }

    function requestPasteFromClipboard(index, pasteEntry, pasteType) {
        if (pasteEntry === undefined) return false;
        var layoutEntry;
        if (pasteType === clipboardService.TYPES.ELEMENT_TYPE)
            layoutEntry = modelObject.createFromElementType(pasteEntry);
        else if (pasteType === clipboardService.TYPES.BLOCK)
            layoutEntry = modelObject.createFromBlockData(pasteEntry);
        else
            return false;
        if (layoutEntry === null) return false;
        var blockObject = getBlockObject(layoutEntry);
        if (blockObject === null) return false;
        layoutEntry.$block = blockObject;
        vm.layout.splice(index, 0, layoutEntry);
        vm.currentBlockInFocus = blockObject;
        return true;
    }

    function requestDeleteBlock(block) {
        if (vm.readonly) return;
        localizationService.localizeMany(["general_delete", "blockEditor_confirmDeleteBlockMessage", "contentTypeEditor_yesDelete"]).then(function (data) {
            const overlay = {
                title: data[0],
                content: localizationService.tokenReplace(data[1], [block.label]),
                submitButtonLabel: data[2],
                close: function () { overlayService.close(); },
                submit: function () {
                    deleteBlock(block);
                    setDirty();
                    overlayService.close();
                }
            };
            overlayService.confirmDelete(overlay);
        });
    }

    // Initialization
    vm.readonly = false;
    vm.noBlocksMode = false;
    vm.tinyMceEditor = null;
    $attrs.$observe("readonly", value => {
        vm.readonly = value !== undefined;
        vm.blockEditorApi.readonly = vm.readonly;
    });
    vm.loading = true;
    vm.rteLoading = true;
    vm.blocksLoading = true;
    vm.updateLoading = function () {
        if (!vm.rteLoading && !vm.blocksLoading) {
            vm.loading = false;
        }
    };
    vm.currentBlockInFocus = null;
    vm.setBlockFocus = function (block) {
        if (vm.currentBlockInFocus !== null) vm.currentBlockInFocus.focus = false;
        vm.currentBlockInFocus = block;
        block.focus = true;
    };
    vm.supportCopy = clipboardService.isSupported();
    vm.clipboardItems = [];
    unsubscribe.push(eventsService.on("clipboardService.storageUpdate", updateClipboard));
    unsubscribe.push($scope.$on("editors.content.splitViewChanged", (event, eventData) => {
        var compositeId = vm.umbVariantContent.editor.compositeId;
        if (eventData.editors.some(x => x.compositeId === compositeId)) {
            vm.layout.forEach(entry => {
                if (entry.$block) updateBlockObject(entry.$block);
            });
        }
    }));
    vm.layout = [];
    vm.availableBlockTypes = [];
    vm.labels = {};
    vm.options = { createFlow: false };
    localizationService.localizeMany(["blockEditor_insertBlock", "content_createEmpty"]).then(function (data) {
        vm.labels.blockEditor_insertBlock = data[0];
        vm.labels.content_createEmpty = data[1];
    });

    vm.$onInit = function ()
    {
        try {
           
            if (!vm.model.value) vm.model.value = {};
            if (!vm.model.value.blocks) vm.model.value.blocks = {};
            var _config$editor;
            if (vm.umbProperty && !vm.umbVariantContent) {
                var found = angularHelper.traverseScopeChain($scope, s => s && s.vm && "umbVariantContentController" === s.vm.constructor.name);
                vm.umbVariantContent = found ? found.vm : null;
                if (!vm.umbVariantContent) {
                    vm.noBlocksMode = true;
                    vm.blocksLoading = false;
                    this.updateLoading();
                    return;
                }
            }
            const config = vm.model.config || {};
            vm.model.onValueChanged = onServerValueChanged;
            liveEditing = config.useLiveEditing;
            vm.listWrapperStyles = {};
            if (config.maxPropertyWidth) vm.listWrapperStyles["max-width"] = config.maxPropertyWidth;
            ensurePropertyValue(vm.model.value);
            const assetPromises = [];
            if (!vm.noBlocksMode) {
                var scopeOfExistence = $scope;
                if (vm.umbVariantContentEditors && vm.umbVariantContentEditors.getScope) scopeOfExistence = vm.umbVariantContentEditors.getScope();
                else if (vm.umbElementEditorContent && vm.umbElementEditorContent.getScope) scopeOfExistence = vm.umbElementEditorContent.getScope();
                modelObject = blockEditorService.createModelObject(vm.model.value.blocks, vm.model.editor, config.blocks, scopeOfExistence, $scope);
                const blockModelObjectLoading = modelObject.load();
                assetPromises.push(blockModelObjectLoading.then(onLoaded, function (err) {
                   
                    vm.blocksLoading = false;
                    vm.updateLoading();
                }));
            }
            vm.textAreaHtmlId = vm.model.alias + "_" + String.CreateGuid();
            var editorConfig = (_config$editor = config.editor) != null ? _config$editor : null;
            if (!editorConfig || Utilities.isString(editorConfig)) editorConfig = tinyMceService.defaultPrevalues();
            var width = editorConfig.dimensions && parseInt(editorConfig.dimensions.width, 10) || null,
                height = editorConfig.dimensions && parseInt(editorConfig.dimensions.height, 10) || null;
            vm.containerWidth = "auto";
            vm.containerHeight = "auto";
            vm.containerOverflow = "inherit";
            tinyMceAssets.forEach(function (tinyJsAsset) {
                assetPromises.push(assetsService.loadJs(tinyJsAsset, $scope));
            });
            $q.all(assetPromises).then(function () {
                return tinyMceService.getTinyMceEditorConfig({
                    htmlId: vm.textAreaHtmlId,
                    stylesheets: editorConfig.stylesheets,
                    toolbar: editorConfig.toolbar,
                    mode: editorConfig.mode
                });
            }).then(function (tinyMceConfig) {
                if (tinyMceConfig.cloudApiKey) {
                    return assetsService.loadJs(`https://cdn.tiny.cloud/1/${tinyMceConfig.cloudApiKey}/tinymce/${tinymce.majorVersion}.${tinymce.minorVersion}/plugins.min.js`).then(() => tinyMceConfig);
                }
                return tinyMceConfig;
            }).then(function (standardConfig) {
                if (height !== null && standardConfig.plugins.indexOf("autoresize") !== -1) {
                    standardConfig.plugins.splice(standardConfig.plugins.indexOf("autoresize"), 1);
                }
                let baseLineConfigObj = {
                    maxImageSize: editorConfig.maxImageSize,
                    width: width,
                    height: height,
                    setup: function (editor) {
                        var _vm$umbProperty$cultu, _vm$umbProperty, _vm$umbProperty$segme, _vm$umbProperty2;
                        vm.tinyMceEditor = editor;
                        vm.tinyMceEditor.on("init", function (e) {
                            $timeout(function () {
                                vm.rteLoading = false;
                                vm.updateLoading();
                            });
                        });
                        vm.tinyMceEditor.on("focus", function () {
                            $element[0].dispatchEvent(new CustomEvent("umb-rte-focus", { composed: true, bubbles: true }));
                        });
                        vm.tinyMceEditor.on("blur", function () {
                            $element[0].dispatchEvent(new CustomEvent("umb-rte-blur", { composed: true, bubbles: true }));
                        });
                        tinyMceService.initializeEditor({
                            editor: editor,
                            toolbar: editorConfig.toolbar,
                            model: vm.model,
                            getValue: function () { return vm.model.value.markup; },
                            setValue: function (newVal) {
                                vm.model.value.markup = newVal;
                                $scope.$evalAsync();
                            },
                            culture: (_vm$umbProperty$cultu = (_vm$umbProperty = vm.umbProperty) == null ? void 0 : _vm$umbProperty.culture) != null ? _vm$umbProperty$cultu : null,
                            segment: (_vm$umbProperty$segme = (_vm$umbProperty2 = vm.umbProperty) == null ? void 0 : _vm$umbProperty2.segment) != null ? _vm$umbProperty$segme : null,
                            blockEditorApi: vm.noBlocksMode ? void 0 : vm.blockEditorApi,
                            parentForm: vm.propertyForm,
                            valFormManager: vm.valFormManager,
                            currentFormInput: $scope.rteForm.modelValue
                        });
                    }
                };
                Utilities.extend(baseLineConfigObj, standardConfig);
                baseLineConfigObj.toolbar = !vm.readonly && baseLineConfigObj.toolbar;
                baseLineConfigObj.readonly = vm.readonly ? 1 : baseLineConfigObj.readonly;
                $timeout(function () {
                    tinymce.init(baseLineConfigObj);
                }, 50);
                unsubscribe.push($scope.$on("formSubmitting", function () {
                    if (vm.tinyMceEditor && !vm.rteLoading) {
                        var blockElements = vm.tinyMceEditor.dom.select("umb-rte-block, umb-rte-block-inline");
                        const usedContentUdis = blockElements.map(blockElement => blockElement.getAttribute("data-content-udi")),
                            unusedBlocks = vm.layout.filter(x => usedContentUdis.indexOf(x.contentUdi) === -1);
                        unusedBlocks.forEach(blockLayout => {
                            deleteBlock(blockLayout.$block);
                        });
                        var parser = new DOMParser,
                            doc = parser.parseFromString(vm.model.value.markup, "text/html"),
                            elements = doc.querySelectorAll("*[class]");
                        elements.forEach(element => {
                            var classAttribute = element.getAttribute("class");
                            if (classAttribute) {
                                var classes = classAttribute.split(" "),
                                    newClasses = classes.filter(function (className) {
                                        return className !== "ng-scope" && className !== "ng-isolate-scope";
                                    });
                                if (newClasses.length > 0) element.setAttribute("class", newClasses.join(" "));
                                else element.removeAttribute("class");
                            }
                        });
                        vm.model.value.markup = doc.body.innerHTML;
                    }
                }));
            }).catch(function (err) {
               
                vm.rteLoading = false;
                vm.blocksLoading = false;
                vm.updateLoading();
            });
           
            // check if rich text has value if so store it in local storage
            if (vm.model.value.markup && vm.model.value.markup.trim() !== "") {
                const localStorageKey = `umbraco-rte-${vm.model.alias}`;
                localStorage.setItem(localStorageKey, vm.model.value.markup);
            }
        } catch (err) {
            
            vm.rteLoading = false;
            vm.blocksLoading = false;
            vm.updateLoading();
        }
        $scope.$watch(() => vm.model.value.markup, function (newVal) {
            vm.hasContent = typeof newVal === "string" && newVal.trim().length > 0;
            if (typeof vm.model.value.markup !== "string") {
                vm.model.value.markup = "";
            }
           
        });
        if (typeof vm.model.value.markup !== "string") {
            vm.model.value.markup = "";
        }
    };
    vm.aiPrompt = "";
    vm.isLoading = false;
   
    vm.generateDescription = function () {
        if (!vm.aiPrompt && !vm.model.value.markup) return;
        let prompt = vm.aiPrompt;
        vm.isLoading = true;
        
        vm.hasContent = !!vm.model.value.markup && vm.model.value.markup.trim().length > 0;
        if (vm.hasContent) {
            prompt = "Enhance the following description: " + vm.model.value.markup;
        }
        
        // Use $http injected via the controller (add it to your $inject array and function params)
        $http.post("/umbraco/backoffice/AIHelper/ContentSuggestion/GetRichTextSuggestion?input=" + encodeURIComponent(prompt))
            .then(function (res) {
                if (res.data.StatusCode === 429 ) {
                    notificationsService.error('You have reached the maximum number of requests for today. Please try again later.');
                    vm.isLoading = false;
                    return;
                }
                vm.model.value.markup = res.data.Response; // This updates the RTE via binding
                vm.isLoading = false;
                //emit event with res.data 
                $rootScope.$emit("TagPrompt", res.data.Response);
            })
            .catch(function () {
                vm.isLoading = false;
                alert("Something went wrong.");
            });
    };

    vm.focusRTE = function () {
        if (vm.tinyMceEditor) vm.tinyMceEditor.focus();
    };
    
    vm.requestShowCreate = function (createIndex, mouseEvent) {
        if (vm.blockTypePicker) return;
        if (vm.availableBlockTypes.length === 1) {
            var blockType = vm.availableBlockTypes[0];
            if (!addNewBlock(createIndex, blockType.blockConfigModel.contentElementTypeKey)) return;
            if (!mouseEvent.ctrlKey && !mouseEvent.metaKey) userFlowWhenBlockWasCreated(createIndex);
        } else {
            showCreateDialog(createIndex);
        }
    };
    vm.requestShowClipboard = function (createIndex) {
        showCreateDialog(createIndex, true);
    };
    vm.showCreateDialog = showCreateDialog;
    vm.blockEditorApi = {
        getBlockByContentUdi: function (blockContentUdi) {
            var layoutIndex = vm.layout.findIndex(entry => entry.contentUdi === blockContentUdi);
            if (layoutIndex === -1) return;
            return vm.layout[layoutIndex].$block;
        },
        showCreateDialog: showCreateDialog,
        activateBlock: activateBlock,
        editBlock: editBlock,
        copyBlock: copyBlock,
        requestDeleteBlock: requestDeleteBlock,
        deleteBlock: deleteBlock,
        openSettingsForBlock: function (block, blockIndex, parentForm) {
            editBlock(block, true, blockIndex, parentForm);
        },
        readonly: vm.readonly,
        singleBlockMode: false
    };
    $scope.$on("$destroy", function () {
        for (const subscription of unsubscribe) subscription();
        if (vm.tinyMceEditor) {
            if ($element && $element[0]) {
                $element[0].dispatchEvent(new CustomEvent("blur", { composed: true, bubbles: true }));
            }
            vm.tinyMceEditor.destroy();
            vm.tinyMceEditor = null;
        }
    });
}

// Dependency injection for minification safety
BlockRteController.$inject = [
    '$element', '$scope', '$q', '$timeout', '$interpolate', 'assetsService', 'editorService', 'clipboardService',
    'localizationService', 'overlayService', 'blockEditorService', 'udiService', 'serverValidationManager',
    'angularHelper', 'eventsService', '$attrs', 'tinyMceAssets', 'tinyMceService', '$http', '$rootScope','notificationsService'
];

angular.module("umbraco").component("umbAiRtePropertyEditor", {
    template: '<div class="umb-property-editor umb-rte" ng-class="{\'--initialized\': !vm.loading}">' +
        '<umb-load-indicator ng-if="vm.loading"></umb-load-indicator>' +
        '<ng-form name="rteForm">' +
        '<label>Prompt for AI (e.g. "Write a product description for a coffee mug")</label>' +
        '<input type="text" ng-model="vm.aiPrompt" class="umb-property-editor" style="width: 100%; margin-bottom: 10px;" />' +
        '<button type="button" ng-if="vm.isLoading" class="btn btn-primary  d-flex align-items-center" > <div class="spinner-border spinner-border-sm me-2" role="status"> <span class="visually-hidden">Loading...</span> </div></button>'+
        '<button type="button" ng-if="!vm.isLoading" class="btn btn-primary" ng-click="vm.generateDescription()" ng-disabled="vm.isLoading" ><i class="icon icon-brain" ng-if="vm.hasContent" style="margin-right: 5px;"></i>✨{{ vm.hasContent ? "Enhance Description" : "Generate Description" }}</button>'+
        '<div class="umb-rte-editor-con">' +
        '<input type="text" id="{{vm.model.alias}}" ng-focus="vm.focusRTE()" name="modelValue" ng-model="vm.model.value.markup" style="position:absolute;top:0;width:0;height:0;padding:0;border:none;">' +
        '<div disable-hotkeys id="{{vm.textAreaHtmlId}}" class="umb-rte-editor" ng-style="{ width: vm.containerWidth, height: vm.containerHeight, overflow: vm.containerOverflow}"></div>' +
        '</div>' +
        '</ng-form>' +
        '</div>'
,
    controller: BlockRteController,
    controllerAs: "vm",
    bindings: {
        model: "="
    },
    require: {
        propertyForm: "^form",
        umbProperty: "?^umbProperty",
        umbVariantContent: "?^^umbVariantContent",
        umbVariantContentEditors: "?^^umbVariantContentEditors",
        umbElementEditorContent: "?^^umbElementEditorContent",
        valFormManager: "^^valFormManager"
    }
});
