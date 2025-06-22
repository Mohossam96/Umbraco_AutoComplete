angular.module("umbraco.directives").component("umbAiTagsEditor", {
    transclude: !0,
    template: '<div class="umb-tags-editor">    <ng-form name="vm.tagEditorForm">        <div class="ai-prompt-suggestion">            <div class="suggestion-buttons" style="margin-bottom:10px;">                <button type="button" class="btn btn-default" ng-repeat="suggestion in vm.aiSuggestions" ng-click="vm.addTagFromSuggestion(suggestion)">                    {{suggestion}}                </button>            </div>        </div>        <div ng-if="vm.isLoading">            <localize key="loading">Loading</localize>...        </div>        <div ng-if="!isLoading">            <input type="hidden" name="tagCount" ng-model="vm.viewModel.length" val-property-validator="vm.validateMandatory">            <span ng-repeat="tag in vm.viewModel track by $index" class="label label-primary tag" ng-keyup="vm.onKeyUpOnTag(tag, $event)" tabindex="0">                <span ng-bind-html="tag"></span>                <umb-icon ng-if="!vm.readonly" icon="icon-trash" class="btn-icon" ng-click="vm.showPrompt($index, tag)" localize="title" title="@buttons_deleteTag"></umb-icon>                <umb-confirm-action ng-if="vm.promptIsVisible === $index" direction="left" on-confirm="vm.removeTag(tag)" on-cancel="vm.hidePrompt()"></umb-confirm-action>            </span>            <input type="text" id="{{vm.inputId}}" class="typeahead tags-{{vm.inputId}}" ng-model="vm.tagToAdd" ng-focus="vm.onTagFieldFocus()" ng-keydown="vm.addTagOnEnter($event)" ng-blur="vm.addTag()" ng-maxlength="200" maxlength="200" localize="placeholder" placeholder="@placeholders_enterTags" aria-labelledby="{{vm.inputId}}" ng-readonly="vm.readonly">        </div>    </ng-form></div>',
    controller: function umbTagsEditorController($rootScope, assetsService, umbRequestHelper, angularHelper, $timeout, $element, $attrs, $http, $scope) {
        let typeahead, tagsHound, vm = this;
        let promptDebounce = null;

        function configureViewModel(isInitLoad) {
            if (vm.value) {
                if (Utilities.isString(vm.value) && vm.value.length > 0) {
                    if ("Json" === vm.config.storageType && vm.value.detectIsJson()) {
                        try {
                            vm.viewModel = JSON.parse(vm.value)
                        } catch (e) {
                            console.error("Invalid JSON in tag editor value", vm.value)
                        }
                        if (!isInitLoad) updateModelValue(vm.viewModel);
                    } else {
                        let tempArray = vm.value.split(",").map(v => v.trim());
                        vm.viewModel = tempArray.filter((v, i, self) => self.indexOf(v) === i);
                        if (!isInitLoad) updateModelValue(vm.viewModel);
                    }
                } else if (Utilities.isArray(vm.value)) {
                    vm.viewModel = vm.value;
                }
            }
        }

        function updateModelValue(val) {
            val = val || [];
            vm.onValueChanged({ value: val });
            reValidate();
        }

        function addTagInternal(tagToAdd) {
            if (tagToAdd && tagToAdd.length > 0 && vm.viewModel.indexOf(tagToAdd) < 0) {
                vm.viewModel.push(tagToAdd);
                updateModelValue(vm.viewModel);
            }
        }

        function addTag() {
            addTagInternal(vm.tagToAdd);
            vm.tagToAdd = "";
            typeahead.typeahead("val", "");
        }

        function removeTag(tag) {
            var i = vm.viewModel.indexOf(tag);
            if (i >= 0) {
                vm.promptIsVisible = "-1";
                vm.viewModel.splice(i, 1);
                updateModelValue(vm.viewModel);
            }
        }

        function removeCurrentTagsFromSuggestions(suggestions) {
            return $.grep(suggestions, suggestion => -1 === $.inArray(suggestion.text, vm.viewModel));
        }

        function reValidate() {
            if (vm.tagEditorForm && vm.tagEditorForm.tagCount)
                vm.tagEditorForm.tagCount.$setViewValue(vm.viewModel.length);
        }

        vm.onTagFieldFocus = function () {
            console.log("Tag field focused, fetching AI suggestions...");
            console.log("model:", $scope.$parent.model);
            console.log("model title", $scope.$parent.model.title);
            let title = ($scope.$parent.model && $scope.$parent.model.title && $scope.$parent.model.title.value);

            if (!title) {
                vm.aiSuggestions = [];
                return;
            }
            if (promptDebounce) $timeout.cancel(promptDebounce);
            promptDebounce = $timeout(() => {
                $http.post("/umbraco/backoffice/AIHelper/Completion/GetTagSuggestionsAsync?input=" + encodeURIComponent(title))
                    .then(res => {
                        vm.aiSuggestions = res.data || [];
                    }, err => {
                        console.error("AI prompt error:", err);
                        vm.aiSuggestions = [];
                    });
            }, 500);
        };

        vm.addTagFromSuggestion = function (tagText) {
            addTagInternal(tagText);
        };

        vm.$onInit = function () {
            console.log("Initializing umbTagsEditor with config:");
            vm.inputId = vm.inputId || "t" + String.CreateGuid();
            assetsService.loadJs("lib/typeahead.js/typeahead.bundle.min.js").then(function () {
                vm.isLoading = !1;
                configureViewModel(!0);
                vm.promptIsVisible = "-1";

                tagsHound = new Bloodhound({
                    initialize: !1,
                    identify: obj => obj.id,
                    datumTokenizer: Bloodhound.tokenizers.obj.whitespace("text"),
                    queryTokenizer: Bloodhound.tokenizers.whitespace,
                    prefetch: {
                        url: umbRequestHelper.getApiUrl("tagsDataBaseUrl", "GetTags", {
                            tagGroup: vm.config.group,
                            culture: vm.culture
                        }),
                        ttl: 3e5
                    },
                    remote: {
                        url: umbRequestHelper.getApiUrl("tagsDataBaseUrl", "GetTags", {
                            tagGroup: vm.config.group,
                            culture: vm.culture,
                            query: "%QUERY"
                        }),
                        wildcard: "%QUERY"
                    }
                });

                tagsHound.initialize().then(function () {
                    var sources = {
                        name: (vm.config.group + (vm.culture ? vm.culture : "")).replace(/\W/g, "-"),
                        display: "text",
                        source: function (query, syncCallback, asyncCallback) {
                            tagsHound.search(query,
                                suggestions => syncCallback(removeCurrentTagsFromSuggestions(suggestions)),
                                suggestions => asyncCallback(removeCurrentTagsFromSuggestions(suggestions))
                            );
                        }
                    },
                        opts = {
                            hint: !0,
                            highlight: !0,
                            cacheKey: new Date,
                            minLength: 1
                        };

                    typeahead = $element.find(".tags-" + vm.inputId)
                        .typeahead(opts, sources)
                        .bind("typeahead:selected", (obj, datum) => {
                            angularHelper.safeApply($rootScope, function () {
                                addTagInternal(datum.text);
                                vm.tagToAdd = "";
                                typeahead.typeahead("val", "");
                            });
                        })
                        .bind("typeahead:autocompleted", (obj, datum) => {
                            angularHelper.safeApply($rootScope, function () {
                                addTagInternal(datum.text);
                                vm.tagToAdd = "";
                                typeahead.typeahead("val", "");
                            });
                        });
                });
            });
        };

        vm.$onChanges = function (changes) {
            if (changes.value && (!changes.value.isFirstChange() && changes.value.currentValue !== changes.value.previousValue)) {
                configureViewModel();
                reValidate();
            }
        };

        vm.$onDestroy = function () {
            if (tagsHound) {
                tagsHound.clearPrefetchCache();
                tagsHound.clearRemoteCache();
                tagsHound = null;
            }
            $element.find(".tags-" + vm.inputId).typeahead("destroy");
        };

        vm.validateMandatory = function () {
            return {
                isValid: !vm.validation.mandatory || (vm.viewModel && vm.viewModel.length > 0) || (vm.value && vm.value.length > 0),
                errorMsg: "Value cannot be empty",
                errorKey: "required"
            };
        };

        vm.addTagOnEnter = function (e) {
            if ((e.keyCode || e.which) === 13 && $element.find(".tags-" + vm.inputId).parent().find(".tt-menu .tt-cursor").length === 0) {
                e.preventDefault();
                addTag();
            }
        };

        vm.addTag = addTag;
        vm.removeTag = removeTag;
        vm.showPrompt = function (idx, tag) {
            var i = vm.viewModel.indexOf(tag);
            if (i === idx) vm.promptIsVisible = i;
        };
        vm.hidePrompt = function () {
            vm.promptIsVisible = "-1";
        };
        vm.onKeyUpOnTag = function (tag, $event) {
            if ($event.keyCode === 8 || $event.keyCode === 46) removeTag(tag);
        };

        vm.isLoading = !0;
        vm.tagToAdd = "";
        vm.promptIsVisible = "-1";
        vm.viewModel = [];
        vm.readonly = !1;
        $attrs.$observe("readonly", value => {
            vm.readonly = value !== undefined;
        });
    },
    controllerAs: "vm",
    bindings: {
        value: "<",
        config: "<",
        validation: "<",
        culture: "<?",
        inputId: "@?",
        onValueChanged: "&"
    }
});
